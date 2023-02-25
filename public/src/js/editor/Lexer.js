var __author__ = "kubik.augustyn@post.cz"

class Lexer {
    static StringIterator = class StringIterator {
        #values
        #i = 0
        #done = false

        constructor(string) {
            this.#values = string.split("")
        }

        reset() {
            this.#i = 0
            this.#done = false
        }

        get next() {
            if (this.#i === this.#values.length) this.#done = true
            return this.#values[this.#i++]
        }

        get done() {
            return this.#done
        }
    }

    currentChar
    /**
     * @type {Lexer.StringIterator}
     */
    text

    constructor(text) {
        this.text = new Lexer.StringIterator(text)
        this.advance()
    }

    advance() {
        this.currentChar = this.text.next
    }

    *generateTokens() {

    }
}
