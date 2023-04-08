var __author__ = "kubik.augustyn@post.cz"

class MindustryCompiler extends Compiler {
    static OBFUSCATE = true
    static VARIABLE_ASSIGNMENT = [MindustryTokens.VARIABLE_PHRASE, MindustryTokens.SET, "*"]
    static VARIABLE_ASSIGNMENT_VALUE = [[MindustryTokens.VALUE, MindustryTokens.VARIABLE_PHRASE]]
    static VARIABLE_ASSIGNMENT_OPERATOR_1INP = [MindustryTokens.OPERATOR, [MindustryTokens.VALUE, MindustryTokens.VARIABLE_PHRASE]]
    static VARIABLE_ASSIGNMENT_OPERATOR_2INP = [[MindustryTokens.VALUE, MindustryTokens.VARIABLE_PHRASE], MindustryTokens.OPERATOR, [MindustryTokens.VALUE, MindustryTokens.VARIABLE_PHRASE]]
    static FUNCTION_CALL = [MindustryTokens.FUNCTION_CALL_PHRASE, MindustryTokens.DUMMY]

    static VarNamesPool = class VarNamesPool {
        varNamesCount

        constructor() {
            this.varNamesCount = 0
        }

        nextAvailable() {
            return "tmp_".concat((this.varNamesCount++).toString(36))
        }
    }

    compile() {
        /**
         * @type {ProcessorBlock[]}
         */
        var processorBlocks = []
        console.group("Compile", this.tree)
        var tmpVars = new MindustryCompiler.VarNamesPool()
        /**
         * @type {MindustryParser.ParenPair}
         */
        var paren = this.tree.clone()
        /**
         * @type {number}
         */
        var i = 0
        var limit = 1000
        var loopI = 0
        WholeLoop:
            while (loopI < limit) {
                var cont = paren.contents[i++]
                var toEndOrNewline = MindustryCompiler.toEndOrNewline(paren.contents.slice(i - 1))
                console.log(toEndOrNewline)
                if (cont instanceof MindustryParser.PAREN_PAIR) {
                    paren.tmp_i = i
                    cont.parent = paren
                    paren = cont
                    i = 0
                } else if (cont instanceof MindustryTokens.COMMENT && !MindustryCompiler.OBFUSCATE) {
                    var commentLines = cont.content.split("\n").filter(a => a)
                    var commentPrints = new Array(commentLines.length).fill(0)
                    commentPrints = commentPrints.map((_, i) => new ProcessorTokens.PRINT(['"' + commentLines[i].replaceAll('"', '“') + '"']))
                    processorBlocks.push(...commentPrints, new ProcessorTokens.PRINT_FLUSH(["null"]))
                } else if (MindustryCompiler.instancesOf(toEndOrNewline, MindustryCompiler.VARIABLE_ASSIGNMENT)) {
                    var assignedVal = toEndOrNewline.slice(2)
                    var varName = toEndOrNewline[0].content
                    console.log("Set variable", varName, "to", assignedVal, "(", toEndOrNewline, ")")
                    if (MindustryCompiler.instancesOf(assignedVal, MindustryCompiler.VARIABLE_ASSIGNMENT_VALUE)) {
                        processorBlocks.push(new ProcessorTokens.SET([varName, assignedVal[0].represent()]))
                    } else if (MindustryCompiler.instancesOf(assignedVal, MindustryCompiler.VARIABLE_ASSIGNMENT_OPERATOR_1INP)) {
                        processorBlocks.push(new ProcessorTokens.OPERATION([assignedVal[0].represent(), varName, assignedVal[1].represent()]))
                    } else if (MindustryCompiler.instancesOf(assignedVal, MindustryCompiler.VARIABLE_ASSIGNMENT_OPERATOR_2INP)) {
                        processorBlocks.push(new ProcessorTokens.OPERATION([assignedVal[1].represent(), varName, assignedVal[0].represent(), assignedVal[2].represent()]))
                    }
                } else if (MindustryCompiler.instancesOf(toEndOrNewline, MindustryCompiler.FUNCTION_CALL)) { // First appearance of function call, process its arguments
                    paren.tmp_i = i
                    toEndOrNewline[0].content[1].parent = paren
                    paren = toEndOrNewline[0].content[1]
                    i = 0
                } else if ((i - 2) >= 0 && MindustryCompiler.instancesOf(MindustryCompiler.toEndOrNewline(paren.contents.slice(i - 2)), MindustryCompiler.FUNCTION_CALL)) { // Second appearance of function call (the dummy token)
                    var functionCall = paren.contents[i - 2]
                    processorBlocks.push(...MindustryCompiler.functionCall(functionCall, functionCall.content[0], functionCall.content[1]))
                }//else if (cont) console.log(cont)
                while (i === paren.contents.length) {
                    if (!paren.parent || paren.root) break WholeLoop
                    paren = paren.parent
                    i = paren.tmp_i || 0
                }
                loopI++
            }
        if (loopI === limit) console.warn("Limit reached:", limit)
        console.groupEnd()
        return processorBlocks
    }

    static toEndOrNewline(tokens) {
        var newlineI = tokens.indexOf(tokens.find(token => token instanceof MindustryTokens.NEWLINE))
        var commentI = tokens.indexOf(tokens.find(token => token instanceof MindustryTokens.COMMENT))
        if (Math.max(newlineI, commentI) !== -1) {
            if (Math.min(newlineI, commentI) !== -1) return tokens.slice(0, Math.min(newlineI, commentI))
            else return tokens.slice(0, Math.max(newlineI, commentI))
        }
        return tokens
    }

    static instancesOf(tokens, classes) {
        if (classes[classes.length - 1] === "*" ? tokens.length < classes.length : tokens.length !== classes.length) return false
        for (var i = 0; i < tokens.length; i++) {
            if (typeof classes[i] === "object") {
                if (!classes[i].find(class_ => tokens[i] instanceof class_)) return false
            } else if (typeof classes[i] === "string" && classes[i] === "*") {
                return true
            } else if (!(tokens[i] instanceof classes[i])) return false
        }
        return true
    }

    /**
     *
     * @param call {MindustryTokens.FUNCTION_CALL_PHRASE}
     * @param name {string}
     * @param args {MindustryParser.PAREN_PAIR}
     */
    static functionCall(call, name, args) {
        /**
         * @type {ProcessorBlock[]}
         */
        var tokens = []
        console.log("Call function:", name, call, args)
        return tokens
    }
}
