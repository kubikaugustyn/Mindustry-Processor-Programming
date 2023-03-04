var __author__ = "kubik.augustyn@post.cz"

class ProcessorBlock extends Token {
    static CATEGORY_INPUT_OUTPUT = "Input & Output"
    static CATEGORY_BLOCK_CONTROL = "Block Control"
    static CATEGORY_OPERATIONS = "Operations"
    static CATEGORY_FLOW_CONTROL = "Flow control"
    static CATEGORY_UNIT_CONTROL = "Unit control"

    type = "processor-block"

    category
    blockTitle
}
