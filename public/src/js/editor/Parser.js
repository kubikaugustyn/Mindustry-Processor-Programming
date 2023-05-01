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

        get nextPreview() {
            return this.#values[this.#i + 1]
        }

        get lastPreview() {
            return this.#values[this.#i - 1]
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

        toArray() {
            return this.#values.slice()
        }
    }

    static ArrayBuffer = class ArrayBuffer {
        static ALLOCATE_CHUNK = 5;
        #length
        #content

        constructor() {
            this.#content = new Array(ArrayBuffer.ALLOCATE_CHUNK)
            this.reset()
        }

        add(item) {
            if (this.#content.length <= this.#length) this.#content.length += ArrayBuffer.ALLOCATE_CHUNK
            this.#content[this.#length++] = item
        }

        reset() {
            this.#length = 0
            this.#content.length = ArrayBuffer.ALLOCATE_CHUNK
        }

        item(i) {
            if (i >= this.#length) return
            return this.#content[i]
        }

        get items() {
            return this.#content.slice(0, this.#length)
        }
    }

    static AtomicValue = class AtomicValue {
        #content

        constructor(val) {
            this.#content = val
        }

        set(val) {
            this.#content = val
        }

        get() {
            return this.#content
        }
    }

    static AtomicInteger = class AtomicInteger extends Parser.AtomicValue {
        add(num = 1) {
            this.set(this.get() + num)
        }

        sub(num = 1) {
            this.set(this.get() - num)
        }

        mul(num = 1) {
            this.set(this.get() * num)
        }

        div(num = 1) {
            this.set(this.get() / num)
        }
    }

    static AST = class AST {
        /**
         * @type {number[]} Basically index of node in node pool
         */
        parentNodes
        /**
         * @type {ASTNode[]}
         */
        nodePool

        constructor() {
            this.parentNodes = []
            this.nodePool = []
        }
    }

    static ASTNode = class ASTNode {
        type
        lineNum
    }

    /**
     * @type {Token}
     */
    currentToken
    /**
     * @type {Parser.ArrayIterator}
     */
    tokens

    throwError(msg, tok) {
        tok && console.log("At token:", tok)
        throw new SyntaxError("Invalid syntax" + (msg ? ": ".concat(msg) : ""))
    }

    constructor() {
    }

    advance() {
        console.warn(new Error("Advance"))
        this.currentToken = this.tokens.next
    }

    reparse(tokens) {
        this.tokens = new Parser.ArrayIterator(tokens)
        this.advance()
        return this.parse()
    }

    parse() {
    }

    static arrayInstances(arr, instances) {
        if (arr.length !== instances.length) return false
        for (var i = 0; i < arr.length; i++) if (!(arr[i] instanceof instances[i])) return false
        return true
    }

    static instanceOf(thing, instances) {
        for (var i = 0; i < instances.length; i++) if (!(thing instanceof instances[i])) return false
        return true
    }
}
