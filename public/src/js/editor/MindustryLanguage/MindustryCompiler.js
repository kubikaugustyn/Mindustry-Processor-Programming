var __author__ = "kubik.augustyn@post.cz"

class MindustryCompiler extends Compiler {
    compile() {
        /**
         * @type {ProcessorBlock[]}
         */
        var processorBlocks = []
        console.group("Compile", this.tree)
        console.groupEnd()
        return processorBlocks
    }
}
