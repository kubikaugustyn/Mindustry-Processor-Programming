var __author__ = "kubik.augustyn@post.cz"

// https://github.com/frozein/PropScript/blob/master/src/parser.cpp

class MindustryParser extends Parser {
    static ERROR_INVALID_TOKEN = "INVALID TOKEN"
    static ERROR_EXPECTED_OPENING_PAREN = "EXPECTED OPENING PARENTHESIS"
    static ERROR_EXPECTED_CLOSING_PAREN = "EXPECTED CLOSING PARENTHESIS"
    static ERROR_EXPECTED_OPENING_CURLY = "EXPECTED OPENING CURLY"
    static ERROR_EXPECTED_CLOSING_CURLY = "EXPECTED CLOSING CURLY"
    static ERROR_EXPECTED_TYPE = "Expected type definition"
    static ERROR_UNEXPECTED_OPERATOR = "UNEXPECTED OPERATOR"
    static ERROR_EXPECTED_INITIALIZER = "EXPECTED INITIALIZER"
    static ERROR_INVALID_LHS_IN_ASSIGNMENT = "Invalid left-hand side in assignment"
    static ERROR_UNEXPECTED_PAREN = "UNEXPECTED PAREN"
    static ERROR_EXPECTED_IDENTIFIER = "Expected identifier"
    static ERROR_UNEXPECTED_TOKEN = "UNEXPECTED TOKEN"
    static ERROR_UNEXPECTED_EOF = "UNEXPECTED END OF FILE"
    static ERROR_UNEXPECTED_NEWLINE = "UNEXPECTED NEWLINE (probably my fault)"
    static ERROR_INVALID_VARIABLE_TYPE = "Invalid variable type"
    static ERROR_EXPECTED_VARIABLE_DECLARATION = "Expected variable declaration"
    static ERROR_EXPECTED_NON_CONST_VARIABLE_DECLARATION = "Expected non-constant variable declaration"
    static ERROR_EXPECTED_COMMA = "Expected a comma separator"
    static ERROR_EXPECTED_SEMICOLON = "Expected a semicolon separator"
    static ERROR_UNEXPECTED_KEYWORD = "Unexpected keyword (not implemented)"
    static ERROR_INVALID_IDENTIFIER = "Invalid identifier - cannot use a type or a keyword as an identifier"
    static ERROR_INVALID_IDENTIFIER_PARAM = "Invalid identifier - cannot use a type or a keyword as an identifier. Perhaps you wanted to separate a new argument type with a semicolon (;)?"
    static ERROR_INVALID_IDENTIFIER_KIND = "Invalid identifier - cannot use a property, constant or a link as an identifier"
    static ERROR_EXPECTED_SET = "Expected set (the = operator)"
    static ERROR_INVALID_OPERATOR_INPUTS = "Invalid operator input count (operator accepts a different amount of arguments than those provided)"
    static ERROR_ILLEGAL_BREAK = "Illegal break statement outside a loop or a switch statement"
    static ERROR_ILLEGAL_CONTINUE = "Illegal continue statement outside a loop"
    static ERROR_ILLEGAL_RETURN = "Illegal return statement outside a function"
    static ERROR_ILLEGAL_FUNCTION_LOCATION = "Illegal function declaration within another function, a loop or a switch statement"
    static ERROR_VARIABLE_REDEFINITION_MISMATCH = "When re-defining a variable, the type or whether it's constant don't match"
    static ERROR_MULTIPLE_DEFAULTS_IN_SWITCH = "Multiple default cases in a switch statement"
    static ERROR_INTERNAL_ERROR = "Internal error, see the console for more information"

    static KEYWORDS = {
        FOR: "for",
        BREAK: "break",
        CONTINUE: "continue",
        WHILE: "while",
        DO: "do",
        IF: "if",
        ELSE: "else",
        SWITCH: "switch",
        CASE: "case",
        DEFAULT: "default",
        FUNCTION: "function",
        CONST: "const",
        RETURN: "return"
    }
    /**
     * @type {string[]}
     */
    static KEYWORDS_LIST
    static POINTER_OP = MindustryLexer.OPERATORS.find(op => op.chars === "*")
    static DEREF_OP = MindustryLexer.OPERATORS.find(op => op.chars === "&")
    static EXPONENT_OP = MindustryLexer.OPERATORS.find(op => op.chars === "**")

    static Context = class Context {
        /**
         * Whether we're currently in an assignment
         * @type {boolean}
         */
        isAssignmentTarget
        /**
         * Whether we're currently in a function
         * @type {boolean}
         */
        inFunctionBody
        /**
         * Whether we're currently in a loop
         * @type {boolean}
         */
        inIteration
        /**
         * Whether we're currently in a switch statement
         * @type {boolean}
         */
        inSwitch
        /**
         * The current variable scope
         * @type {ProcessorVariables}
         */
        scope

        constructor() {
            this.isAssignmentTarget = false
            this.inFunctionBody = false
            this.inIteration = false
            this.inSwitch = false
            this.scope = new ProcessorVariables()
        }

        /**
         * Pushes a new child scope on top of the scope stack
         * @return {ProcessorVariables} The new child scope
         */
        pushChildScope() {
            return this.scope = this.scope.clone(true)
        }

        /**
         * Pops a child scope off the scope stack
         */
        popChildScope() {
            if (!this.scope.parent) throw new Error("Cannot pop the child scope further")
            this.scope = this.scope.parent
        }
    }
    static Params = class Params {
        /**
         * Whether we're currently in a for loop header (force value setter)
         * @type {boolean}
         */
        inFor
        /**
         * Whether we're currently in a const declaration
         * @type {boolean}
         */
        isConst
        /**
         * @type {Token|undefined}
         */
        variableType
        /**
         * @type {boolean}
         */
        isPointer

        /**
         * @param inFor {boolean}
         * @param isConst {boolean}
         */
        constructor(inFor, isConst) {
            this.inFor = inFor
            this.isConst = isConst
            this.variableType = undefined
            this.isPointer = false
        }
    }

