var __author__ = "kubik.augustyn@post.cz"

class Lexer {
    static DEBUG_RANGE = false
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
            if (string.length > 1) {
                string.split("").forEach(char => this.add(char))
                return;
            }
            var lastIndex = this.#value.length - 1
            var lastVal = this.#value[lastIndex]
            if (typeof lastVal === "string") {
                if (lastVal === string) this.#value[lastIndex] = [2, string]
                else if (lastVal.endsWith(string)) {
                    this.#value[lastIndex] = lastVal.slice(0, -string.length)
                    this.#value.push([2, string])
                } else this.#value[lastIndex] += string
            } else if (lastVal instanceof Array && lastVal[1] === string) {
                this.#value[lastIndex][0] += 1
            } else this.#value.push(string)
            this.undo(0)
        }

        peek(len) {
            // if (len === 0) return this.currentChar
            return this.#itemAtI(this.#i + len - 1)
        }

        peekDone(len) {
            return typeof this.peek(len) == "undefined"
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
     * @type {number}
     */
    lineNumber
    /**
     * @type {number}
     */
    #tokenFrom
    /**
     * @type {number}
     */
    #tokenTo
    /**
     * @type {boolean}
     */
    #rangeEnabled

    constructor() {
    }

    advance(skip = false) {
        this.currentChar = this.text.next
        if (Lexer.DEBUG_RANGE) console.warn(this.currentChar, this.#tokenTo + "++")
        if (!skip && !this.#rangeEnabled) throw new Error("Cannot advance outside a range")
        this.#tokenTo++
    }

    advanceBy(amount, skip = false) {
        if (amount <= 0) throw new Error(`Amount ${amount} out of range`)
        for (var i = 0; i < amount; i++) {
            this.currentChar = this.text.next
        }
        if (Lexer.DEBUG_RANGE) console.warn(this.currentChar, this.#tokenTo + " += " + amount)
        if (!skip && !this.#rangeEnabled) throw new Error("Cannot advance outside a range")
        this.#tokenTo += amount
    }

    startRange() {
        if (this.#rangeEnabled) throw new Error("Cannot start a range within a range")
        if (Lexer.DEBUG_RANGE) console.warn(`NEXT RANGE (${this.#tokenTo} - ?)`)
        this.#tokenFrom = this.#tokenTo
        this.#rangeEnabled = true
    }

    endRange() {
        if (!this.#rangeEnabled) throw new Error("Cannot end a range without it even starting")
        if (this.#tokenFrom === this.#tokenTo) throw new Error("Cannot end a range without it covering at least one character")
        if (Lexer.DEBUG_RANGE) console.warn(`END RANGE (${this.#tokenFrom} - ${this.#tokenTo})`)
        this.#rangeEnabled = false
    }

    get tokenFrom() {
        return this.#tokenFrom
    }

    get tokenTo() {
        return this.#tokenTo
    }

    get rangeEnabled() {
        return this.#rangeEnabled
    }

    /**
     * @return {{from: number, to: number}}
     */
    get range() {
        if (this.#rangeEnabled) throw new Error("Cannot read a range without it being closed")
        return {from: this.#tokenFrom, to: this.#tokenTo}
    }

    newline() {
        this.lineNumber++
    }

    regenerateTokens(text) {
        this.lineNumber = 0
        this.#tokenFrom = 0
        this.#tokenTo = 0
        this.#rangeEnabled = false
        this.text = new Lexer.StringIterator(text)
        this.currentChar = this.text.next
        return this.generateTokens()
    }

    /**
     * @abstract
     * @return {Generator<Token>}
     */
    * generateTokens() {

    }
}
