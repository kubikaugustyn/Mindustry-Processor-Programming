var __author__ = "kubik.augustyn@post.cz"

//https://github.com/frozein/PropScript/blob/master/src/interpreter.cpp - just small core, basically all mine

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
         * @param returns {Object<string, string[], ProcessorType[]>}
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
         * @type {ProcessorType}
         */
        type
        /**
         * @type {*}
         */
        val

        /**
         * @param name {string}
         * @param type {ProcessorType}
         * @param val {*, null}
         */
        constructor(name, type, val = null) {
            this.name = name
            this.type = type
            this.val = val
        }
    }
    // Used mainly in jump commands
    static DynamicLink = class DynamicLink {
        /**
         * @type {number}
         */
        target

        toString() {
            return "Dynamic Link" + (typeof this.target !== "undefined" ? ` to "${this.target}"` : "")
        }
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
    /**
     * @type {Constant[]}
     */
    static DEFAULT_CONSTANTS = []
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
    /**
     * @type {DynamicLink, undefined}
     */
    static breakTarget = undefined
    /**
     * @type {DynamicLink, undefined}
     */
    static continueTarget = undefined
    static continueFlag = false
    static OPtoJUMP = new Map([
        [MindustryLexer.OPERATORS[7], "equal"],
        [MindustryLexer.OPERATORS[8], "notEqual"],
        [MindustryLexer.OPERATORS[10], "lessThan"],
        [MindustryLexer.OPERATORS[11], "lessThanEq"],
        [MindustryLexer.OPERATORS[12], "greaterThan"],
        [MindustryLexer.OPERATORS[13], "greaterThanEq"],
        [MindustryLexer.OPERATORS[14], "strictEqual"],
        ["*", "always"]
    ])
    static OPReverse = new Map([
        ["notEqual", "equal"],
        ["equal", "notEqual"],
        ["greaterThanEq", "lessThan"],
        ["greaterThan", "lessThanEq"],
        ["lessThanEq", "greaterThan"],
        ["lessThan", "greaterThanEq"]
    ])
    /**
     * @type {ArrayBuffer}
     */
    static LogicIDsData

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
    static addedVarsCache
    static addedFuncsCache;

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
        if (!MindustryCompiler.DEFAULT_CONSTANTS.length) this.createConstants()
        ProcessorTypes.reloadAll()
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

            // Remove dynamic links
            for (var block of MindustryCompiler.blocks.iter()) {
                for (var i = 0; i < block.params.length; i++) {
                    if (block.params[i] instanceof MindustryCompiler.DynamicLink) {
                        /**
                         * @type {DynamicLink}
                         */
                        var link = block.params[i]
                        if (link.target >= MindustryCompiler.blocks.length) link.target = 0 // To prevent jumps pointing out of the code
                        block.params[i] = link.target
                    }
                }
            }
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
                    errMsg = "INVALID PARAMETERS (maybe call of native function that wasn't implemented yet?)"
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

            this.handleError("COMPILER ERROR: " + errMsg + " ON LINE " + (MindustryCompiler.errorNode?.lineNum + 1), MindustryCompiler.errorNode)
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
     * @param addedFuncs {string[], undefined}
     * @param addedVars {string[], undefined}
     */
    compileStatements(ast, nodes, addedFuncs = undefined, addedVars = undefined) {
        var del = arguments.length === 2
        addedFuncs = addedFuncs || []
        addedVars = addedVars || []
        MindustryCompiler.addedFuncsCache = addedFuncs
        MindustryCompiler.addedVarsCache = addedVars

        for (var i = 0; i < nodes.length; i++) {
            this.compileStatement(ast, ast.nodePool[nodes[i]], addedFuncs, addedVars)

            if (MindustryCompiler.returnFlag || MindustryCompiler.breakFlag || MindustryCompiler.continueFlag) break
        }

        if (del) {
            for (i = 0; i < addedFuncs.length; i++) MindustryCompiler.functions.delete(addedFuncs[i]);
            for (i = 0; i < addedVars.length; i++) MindustryCompiler.variables.delete(addedVars[i]);
        }
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
        var left, right, val
        switch (node.type) {
            case MindustryParser.SETNode:
                return this.equal(ast, ast.nodePool[node.set.left], ast.nodePool[node.set.right], addedFuncs, addedVars)
            case MindustryParser.OPNode:
                var lNode = ast.nodePool[node.op.left]
                var rNode = ast.nodePool[node.op.right]
                if (node.op.type.has2inputs) left = this.nodeToString(ast, lNode, addedFuncs, addedVars)
                right = this.nodeToString(ast, rNode, addedFuncs, addedVars)


                name = this.variable(ProcessorTypes.NUMBER, addedVars, name)
                // If operator is 'of' or 'in'
                if (node.op.type === MindustryLexer.OPERATORS[39] || node.op.type === MindustryLexer.OPERATORS[40]) {
                    if (!ProcessorTypes.ALL_SENSEABLE.includes(left.slice(1)) && !ProcessorTypes.ALL_ITEMS.includes(left.slice(1)) && !ProcessorTypes.ALL_LIQUIDS.includes(left.slice(1))) this.handleWarning(`Are you sure that '${left}' property of ${right} really exists? If yes, contact me (there's contacts page on this website if you don't know)`, node)
                    this.block(ProcessorTokens.SENSOR, name, right, left)
                }
                // Else just the operator
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
                //name = this.variable(ProcessorTypes.NUMBER, addedVars, name)
                //this.block(ProcessorTokens.SET, name, this.getNumberValue(node))
                val = this.getNumberValue(node)
                if (name) {
                    name = this.variable(ProcessorTypes.NUMBER, addedVars, name)
                    this.block(ProcessorTokens.SET, name, val)
                } else name = val
                break
            case MindustryParser.STRINGNode:
                val = this.getStringValue(node)
                if (name) {
                    this.block(ProcessorTokens.SET, name, val)
                } else name = val
                break
            case MindustryParser.KEYWORDNode:
                var condition
                if (typeof ast.nodePool[node.keyword.condition] !== "undefined") {
                    condition = ast.nodePool[node.keyword.condition].op
                    var jmpType = MindustryCompiler.OPtoJUMP.get(condition.type)
                    if (typeof jmpType === "undefined") {
                        left = this.compileStatement(ast, ast.nodePool[node.keyword.condition], addedFuncs, addedVars)
                        right = "0"// Idk why, but it somehow breaks with 0 (false)
                        jmpType = "notEqual"
                    } else {
                        left = this.compileStatement(ast, ast.nodePool[condition.left], addedFuncs, addedVars)
                        right = this.compileStatement(ast, ast.nodePool[condition.right], addedFuncs, addedVars)
                    }
                }
                if (node.keyword.type === "IF") {
                    /*
                    Structure:
                    JUMP to ifCode
                    <elseCode>
                    JUMP always endOfIf
                    <ifCode>
                    <endOfIf|otherBlock>

                    OR

                    JUMP to endOfIf if (negated condition)
                    <ifCode>
                    <endOfIf|otherBlock>
                     */
                    /*console.log(node.keyword)
                    console.log("IF keyword:", node.keyword)
                    console.log("IF:", condition)*/
                    var ifCodeJump = new MindustryCompiler.DynamicLink
                    var afterIfJump = new MindustryCompiler.DynamicLink
                    var ifCodeJumpBlock = this.block(ProcessorTokens.JUMP, ifCodeJump, jmpType, left, right) // Jump to ifCode
                    if (node.keyword.hasElse) {
                        this.compileStatements(ast, node.keyword.elseCode, addedFuncs, addedVars) // Else code
                    }
                    if (!node.keyword.hasElse && MindustryCompiler.OPReverse.has(ifCodeJumpBlock.params[1])) {
                        // Reverse the condition if possible and has only if, not else
                        ifCodeJumpBlock.params[0] = afterIfJump
                        ifCodeJumpBlock.params[1] = MindustryCompiler.OPReverse.get(ifCodeJumpBlock.params[1])
                    } else this.block(ProcessorTokens.JUMP, afterIfJump, "always") // Jump after whole if, runs also if hasElse
                    ifCodeJump.target = MindustryCompiler.blocks.length
                    this.compileStatements(ast, node.keyword.code, addedFuncs, addedVars) // If code
                    afterIfJump.target = MindustryCompiler.blocks.length
                    /*console.log("Ast nodes:", ast.nodePool)
                    console.group("Only if")
                    console.log("Left:", left, ast.nodePool[condition.left])
                    console.log("OP:", jmpType)
                    console.log("Right:", right, ast.nodePool[condition.right])
                    console.groupEnd()
                    console.group("Then")
                    node.keyword.code.forEach(a => console.log(ast.nodePool[a]))
                    console.groupEnd()
                    console.group("Else")
                    if (node.keyword.hasElse) node.keyword.elseCode.forEach(a => console.log(ast.nodePool[a]))
                    else console.log("(Doesn't have else)")
                    console.groupEnd()
                    console.log(this.variable(ProcessorTypes.BOOLEAN, addedVars, name))*/
                } else if (node.keyword.type === "WHILE") {
                    /*console.log("WHILE keyword:", node.keyword)
                    console.log("WHILE:", condition)*/
                    var whileCodeJump = new MindustryCompiler.DynamicLink
                    var whileConditionJump = new MindustryCompiler.DynamicLink
                    var afterWhileJump = new MindustryCompiler.DynamicLink
                    // Jump to the condition of while (what if even first iteration shouldn't start?) or skip the while
                    var conditionReverse = MindustryCompiler.OPReverse.get(jmpType) || "always"
                    this.block(ProcessorTokens.JUMP, afterWhileJump, conditionReverse, left, right)
                    whileCodeJump.target = MindustryCompiler.blocks.length
                    var oldBreakTarget = MindustryCompiler.breakTarget
                    var oldContinueTarget = MindustryCompiler.continueTarget
                    MindustryCompiler.breakTarget = afterWhileJump
                    MindustryCompiler.continueTarget = whileConditionJump
                    this.compileStatements(ast, node.keyword.code, addedFuncs, addedVars) // While code
                    MindustryCompiler.breakTarget = oldBreakTarget
                    MindustryCompiler.continueTarget = oldContinueTarget
                    whileConditionJump.target = MindustryCompiler.blocks.length
                    this.block(ProcessorTokens.JUMP, whileCodeJump, jmpType, left, right) // Jump back to the while
                    afterWhileJump.target = MindustryCompiler.blocks.length
                } else if (node.keyword.type === "BREAK") {
                    //console.log("Break", node.keyword)
                    if (typeof MindustryCompiler.breakTarget === "undefined") this.error(MindustryCompiler.RuntimeError.INVALID_BREAK_CONTINUE, node)
                    this.block(ProcessorTokens.JUMP, MindustryCompiler.breakTarget, "always")
                } else if (node.keyword.type === "CONTINUE") {
                    //console.log("Continue", node.keyword)
                    if (typeof MindustryCompiler.continueTarget === "undefined") this.error(MindustryCompiler.RuntimeError.INVALID_BREAK_CONTINUE, node)
                    this.block(ProcessorTokens.JUMP, MindustryCompiler.continueTarget, "always")
                } else if (node.keyword.type === "FUNCTION") {
                    console.log("Function", node.keyword)
                    name = this.function(ast, node.keyword.paramNames, addedFuncs, addedVars, name)
                } else console.log("Keyword:", node)
                break
            default:
                this.error(MindustryCompiler.RuntimeError.UNSUPPORTED_NODE_TYPE, node)
                break
        }
        return name
    }

    getNumberValue(node) {
        var val = node.literal.value.toString()
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
        return varNode.phrase.name
    }

    /**
     * @param ast {AST}
     * @param varNode {ASTNode}
     * @param valNode {ASTNode}
     * @param addedFuncs {string[]}
     * @param addedVars {string[]}
     * @returns {string}
     */
    jump(ast, varNode, valNode, addedFuncs, addedVars) {
        // TODO
        // MindustryCompiler.OPtoJUMP
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
        console.log("Error", ...arguments)
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
     * @param ast {AST}
     * @param args {string[]}
     * @param addedFuncs {string[]}
     * @param addedVars {string[]}
     * @param name {string, undefined}
     * @returns {string}
     */
    function(ast, args, addedFuncs, addedVars, name = undefined) {
        this.error(MindustryCompiler.RuntimeError.UNSUPPORTED_NODE_TYPE)
        /*if (!name) this.error(MindustryCompiler.RuntimeError.INVALID_ASSIGNMENT)
        addedFuncs.push(name)
        var sig = new MindustryCompiler.FunctionSignature(
            name,
            Object.fromEntries(args.map(a => [a, "*"])),
            {"tmp__return": "*"},
            this.compileStatements(ast, code, addedFuncs, addedVars)
        )
        MindustryCompiler.functions.set(name, sig)
        return name*/
    }

    /**
     * @param cons {ProcessorBlock:new}
     * @param args {string, DynamicLink}
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
            new MindustryCompiler.FunctionSignature("draw.clear", {
                "R": [new ProcessorTypes.COLOR],
                "G": [new ProcessorTypes.COLOR],
                "B": [new ProcessorTypes.COLOR]
            }, {}, [[ProcessorTokens.DRAW, "clear", "$R", "$G", "$B"]]),
            new MindustryCompiler.FunctionSignature("draw.color", {
                "R": [new ProcessorTypes.COLOR],
                "G": [new ProcessorTypes.COLOR],
                "B": [new ProcessorTypes.COLOR],
                "A": [new ProcessorTypes.COLOR]
            }, {}, [[ProcessorTokens.DRAW, "color", "$R", "$G", "$B", "$A"]]),
            new MindustryCompiler.FunctionSignature("draw.col", {"color": [new ProcessorTypes.COLOR_NUMBER]}, {}, [[ProcessorTokens.DRAW, "col", "$color"]]),
            new MindustryCompiler.FunctionSignature("draw.stroke", {"color": [new ProcessorTypes.COLOR_NUMBER]}, {}, [[ProcessorTokens.DRAW, "stroke", "$color"]]),
            new MindustryCompiler.FunctionSignature("draw.line", {
                "x1": [new ProcessorTypes.POSITIVE_INTEGER],
                "y1": [new ProcessorTypes.POSITIVE_INTEGER],
                "x2": [new ProcessorTypes.POSITIVE_INTEGER],
                "y2": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "line", "$x1", "$y1", "$x2", "$y2"]]),
            new MindustryCompiler.FunctionSignature("draw.rect", {
                "x": [new ProcessorTypes.POSITIVE_INTEGER],
                "y": [new ProcessorTypes.POSITIVE_INTEGER],
                "w": [new ProcessorTypes.POSITIVE_INTEGER],
                "h": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "rect", "$x", "$y", "$w", "$h"]]),
            new MindustryCompiler.FunctionSignature("draw.lineRect", {
                "x": [new ProcessorTypes.POSITIVE_INTEGER],
                "y": [new ProcessorTypes.POSITIVE_INTEGER],
                "w": [new ProcessorTypes.POSITIVE_INTEGER],
                "h": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "lineRect", "$x", "$y", "$w", "$h"]]),
            new MindustryCompiler.FunctionSignature("draw.poly", {
                "x": [new ProcessorTypes.POSITIVE_INTEGER],
                "y": [new ProcessorTypes.POSITIVE_INTEGER],
                "sides": [new ProcessorTypes.POSITIVE_INTEGER],
                "radius": [new ProcessorTypes.POSITIVE_NUMBER],
                "rotation": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "poly", "$x", "$y", "$sides", "$radius", "$rotation"]]),
            new MindustryCompiler.FunctionSignature("draw.linePoly", {
                "x": [new ProcessorTypes.POSITIVE_INTEGER],
                "y": [new ProcessorTypes.POSITIVE_INTEGER],
                "sides": [new ProcessorTypes.POSITIVE_INTEGER],
                "radius": [new ProcessorTypes.POSITIVE_NUMBER],
                "rotation": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "linePoly", "$x", "$y", "$sides", "$radius", "$rotation"]]),
            new MindustryCompiler.FunctionSignature("draw.triangle", {
                "x1": [new ProcessorTypes.POSITIVE_INTEGER],
                "y1": [new ProcessorTypes.POSITIVE_INTEGER],
                "x2": [new ProcessorTypes.POSITIVE_INTEGER],
                "y2": [new ProcessorTypes.POSITIVE_INTEGER],
                "x3": [new ProcessorTypes.POSITIVE_INTEGER],
                "y3": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "triangle", "$x1", "$y1", "$x2", "$y2", "$x3", "$y3"]]),
            new MindustryCompiler.FunctionSignature("draw.image", {
                "x": [new ProcessorTypes.POSITIVE_INTEGER],
                "y": [new ProcessorTypes.POSITIVE_INTEGER],
                "image": [new ProcessorTypes.CONTENT],
                "size": [new ProcessorTypes.POSITIVE_NUMBER],
                "rotation": [new ProcessorTypes.POSITIVE_INTEGER]
            }, {}, [[ProcessorTokens.DRAW, "image", "$x", "$y", "$image", "$size", "$rotation"]]),
            new MindustryCompiler.FunctionSignature("print", {"text": [new ProcessorTypes.STRING]}, {}, [[ProcessorTokens.PRINT, "$text"]]),
            new MindustryCompiler.FunctionSignature("drawflush", {"block": [new ProcessorTypes.BUILDING]}, {}, [[ProcessorTokens.DRAW_FLUSH, "$block"]]),
            new MindustryCompiler.FunctionSignature("printflush", {"block": [new ProcessorTypes.BUILDING]}, {}, [[ProcessorTokens.PRINT_FLUSH, "$block"]]),
            new MindustryCompiler.FunctionSignature("getlink", {"link#": [new ProcessorTypes.POSITIVE_INTEGER]}, {"block": [new ProcessorTypes.BUILDING]}, [[ProcessorTokens.GET_LINK, "$block", "$link#"]]),
            new MindustryCompiler.FunctionSignature("control.enabled", {
                "block": [new ProcessorTypes.BUILDING],
                "enabled": [new ProcessorTypes.BOOLEAN]
            }, {}, [[ProcessorTokens.CONTROL, "enabled", "$block", "$enabled"]]),
            new MindustryCompiler.FunctionSignature("control.shoot", {
                "block": [new ProcessorTypes.BUILDING],
                "x": [new ProcessorTypes.POSITIVE_INTEGER],
                "y": [new ProcessorTypes.POSITIVE_INTEGER],
                "shoot": [new ProcessorTypes.BOOLEAN]
            }, {}, [[ProcessorTokens.CONTROL, "shoot", "$block", "$x", "$y", "$shoot"]]),
            new MindustryCompiler.FunctionSignature("control.shootp", {
                "block": [new ProcessorTypes.BUILDING],
                "unit": [new ProcessorTypes.UNIT],
                "shoot": [new ProcessorTypes.BOOLEAN]
            }, {}, [[ProcessorTokens.CONTROL, "shootp", "$block", "$unit", "$shoot"]]),
            new MindustryCompiler.FunctionSignature("control.config", {
                "block": [new ProcessorTypes.BUILDING],
                "config": [new ProcessorTypes.CONTENT]
            }, {}, [[ProcessorTokens.CONTROL, "config", "$block", "$config"]]),
            new MindustryCompiler.FunctionSignature("control.color", {
                "block": [new ProcessorTypes.BUILDING],
                "color": [new ProcessorTypes.COLOR_NUMBER]
            }, {}, [[ProcessorTokens.CONTROL, "color", "$block", "$color"]]),
            new MindustryCompiler.FunctionSignature("radar", {
                "block": [new ProcessorTypes.BUILDING],
                "target": ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
                "target2": ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
                "target3": ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
                "order": [new ProcessorTypes.POSITIVE_INTEGER],
                "sort": ["distance", "health", "shield", "armor", "maxHealth"]
            }, {"unit": [new ProcessorTypes.UNIT]}, [[ProcessorTokens.RADAR, "$block", "$target", "$target2", "$target3", "$order", "$sort", "$unit"]]),
            new MindustryCompiler.FunctionSignature("lookup.block", {"block#": [new ProcessorTypes.POSITIVE_INTEGER]}, {"block": [new ProcessorTypes.CONTENT]}, [[ProcessorTokens.LOOKUP, "block", "$block", "$block#"]]),
            new MindustryCompiler.FunctionSignature("lookup.unit", {"unit#": [new ProcessorTypes.POSITIVE_INTEGER]}, {"unit": [new ProcessorTypes.CONTENT]}, [[ProcessorTokens.LOOKUP, "unit", "$unit", "$unit#"]]),
            new MindustryCompiler.FunctionSignature("lookup.item", {"item#": [new ProcessorTypes.POSITIVE_INTEGER]}, {"item": [new ProcessorTypes.CONTENT]}, [[ProcessorTokens.LOOKUP, "item", "$item", "$item#"]]),
            new MindustryCompiler.FunctionSignature("lookup.liquid", {"liquid#": [new ProcessorTypes.POSITIVE_INTEGER]}, {"liquid": [new ProcessorTypes.CONTENT]}, [[ProcessorTokens.LOOKUP, "liquid", "$liquid", "$liquid#"]]),
            new MindustryCompiler.FunctionSignature("packcolor", {
                "R": [new ProcessorTypes.COLOR],
                "G": [new ProcessorTypes.COLOR],
                "B": [new ProcessorTypes.COLOR],
                "A": [new ProcessorTypes.COLOR]
            }, {"color": [new ProcessorTypes.COLOR_NUMBER]}, [[ProcessorTokens.PACK_COLOR, "$color", "$R", "$G", "$B", "$A"]]),
            new MindustryCompiler.FunctionSignature("wait", {"time": [new ProcessorTypes.POSITIVE_NUMBER]}, {}, [[ProcessorTokens.WAIT, "$time"]]),
            new MindustryCompiler.FunctionSignature("stop", {}, {}, [[ProcessorTokens.STOP]]),
            new MindustryCompiler.FunctionSignature("end", {}, {}, [[ProcessorTokens.END]]),
            new MindustryCompiler.FunctionSignature("jump", {
                "addr": [new ProcessorTypes.POSITIVE_INTEGER],
                "type": [
                    "equal",
                    "notEqual",
                    "lessThan",
                    "lessThanEq",
                    "greaterThan",
                    "greaterThanEq",
                    "strictEqual"
                ],
                // Name**?** means it's optional, signature is invalid when after one optional argument isn't another OPTIONAL argument
                "left?": [new ProcessorTypes.ANY],
                "right?": [new ProcessorTypes.ANY]
            }, {}, [[ProcessorTokens.JUMP, "$addr", "$type", "$left?", "$right?"]]),
            new MindustryCompiler.FunctionSignature("ubind", {
                "typeOrUnit": [
                    new ProcessorTypes.UNIT, // Bind specific stored unit
                    new ProcessorTypes.CONTENT // Bind unit of type
                ]
            }, {}, [[ProcessorTokens.UNIT_BIND, "$typeOrUnit"]]),
            new MindustryCompiler.FunctionSignature("ucontrol.idle", {}, {}, [[ProcessorTokens.UNIT_CONTROL, "idle"]]),
            new MindustryCompiler.FunctionSignature("ucontrol.stop", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.move", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.approach", {}, {}, []),
            new MindustryCompiler.FunctionSignature("ucontrol.pathfind", {}, {}, []),
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

    createConstants() {
        // Basically same as https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/logic/GlobalVars.java
        var c = MindustryCompiler.DEFAULT_CONSTANTS = new Array(17) // Minimum of 17 items
        var co = MindustryCompiler.Constant
        //add default constants
        c[0] = new co("false", new ProcessorTypes.BOOLEAN, 0)
        c[1] = new co("true", new ProcessorTypes.BOOLEAN, 1)
        c[2] = new co("null", new ProcessorTypes.NULL, null)
        //math
        c[3] = new co("@pi", new ProcessorTypes.NUMBER, 3.1415927410125732) // From https://mindustrygame.github.io/docs/constant-values.html#arc.math.Mathf.PI
        c[4] = new co("π", new ProcessorTypes.NUMBER, 3.1415927410125732) // For the "cool" kids
        c[5] = new co("@e", new ProcessorTypes.NUMBER, 2.7182817459106445)
        c[6] = new co("@degToRad", new ProcessorTypes.NUMBER, 0.01745329238474369)
        c[7] = new co("@radToDeg", new ProcessorTypes.NUMBER, 57.2957763671875)
        //time
        c[8] = new co("@time", new ProcessorTypes.POSITIVE_INTEGER, 0)
        c[9] = new co("@tick", new ProcessorTypes.POSITIVE_INTEGER, 0)
        c[10] = new co("@second", new ProcessorTypes.POSITIVE_INTEGER, 0)
        c[11] = new co("@minute", new ProcessorTypes.POSITIVE_INTEGER, 0)
        c[12] = new co("@waveNumber", new ProcessorTypes.POSITIVE_INTEGER, 0)
        c[13] = new co("@waveTime", new ProcessorTypes.POSITIVE_INTEGER, 0)
        //special enums
        c[14] = new co("@ctrlProcessor", new ProcessorTypes.CONTROLLED_NUMBER, ProcessorTypes.CONTROLLED_NUMBER.ctrlProcessor)
        c[15] = new co("@ctrlPlayer", new ProcessorTypes.CONTROLLED_NUMBER, ProcessorTypes.CONTROLLED_NUMBER.ctrlPlayer)
        c[16] = new co("@ctrlCommand", new ProcessorTypes.CONTROLLED_NUMBER, ProcessorTypes.CONTROLLED_NUMBER.ctrlCommand)
        ////LOAD////
        //read logic ID mapping data (generated in ImagePacker)
        if (MindustryCompiler.LogicIDsData) {
            var read = new DataView(MindustryCompiler.LogicIDsData) // Create reading class
            var pointer = 0
            var lookableContent = ["block", "unit", "item", "liquid"]
            for (var cname of lookableContent) {
                var amount = read.getInt16(pointer, false)
                pointer += 2

                //store count constants
                c.push(new co("@" + cname + "Count", new ProcessorTypes.POSITIVE_INTEGER, amount));
                // console.groupCollapsed(cname, amount)
                /**
                 * @type {string[]}
                 */
                var names = new Array(amount)
                for (var i = 0; i < amount; i++) {
                    var nameLength = read.getInt16(pointer, false)
                    pointer += 2
                    var name = ""
                    for (var j = 0; j < nameLength; j++) name += String.fromCharCode(read.getUint8(pointer++))
                    // console.log(name)
                    names[i] = name
                }
                ProcessorTypes["ALL_" + cname.toUpperCase() + "S"] = names
                // console.groupEnd()
            }
        }
        ////LOAD////
        //store base content
        for (var team of ProcessorTypes.ALL_BASE_TEAMS) c.push(new co("@" + team, new ProcessorTypes.CONTENT))
        for (var item of ProcessorTypes.ALL_ITEMS) c.push(new co("@" + item, new ProcessorTypes.CONTENT))
        for (var liquid of ProcessorTypes.ALL_LIQUIDS) c.push(new co("@" + liquid, new ProcessorTypes.CONTENT))
        for (var block of ProcessorTypes.ALL_BLOCKS)
            //only register blocks that have no item equivalent (this skips sand)
            if (!ProcessorTypes.ALL_ITEMS.includes(block)) c.push(new co("@" + block, new ProcessorTypes.CONTENT))
        //used as a special value for any environmental solid block
        c.push(new co("@solid", new ProcessorTypes.CONTENT)) // put("@solid", Blocks.stoneWall);
        for (var unit of ProcessorTypes.ALL_UNITS) c.push(new co("@" + unit, new ProcessorTypes.CONTENT))
        //store sensor constants
        for (var sensor of ProcessorTypes.ALL_SENSORS) c.push(new co("@" + sensor, new ProcessorTypes.ANY))
        //read logic ID mapping data (generated in ImagePacker)
        // MOVED UP
    }

    static {
        var http = new XMLHttpRequest()
        // <CORE>/editor/ or <CORE>/docs/ - doesn't matter
        var rootURL = document.location.origin + document.location.pathname
        // <CORE>/src/js/editor/ProcessorLanguage/logicids.dat
        http.open("GET", rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.length - 2)) + "/src/js/editor/ProcessorLanguage/logicids.dat", true)
        http.responseType = "arraybuffer"
        http.onreadystatechange = (function (event) {
            if (this.readyState !== XMLHttpRequest.DONE) return
            if (this.status !== 200) {
                console.warn("Oh no:", this.status, this.statusText)
                return
            }
            MindustryCompiler.LogicIDsData = this.response
        }).bind(http)
        http.send()
    }
}