    /**
     * @type {MindustryParser.Context}
     */
    ctx
    /**
     * @type {Parser.AST}
     */
    ast

    reset() {
        this.ctx = new MindustryParser.Context
    }

    parse() {
        if (!this.currentToken) {
            return undefined
        }

        var ast = Parser.AST.getAST()
        this.ast = ast
        ast.use()
        // console.log(ast)
        // console.log(this.tokens.toArray())
        var i = 0, limit = 10_000
        this.removeNewlineAndComments()
        while (!this.tokens.done) {
            ast.parentNodes.push(this.addNode(this.parseStatementListItem()))

            this.removeNewlineAndComments()
            i++
            if (i >= limit) break
        }
        if (i >= limit) console.log("Reached limit")

        // ??? if (!ast) this.handleError()
        return ast
    }

    // Block is a statement list which consists of statement list items
    parseStatementListItem() {
        /**
         * @type {Parser.ASTNode}
         */
        var statement
        this.ctx.isAssignmentTarget = true
        if (this.currentToken instanceof MindustryTokens.PHRASE) {
            // Declaration
            var value = this.currentToken.content
            if (value === MindustryParser.KEYWORDS.CONST) {
                statement = this.parseLexicalDeclaration(new MindustryParser.Params(false, true))
            } else if (value === MindustryParser.KEYWORDS.FUNCTION) {
                statement = this.parseFunctionDeclaration()
            } else if (ProcessorTypes.ALL_TYPES.includes(value)) {
                statement = this.isLexicalDeclaration() ?
                    this.parseLexicalDeclaration(new MindustryParser.Params(false, false)) :
                    this.parseStatement()
            }
        } else if (this.currentToken instanceof MindustryTokens.OPERATOR) {
            // Pointer to a type
            /**
             * @type {MindustryLexer.OPERATOR}
             */
            var op = this.currentToken.subtypeObject
            if (op === MindustryParser.POINTER_OP) {
                if (this.tokens.nextPreview instanceof MindustryTokens.PHRASE) {
                    statement = this.parseLexicalDeclaration(new MindustryParser.Params(false, false))
                }
            }
        }
        if (!statement) statement = this.parseStatement()
        return statement
    }

    parseStatement() {
        // console.log("Parse statement at token:", this.currentToken)
        var statement
        if (this.currentToken instanceof MindustryTokens.VALUE) statement = this.parseExpressionStatement()
        else if (this.currentToken instanceof MindustryTokens.PAREN) {
            if (this.currentToken.content === "{") statement = this.parseBlock()
            else statement = this.parseExpressionStatement()
        } else if (this.currentToken instanceof MindustryTokens.PHRASE) {
            if (!MindustryParser.KEYWORDS_LIST.includes(this.currentToken.content)) {
                if (ProcessorTypes.ALL_TYPES.includes(this.currentToken.content) && this.isLexicalDeclaration()) {
                    statement = this.parseLexicalDeclaration(new MindustryParser.Params(false, false))
                } else {
                    if (this.matchParen("(", this.tokens.nextPreview)) {
                        var calleeToken = this.currentToken
                        var callee = this.parseIdentifierName("get")
                        statement = this.parseCallExpression(calleeToken, callee, new MindustryParser.Params(false, false))
                    } else
                        statement = this.parseForcedAssignmentExpression(new MindustryParser.Params(false, false))
                }
            } else switch (this.currentToken.content) {
                case MindustryParser.KEYWORDS.BREAK:
                    statement = this.parseBreakStatement()
                    break
                case MindustryParser.KEYWORDS.CONTINUE:
                    statement = this.parseContinueStatement()
                    break
                case MindustryParser.KEYWORDS.DO:
                    statement = this.parseDoWhileStatement()
                    break
                case MindustryParser.KEYWORDS.FOR:
                    statement = this.parseForStatement()
                    break
                case MindustryParser.KEYWORDS.FUNCTION:
                    statement = this.parseFunctionDeclaration()
                    break
                case MindustryParser.KEYWORDS.IF:
                    statement = this.parseIfStatement()
                    break
                case MindustryParser.KEYWORDS.RETURN:
                    statement = this.parseReturnStatement()
                    break
                case MindustryParser.KEYWORDS.SWITCH:
                    statement = this.parseSwitchStatement()
                    break
                case MindustryParser.KEYWORDS.CONST:
                    statement = this.parseLexicalDeclaration(new MindustryParser.Params(false, true))
                    break
                case MindustryParser.KEYWORDS.WHILE:
                    statement = this.parseWhileStatement()
                    break
                default:
                    this.handleError(MindustryParser.ERROR_UNEXPECTED_KEYWORD, this.currentToken)
                // statement = this.parseExpressionStatement()
            }
        } else
            this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)

        if (!statement) this.handleError(MindustryParser.ERROR_INTERNAL_ERROR, this.currentToken)

