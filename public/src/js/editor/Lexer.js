var __author__ = "kubik.augustyn@post.cz"

class Lexer {
    static StringIterator = class StringIterator {
        // String iterator, stores items using run length encoding
        /**
         * @type {(string|(number|string)[])[]}
         */
        #value = []
        #i = 0
        #done = false
        #almostDone = false
        /**
         * @type {string}
         */
        currentChar

        constructor(string) {
            this.add(string)
        }

        reset() {
            this.#i = 0
            this.#done = false
            this.#almostDone = false
        }

        get length() {
            return this.#value.reduce((length, val) => length + (typeof val === "string" ? val.length : val[0]), 0)
        }

        #itemAtI(findI) {
            var i = 0
            for (var val of this.#value) {
                var len = typeof val === "string" ? val.length : val[0]
                if (i + len > findI) return typeof val === "string" ? val[findI - i] : val[1]
                i += len
            }
        }

        get next() {
            var length = this.length;
            if (this.#i >= length) this.#done = true
            if (this.#i >= length - 1) this.#almostDone = true
            return this.currentChar = this.#itemAtI(this.#i++)
        }

        get done() {
            return this.#done
        }

        get almostDone() {
            return this.#almostDone
        }

        undo(len) {
            var length = this.length;
            this.#i -= len
            this.#done = this.#i >= length
            this.#almostDone = this.#i >= length - 1
        }

        add(string) {
            if (!string) {
                this.undo(0)
                return
            }
            var lastVal = this.#value[this.#value.length - 1]
            if (typeof lastVal === "string" && lastVal === string) {
                this.#value[this.#value.length - 1] = [2, string]
            } else if (lastVal instanceof Array && lastVal[1] === string) {
                this.#value[this.#value.length - 1][0] += 1
            } else this.#value.push(string)
            this.undo(0)
        }

        toString() {
            return this.#value.map(a => typeof a === "string" ? a : a[1].repeat(a[0])).join("")
        }
    }

    currentChar
    /**
     * @type {Lexer.StringIterator}
     */
    text
    /**
     * Text --> Tokens
     * + = Next token
     * = = Keep token
     * * = Skip this char (for non-parsed spaces etc.)
     * @type {Lexer.StringIterator}
     */
    tokenText
    /**
     * @type {number}
     */
    lineNumber

    constructor() {
    }

    advance() {
        this.currentChar = this.text.next
    }

    nextToken() {
        this.tokenText.add("+")
    }

    keepToken() {
        this.tokenText.add("=")
    }

    skipToken() {
        // console.warn("Skip token")
        this.tokenText.add("*")
    }

    newline() {
        this.lineNumber++
    }

    regenerateTokens(text) {
        this.lineNumber = 0
        this.text = new Lexer.StringIterator(text)
        this.tokenText = new Lexer.StringIterator("")
        this.advance()
        return this.generateTokens()
    }

    * generateTokens() {

    }
}
