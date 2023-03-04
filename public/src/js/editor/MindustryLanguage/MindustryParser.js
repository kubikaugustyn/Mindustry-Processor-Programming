var __author__ = "kubik.augustyn@post.cz"

class MindustryParser extends Parser {
    static PAREN_PAIR = class ParenPair {
        /**
         * @type {MindustryLexer.Paren}
         */
        openParen
        /**
         * @type {MindustryLexer.Paren}
         */
        closeParen
        /**
         * @type {Array}
         */
        contents = []
        /**
         * @type {MindustryParser.ParenPair}
         */
        parent
        /**
         * @type {boolean}
         */
        root = false

        constructor(openParen, parent) {
            this.openParen = openParen
            this.parent = parent
        }

        newContent(content) {
            this.contents.push(content)
        }

        /**
         * @param paren {MindustryLexer.Paren}
         */
        close(paren) {
            this.closeParen = paren
        }
    }

    parse() {
        if (!this.currentToken) {
            return undefined
        }

        var result = this.pairParens()

        if (!result) this.throwError()

        return result
    }

    pairParens() {
        var limit = 10000
        var loopI = 0
        /**
         * @type {MindustryParser.ParenPair|undefined}
         */
        var paren = new MindustryParser.PAREN_PAIR()
        paren.root = true
        while (!this.tokens.done && loopI < limit) {
            console.log(this.currentToken instanceof MindustryTokens.PAREN, paren, this.currentToken)
            if (this.currentToken instanceof MindustryTokens.PAREN) {
                /**
                 * @type {MindustryLexer.Paren}
                 */
                var currentParen = this.currentToken.subtypeObject
                if (currentParen.opening) {
                    if (paren) {
                        var newPair = new MindustryParser.PAREN_PAIR(currentParen, paren)
                        paren.newContent(newPair)
                        paren = newPair
                    } else {
                    }
                } else {
                    if (!paren || paren.root) this.throwError()
                    paren.close(currentParen)
                    paren = paren.parent
                }
                this.advance()
            } else if (paren) {
                paren.newContent(this.currentToken)
            }
            this.advance()
            loopI++
        }
        if (paren) return
        return paren
    }
}
