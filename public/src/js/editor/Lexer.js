var __author__ = "kubik.augustyn@post.cz"

class Lexer {
    static StringIterator = class StringIterator {
        /**
         * @type {string[]}
         */
        #values = []
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

        get next() {
            if (this.#i >= this.#values.length) this.#done = true
            if (this.#i >= this.#values.length - 1) this.#almostDone = true
            if (this.#values[this.#i] === "\\" && !this.done) {
                return this.#values[this.#i++].concat(this.next)
            }
            return this.currentChar = this.#values[this.#i++]
        }

        get done() {
            return this.#done
        }

        get almostDone() {
            return this.#almostDone
        }

        undo(len) {
            this.#i -= len
            this.#done = this.#i >= this.#values.length
            this.#almostDone = this.#i >= this.#values.length - 1
        }

        add(string) {
            this.#values.push(...string.split(""))
            this.undo(0)
        }

        toString() {
            return this.#values.join("")
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
    tokenText = new Lexer.StringIterator("")

    constructor(text) {
        this.text = new Lexer.StringIterator(text)
        this.advance()
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

    * generateTokens() {

    }
}
