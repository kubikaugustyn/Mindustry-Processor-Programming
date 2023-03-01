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
            if (this.#values[this.#i] === "\\" && !this.done) {
                return this.#values[this.#i++].concat(this.next)
            }
            return this.#values[this.#i++]
        }

        get done() {
            return this.#done
        }

        set undo(len) {
            this.#i -= len
            this.#done = this.#i === this.#values.length
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

    * generateTokens() {

    }
}
