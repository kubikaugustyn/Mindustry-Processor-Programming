var __author__ = "kubik.augustyn@post.cz"

//https://github.com/frozein/PropScript/blob/master/src/interpreter.cpp

class MindustryCompiler extends Compiler {
    static VariableSignature = class VariableSignature {
        /**
         * @type {string}
         */
        name
        /**
         * @type {ProcessorType}
         */
        type

        constructor(name, type) {
            this.name = name
            this.type = type
        }
    }
    static Value = class Value {
        /**
         * @type {*}
         */
        val

        constructor(val) {
            this.val = val
        }
    }
    static FunctionSignature = class FunctionSignature {
        name
        // ?! PSdata (*func)(const std::vector<PSdata>& params, const PSnode& node, void* userData);
        arguments
        returns
        content

        /**
         * @param name {string}
         * @param args {Object<string, ProcessorType[]>}
         * @param returns {Object<string, ProcessorType[]>}
         * @param content {[*]}
         */
        constructor(name, args, returns, content) {
            this.name = name
            this.arguments = args
            this.returns = returns
            this.content = content
        }
    }
    static Constant = class Constant {
        /**
         * @type {string}
         */
        name
        /**
         * @type {*}
         */
        val
    }

    static RuntimeError = class RuntimeError {
        static INVALID_ASSIGNMENT = "INVALID_ASSIGNMENT"
        static INVALID_OP = "INVALID_OP"
        static UNSUPPORTED_NODE_TYPE = "UNSUPPORTED_NODE_TYPE"
        static UNDEFINED_VARIABLE = "UNDEFINED_VARIABLE"
        static UNDEFINED_FUNCTION = "UNDEFINED_FUNCTION"
        static INVALID_PARAMS = "INVALID_PARAMS"
        static INVALID_INDEX = "INVALID_INDEX"
        static INVALID_CONDITION = "INVALID_CONDITION"
        static INVALID_BREAK_CONTINUE = "INVALID_BREAK_CONTINUE"
        static FUNCTION_REDEFINITION = "FUNCTION_REDEFINITION"
        static ARGUMENT_NAME_REDEFINITION = "ARGUMENT_NAME_REDEFINITION"
    }
    /**
     * @type {string} One of runtime errors
     */
    static error
    /**
     * @type {Parser.ASTNode}
     */
    static errorNode
    /**
     * @type {FunctionSignature[]}
     */
    static DEFAULT_LIB_FUNCTIONS = []
    static DEFAULT_CONSTANTS = {
        "M_PI": new MindustryCompiler.Value(Math.PI)
    }
    /**
     * @type {Map<string, FunctionSignature>}
     */
    static libFunctions = new Map()
    /**
     * @type {Map<string, VariableSignature>}
     */
    static constants = new Map()
    static libFunctionUserData = void 0
    /**
     * @type {Map<string, FunctionSignature>}
     */
    static functions = new Map()
    /**
     * @type {Map<string, VariableSignature>}
     */
    static variables = new Map()
    static inLoop = false
    static returnFlag = false
    static breakFlag = false
    static continueFlag = false

    static OBFUSCATE = true

    static VarNamesPool = class VarNamesPool {
        varNamesCount

        constructor() {
            this.varNamesCount = 0
        }

        nextAvailable() {
            return "tmp_".concat((this.varNamesCount++).toString(36))
        }

        reset() {
            this.varNamesCount = 0
        }
    }
    static varNamesPool = new MindustryCompiler.VarNamesPool()
    static blocks = new Parser.ArrayBuffer()

    /**
     * @param functions {FunctionSignature[]}
     */
    setFunctions(functions) {
        MindustryCompiler.libFunctions.clear()
        for (var i = 0; i < MindustryCompiler.DEFAULT_LIB_FUNCTIONS.length; i++) MindustryCompiler.libFunctions.set(MindustryCompiler.DEFAULT_LIB_FUNCTIONS[i].name, MindustryCompiler.DEFAULT_LIB_FUNCTIONS[i])
        for (i = 0; i < functions.length; i++) MindustryCompiler.libFunctions.set(functions[i].name, functions[i])
    }

