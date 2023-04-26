var __author__ = "kubik.augustyn@post.cz"

class Compiler {
    /**
     * @type {any}
     */
    tree // Used (now) only with type ParenPair

    throwError(msg) {
        throw new Error("Compilation error" + (msg ? ": ".concat(msg) : ""))
    }

    constructor() {

    }

    recompile(tree) {
        this.tree = tree
        return this.compile()
    }

    compile() {

    }
}
