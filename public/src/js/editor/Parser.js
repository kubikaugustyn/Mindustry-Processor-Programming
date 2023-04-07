var __author__ = "kubik.augustyn@post.cz"

class Parser {
    static ArrayIterator = class ArrayIterator {
        #values = []
        #i = 0
        #done = false
        #almostDone = false

        constructor(array) {
            this.add(array)
        }

        reset() {
            this.#i = 0
            this.#done = false
            this.#almostDone = false
        }

        get next() {
            if (this.#i >= this.#values.length) this.#done = true
            if (this.#i >= this.#values.length - 1) this.#almostDone = true
            return this.#values[this.#i++]
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

        add(array) {
            this.#values.push(...array)
            this.undo(0)
        }
    }

    /**
     * @type {Token}
     */
    currentToken
    /**
     * @type {Parser.ArrayIterator}
     */
    tokens

    throwError(msg) {
        throw new SyntaxError("Invalid syntax" + (msg ? ": ".concat(msg) : ""))
    }

    constructor(tokens) {
        this.tokens = new Parser.ArrayIterator(tokens)
        this.advance()
    }

    advance() {
        this.currentToken = this.tokens.next
    }

    parse() {

    }
}