    /**
     * @param constants {Constant[]}
     */
    setConstants(constants) {
        MindustryCompiler.constants.clear()
        for (var i = 0; i < MindustryCompiler.DEFAULT_CONSTANTS.length; i++) MindustryCompiler.constants.set(MindustryCompiler.DEFAULT_CONSTANTS[i].name, MindustryCompiler.DEFAULT_CONSTANTS[i])
        for (i = 0; i < constants.length; i++) MindustryCompiler.constants.set(constants[i].name, constants[i])
    }

    setFunctionUserData(userData) {
        MindustryCompiler.libFunctionUserData = userData
    }

    /**
     * @param node {Parser.ASTNode}
     */
    throwInvalidParamError(node) {
        this.handleError(MindustryCompiler.RuntimeError.INVALID_PARAMS, node)
    }

    /**
     * @return {ProcessorBlock[]}
     */
    compile() {
        if (!MindustryCompiler.DEFAULT_LIB_FUNCTIONS.length) this.createLibFunctions()
        /**
         * @type {Parser.AST}
         */
        var ast = this.tree
        MindustryCompiler.blocks.reset()
        MindustryCompiler.varNamesPool.reset()

        if (MindustryCompiler.libFunctions.size === 0) this.setFunctions([])
        if (MindustryCompiler.constants.size === 0) this.setConstants([])

        try {
            this.compileStatements(ast, ast.parentNodes)
            if (MindustryCompiler.returnFlag) MindustryCompiler.returnFlag = false
        } catch (e) {
            /**
             * @type {string}
             */
            var errMsg
            /**
             * @type {Parser.ASTNode}
             */
            if (!MindustryCompiler.errorNode || !MindustryCompiler.error) this.handleError(e)
            switch (MindustryCompiler.error) {
                case MindustryCompiler.RuntimeError.INVALID_ASSIGNMENT:
                    errMsg = "INVALID ASSIGNMENT"
                    break
                case MindustryCompiler.RuntimeError.INVALID_OP:
                    errMsg = "INVALID OPERATION"
                    break
                case MindustryCompiler.RuntimeError.UNSUPPORTED_NODE_TYPE:
                    errMsg = "UNSUPPORTED NODE TYPE (i must've forgot to implement something in the interpreter)"
                    break
                case MindustryCompiler.RuntimeError.UNDEFINED_VARIABLE:
                    errMsg = "UNDEFINED VARIABLE"
                    break
                case MindustryCompiler.RuntimeError.UNDEFINED_FUNCTION:
                    errMsg = "UNDEFINED FUNCTION"
                    break
                case MindustryCompiler.RuntimeError.INVALID_PARAMS:
                    errMsg = "INVALID PARAMETERS"
                    break
                case MindustryCompiler.RuntimeError.INVALID_INDEX:
                    errMsg = "INVALID INDEX"
                    break
                case MindustryCompiler.RuntimeError.INVALID_CONDITION:
                    errMsg = "INVALID CONDITION"
                    break
                case MindustryCompiler.RuntimeError.INVALID_BREAK_CONTINUE:
                    errMsg = "INVALID BREAK/CONTINUE"
                    break
                case MindustryCompiler.RuntimeError.FUNCTION_REDEFINITION:
                    errMsg = "FUNCTION REDEFINITION"
                    break
                case MindustryCompiler.RuntimeError.ARGUMENT_NAME_REDEFINITION:
                    errMsg = "ARGUMENT NAME REDEFINITION"
                    break
            }

            //there might be uncleared vars/funcs if we run into an error:
            MindustryCompiler.functions.clear()
            MindustryCompiler.variables.clear()
            ast.setFree()

            this.handleError(errMsg + " ON LINE " + (MindustryCompiler.errorNode?.lineNum + 1), MindustryCompiler.errorNode)
        }
        ast.setFree()
        /**
         * @type {ProcessorBlock[]}
         var processorBlocks = []
         MindustryCompiler.varNamesPool.reset()
         console.group("Compile", this.tree)
         processorBlocks.push(new ProcessorTokens.READ([0, 1, 2]))
         console.groupEnd()
         this.tree.setFree()
         return processorBlocks*/
        return MindustryCompiler.blocks.items
    }

