var __author__ = "kubik.augustyn@post.cz"

// https://github.com/frozein/PropScript/blob/master/src/parser.cpp

class MindustryParser extends Parser {
    static ERROR_INVALID_TOKEN = "INVALID TOKEN"
    static ERROR_EXPECTED_CLOSING_PAREN = "EXPECTED CLOSING PARENTHESIS"
    static ERROR_UNEXPECTED_OPERATOR = "UNEXPECTED OPERATOR"
    static ERROR_EXPECTED_OPERATOR = "EXPECTED OPERATOR"

    static OPNode = "OPNode"
    static PHRASENode = "PHRASENode"
    static NUMBERNode = "NUMBERNode"

    static KEYWORDS = ["function", "return", "if", "else", "for", "in"]

    parse() {
        if (!this.currentToken) {
            return undefined
        }

        var result = new Parser.AST()
        console.log(this.tokens.toArray())
        var numOpenParens = new Parser.AtomicInteger(0)
        while (!this.tokens.done) {
            result.parentNodes.push(this.parseStatement(result, numOpenParens))
            this.removeNewline()
            break
        }

        if (!result) this.throwError()

        return result
    }

    parseStatement(ast, numOpenParens) {
        console.log("Parse statement", ast, numOpenParens.get(), this.currentToken)
        // TODO IF / FOR
        // TODO FUNC
        // TODO RETURN
        // TODO BREAK / CONTINUE
        //MUST BE REGULAR OPERATION:
        var left, right

        //GET LEFT TOKEN:
        left = this.parseNonOP(ast, numOpenParens);

        //CHECK IF LINE ENDED:
        if (this.currentToken instanceof MindustryTokens.NEWLINE || (
            this.currentToken instanceof MindustryTokens.PAREN && (
                this.currentToken === MindustryLexer.PARENS[4] || this.currentToken === MindustryLexer.PARENS[1] ||
                this.currentToken === MindustryLexer.PARENS[3] || this.currentToken === MindustryLexer.PARENS[5]
            )
        ) || this.currentToken instanceof MindustryTokens.COMMA) return left

        //GET OP TOKEN:
        var opNode = this.getOPNode(ast, numOpenParens)

        //GET RIGHT TOKEN:
        right = this.parseNonOP(ast, numOpenParens)

        //CONSTRUCT OP NODE:
        opNode.op.inParens = false
        opNode.op.left = left
        opNode.op.right = right

        //ITERATE TO GET REST OF NODES:
        while (!this.tokens.done && !(this.currentToken instanceof MindustryTokens.NEWLINE) && !(this.currentToken instanceof MindustryTokens.PAREN && (
            this.currentToken.subtypeObject === MindustryLexer.PARENS[4] || this.currentToken.subtypeObject === MindustryLexer.PARENS[1] ||
            this.currentToken.subtypeObject === MindustryLexer.PARENS[3] || this.currentToken.subtypeObject === MindustryLexer.PARENS[5]
        ))) {
            var newOp = this.getOPNode(ast, numOpenParens);

            right = this.parseNonOP(ast, numOpenParens);

            //ADD TO EXISTING NODES WITH CORRECT ORDER OF OPERATIONS:
            if (this.precedence(newOp.op) >= this.precedence(opNode.op)) {
                newOp.op.left = this.addNode(ast, opNode);
                newOp.op.right = right;
                opNode = newOp;
            } else {
                //find rightmost op with lesser order:
                var rightMost = opNode;
                var rightModeRight = ast.nodePool[rightMost.op.right];
                while (rightModeRight instanceof MindustryTokens.OPERATOR &&
                this.precedence(newOp.op) < this.precedence(rightModeRight.op) &&
                !rightMost.op.inParens) {
                    rightMost = ast.nodePool[rightMost.op.right];
                    rightModeRight = ast.nodePool[rightMost.op.right];
                }

                newOp.op.left = rightMost.op.right;
                newOp.op.right = right;
                rightMost.op.right = this.addNode(ast, newOp);
            }
        }

        return this.addNode(ast, opNode)
    }

    parseNonOP(ast, numOpenParens) {
        var node
        if (this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[0]) node = this.parseStatementInParens(ast, numOpenParens)
        else node = this.parsePhrase(ast, numOpenParens)
        this.continueStatement(numOpenParens)
        return node
    }

    parseStatementInParens(ast, numOpenParens) {
        numOpenParens.add()
        this.advance()
        var node = this.parseStatement(ast, numOpenParens)
        if (!(this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[1])) this.throwError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN)
        ast.nodePool[node].op.inParens = true

        numOpenParens.sub()
        this.advance()
        return node
    }

    parsePhrase(ast, numOpenParens) {
        var negative = false
        if (this.currentToken instanceof MindustryTokens.OPERATOR && this.currentToken.subtypeObject === MindustryLexer.OPERATORS[1]) {
            negative = true
            this.advance()
        }

        this.forcePhrase(this.currentToken)

        //FUNCTION:
        if (this.tokens.nextPreview instanceof MindustryTokens.PAREN && this.tokens.nextPreview.subtypeObject === MindustryLexer.PARENS[0]) {
            // TODO this
        }

        this.advance()
        var token = this.currentToken

        //NUMBER:
        if (token instanceof MindustryTokens.VALUE && token.subtype === "number") {
            var numNode = new Parser.ASTNode
            numNode.type = MindustryParser.NUMBERNode
            numNode.lineNum = this.tokens.lastPreview.lineNum
            numNode.literal = {value: token.content}
            return this.addNode(ast, numNode)
        }

        //VARIABLE:
        var varNode = new Parser.ASTNode
        varNode.type = MindustryParser.PHRASENode
        varNode.lineNum = this.currentToken.lineNum
        varNode.phrase = {type: "VAR", name: token.content}

        //index into variable:
        // NOT DOING THAT

        if (negative) {
            var minusNode = new Parser.ASTNode
            minusNode.type = MindustryParser.OPNode
            minusNode.lineNum = this.currentToken.lineNum
            minusNode.op = {type: "SUB-TODO"}


            var negOne = new Parser.ASTNode
            negOne.type=MindustryParser.NUMBERNode
        } else return this.addNode(ast, varNode)
    }

    getOPNode(ast, numOpenParens) {
        //ENSURE ACTUALLY AN OP:
        if (!(this.currentToken instanceof MindustryTokens.OPERATOR)) this.throwError(MindustryParser.ERROR_EXPECTED_OPERATOR, this.currentToken)

        var opNode = new Parser.ASTNode
        opNode.type = MindustryParser.OPNode
        opNode.lineNum = this.currentToken.lineNum
        opNode.op = {}
        opNode.op.type = this.currentToken.subtypeObject

        this.advance()
        this.continueStatement(numOpenParens)
        return opNode;
    }

    addNode(ast, node) {
        ast.nodePool.push(node)
        return ast.nodePool.length - 1
    }

    continueStatement(numOpenParens) {
        if (this.currentToken instanceof MindustryTokens.NEWLINE && numOpenParens.get() !== 0) {
            this.advance()
            if (this.tokens.done) this.throwError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN, this.currentToken)
        }
    }

    removeNewline() {
        if (this.currentToken instanceof MindustryTokens.NEWLINE) this.advance()
    }

    precedence(op) {
        console.log(op)
        return 0
    }

    forcePhrase(token) {
        if (token.type !== MindustryParser.PHRASENode) this.throwError(MindustryParser.ERROR_UNEXPECTED_OPERATOR, token)
        if (MindustryParser.KEYWORDS.includes(token.content)) this.throwError(MindustryParser.ERROR_INVALID_TOKEN, token)
    }
}
