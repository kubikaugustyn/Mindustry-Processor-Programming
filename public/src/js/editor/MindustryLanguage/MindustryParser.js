var __author__ = "kubik.augustyn@post.cz"

class MindustryParser extends Parser {
    static ERROR_INVALID_TOKEN = "INVALID TOKEN"
    static ERROR_EXPECTED_CLOSING_PAREN = "EXPECTED CLOSING PARENTHESIS"
    static ERROR_UNEXPECTED_OPERATOR = "UNEXPECTED OPERATOR"
    static ERROR_EXPECTED_OPERATOR = "EXPECTED OPERATOR"

    static OPNode = "OPNode"
    static PHRASENode = "PHRASENode"

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
        console.log(this.currentToken)
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

        /*//ITERATE TO GET REST OF NODES:
        while(curTokenIdx < tokens.size() && tokens[curTokenIdx].type != PStoken::NEWLINE && tokens[curTokenIdx].str != PS_SEPERATOR_CURLY_OPEN &&
              std::find(PS_CLOSED_SEPERATORS.begin(), PS_CLOSED_SEPERATORS.end(), tokens[curTokenIdx].str) == PS_CLOSED_SEPERATORS.end())
        {
            PSnode newOp = _ps_get_op_node(ast, tokens, curTokenIdx, numOpenParens);

            right = _ps_parse_non_op(ast, tokens, curTokenIdx, numOpenParens);

            //ADD TO EXISTING NODES WITH CORRECT ORDER OF OPERATIONS:
            if(_ps_precedence(newOp.op.type) >= _ps_precedence(opNode.op.type))
            {
                newOp.op.left = _ps_add_node(ast, opNode);
                newOp.op.right = right;
                opNode = newOp;
            }
            else
            {
                //find rightmost op with lesser order:
                PSnode* rightMost = &opNode;
                PSnode rightModeRight = ast->nodePool[rightMost->op.right];
                while(rightModeRight.type == PSnode::OP &&
                     _ps_precedence(newOp.op.type) < _ps_precedence(rightModeRight.op.type) &&
                     !rightMost->op.inParens)
                {
                    rightMost = &ast->nodePool[rightMost->op.right];
                    rightModeRight = ast->nodePool[rightMost->op.right];
                }

                newOp.op.left = rightMost->op.right;
                newOp.op.right = right;
                rightMost->op.right = _ps_add_node(ast, newOp);
            }
        }*/

        return this.addNode(ast, opNode)
    }

    parseNonOP(ast, numOpenParens) {
        var node
        if (this.currentToken instanceof MindustryTokens.PAREN && this.currentToken === MindustryLexer.PARENS[0]) node = this.parseStatementInParens(ast, numOpenParens)
        else node = this.parsePhrase(ast, numOpenParens)
        this.continueStatement(numOpenParens)
        return node
    }

    parseStatementInParens(ast, numOpenParens) {
        numOpenParens.add()
        this.advance()
        var node = this.parseStatement(ast, numOpenParens)
        if (!(this.currentToken instanceof MindustryTokens.PAREN && this.currentToken === MindustryLexer.PARENS[1])) this.throwError(MindustryParser.ERROR_EXPECTED_CLOSING_PAREN)
        ast.nodePool[node].op.inParens = true

        numOpenParens.sub()
        this.advance()
        return node
    }

    parsePhrase(ast, numOpenParens) {
        // TODO _ps_parse_id
    }

    getOPNode(ast, numOpenParens) {
        //ENSURE ACTUALLY AN OP:
        if (!(this.currentToken instanceof MindustryTokens.OPERATOR)) this.throwError(MindustryParser.ERROR_EXPECTED_OPERATOR, this.currentToken)

        var opNode = new Parser.ASTNode
        opNode.type = MindustryParser.OPNode
        opNode.lineNum = this.currentToken.lineNum
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

    forcePhrase(token) {
        if (token.type !== MindustryParser.PHRASENode) this.throwError(MindustryParser.ERROR_UNEXPECTED_OPERATOR, token)
        if (MindustryParser.KEYWORDS.includes(token.content)) this.throwError(MindustryParser.ERROR_INVALID_TOKEN, token)
    }
}