    /**
     * @param ast {AST}
     * @param nodes {number[]}
     */
    compileStatements(ast, nodes) {
        /**
         * @type {string[]}
         */
        var addedFuncs = [], addedVars = []

        for (var i = 0; i < nodes.length; i++) {
            this.compileStatement(ast, ast.nodePool[nodes[i]], addedFuncs, addedVars)

            if (MindustryCompiler.returnFlag || MindustryCompiler.breakFlag || MindustryCompiler.continueFlag) break
        }

        for (i = 0; i < addedFuncs.length; i++) MindustryCompiler.functions.delete(addedFuncs[i]);
        for (i = 0; i < addedVars.length; i++) MindustryCompiler.variables.delete(addedVars[i]);
    }

    nodeToString(ast, node, addedFuncs, addedVars) {
        if (node.type === MindustryParser.NUMBERNode) return node.literal.value
        if (node.type === MindustryParser.PHRASENode) {
            if (node.phrase.type === "VAR") return node.phrase.name
        }
        //console.log(node.type, node)
        return this.compileStatement(ast, node, addedFuncs, addedVars)
    }

    /**
     * @param ast {AST}
     * @param node {ASTNode}
     * @param addedFuncs {string[]}
     * @param addedVars {string[]}
     * @param name {string, undefined}
     * @returns {string}
     */
    compileStatement(ast, node, addedFuncs, addedVars, name = undefined) {
        // console.log(node)
        switch (node.type) {
            case MindustryParser.SETNode:
                return this.equal(ast, ast.nodePool[node.set.left], ast.nodePool[node.set.right], addedFuncs, addedVars)
            case MindustryParser.OPNode:
                var lNode = ast.nodePool[node.op.left]
                var rNode = ast.nodePool[node.op.right]
                if (node.op.type.has2inputs) var left = this.nodeToString(ast, lNode, addedFuncs, addedVars)
                var right = this.nodeToString(ast, rNode, addedFuncs, addedVars)


                name = this.variable(ProcessorTypes.NUMBER, addedVars, name)
                if (node.op.type === MindustryLexer.OPERATORS[39]) this.block(ProcessorTokens.SENSOR, name, left, right)
                else this.block(ProcessorTokens.OPERATION, node.op.type.processorString, name, node.op.type.has2inputs ? left : right, node.op.type.has2inputs ? right : null)
                //console.log(node.op.type, MindustryLexer.OPERATORS)
                /*switch (node.op.type) {
                    case MindustryLexer.OPERATORS[0]: // +

                        break
                    case MindustryLexer.OPERATORS[2]: // *
                        name = this.variable(ProcessorTypes.NUMBER, addedVars, name)
                        this.block(ProcessorTokens.OPERATION, "mul", name, left, right)
                        break
                }*/
                break
            case MindustryParser.PHRASENode:
                if (node.phrase.type === "VAR") name = node.phrase.name
                else if (node.phrase.type === "FUNC") {
                    this.compileFunctionCall(ast, node, addedFuncs, addedVars, null)
                } else console.log("Phrase:", node)
                break
            case MindustryParser.NUMBERNode:
                name = this.variable(ProcessorTypes.NUMBER, addedVars, name)
                this.block(ProcessorTokens.SET, name, this.getNumberValue(node))
                break
            case MindustryParser.KEYWORDNode:
                break
            default:
                this.error(MindustryCompiler.RuntimeError.UNSUPPORTED_NODE_TYPE, node)
                break
        }
        return name
    }

    getNumberValue(node) {
        var val = node.literal.value
        // console.log(node, val)
        if (node.literal.type === "color") val = "%" + val.slice(2)
        return val
    }

