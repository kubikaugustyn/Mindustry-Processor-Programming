var __author__ = "kubik.augustyn@post.cz"

class ProcessorBlock extends Token {
    static CATEGORY_INPUT_OUTPUT = "Input & Output"
    static CATEGORY_BLOCK_CONTROL = "Block Control"
    static CATEGORY_OPERATIONS = "Operations"
    static CATEGORY_FLOW_CONTROL = "Flow control"
    static CATEGORY_UNIT_CONTROL = "Unit control"

    type = "processor-block"

    category = ""
    blockTitle = ""
    format = "[blank]" // "Hello {1}, {0}" (params: ["just test", "world"]) --> "Hello world, just test"
    // OR [[{1: "world"}, "Hello {1}, {0}"], [{}, "Failed"]] (params: ["just test", "world"]) --> "Hello world, just test" - Only if param 0 === "world"
    command = "[blank command]"

    params

    /**
     * @param params {string[]}
     */
    constructor(params) {
        super();
        this.params = params
    }

    /**
     * @returns {string}
     */
    normalizeCategory() {
        return this.category.toLowerCase().replaceAll(" & ", " ").replaceAll(" ", "-")
    }

    /**
     * @param formatParam {(name: string) => string}
     * @returns {string}
     */
    applyFormat(formatParam = a => a) {
        var format = this.format
        if (typeof format !== "string") {
            format = format.find(a => {
                for (var [i, value] of Object.entries(a[0])) {
                    if (this.params[i] !== value) return false
                }
                return true
            })?.[1] || "[blank]"
        }
        var iter = new Lexer.StringIterator(format)
        var isParam = false
        var paramIStr = ""
        /**
         * @type {(HTMLSpanElement|string)[]}
         */
        var formatted = []
        while (!iter.almostDone) {
            if (iter.next === "{") isParam = true
            else if (iter.currentChar === "}") {
                isParam = false
                formatted.push(formatParam(this.params[parseInt(paramIStr)]))
                paramIStr = ""
            } else {
                if (isParam) paramIStr += iter.currentChar
                else {
                    if (typeof formatted[formatted.length - 1] !== "string" || formatted[formatted.length - 1].startsWith("<")) formatted.push("")
                    formatted[formatted.length - 1] += iter.currentChar
                }
            }
        }
        return formatted.map(a => a.startsWith("<") ? a : `<span>${a}</span>`).join("")
    }

    toString() {
        return `${this.command} ${this.params.join(" ")}`
    }

    clone() {
        var clone = new ProcessorBlock(this.params.slice())
        clone.category = this.category
        clone.blockTitle = this.blockTitle
        clone.format = this.format
        clone.command = this.command
        return clone
    }
}