        return statement
    }

    parseForcedVariableDeclaration(allowConst) {
        var startToken = this.currentToken
        var declaration
        if (!(this.currentToken instanceof MindustryTokens.PHRASE)) this.handleError(MindustryParser.ERROR_EXPECTED_VARIABLE_DECLARATION, this.currentToken)
        if (!MindustryParser.KEYWORDS_LIST.includes(this.currentToken.content)) {
            if (ProcessorTypes.ALL_TYPES.includes(this.currentToken.content) && this.isLexicalDeclaration()) {
                declaration = this.parseLexicalDeclaration(new MindustryParser.Params(false, false))
            }
        } else if (this.currentToken.content === MindustryParser.KEYWORDS.CONST) {
            if (!allowConst) this.handleError(MindustryParser.ERROR_EXPECTED_NON_CONST_VARIABLE_DECLARATION, this.currentToken)
            declaration = this.parseLexicalDeclaration(new MindustryParser.Params(false, true))
        }
        if (!declaration) this.handleError(MindustryParser.ERROR_EXPECTED_VARIABLE_DECLARATION, startToken)
        return declaration
    }

    /**
     * @return {MindustryNodes.BreakStatement}
     */
    parseBreakStatement() {
        var breakToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.BREAK)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, breakToken)
        if (!this.ctx.inSwitch && !this.ctx.inIteration) this.handleError(MindustryParser.ERROR_ILLEGAL_BREAK, breakToken)
        this.markAsKeyword(breakToken)
        this.advance()

        return this.finalize(new MindustryNodes.BreakStatement, breakToken)
    }

    /**
     * @return {MindustryNodes.ContinueStatement}
     */
    parseContinueStatement() {
        var continueToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.CONTINUE)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, continueToken)
        if (!this.ctx.inIteration) this.handleError(MindustryParser.ERROR_ILLEGAL_CONTINUE, continueToken)
        this.markAsKeyword(continueToken)
        this.advance()

        return this.finalize(new MindustryNodes.ContinueStatement, continueToken)
    }

    /**
     * @return {MindustryNodes.ForStatement}
     */
    parseForStatement() {
        var startToken = this.currentToken
        var init, test, update

        if (!this.matchKeyword(MindustryParser.KEYWORDS.FOR)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        if (!this.matchParen("(")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()

        if (this.currentToken instanceof MindustryTokens.SEMICOLON) this.advance()
        else {
            init = this.addNode(this.parseForcedVariableDeclaration(false))
            this.expectSemicolonSeparator()
        }

        if (this.currentToken instanceof MindustryTokens.SEMICOLON) this.advance()
        else {
            test = this.addNode(this.parseExpression())
            this.expectSemicolonSeparator()
        }

        if (!this.matchParen(")")) {
            update = this.addNode(this.parseExpression())
        }

        if (!this.matchParen(")")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()

        var previousInIteration = this.ctx.inIteration
        this.ctx.inIteration = true
        var body = this.addNode(this.parseStatement())
        this.ctx.inIteration = previousInIteration

        return this.finalize(new MindustryNodes.ForStatement(init, test, update, body), startToken)
    }

    /**
     * @return {MindustryNodes.FunctionDeclaration}
     */
    parseFunctionDeclaration() {
        // <function func(NUMBER a, b; STRING c) {...}>
        if (this.ctx.inFunctionBody || this.ctx.inSwitch || this.ctx.inIteration)
            this.handleError(MindustryParser.ERROR_ILLEGAL_FUNCTION_LOCATION, this.currentToken)
        var startToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.FUNCTION)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        var scope = this.ctx.pushChildScope()
        this.currentToken.subtype = "function-declaration"
        var identifier = this.addNode(this.parseIdentifierName("none"))
        var params = this.addNodes(this.parseFormalParameters())
        var body = this.addNode(this.parseFunctionSourceElements())
        this.ctx.popChildScope()

        return this.finalize(new MindustryNodes.FunctionDeclaration(identifier, params, body, scope), startToken)
    }

    /**
     * @return {MindustryNodes.Parameter[]}
     */
    parseFormalParameters() {
        // function func<(NUMBER a, b; STRING c)> {...}
        /**
         * @type {MindustryNodes.Parameter[]}
         */
        var params = []
        if (!this.matchParen("(")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()

        if (!this.matchParen(")")) {
            while (this.currentToken) {
                if (!(this.currentToken instanceof MindustryTokens.PHRASE) ||
                    !ProcessorTypes.ALL_TYPES.includes(this.currentToken.content) ||
                    MindustryParser.KEYWORDS_LIST.includes(this.currentToken.content))
                    this.handleError(MindustryParser.ERROR_EXPECTED_TYPE, this.currentToken)
                var type = this.currentToken
                type.subtype = "variable-type"
                this.checkVariableType(type) // Just to make sure
                this.advance()
                var paramType = new ProcessorTypes[type.content]()
                var isPointer = false
                // TODO Implement pointer params
                console.warn("Pointer params not implemented")

                while (this.currentToken) {
                    var identifier = this.currentToken
                    if (!(identifier instanceof MindustryTokens.PHRASE))
                        this.handleError(MindustryParser.ERROR_EXPECTED_IDENTIFIER, identifier)
                    var isType = ProcessorTypes.ALL_TYPES.includes(identifier.content)
                    if (isType ||
                        MindustryParser.KEYWORDS_LIST.includes(identifier.content))
                        this.handleError(isType ? MindustryParser.ERROR_INVALID_IDENTIFIER_PARAM : MindustryParser.ERROR_INVALID_IDENTIFIER, identifier)
                    if (identifier.subtype) this.handleError(MindustryParser.ERROR_INVALID_IDENTIFIER_KIND, identifier)
                    var isValid = this.registerVariable(identifier.content, paramType, false, isPointer, true, identifier)
                    identifier.subtype = isValid ? "function-param" : "function-param-invalid"
                    var paramName = this.addNode(this.finalize(new MindustryNodes.Identifier(identifier.content), identifier))
                    params.push(this.finalize(new MindustryNodes.Parameter(paramName, paramType), identifier))
                    this.advance()

                    if (this.matchParen(")") || this.currentToken instanceof MindustryTokens.SEMICOLON) break

                    this.expectCommaSeparator()
                }

                if (this.matchParen(")")) break

                this.expectSemicolonSeparator()
            }
        }

        if (!this.matchParen(")")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()
        return params
    }

    /**
     * @return {MindustryNodes.BlockStatement}
     */
    parseFunctionSourceElements() {
        // function func(NUMBER a, b; STRING c) <{...}>

        var previousInFunctionBody = this.ctx.inFunctionBody
        this.ctx.inFunctionBody = true
        var body = this.parseBlock()
        this.ctx.inFunctionBody = previousInFunctionBody

        return body
    }

    /**
     * @return {MindustryNodes.IfStatement}
     */
    parseIfStatement() {
        var alternate, startToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.IF)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        if (!this.matchParen("(")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()

        var test = this.addNode(this.parseExpression())

        if (!this.matchParen(")")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()

        var consequent = this.addNode(this.parseIfClause())
        this.removeNewlineAndComments()
        if (this.matchKeyword(MindustryParser.KEYWORDS.ELSE)) {
            this.markAsKeyword()
            this.advance()
            alternate = this.addNode(this.parseIfClause())
        }

        return this.finalize(new MindustryNodes.IfStatement(test, consequent, alternate), startToken)
    }

    /**
     * @return {Parser.ASTNode}
     */
    parseIfClause() {
        return this.parseStatement()
    }

    /**
     * @return {MindustryNodes.ReturnStatement}
     */
    parseReturnStatement() {
        var startToken = this.currentToken
        if (!this.ctx.inFunctionBody) this.handleError(MindustryParser.ERROR_ILLEGAL_RETURN, this.currentToken)

        if (!this.matchKeyword(MindustryParser.KEYWORDS.RETURN)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        var hasArgument = !!this.currentToken && (
            !this.matchParen("}") ||
            this.currentToken instanceof MindustryTokens.VALUE
        )
        var argument = hasArgument ? this.addNode(this.parseExpression()) : undefined

        return this.finalize(new MindustryNodes.ReturnStatement(argument), startToken)
    }

    /**
     * @return {MindustryNodes.SwitchStatement}
     */
    parseSwitchStatement() {
        var startToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.SWITCH)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        if (!this.matchParen("(")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()

        var discriminant = this.addNode(this.parseExpression())

        if (!this.matchParen(")")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()

        var previousInSwitch = this.ctx.inSwitch
        this.ctx.inSwitch = true

        var cases = []
        var default_case, hasDefault = false
        if (!this.matchParen("{")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_CURLY, this.currentToken)
        this.advance()
        while (!hasDefault) { // Addition: we only support default at the end of switch
            this.removeNewlineAndComments()
            if (this.matchParen("}")) break
            var clauseToken = this.currentToken
            var clause = this.parseSwitchCase()
            if (clause instanceof MindustryNodes.CaseStatement) cases.push(this.addNode(clause))
            else {
                if (hasDefault) this.handleError(MindustryParser.ERROR_MULTIPLE_DEFAULTS_IN_SWITCH, clauseToken)
                default_case = this.addNode(clause)
                hasDefault = true
            }
        }
        if (!this.matchParen("}")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_CURLY, this.currentToken)
        this.advance()

        this.ctx.inSwitch = previousInSwitch

        return this.finalize(new MindustryNodes.SwitchStatement(discriminant, cases, default_case), startToken)
    }

    /**
     * @return {MindustryNodes.CaseStatement|MindustryNodes.DefaultStatement}
     */
    parseSwitchCase() {
        var startToken = this.currentToken

        var test, isDefault
        if (this.matchKeyword(MindustryParser.KEYWORDS.DEFAULT)) {
            isDefault = true
            this.markAsKeyword()
            this.advance()
        } else if (this.matchKeyword(MindustryParser.KEYWORDS.CASE)) {
            isDefault = false
            this.markAsKeyword()
            this.advance()
            test = this.addNode(this.parseExpression())
        } else this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)

        if (!(this.currentToken instanceof MindustryTokens.COLON)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.advance()

        var consequent = []
        while (true) {
            this.removeNewlineAndComments()
            if (this.matchParen("}") ||
                this.matchKeyword(MindustryParser.KEYWORDS.DEFAULT) ||
                this.matchKeyword(MindustryParser.KEYWORDS.CASE)) break
            consequent.push(this.addNode(this.parseStatementListItem()))
        }

        return isDefault ?
            this.finalize(new MindustryNodes.DefaultStatement(consequent), startToken) :
            this.finalize(new MindustryNodes.CaseStatement(test, consequent), startToken)
    }

    /**
     * @return {MindustryNodes.WhileStatement}
     */
    parseWhileStatement() {
        var startToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.WHILE)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        if (!this.matchParen("(")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()

        var test = this.addNode(this.parseExpression())

        if (!this.matchParen(")")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()

        var previousInIteration = this.ctx.inIteration
        this.ctx.inIteration = true
        var body = this.addNode(this.parseStatement())
        this.ctx.inIteration = previousInIteration

        return this.finalize(new MindustryNodes.WhileStatement(test, body), startToken)
    }

    /**
     * @return {MindustryNodes.WhileStatement}
     */
    parseDoWhileStatement() {
        var startToken = this.currentToken

        if (!this.matchKeyword(MindustryParser.KEYWORDS.DO)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        this.removeNewlineAndComments()
        var previousInIteration = this.ctx.inIteration
        this.ctx.inIteration = true
        var body = this.addNode(this.parseStatement())
        this.ctx.inIteration = previousInIteration
        this.removeNewlineAndComments()

        if (!this.matchKeyword(MindustryParser.KEYWORDS.WHILE)) this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
        this.markAsKeyword()
        this.advance()

        if (!this.matchParen("(")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()

        var test = this.addNode(this.parseExpression())

        if (!this.matchParen(")")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()

        return this.finalize(new MindustryNodes.WhileStatement(test, body), startToken)
    }

    /**
     * @return {MindustryNodes.ExpressionStatement}
     */
    parseExpressionStatement() {
        var startToken = this.currentToken
        var expr = this.addNode(this.parseExpression())
        return this.finalize(new MindustryNodes.ExpressionStatement(expr), startToken)
    }

    /**
     * @return {MindustryNodes.BlockStatement}
     */
    parseBlock() {
        this.removeNewlineAndComments()
        var startToken = this.currentToken

        if (!this.matchParen("{")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_CURLY, this.currentToken)
        this.advance()
        var block = []
        while (this.currentToken) {
            this.removeNewlineAndComments()
            if (this.matchParen("}")) break
            block.push(this.addNode(this.parseStatementListItem()))
        }
        if (!this.matchParen("}")) this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_CURLY, this.currentToken)
        this.advance()

        if (block.length === 0) return this.finalize(new MindustryNodes.EmptyStatement, startToken)
        else if (block.length === 1) return this.ast.nodePool[block[0]]
        else return this.finalize(new MindustryNodes.BlockStatement(block), startToken)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {MindustryNodes.VariableDeclaration}
     */
    parseLexicalDeclaration(params) {
        // <NUMBER A = 9, b = 5, c = 6>
        var type = this.currentToken
        if (params.isConst) {
            this.markAsKeyword()
            this.advance()
            type = this.currentToken
        }
        var isPointer = this.currentToken instanceof MindustryTokens.OPERATOR
        if (isPointer) {
            if (this.currentToken.subtypeObject !== MindustryParser.POINTER_OP) this.handleError(MindustryParser.ERROR_UNEXPECTED_OPERATOR, this.currentToken)
            this.advance()
            type = this.currentToken
        }
        this.advance()

        type.subtype = "variable-type"
        this.checkVariableType(type) // Just to make sure

        params.variableType = type
        params.isPointer = isPointer
        var declarators = this.parseBindingList(params)
        var declaration = new MindustryNodes.VariableDeclaration
        declaration.declarators = this.addNodes(declarators)
        return this.finalize(declaration, type)
    }

    /**
     * @param type {Token}
     */
    checkVariableType(type) {
        if (ProcessorTypes.ALL_TYPES.includes(type.content)) return
        this.handleError(MindustryParser.ERROR_INVALID_VARIABLE_TYPE, type)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {MindustryNodes.VariableDeclarator[]}
     */
    parseBindingList(params) {
        // NUMBER <A = 9, b = 5, c = 6>
        /**
         * @type {MindustryNodes.VariableDeclarator[]}
         */
        var list = [this.parseLexicalBinding(params)]
        while (this.currentToken instanceof MindustryTokens.COMMA) {
            this.advance()
            list.push(this.parseLexicalBinding(params))
        }
        return list
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {MindustryNodes.VariableDeclarator}
     */
    parseLexicalBinding(params) {
        // NUMBER <A = 9>, b = 5, c = 6
        this.removeNewlineAndComments()

        var name = this.currentToken
        if (name.subtype) this.handleError(MindustryParser.ERROR_INVALID_IDENTIFIER_KIND, name)
        if (MindustryParser.KEYWORDS_LIST.includes(name.content) || ProcessorTypes.ALL_TYPES.includes(name.content))
            this.handleError(MindustryParser.ERROR_INVALID_IDENTIFIER, name)
        this.advance()

        if (!this.matchSet()) this.handleError(MindustryParser.ERROR_EXPECTED_INITIALIZER, this.currentToken)
        this.advance()
        var init = this.addNode(this.isolateCoverGrammar(this.parseAssignmentExpression, params))
        var identifier = this.addNode(this.finalize(new MindustryNodes.Identifier(name.content), name))
        var valueType = new ProcessorTypes[params.variableType.content]()

        var isValid = this.registerVariable(name.content, valueType, params.isConst, params.isPointer, false, name)
        name.subtype = isValid ?
            (params.isConst ? "constant" : "variable") :
            "variable-invalid-redefinition"

        return this.finalize(new MindustryNodes.VariableDeclarator(identifier, init, params.isConst, params.isPointer, valueType), name)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseAssignmentExpression(params) {
        this.handleEOF()
        var startToken = this.currentToken
        var expr = this.parseConditionalExpression(params)

        if (this.matchSet()) {
            if (!this.ctx.isAssignmentTarget) this.handleError(MindustryParser.ERROR_INVALID_LHS_IN_ASSIGNMENT, this.currentToken)

            this.advance()
            // Originally parseAssignmentExpression - allowed a = b = 9 syntax
            // https://github.com/kubikaugustyn/KUtil/blob/09ca67a0f7a7f669b5ae8f9e19b0006369f84e83/kutil/language/languages/javascript/JSParser.py#L1639-L1640
            var right = this.addNode(this.finalize(this.isolateCoverGrammar(this.parseConditionalExpression, params)))
            expr = this.finalize(new MindustryNodes.AssignmentExpression(this.addNode(expr), right), startToken)
        }

        return expr
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {MindustryNodes.AssignmentExpression}
     */
    parseForcedAssignmentExpression(params) {
        var startToken = this.currentToken
        var target
        if (!this.matchParen("[", this.tokens.nextPreview))
            target = this.parseIdentifierName("set")
        else {
            // Parse the computed member (variable[index] = value)
            target = this.parseIdentifierName("get")
            if (!this.matchParen("[")) this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
            this.ctx.isAssignmentTarget = true
            this.advance()
            var prop = this.addNode(this.isolateCoverGrammar(this.parseExpression, params))
            if (!this.matchParen("]"))
                this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
            this.advance()

            target = this.finalize(new MindustryNodes.ComputedMemberExpression(this.addNode(target), prop), startToken)
        }
        if (!this.matchSet()) this.handleError(MindustryParser.ERROR_EXPECTED_SET, this.currentToken)
        this.advance()
        var value = this.addNode(this.finalize(this.isolateCoverGrammar(this.parseConditionalExpression, params)))
        return this.finalize(new MindustryNodes.AssignmentExpression(this.addNode(target), value), startToken)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseConditionalExpression(params) {
        // A place to add the ternary operator, see:
        // https://github.com/kubikaugustyn/KUtil/blob/09ca67a0f7a7f669b5ae8f9e19b0006369f84e83/kutil/language/languages/javascript/JSParser.py#L1448-L1462
        return this.inheritCoverGrammar(this.parseBinaryExpression, params)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseBinaryExpression(params) {
        var startToken = this.currentToken

        var expr = this.inheritCoverGrammar(this.parseExponentiationExpression, params)

        var token = this.currentToken
        var precedence = this.binaryPrecedence(token)
        if (precedence > 0) {
            this.advance()

            this.ctx.isAssignmentTarget = false

            var left = expr
            var right = this.isolateCoverGrammar(this.parseExponentiationExpression, params)

            if (!token.subtypeObject.has2inputs) this.handleError(MindustryParser.ERROR_INVALID_OPERATOR_INPUTS, token)

            var stack = [left, token.subtypeObject, right]
            var precedences = [precedence]
            while (true) {
                precedence = this.binaryPrecedence(this.currentToken)
                if (precedence <= 0) break

                // Reduce: make a binary expression from the three topmost entries.
                while (stack.length > 2 && precedence <= precedences[precedences.length - 1]) {
                    right = this.addNode(stack.pop())
                    /**
                     * @type {MindustryLexer.OPERATOR}
                     */
                    var operator = stack.pop()
                    precedences.pop()
                    left = this.addNode(stack.pop())
                    stack.push(this.finalize(new MindustryNodes.BinaryExpression(operator, left, right), startToken))
                }

                // Shift.
                stack.push(this.currentToken.subtypeObject)
                if (!this.currentToken.subtypeObject.has2inputs) this.handleError(MindustryParser.ERROR_INVALID_OPERATOR_INPUTS, this.currentToken)
                this.advance()
                precedences.push(precedence)
                stack.push(this.isolateCoverGrammar(this.parseExponentiationExpression, params))
            }

            // Final reduce to clean up the stack
            var i = stack.length - 1
            expr = stack[i]

            while (i > 1) {
                var op = stack[i - 1]
                expr = this.finalize(new MindustryNodes.BinaryExpression(op, this.addNode(stack[i - 2]), this.addNode(expr)), startToken)
                i -= 2
            }
        }

        return expr
    }

    /**
     * @param token {Token}
     * @return {number}
     */
    binaryPrecedence(token) {
        return token instanceof MindustryTokens.OPERATOR ? token.subtypeObject.precedence : 0
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseExponentiationExpression(params) {
        var startToken = this.currentToken

        var expr = this.inheritCoverGrammar(this.parseUnaryExpression, params)
        if (!(expr instanceof MindustryNodes.UnaryExpression) && this.currentToken?.subtypeObject === MindustryParser.EXPONENT_OP) {
            this.advance()
            this.ctx.isAssignmentTarget = false
            var left = this.addNode(expr)
            var right = this.addNode(this.isolateCoverGrammar(this.parseExponentiationExpression, params))
            expr = this.finalize(new MindustryNodes.BinaryExpression(MindustryParser.EXPONENT_OP, left, right), startToken)
        }

        return expr
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseUnaryExpression(params) {
        this.handleEOF()
        var isDeref = this.currentToken.subtypeObject === MindustryParser.DEREF_OP
        if (this.currentToken instanceof MindustryTokens.OPERATOR &&
            (!this.currentToken.subtypeObject.has2inputs || isDeref)
        ) {
            var token = this.currentToken
            this.advance()
            var expr = this.inheritCoverGrammar(this.parseUnaryExpression, params)
            if (isDeref) expr = new MindustryNodes.DerefExpression(this.addNode(expr))
            else expr = new MindustryNodes.UnaryExpression(token.subtypeObject, this.addNode(expr))
            expr = this.finalize(expr, token)
            this.ctx.isAssignmentTarget = false
            return expr
        } else return this.parseUpdateExpression(params)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseUpdateExpression(params) {
        // Place to add ++x, --x, x++, x--
        // https://github.com/kubikaugustyn/KUtil/blob/09ca67a0f7a7f669b5ae8f9e19b0006369f84e83/kutil/language/languages/javascript/JSParser.py#L1284
        // this.handleError(MindustryParser.ERROR_UNEXPECTED_OPERATOR, this.currentToken)
        var startToken = this.currentToken
        return this.finalize(this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall, params), startToken)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parseLeftHandSideExpressionAllowCall(params) {
        var startToken = this.currentToken

        var expr = this.inheritCoverGrammar(this.parsePrimaryExpression, params)
        var prop
        while (true) {
            if (this.currentToken instanceof MindustryTokens.DOT) {
                var holderToken = this.tokens.lastPreview
                this.ctx.isAssignmentTarget = true
                this.advance()
                prop = this.addNode(this.parseIdentifierName("none"))
                expr = this.finalize(new MindustryNodes.StaticMemberExpression(this.addNode(expr), prop), holderToken)
            } else if (this.matchParen("(")) {
                /**
                 * @type {Token}
                 */
                var calleeToken = this.tokens.lastPreview
                expr = this.parseCallExpression(calleeToken, expr, params)
            } else if (this.matchParen("[")) {
                this.ctx.isAssignmentTarget = true
                this.advance()
                prop = this.addNode(this.isolateCoverGrammar(this.parseExpression, params))
                if (!this.matchParen("]"))
                    this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
                this.advance()

                expr = this.finalize(new MindustryNodes.ComputedMemberExpression(this.addNode(expr), prop), startToken)
            } else break
        }

        return expr
    }

    /**
     * @param calleeToken {Token}
     * @param callee {Parser.ASTNode}
     * @param params {MindustryParser.Params}
     * @return {MindustryNodes.CallExpression}
     */
    parseCallExpression(calleeToken, callee, params) {
        calleeToken.subtype = "function-call"
        this.ctx.isAssignmentTarget = false
        var args = this.parseArguments(params)
        return this.finalize(new MindustryNodes.CallExpression(this.addNode(callee), this.addNodes(args)), calleeToken)
    }

    /**
     * @param asVariableKind {"set"|"get"|"none"} Whether the identifier is meant as a variable getter
     * @return {MindustryNodes.Identifier}
     */
    parseIdentifierName(asVariableKind) {
        var identifier = this.currentToken
        this.advance()
        var name = identifier.content
        if (!(identifier instanceof MindustryTokens.PHRASE))
            this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, identifier)
        if (MindustryParser.KEYWORDS_LIST.includes(name) || ProcessorTypes.ALL_TYPES.includes(name))
            this.handleError(MindustryParser.ERROR_INVALID_IDENTIFIER, identifier)
        if (asVariableKind !== "none") {
            var {subtype, isConst} = this.isValidAndConstVariable(name, identifier)
            identifier.subtype = (isConst && asVariableKind === "set") ?
                "variable-invalid-const-assignment" :
                subtype
        }
        return this.finalize(new MindustryNodes.Identifier(name), identifier)
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    parsePrimaryExpression(params) {
        if (this.currentToken instanceof MindustryTokens.PHRASE) {
            var name = this.currentToken.content
            var nameToken = this.currentToken
            this.advance()
            if (name === MindustryParser.KEYWORDS.FUNCTION) {
                // TODO Figure out what is this for
                console.warn("What is this useful for?")
                this.ctx.isAssignmentTarget = false
                return this.finalize(new MindustryNodes.Identifier(this.currentToken.content), this.currentToken)
            } else {
                var {subtype} = this.isValidAndConstVariable(name, nameToken)
                nameToken.subtype = subtype
                return this.finalize(new MindustryNodes.Identifier(name), nameToken)
            }
        } else if (this.currentToken instanceof MindustryTokens.VALUE) {
            this.ctx.isAssignmentTarget = false
            var token = this.currentToken
            this.advance()
            return this.finalize(new MindustryNodes.Value(token.content), token)
        } else if (this.currentToken instanceof MindustryTokens.PAREN) {
            this.handleError(MindustryParser.ERROR_UNEXPECTED_PAREN, this.currentToken)
        } else this.handleError(MindustryParser.ERROR_UNEXPECTED_TOKEN, this.currentToken)
    }

    /**
     * @return {Parser.ASTNode}
     */
    parseExpression() {
        // A place to add sequence expression
        // https://github.com/kubikaugustyn/KUtil/blob/09ca67a0f7a7f669b5ae8f9e19b0006369f84e83/kutil/language/languages/javascript/JSParser.py#L1654-L1663
        return this.isolateCoverGrammar(this.parseAssignmentExpression, new MindustryParser.Params(false, false))
    }

    /**
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode[]}
     */
    parseArguments(params) {
        this.handleEOF()
        if (!this.matchParen("("))
            this.handleError(MindustryParser.ERROR_EXPECTED_OPENING_PAREN, this.currentToken)
        this.advance()
        var args = []
        if (!this.matchParen(")")) {
            while (true) {
                this.handleEOF()
                args.push(this.isolateCoverGrammar(this.parseAssignmentExpression, params))
                if (this.matchParen(")")) break
                this.expectCommaSeparator()
                if (this.matchParen(")")) break
            }
        }

        if (!this.matchParen(")"))
            this.handleError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        this.advance()
        return args
    }

    /**
     * @param paren {string}
     * @param token {Token|undefined}
     * @return {boolean}
     */
    matchParen(paren, token = undefined) {
        if (!token) token = this.currentToken
        return token instanceof MindustryTokens.PAREN && token.content === paren
    }

    /**
     * @return {boolean}
     */
    matchSet() {
        return this.currentToken instanceof MindustryTokens.SET
    }

    /**
     * @return {boolean}
     */
    matchKeyword(keyword) {
        return this.currentToken instanceof MindustryTokens.PHRASE && this.currentToken.content === keyword
    }

    expectCommaSeparator() {
        if (!(this.currentToken instanceof MindustryTokens.COMMA))
            this.handleError(MindustryParser.ERROR_EXPECTED_COMMA, this.currentToken)
        this.advance()
    }

    expectSemicolonSeparator() {
        if (!(this.currentToken instanceof MindustryTokens.SEMICOLON))
            this.handleError(MindustryParser.ERROR_EXPECTED_SEMICOLON, this.currentToken)
        this.advance()
    }

    /**
     * @param parseFunction {(params: MindustryParser.Params)=>Parser.ASTNode}
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    isolateCoverGrammar(parseFunction, params) {
        var previousIsAssignmentTarget = this.ctx.isAssignmentTarget
        this.ctx.isAssignmentTarget = true
        var result = parseFunction.bind(this, params)()
        this.ctx.isAssignmentTarget = previousIsAssignmentTarget
        return result
    }

    /**
     * @param parseFunction {(params: MindustryParser.Params)=>Parser.ASTNode}
     * @param params {MindustryParser.Params}
     * @return {Parser.ASTNode}
     */
    inheritCoverGrammar(parseFunction, params) {
        var previousIsAssignmentTarget = this.ctx.isAssignmentTarget
        this.ctx.isAssignmentTarget = true
        var result = parseFunction.bind(this, params)()
        this.ctx.isAssignmentTarget = previousIsAssignmentTarget && this.ctx.isAssignmentTarget
        return result
    }

    /**
     * Registers a new variable within the current scope
     * @param name {string}
     * @param type {ProcessorType}
     * @param isConst {boolean}
     * @param isPointer {boolean}
     * @param isArgument {boolean}
     * @param token {Token}
     * @return {boolean} Whether the variable is valid
     */
    registerVariable(name, type, isConst, isPointer, isArgument, token) {
        if (this.ctx.scope.hasVariable(name)) {
            var variable = this.ctx.scope.getVariable(name)
            if (variable.constant !== isConst || variable.type.name !== type.name || variable.pointer !== isPointer || variable.argument !== isArgument)
                this.handleError(MindustryParser.ERROR_VARIABLE_REDEFINITION_MISMATCH, token)
        }
        return this.ctx.scope.addVariable(name, type, isConst, isPointer, isArgument)
    }

    /**
     * @param name {string}
     * @param token {Token|undefined}
     * @return {{isValid:boolean,isConst:boolean,subtype:string}}
     */
    isValidAndConstVariable(name, token = undefined) {
        if (this.ctx.scope.hasVariable(name)) {
            var variable = this.ctx.scope.getVariable(name)
            var isConst = variable.constant
            var isArgument = variable.argument
            return {
                isValid: true,
                isConst,
                subtype: isConst ? "constant" : (isArgument ? "function-param" : "variable")
            }
        } else if (MindustryCompiler.DEFAULT_CONSTANTS.find(constant => constant.name === name)) {
            var subtype = name in ["true", "false", "null"] ? "default-value" : "default-constant"
            return {isValid: true, isConst: true, subtype}
        } else if (token.subtype === "param") {
            return {isValid: true, isConst: true, subtype: "param"}
        } else if (token.subtype === "link") {
            // Hope that the user linked that thing
            return {isValid: true, isConst: true, subtype: "link"}
        } else return {isValid: false, isConst: false, subtype: "variable-invalid-not-defined"}
    }

    handleEOF() {
        if (!this.currentToken) this.handleError(MindustryParser.ERROR_UNEXPECTED_EOF, this.tokens.lastValid)
    }

    /**
     * @param node {Parser.ASTNode}
     * @param token {Token|undefined}
     * @return {Parser.ASTNode}
     */
    finalize(node, token) {
        node.lineNum = token?.lineNum
        node.sourceToken = token
        return node
    }

    isLexicalDeclaration() {
        this.removeNewlineAndComments()
        var next = this.tokens.nextPreview
        return (
            next instanceof MindustryTokens.PHRASE ||
            (next instanceof MindustryTokens.PAREN && ["[", "{"].includes(next.subtypeObject.char))
        )
    }

    /**
     * Marks the provided token (or current token if not provided) as a keyword, so it can be seen in the syntax highlighted code
     * @param token {Token|undefined}
     */
    markAsKeyword(token = undefined) {
        if (!token) token = this.currentToken
        token.subtype = "keyword"
    }

    /**
     * @param node {Parser.ASTNode}
     * @return {number}
     */
    addNode(node) {
        var i = this.ast.nodePool.indexOf(node)
        if (i > -1) return i
        this.ast.nodePool.push(node)
        return this.ast.nodePool.length - 1
    }

    /**
     * @param nodes {Parser.ASTNode[]}
     * @return {number[]}
     */
    addNodes(nodes) {
        return nodes.map(node => this.addNode(node))
    }

    removeNewlineAndComments() {
        while (this.currentToken instanceof MindustryTokens.NEWLINE ||
            this.currentToken instanceof MindustryTokens.COMMENT
            )
            this.advance()
    }

    /*removeNewline() {
        while (this.currentToken instanceof MindustryTokens.NEWLINE) this.advance()
    }*/

    handleError(msg, tok) {
        if (msg === MindustryParser.ERROR_UNEXPECTED_TOKEN) {
            if (typeof tok === "undefined" && !this.currentToken) {
                super.handleError(MindustryParser.ERROR_UNEXPECTED_EOF, undefined)
            } else if (tok instanceof MindustryTokens.NEWLINE) {
                super.handleError(MindustryParser.ERROR_UNEXPECTED_NEWLINE, {lineNum: tok.lineNum})
            }
        }
        super.handleError(msg, tok);
    }

    /**
     * @param type {string|function():Parser.ASTNode}
     * @param token {Token|undefined}
     * @return {Parser.ASTNode}
     */
    createNode(type, token = undefined) {
        var isNodeType = typeof type === "string"
        var node = isNodeType ? new Parser.ASTNode : type()
        isNodeType && (node.type = type)
        node.lineNum = (token || this.currentToken).lineNum
        return node
    }

    static {
        this.KEYWORDS_LIST = Array.from(Object.values(this.KEYWORDS))
    }
}

// TODO Support negative numbers (-69 instead of 0 - 69)
// TODO Compile the tree