    getStringValue(node) {
        return `"${node.literal.value}"`
    }

    /**
     * @param ast {AST}
     * @param node {ASTNode}
     * @param addedFuncs {string[]}
     * @param addedVars {string[]}
     * @param name {string, string[], null} Return variable names
     * @returns {string}
     */
    compileFunctionCall(ast, node, addedFuncs, addedVars, name) {
        /**
         * @type {MindustryCompiler.FunctionSignature}
         */
        var func = MindustryCompiler.libFunctions.get(node.phrase.name) || MindustryCompiler.functions.get(node.phrase.name)
        // If function doesn't even exist
        if (!func) this.handleError(MindustryCompiler.RuntimeError.UNDEFINED_FUNCTION, node)
        // If arguments count don't match
        if (Object.keys(func.arguments).length !== node.phrase.params.length) this.error(MindustryCompiler.RuntimeError.INVALID_PARAMS, node)
        // If return count don't match
        if (Object.keys(func.returns).length !== (name ? (name instanceof Array ? name.length : 1) : 0)) this.error(MindustryCompiler.RuntimeError.INVALID_ASSIGNMENT, node)
        // In function signature, can't contain collision of same input as output
        if (Object.keys(func.arguments).find(a => func.returns[a] !== undefined)) this.error(MindustryCompiler.RuntimeError.INVALID_PARAMS, node)
        var paramsEntries = Object.keys(func.arguments).map((a, b) => {
            var n = ast.nodePool[node.phrase.params[b]]
            return [a,
                n.type === MindustryParser.NUMBERNode ? this.getNumberValue(n) :
                    n.type === MindustryParser.STRINGNode ? this.getStringValue(n) : this.compileStatement(ast, n, addedFuncs, addedVars)
            ]
        })
        paramsEntries.push(...Object.keys(func.returns).map((a, i) => [a, name instanceof Array ? name[i] : name]))
        var params = new Map(paramsEntries)
        // console.log("Function:", ...arguments)
        // console.log("Function:", func)
        // console.log("Function:", params)
        for (var instructionParts of func.content) {
            instructionParts = instructionParts.map((a, i) => i === 0 ? a : (
                a.startsWith("$") ? params.get(a.slice(1)) : a
            ))
            this.block(...instructionParts)
        }
    }

    // SOME STUFF

    /**
     * @param ast {AST}
     * @param varNode {ASTNode}
     * @param valNode {ASTNode}
     * @param addedFuncs {string[]}
     * @param addedVars {string[]}
     * @returns {string}
     */
    equal(ast, varNode, valNode, addedFuncs, addedVars) {
        // console.log(...arguments)
        if (varNode.type !== MindustryParser.PHRASENode || (varNode.phrase.type !== "VAR" && varNode.phrase.type !== "MULTI-VAR")) this.error(MindustryCompiler.RuntimeError.INVALID_ASSIGNMENT, varNode)

        //this.block(ProcessorTokens.SET, varNode.phrase.name, valNode)
        if (varNode.phrase.type !== "VAR" && (valNode.type !== MindustryParser.PHRASENode || valNode.phrase.type !== "FUNC")) this.error(MindustryCompiler.RuntimeError.INVALID_ASSIGNMENT, varNode)
        if (varNode.phrase.type === "VAR" && valNode.type === MindustryParser.PHRASENode && valNode.phrase.type === "VAR") this.block(ProcessorTokens.SET, varNode.phrase.name, valNode.phrase.name)
        else if (valNode.type === MindustryParser.PHRASENode && valNode.phrase.type === "FUNC") this.compileFunctionCall(ast, valNode, addedFuncs, addedVars, varNode.phrase.name || varNode.phrase.names)
        else this.compileStatement(ast, valNode, addedFuncs, addedVars, varNode.phrase.name)
    }

    error(error, errorNode) {
        MindustryCompiler.error = error
        MindustryCompiler.errorNode = errorNode
        throw error
    }

