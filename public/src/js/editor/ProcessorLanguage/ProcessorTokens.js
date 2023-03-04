var __author__ = "kubik.augustyn@post.cz"

class ProcessorTokens { // Basically all block available in processor
    static READ = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
        blockTitle="Read"
    }
    static WRITE = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
    }
    static DRAW = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
    }
    static PRINT = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
    }
}
