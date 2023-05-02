var __author__ = "kubik.augustyn@post.cz"

// https://github.com/frozein/PropScript/blob/master/src/parser.cpp

class MindustryParser extends Parser {
    static ERROR_INVALID_TOKEN = "INVALID TOKEN"
    static ERROR_EXPECTED_CLOSING_PAREN = "EXPECTED CLOSING PARENTHESIS"
    static ERROR_UNEXPECTED_OPERATOR = "UNEXPECTED OPERATOR"
    static ERROR_EXPECTED_OPERATOR = "EXPECTED OPERATOR"

    static SETNode = "SETNode"
    static OPNode = "OPNode"
    static PHRASENode = "PHRASENode"
    static NUMBERNode = "NUMBERNode"
    static KEYWORDNode = "KEYWORDNode"

    static KEYWORDS = {
        flow: ["if", "for", "while"],
        else: "else",
        aaaa: ["function", "return", "in"]
    }

    parse() {
        if (!this.currentToken) {
            return undefined
        }

        var result = new Parser.AST()
        // console.log(this.tokens.toArray())
        var numOpenParens = new Parser.AtomicInteger(0)
        var i = 0, limit = 10_000
        while (!this.tokens.done) {
            result.parentNodes.push(this.parseStatement(result, numOpenParens))
            this.removeNewline()
            i++
            if (i >= limit) break
        }
        if (i >= limit) console.log("Reached limit")

        if (!result) this.throwError()

        return result
    }