    /**
     * @param type {ProcessorType}
     * @param addedVars {string[]}
     * @param name {string, undefined}
     * @returns {string}
     */
    variable(type, addedVars, name = undefined) {
        if (!name) name = MindustryCompiler.varNamesPool.nextAvailable()
        addedVars.push(name)
        var sig = new MindustryCompiler.VariableSignature(name, type)
        MindustryCompiler.variables.set(name, sig)
        return name
    }

    /**
     * @param cons {ProcessorBlock:new}
     * @param args {string}
     * @returns {ProcessorBlock}
     */
    block(cons, ...args) {
        var block = new cons(args)
        MindustryCompiler.blocks.add(block)
        return block
    }

    createLibFunctions() {
        MindustryCompiler.DEFAULT_LIB_FUNCTIONS = [
            new MindustryCompiler.FunctionSignature("read", {
                "block": [new ProcessorTypes.BUILDING],
                "addr": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {"val": [new ProcessorTypes.NUMBER]}, [[ProcessorTokens.READ, "$val", "$block", "$addr"]]),
            new MindustryCompiler.FunctionSignature("write", {
                "block": [new ProcessorTypes.BUILDING],
                "addr": [new ProcessorTypes.POSITIVE_INTEGER],
                "val": [new ProcessorTypes.NUMBER]
            }, {}, [[ProcessorTokens.WRITE, "$val", "$block", "$addr"]]),
            new MindustryCompiler.FunctionSignature("draw.clear", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.color", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.col", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.stroke", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.line", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.rect", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.lineRect", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.poly", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.linePoly", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.triangle", {}, {}, []),
            new MindustryCompiler.FunctionSignature("draw.image", {}, {}, []),
            new MindustryCompiler.FunctionSignature("print", {"text": [new ProcessorTypes.STRING]}, {}, [[ProcessorTokens.PRINT, "$text"]]),
            new MindustryCompiler.FunctionSignature("drawflush", {}, {}, []),
            new MindustryCompiler.FunctionSignature("printflush", {"block": [new ProcessorTypes.BUILDING]}, {}, [[ProcessorTokens.PRINT_FLUSH, "$block"]]),
            new MindustryCompiler.FunctionSignature("getlink", {}, {}, []),
            new MindustryCompiler.FunctionSignature("control.enabled", {}, {}, []),
            new MindustryCompiler.FunctionSignature("control.shoot", {}, {}, []),
            new MindustryCompiler.FunctionSignature("control.shootp", {}, {}, []),
            new MindustryCompiler.FunctionSignature("control.config", {}, {}, []),
            new MindustryCompiler.FunctionSignature("control.color", {}, {}, []),
            new MindustryCompiler.FunctionSignature("radar", {}, {}, []),
            new MindustryCompiler.FunctionSignature("lookup.block", {}, {}, []),
            new MindustryCompiler.FunctionSignature("lookup.unit", {}, {}, []),
            new MindustryCompiler.FunctionSignature("lookup.item", {}, {}, []),
            new MindustryCompiler.FunctionSignature("lookup.liquid", {}, {}, []),
            new MindustryCompiler.FunctionSignature("packcolor", {}, {}, []),
            new MindustryCompiler.FunctionSignature("wait", {}, {}, []),
            new MindustryCompiler.FunctionSignature("stop", {}, {}, []),
            new MindustryCompiler.FunctionSignature("end", {}, {}, []),
            new MindustryCompiler.FunctionSignature("jump", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ubind", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.idle", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.stop", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.move", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.approach", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.boost", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.target", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.targetp", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.itemDrop", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.itemTake", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.payDrop", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.payTake", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.payEnter", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.payEnterIfIn", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.mine", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.flag", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.build", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.getBlock", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.within", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.unbind", {}, {}, []),
            new MindustryCompiler.FunctionSignature("uradar", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ulocate.ore", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ulocate.building", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ulocate.spawn", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ulocate.damaged", {}, {}, [])
        ]
    }
}
