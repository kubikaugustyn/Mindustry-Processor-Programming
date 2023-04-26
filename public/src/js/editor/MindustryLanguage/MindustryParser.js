var __author__ = "kubik.augustyn@post.cz"

class MindustryParser extends Parser {
    parse() {
        if (!this.currentToken) {
            return undefined
        }

        var ast = new Parser.ArrayBuffer()
        console.log(this.tokens.toArray())
        var buffer = new Parser.ArrayBuffer()
        var numOpenParens = new Parser.AtomicValue(0)
        while (!this.tokens.done) {
            console.log(buffer.items)
            buffer.add(this.currentToken)
            this.process(ast, buffer)
            this.advance()
        }

        if (!ast) this.throwError()

        return ast.items
    }

    process(ast, buffer) {
        if (Parser.arrayInstances(buffer.items, [MindustryTokens.PHRASE, MindustryTokens.SET])) ast.add(this.add(ast, buffer))
        else if (Parser.arrayInstances(buffer.items, [MindustryTokens.VALUE, MindustryTokens.OPERATOR, MindustryTokens.VALUE])) ast.add(this.op2(ast, buffer))
        else console.log("Oh no", ast.items, buffer.items)
    }

    // Used for X SET Y
    add(ast, buffer) {
        var child = [this.currentToken, buffer.item(0), new Parser.ArrayBuffer()]
        this.advance()
        var val = new Parser.ArrayBuffer()
        while (!this.tokens.done && !(this.currentToken instanceof MindustryTokens.NEWLINE)) {
            val.add(this.currentToken)
            this.advance()
        }
        this.process(child[2], val)
        // child[2] = child[2].items[0];
        return child
    }

    // Used for X OPERATOR Y
    op2(ast, buffer) {
        var child = [buffer.item(1), buffer.item(0), buffer.item(2)]
        this.advance()
        buffer.reset()
        return child
    }
}
