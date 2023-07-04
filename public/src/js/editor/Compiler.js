var __author__ = "kubik.augustyn@post.cz"

class Compiler {
    /**
     * @type {any}
     */
    tree // Used (now) only with type AST
    /**
     * @type {boolean}
     */
    quietError

    throwError(msg, node) {
        if (!this.quietError && node) {
            console.log("At node:", node)
            this.quietError = false
        }
        throw new Error("Compilation error" + (msg ? ": ".concat(msg) : ""))
    }

    handleError(msg, node) {
        this.throwError(msg, node, this)
    }

    warning(msg, node) {
        if (node) console.log("At node:", node)
        console.warn("Compilation warning" + (msg ? ": ".concat(msg) : ""))
    }

    handleWarning(msg, node) {
        this.warning(msg, node, this)
    }

    constructor() {

    }

    recompile(tree) {
        this.tree = tree
        this.quietError = false
        return this.compile()
    }

    compile() {

    }
}