    parseStatement(ast, numOpenParens) {
        // console.log("Parse statement", ast, numOpenParens.get(), this.currentToken)
        //CHECK IF CONTROL FLOW STATEMENT:
        if (this.currentToken instanceof MindustryTokens.PHRASE && (MindustryParser.KEYWORDS.flow.includes(this.currentToken.content))) {
            this.currentToken.subtype = "keyword"
            var type = this.currentToken.content

            if (numOpenParens > 0) this.throwError(MindustryParser.ERROR_INVALID_TOKEN, this.currentToken)

            var controlNode = new Parser.ASTNode
            controlNode.type = MindustryParser.KEYWORDNode
            controlNode.lineNum = this.currentToken.lineNum
            controlNode.keyword = {type: type.toUpperCase(), code: []}

            //GET CONDITION:
            this.advance()
            controlNode.keyword.condition = this.parseStatement(ast, numOpenParens)
            this.removeNewline()

            //GET CODE:
            if (this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[4]) {
                this.advance()
                this.removeNewline()

                while (!(this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[5])) {
                    controlNode.keyword.code.push(this.parseStatement(ast, numOpenParens))
                    this.removeNewline()
                }

                this.advance()
            } else //single line
                controlNode.keyword.code.push(this.parseStatement(ast, numOpenParens))

            //IF NOT IF, NO ELSE STATEMENT POSSIBLE SO JUST RETURN
            if (type !== MindustryParser.KEYWORDS.flow[0]) return this.addNode(ast, controlNode)

            //CHECK FOR ELSE:
            this.removeNewline()

            if (this.currentToken instanceof MindustryTokens.PHRASE && this.currentToken.content === MindustryParser.KEYWORDS.else) {
                this.currentToken.subtype = "keyword"
                controlNode.keyword.hasElse = true
                controlNode.keyword.elseCode = []

                this.advance()
                this.removeNewline()
                if (this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[4]) { //multi-line
                    this.advance()
                    this.removeNewline()

                    while (!(this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[5])) {
                        controlNode.keyword.elseCode.push(this.parseStatement(ast, numOpenParens))
                        this.removeNewline()
                    }

                    this.advance()
                } else //single-line / else-if
                    controlNode.keyword.elseCode.push(this.parseStatement(ast, numOpenParens))
            } else controlNode.keyword.hasElse = false

            return this.addNode(ast, controlNode)
        }
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
                this.currentToken.subtypeObject === MindustryLexer.PARENS[4] || this.currentToken.subtypeObject === MindustryLexer.PARENS[1] ||
                this.currentToken.subtypeObject === MindustryLexer.PARENS[3] || this.currentToken.subtypeObject === MindustryLexer.PARENS[5]
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
                while (rightModeRight instanceof MindustryTokens.OPERATOR && this.precedence(newOp.op) < this.precedence(rightModeRight.op) && !rightMost.op.inParens) {
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
        var negative = false, minusNode, negOne
        if (this.currentToken instanceof MindustryTokens.OPERATOR && this.currentToken.subtypeObject === MindustryLexer.OPERATORS[1]) {
            negative = true
            this.advance()
        }

        // this.forcePhrase(this.currentToken) For some reason crashes it

        //FUNCTION:
        if (this.tokens.nextPreview instanceof MindustryTokens.PAREN && this.tokens.nextPreview.subtypeObject === MindustryLexer.PARENS[0]) {
            var funcNode = new Parser.ASTNode
            funcNode.type = MindustryParser.PHRASENode
            funcNode.lineNum = this.currentToken.lineNum
            funcNode.phrase = {
                type: "FUNC",
                name: this.currentToken.content,
                params: []
            }
            this.currentToken.subtype = "function-call"
            this.advance()
            this.advance()
            numOpenParens.add()
            this.continueStatement(numOpenParens)

            //0 argument function:
            if (this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[1]) {
                this.advance()
                numOpenParens.sub()
                return this.addNode(ast, funcNode)
            }

            //arguments:
            while (true) {
                funcNode.phrase.params.push(this.parseStatement(ast, numOpenParens))

                if (this.currentToken instanceof MindustryTokens.PAREN && this.currentToken.subtypeObject === MindustryLexer.PARENS[1]) break
                else if (!(this.currentToken instanceof MindustryTokens.COMMA)) this.throwError(MindustryParser.ERROR_EXPECTED_OPERATOR, this.currentToken)

                this.advance()
                this.continueStatement(numOpenParens)
            }

            this.advance()
            numOpenParens.sub()

            if (negative) {
                minusNode = new Parser.ASTNode
                minusNode.type = MindustryParser.OPNode
                minusNode.lineNum = this.currentToken.lineNum
                minusNode.op = {type: "SUB-TODO"}


                negOne = new Parser.ASTNode
                negOne.type = MindustryParser.NUMBERNode
                negOne.lineNum = this.currentToken.lineNum
                negOne.literal = {value: -1}

                minusNode.op = {
                    left: this.addNode(ast, negOne),
                    right: this.addNode(ast, funcNode),
                    type: MindustryLexer.OPERATORS[2]
                }
                return this.addNode(ast, minusNode)
            } else return this.addNode(ast, funcNode)
        }

        var token = this.currentToken
        this.advance()

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
        varNode.phrase = {type: "VAR", name: this.tokens.lastPreview.content}

        //index into variable:
        // NOT DOING THAT

        if (negative) {
            minusNode = new Parser.ASTNode
            minusNode.type = MindustryParser.OPNode
            minusNode.lineNum = this.currentToken.lineNum
            minusNode.op = {type: "SUB-TODO"}


            negOne = new Parser.ASTNode
            negOne.type = MindustryParser.NUMBERNode
            negOne.lineNum = this.currentToken.lineNum
            negOne.literal = {value: -1}

            minusNode.op = {
                left: this.addNode(ast, negOne),
                right: this.addNode(ast, varNode),
                type: MindustryLexer.OPERATORS[2]
            }
            return this.addNode(ast, minusNode)
        } else return this.addNode(ast, varNode)
    }

    getOPNode(ast, numOpenParens) {
        //ENSURE ACTUALLY AN OP:
        if (!(this.currentToken instanceof MindustryTokens.OPERATOR || this.currentToken instanceof MindustryTokens.SET)) this.throwError(MindustryParser.ERROR_EXPECTED_OPERATOR, this.currentToken)

        var opNode = new Parser.ASTNode
        opNode.lineNum = this.currentToken.lineNum
        opNode.op = {}
        if (this.currentToken instanceof MindustryTokens.SET) {
            opNode.type = MindustryParser.SETNode
            opNode.set = opNode.op
        } else {
            opNode.type = MindustryParser.OPNode
            opNode.op.type = this.currentToken.subtypeObject
        }

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
        return op.precedence / 10
    }

    /*forcePhrase(token) {
        if (!(token instanceof MindustryTokens.PHRASE)) this.throwError(MindustryParser.ERROR_UNEXPECTED_OPERATOR, token)
        if (MindustryParser.KEYWORDS.includes(token.content)) this.throwError(MindustryParser.ERROR_INVALID_TOKEN, token)
    }*/
}
