var __author__ = "kubik.augustyn@post.cz"

//https://github.com/frozein/PropScript/blob/master/src/interpreter.cpp - just small core, basically all mine

class MindustryCompiler extends Compiler {
    static NativeFunctionBinding = class NativeFunctionBinding {
        /**
         * Function binding name
         * @type {string}
         */
        name // init
        /**
         * Function binding arguments
         * @type {string|ProcessorType[][]}
         */
        arguments // [["arg1", ProcessorTypes.NUMBER], ["arg2", ProcessorTypes.STRING]]
        /**
         * Function binding return type
         * @type {ProcessorType|undefined}
         */
        returns // ProcessorTypes.STRING
        /**
         * MLOG function code
         * @type {ProcessorBlock[]}
         */
        instructions
        /**
         * Optional MPPL code that shows how the function works
         * @type {string|undefined}
         */
        code

        /**
         * @param name {string}
         * @param args {string|ProcessorType[][]}
         * @param returns {ProcessorType|undefined}
         * @param instructions {ProcessorBlock[]}
         * @param code {string|undefined}
         */
        constructor(name, args, returns, instructions, code = undefined) {
            this.name = name
            this.arguments = args
            this.returns = returns
            this.instructions = instructions
            this.code = code
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

    static CompileError = class CompileError {
        static UNSUPPORTED_NODE_TYPE = "UNSUPPORTED_NODE_TYPE"
        static UNEXPECTED_NODE_TYPE = "UNEXPECTED_NODE_TYPE"
        static REQUIRED_TARGET_VAR_NAME = "REQUIRED_TARGET_VAR_NAME"
        static UNDEFINED_FUNCTION = "UNDEFINED_FUNCTION"
        static INVALID_ARGUMENT_COUNT = "INVALID_ARGUMENT_COUNT"
        static INVALID_ARGUMENT_TYPE = "INVALID_ARGUMENT_TYPES"
        static VOID_FUNCTION_CANNOT_BE_ASSIGNED = "VOID_FUNCTION_CANNOT_BE_ASSIGNED"
    }
    /**
     * @type {AST}
     */
    tree
    /**
     * @type {string} One of runtime errors
     */
    error
    /**
     * @type {Parser.ASTNode}
     */
    errorNode
    /**
     * @type {NativeFunctionBinding[]}
     */
    static DEFAULT_LIB_FUNCTIONS = []
    /**
     * @type {Constant[]}
     */
    static DEFAULT_CONSTANTS = []
    /**
     * @type {boolean}
     */
    static LOADED_ALL_DEFAULT_CONSTANTS = false
    /**
     * @type {DynamicLink | undefined}
     */
    breakTarget
    /**
     * @type {DynamicLink, undefined}
     */
    continueTarget
    static OPReverse = new Map([
        ["notEqual", "equal"],
        ["equal", "notEqual"],
        ["greaterThanEq", "lessThan"],
        ["greaterThan", "lessThanEq"],
        ["lessThanEq", "greaterThan"],
        ["lessThan", "greaterThanEq"]
    ])
    static SWITCH_CMP_OP = MindustryLexer.OPERATORS.find(op => op.chars === "==")
    static BINARY_MEMBER_OPs = [
        MindustryLexer.OPERATORS.find(op => op.chars === "in"),
        MindustryLexer.OPERATORS.find(op => op.chars === "of")
    ]
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
    /**
     * @type {MindustryCompiler.VarNamesPool}
     */
    varNamesPool
    /**
     * @type {Parser.ArrayBuffer}
     */
    blocks
    /**
     * @type {ProcessorVariables|undefined}
     */
    rootScope
    /**
     * @type {ProcessorVariables[]}
     */
    scopeStack
    /**
     * @type {ProcessorVariables}
     */
    currentScope
    /**
     * @type {string[]}
     */
    targetVarNames
    /**
     * A variable name to store results into. Used when compiling for example variable declarators.
     * @type {string|undefined}
     */
    targetVarName

    constructor() {
        super();
        this.blocks = new Parser.ArrayBuffer()
        this.varNamesPool = new MindustryCompiler.VarNamesPool()
        this.rootScope = undefined
        this.targetVarNames = []
        this.targetVarName = undefined
        this.rootScope = undefined
        this.scopeStack = []
        this.currentScope = undefined
    }


    /**
     * @return {ProcessorBlock[]}
     */
    compile() {
        if (!MindustryCompiler.DEFAULT_LIB_FUNCTIONS.length) this.createLibFunctions()
        MindustryCompiler.createConstants()
        ProcessorTypes.reloadAll()
        /**
         * @type {Parser.AST}
         */
        var ast = this.tree
        this.blocks.reset()
        this.varNamesPool.reset()
        if (!this.rootScope) this.rootScope = new ProcessorVariables()
        if (this.rootScope.parent) this.throwError("The compiled root scope cannot have a parent scope")
        this.targetVarNames = []
        this.targetVarName = undefined
        this.scopeStack = [this.rootScope]
        this.currentScope = this.rootScope

        console.group("Compile AST:", ast)
        try {
            this.compileStatements(ast.parentNodes)

            // Remove dynamic links
            for (var block of this.blocks.iter()) {
                for (var i = 0; i < block.params.length; i++) {
                    if (block.params[i] instanceof MindustryCompiler.DynamicLink) {
                        /**
                         * @type {DynamicLink}
                         */
                        var link = block.params[i]
                        if (link.target >= this.blocks.length) link.target = 0 // To prevent jumps pointing out of the code
                        block.params[i] = link.target
                    }
                }
            }
        } catch (e) {
            for (var j = 0; j < 25; j++) console.groupEnd()
            /**
             * @type {string}
             */
            var errMsg
            /**
             * @type {Parser.ASTNode}
             */
            if (!this.errorNode || !this.error) {
                console.groupCollapsed("The actual error:")
                console.error(e)
                console.groupEnd()
                this.handleError(e)
            }
            switch (this.error) {
                case MindustryCompiler.CompileError.UNSUPPORTED_NODE_TYPE:
                    errMsg = "UNSUPPORTED NODE TYPE (I must've forgot to implement something in the compiler)"
                    break
                default:
                    errMsg = `Error: ${this.error}`
                    break
            }

            ast.setFree()

            super.handleError("COMPILER ERROR: " + errMsg + " ON LINE " + (this.errorNode?.lineNum + 1), this.errorNode)
        }
        ast.setFree()
        console.groupEnd()

        return this.blocks.items
    }

    /**
     * @param nodes {number[]}
     */
    compileStatements(nodes) {
        for (var i = 0; i < nodes.length; i++) {
            this.compileStatement(this.tree.nodePool[nodes[i]])
        }
    }

    /**
     * @param node {ASTNode}
     */
    compileStatement(node) {
        console.group("Compile statement:", node)
        switch (node.type) {
            case MindustryNodeType("VARIABLE_DECLARATION"):
                this.compileVariableDeclaration(node)
                break
            case MindustryNodeType("VALUE"):
                this.requireTargetVarName(node)
                if (node instanceof MindustryNodes.Value)
                    this.block(ProcessorTokens.SET, this.targetVarName, this.stringifyValue(node))
                else this.never()
                break
            case MindustryNodeType("IDENTIFIER"):
                this.requireTargetVarName(node)
                if (node instanceof MindustryNodes.Identifier)
                    this.block(ProcessorTokens.SET, this.targetVarName, node.name)
                else this.never()
                break
            case MindustryNodeType("BINARY_EXPRESSION"):
                if (node instanceof MindustryNodes.BinaryExpression) this.compileBinaryExpression(node)
                else this.never()
                break
            case MindustryNodeType("UNARY_EXPRESSION"):
                if (node instanceof MindustryNodes.UnaryExpression) this.compileUnaryExpression(node)
                else this.never()
                break
            case MindustryNodeType("ASSIGNMENT_EXPRESSION"):
                if (node instanceof MindustryNodes.AssignmentExpression) this.compileAssignmentExpression(node)
                else this.never()
                break
            case MindustryNodeType("BLOCK_STATEMENT"):
                if (node instanceof MindustryNodes.BlockStatement) this.compileStatements(node.block)
                else this.never()
                break
            case MindustryNodeType("IF_STATEMENT"):
                if (node instanceof MindustryNodes.IfStatement) this.compileIfStatement(node)
                else this.never()
                break
            case MindustryNodeType("WHILE_STATEMENT"):
                if (node instanceof MindustryNodes.WhileStatement) this.compileWhileStatement(node)
                else this.never()
                break
            case MindustryNodeType("BREAK_STATEMENT"):
                if (node instanceof MindustryNodes.BreakStatement) this.compileBreakStatement(node)
                else this.never()
                break
            case MindustryNodeType("CONTINUE_STATEMENT"):
                if (node instanceof MindustryNodes.ContinueStatement) this.compileContinueStatement(node)
                else this.never()
                break
            case MindustryNodeType("FOR_STATEMENT"):
                if (node instanceof MindustryNodes.ForStatement) this.compileForStatement(node)
                else this.never()
                break
            case MindustryNodeType("SWITCH_STATEMENT"):
                if (node instanceof MindustryNodes.SwitchStatement) this.compileSwitchStatement(node)
                else this.never()
                break
            case MindustryNodeType("CALL_EXPRESSION"):
                if (node instanceof MindustryNodes.CallExpression) this.compileCallExpression(node)
                else this.never()
                break
            case MindustryNodeType("COMPUTED_MEMBER_EXPRESSION"):
                if (node instanceof MindustryNodes.ComputedMemberExpression) this.compileComputedMemberExpression(node)
                else this.never()
                break
            case MindustryNodeType("EMPTY_STATEMENT"):
                break
            default:
                console.log("Unsupported node:", node)
                this.handleError(MindustryCompiler.CompileError.UNSUPPORTED_NODE_TYPE, node)
                break
        }
        console.groupEnd()
    }

    /**
     * Returns a string that when put into a block, will result into the statement result
     * @param node {ASTNode}
     * @param forceTmpVar {boolean}
     * @returns {string}
     */
    compileAssignedStatement(node, forceTmpVar) {
        console.log("Compile assigned statement:", node)
        if (node instanceof MindustryNodes.Value) return this.stringifyValue(node)
        else if (node instanceof MindustryNodes.Identifier) return String(node.name)
        var targetVarName = forceTmpVar ? this.varNamesPool.nextAvailable() : this.targetVarName
        forceTmpVar && this.pushTargetVarName(targetVarName)
        this.compileStatement(node)
        forceTmpVar && this.popTargetVarName()
        return targetVarName
    }

    /**
     * @param expression {MindustryNodes.BinaryExpression}
     */
    compileBinaryExpression(expression) {
        this.requireTargetVarName(expression)
        var left = this.compileAssignedStatement(this.getNode(expression.left), true),
            right = this.compileAssignedStatement(this.getNode(expression.right), true)
        if (MindustryCompiler.BINARY_MEMBER_OPs.includes(expression.operator))
            this.block(ProcessorTokens.SENSOR, this.targetVarName, right, left)
        else
            this.block(ProcessorTokens.OPERATION, expression.operator.processorString, this.targetVarName, left, right)
    }

    /**
     * @param expression {MindustryNodes.UnaryExpression}
     */
    compileUnaryExpression(expression) {
        this.requireTargetVarName(expression)
        var left = this.compileAssignedStatement(this.getNode(expression.left), false)
        this.block(ProcessorTokens.OPERATION, expression.operator.processorString, this.targetVarName, left)
    }

    /**
     * @param expression {MindustryNodes.AssignmentExpression}
     */
    compileAssignmentExpression(expression) {
        if (this.getNode(expression.left) instanceof MindustryNodes.ComputedMemberExpression) {
            this.compileAssignmentToCellExpression(expression)
            return
        }
        var varName = this.getIdentifierName(expression.left)
        this.pushTargetVarName(varName)
        var result = this.compileAssignedStatement(this.getNode(expression.right), false)
        this.popTargetVarName()
        if (result !== varName) this.block(ProcessorTokens.SET, varName, result)
    }

    /**
     * Note that this compiles only member setter
     * @param expression {MindustryNodes.AssignmentExpression}
     */
    compileAssignmentToCellExpression(expression) {
        /**
         * @type {MindustryNodes.ComputedMemberExpression}
         */
        var memberExpression = this.getNode(expression.left, MindustryNodes.ComputedMemberExpression)
        var target = this.compileAssignedStatement(this.getNode(memberExpression.expression), true)
        var address = this.compileAssignedStatement(this.getNode(memberExpression.property), true)
        var value = this.varNamesPool.nextAvailable()
        this.pushTargetVarName(value)
        value = this.compileAssignedStatement(this.getNode(expression.right), false)
        this.popTargetVarName()
        this.block(ProcessorTokens.WRITE, value, target, address)
    }

    /**
     * Note that this compiles only member getter
     * @param expression {MindustryNodes.ComputedMemberExpression}
     */
    compileComputedMemberExpression(expression) {
        this.requireTargetVarName(expression)
        var source = this.getIdentifierName(expression.expression)
        var address = this.varNamesPool.nextAvailable()
        this.pushTargetVarName(address)
        address = this.compileAssignedStatement(this.getNode(expression.property), false)
        this.popTargetVarName()
        this.block(ProcessorTokens.READ, this.targetVarName, source, address)
    }

    /**
     * @param statement {MindustryNodes.IfStatement}
     */
    compileIfStatement(statement) {
        var {jumpIfFalse: afterIf} = this.compileCondition(statement.test)
        this.compileStatement(this.getNode(statement.consequent))
        if (statement.alternate) {
            var afterElse = new MindustryCompiler.DynamicLink
            this.block(ProcessorTokens.JUMP, afterElse, "always")
            afterIf.target = this.blocks.length
            this.compileStatement(this.getNode(statement.alternate))
            afterElse.target = this.blocks.length
        } else afterIf.target = this.blocks.length
    }

    /**
     * @param statement {MindustryNodes.WhileStatement}
     */
    compileWhileStatement(statement) {
        var lastBreakTarget = this.breakTarget
        var lastContinueTarget = this.continueTarget

        var {jumpIfFalse: afterWhile, testPos} = this.compileCondition(statement.test)
        this.breakTarget = afterWhile
        this.continueTarget = testPos
        this.compileStatement(this.getNode(statement.body))
        this.block(ProcessorTokens.JUMP, testPos, "always")
        afterWhile.target = this.blocks.length

        this.breakTarget = lastBreakTarget
        this.continueTarget = lastContinueTarget
    }

    /**
     * @param statement {MindustryNodes.BreakStatement}
     */
    compileBreakStatement(statement) {
        if (!this.breakTarget) this.handleError(MindustryCompiler.CompileError.UNEXPECTED_NODE_TYPE, statement)
        this.block(ProcessorTokens.JUMP, this.breakTarget, "always")
    }

    /**
     * @param statement {MindustryNodes.ContinueStatement}
     */
    compileContinueStatement(statement) {
        if (!this.continueTarget) this.handleError(MindustryCompiler.CompileError.UNEXPECTED_NODE_TYPE, statement)
        this.block(ProcessorTokens.JUMP, this.continueTarget, "always")
    }

    /**
     * @param statement {MindustryNodes.ForStatement}
     */
    compileForStatement(statement) {
        var lastBreakTarget = this.breakTarget
        var lastContinueTarget = this.continueTarget
        var updatePos = new MindustryCompiler.DynamicLink

        this.compileStatement(this.getNode(statement.init))
        var {jumpIfFalse: afterFor, testPos} = this.compileCondition(statement.test)
        this.breakTarget = afterFor
        this.continueTarget = updatePos
        this.compileStatement(this.getNode(statement.body))
        updatePos.target = this.blocks.length
        this.compileStatement(this.getNode(statement.update))
        this.block(ProcessorTokens.JUMP, testPos, "always")
        afterFor.target = this.blocks.length

        this.breakTarget = lastBreakTarget
        this.continueTarget = lastContinueTarget
    }

    /**
     * @param expression {MindustryNodes.CallExpression}
     */
    compileCallExpression(expression) {
        // TODO Add stack pushing
        // TODO Allow calls for non-lib functions
        var calleeName = this.getIdentifierName(expression.callee)
        var libFunction = MindustryCompiler.DEFAULT_LIB_FUNCTIONS.find(func => func.name === calleeName)
        if (!libFunction) this.handleError(MindustryCompiler.CompileError.UNDEFINED_FUNCTION, expression)
        this.compileDefaultLibCallExpression(expression, libFunction)
    }

    /**
     * @param expression {MindustryNodes.CallExpression}
     * @param func {MindustryCompiler.NativeFunctionBinding}
     */
    compileDefaultLibCallExpression(expression, func) {
        console.log(func)
        if (func.arguments.length !== expression.arguments.length) this.handleError(MindustryCompiler.CompileError.INVALID_ARGUMENT_COUNT, expression)
        // Map of arg name to its respective value
        var args = {}
        for (var i = 0; i < func.arguments.length; i++) {
            var argNode = this.getNode(expression.arguments[i])
            var [argName, argType] = func.arguments[i]
            // TODO Check argument types
            // this.handleError(MindustryCompiler.CompileError.INVALID_ARGUMENT_TYPE, argNode)
            var argValue = this.varNamesPool.nextAvailable()
            this.pushTargetVarName(argValue)
            argValue = this.compileAssignedStatement(argNode, false)
            this.popTargetVarName()
            args[argName] = argValue
        }
        // console.log(args)
        for (var block of func.instructions) {
            var clone = block.clone()
            for (var j = 0; j < clone.params.length; j++) {
                /**
                 * @type {string}
                 */
                var param = clone.params[j]
                if (typeof param !== "string") continue
                if (!param.startsWith("$") || !param.endsWith("$")) continue
                param = param.slice(1, -1)
                if (param === "RETURN" && func.returns) param = this.targetVarName
                else if (param in args) param = args[param]
                else this.handleError("Invalid param (binding mistake): " + param, expression)
                clone.params[j] = param
            }
            this.blocks.add(clone)
        }
        if (func.returns) this.requireTargetVarName(expression)
        else if (typeof this.targetVarName !== "undefined") this.handleError(MindustryCompiler.CompileError.VOID_FUNCTION_CANNOT_BE_ASSIGNED, expression)
    }

    /**
     * @param statement {MindustryNodes.SwitchStatement}
     */
    compileSwitchStatement(statement) {
        var lastBreakTarget = this.breakTarget

        // Decide whether it's optimal or not
        var isOptimal = this.decideSwitchStatementOptimal(statement)
        if (isOptimal) isOptimal = this.compileOptimalSwitchStatement(statement)
        if (!isOptimal) this.compileNonOptimalSwitchStatement(statement)

        this.breakTarget = lastBreakTarget
    }

    /**
     * Decides whether a switch statement is optimal, enhancing the compiled code by creating a "jump table" instead of chaining IFs
     * @param statement {MindustryNodes.SwitchStatement}
     * @returns {boolean}
     */
    decideSwitchStatementOptimal(statement) {
        var discriminant = this.getNode(statement.discriminant)
        if (discriminant instanceof MindustryNodes.Value) {
            // It's optimal if it's switching an integer directly
            if (!(new ProcessorTypes.POSITIVE_INTEGER).isValid(discriminant.value)) return false
        } else if (discriminant instanceof MindustryNodes.Identifier) {
            // It's optimal if it's switching a variable of type number
            if (!this.currentScope.hasVariable(discriminant.name)) return false
            var variable = this.currentScope.getVariable(discriminant.name)
            if (!(variable.type instanceof ProcessorTypes.POSITIVE_INTEGER)) return false
        } else return false // Otherwise it's not optimal

        // It must have at least 2 cases
        if (statement.cases.length < 2) return false

        var caseValues = {}
        for (var caseI of statement.cases) {
            /**
             * @type {MindustryNodes.CaseStatement}
             */
            var caseNode = this.getNode(caseI, MindustryNodes.CaseStatement)
            var test = this.getNode(caseNode.test)
            // It's optimal if it's switching a static integer
            if (!(test instanceof MindustryNodes.Value)) return false
            if (!(new ProcessorTypes.POSITIVE_INTEGER).isValid(test.value)) return false
            caseValues[test.value] = caseI
        }
        // Check offsets - maximum is 5 (the offset between case test values - case 0, 1, 2, 3)
        var offsets = new Array(Object.keys(caseValues).length - 1).fill(0).map((_, index) => Object.keys(caseValues)[index + 1] - Object.keys(caseValues)[index])
        if (Math.max.apply(null, offsets) > 5) return false
        // Sort the cases ascending with their number
        statement.cases = []
        for (var key of Object.keys(caseValues).sort((a, b) => a - b)) {
            statement.cases.push(caseValues[key])
        }

        // It must have a default clause to catch "errors"
        return typeof statement.default !== "undefined";
    }

    /**
     * @param statement {MindustryNodes.SwitchStatement}
     * @returns {boolean}
     */
    compileOptimalSwitchStatement(statement) {
        var afterSwitch = new MindustryCompiler.DynamicLink
        var defaultPos = new MindustryCompiler.DynamicLink
        this.breakTarget = afterSwitch

        var discriminant = this.varNamesPool.nextAvailable()
        this.pushTargetVarName(discriminant)
        discriminant = this.compileAssignedStatement(this.getNode(statement.discriminant), false)
        this.popTargetVarName()

        var caseBlocks = {}
        /**
         * @type {MindustryNodes.CaseStatement}
         */
        var caseNode
        for (caseNode of statement.cases.map(caseI => this.getNode(caseI, MindustryNodes.CaseStatement))) {
            var lastBlocks = this.blocks
            this.blocks = new Parser.ArrayBuffer
            this.compileStatements(caseNode.consequent)
            if (!(this.blocks.item(this.blocks.length - 1) instanceof ProcessorTokens.JUMP)) {
                // If we don't have a jump at the end (hopefully the break jump),
                // the switch is not optimal because the optimal solution counts with no fall-trough cases.
                return false
            }
            caseBlocks[this.getNode(caseNode.test).value] = this.blocks.items
            this.blocks = lastBlocks
        }
        var [from, to] = [Math.min.apply(null, Object.keys(caseBlocks)), Math.max.apply(null, Object.keys(caseBlocks))]
        console.log(caseBlocks, from, to)
        // Jump to default if out of bounds to prevent arbitrary jumps
        this.block(ProcessorTokens.JUMP, defaultPos, "lessThan", discriminant, String(from))
        this.block(ProcessorTokens.JUMP, defaultPos, "greaterThan", discriminant, String(to))
        // Prepare jump target
        var jumpTablePosition = this.varNamesPool.nextAvailable() // The jump target to where we want to jump
        if (from - 1 !== 0) this.block(ProcessorTokens.OPERATION, "sub", jumpTablePosition, discriminant, String(from - 1))
        this.block(ProcessorTokens.OPERATION, "mul", jumpTablePosition, (from + 1) ? jumpTablePosition : discriminant, "2")
        this.block(ProcessorTokens.OPERATION, "add", jumpTablePosition, jumpTablePosition, "@counter")
        // Now we jump to our (not added yet) table
        this.block(ProcessorTokens.SET, "@counter", jumpTablePosition)
        // Build the table
        // List of [blocks, link to them]
        var overflowBlocks = []
        for (var i = from; i <= to; i++) {
            if (i in caseBlocks) {
                var blocks = caseBlocks[i]
                if (blocks.length === 2) {
                    this.blocks.add(blocks[0])
                    this.blocks.add(blocks[1])
                } else {
                    var overflowPos = new MindustryCompiler.DynamicLink
                    this.block(ProcessorTokens.JUMP, overflowPos, "always")
                    this.block(ProcessorTokens.SET, "@counter", "@counter") // infinite loop! (never reached)
                    overflowBlocks.push([blocks, overflowPos])
                }
            } else {
                // If not covered by any switch, fill it with jumps to default
                this.block(ProcessorTokens.JUMP, defaultPos, "always")
                this.block(ProcessorTokens.SET, "@counter", "@counter") // infinite loop! (never reached)
            }
        }
        // Add the overflowing blocks (which exceeded the two block table entry)
        for (var [overflowedBlocks, link] of overflowBlocks) {
            link.target = this.blocks.length
            overflowedBlocks.forEach(block => this.blocks.add(block))
        }
        // Add the default case
        defaultPos.target = this.blocks.length
        /**
         * @type {MindustryNodes.DefaultStatement}
         */
        var defaultNode = this.getNode(statement.default, MindustryNodes.DefaultStatement)
        this.compileStatements(defaultNode.consequent)

        afterSwitch.target = this.blocks.length
        return true
    }

    /**
     * @param statement {MindustryNodes.SwitchStatement}
     */
    compileNonOptimalSwitchStatement(statement) {
        statement.sourceToken.subtype = "keyword-non-optimal-switch"
        var afterSwitch = new MindustryCompiler.DynamicLink
        this.breakTarget = afterSwitch

        for (var caseI of statement.cases) {
            /**
             * @type {MindustryNodes.CaseStatement}
             */
            var caseNode = this.getNode(caseI, MindustryNodes.CaseStatement)
            var {jumpIfFalse} = this.compileCondition(
                new MindustryNodes.BinaryExpression(MindustryCompiler.SWITCH_CMP_OP, statement.discriminant, caseNode.test)
            )
            this.compileStatements(caseNode.consequent)
            jumpIfFalse.target = this.blocks.length
        }

        if (statement.default) {
            /**
             * @type {MindustryNodes.DefaultStatement}
             */
            var defaultNode = this.getNode(statement.default, MindustryNodes.DefaultStatement)
            this.compileStatements(defaultNode.consequent)
        }

        afterSwitch.target = this.blocks.length
    }

    /**
     * @param test {number|Parser.ASTNode}
     * @returns {{testPos: MindustryCompiler.DynamicLink, jumpIfFalse: MindustryCompiler.DynamicLink}}
     */
    compileCondition(test) {
        // TODO Optimise the check into the jump
        var jumpIfFalse = new MindustryCompiler.DynamicLink
        var testPos = new MindustryCompiler.DynamicLink

        testPos.target = this.blocks.length
        var testVar = this.varNamesPool.nextAvailable()
        this.pushTargetVarName(testVar)
        var testVal = this.compileAssignedStatement(this.getNode(test), false)
        this.popTargetVarName()
        this.block(ProcessorTokens.JUMP, jumpIfFalse, "equal", testVal, "false")
        return {testPos, jumpIfFalse}
    }

    /**
     * @param declaration {MindustryNodes.VariableDeclaration}
     */
    compileVariableDeclaration(declaration) {
        declaration.declarators.forEach(i => this.compileVariableDeclarator(this.getNode(i, MindustryNodes.VariableDeclarator)))
    }

    /**
     * @param declarator {MindustryNodes.VariableDeclarator}
     */
    compileVariableDeclarator(declarator) {
        console.log("Variable declarator:", declarator)
        var name = this.getIdentifierName(declarator.variableName)
        if (typeof declarator.initializer === "undefined") this.block(ProcessorTokens.SET, name, "null")
        else {
            this.pushTargetVarName(name)
            this.compileStatement(this.getNode(declarator.initializer))
            this.popTargetVarName()
        }
    }

    /**
     * @param valueNode {MindustryNodes.Value}
     * @returns {string}
     */
    stringifyValue(valueNode) {
        var val = valueNode.value
        if (typeof val === "string") {
            val = '"' + val.replaceAll('"', '\\"') + '"'
        }
        return String(val)
    }

    /**
     * @param node {Parser.ASTNode}
     */
    requireTargetVarName(node) {
        if (!this.targetVarName) this.handleError(MindustryCompiler.CompileError.REQUIRED_TARGET_VAR_NAME, node)
    }

    /**
     * @param name {string}
     */
    pushTargetVarName(name) {
        this.targetVarName = name
        this.targetVarNames.push(name)
    }

    popTargetVarName() {
        this.targetVarNames.pop()
        this.targetVarName = this.targetVarNames[this.targetVarNames.length - 1]
    }

    pushScope(scope) {
        this.currentScope = scope
        this.scopeStack.push(scope)
    }

    popScope() {
        this.scopeStack.pop()
        this.currentScope = this.scopeStack[this.scopeStack.length - 1]
    }

    /**
     * @return never
     */
    never() {
        this.handleError("An error that should never be thrown")
    }

    /**
     * @param index {number}
     * @returns {string}
     */
    getIdentifierName(index) {
        var id = this.getNode(index, MindustryNodes.Identifier)
        return id.name
    }

    /**
     * @template T
     * @param index {number|Parser.ASTNode}
     * @param nodeType {T|undefined}
     * @return {T}
     */
    getNode(index, nodeType = undefined) {
        if (!nodeType) nodeType = Parser.ASTNode
        var node = index instanceof Parser.ASTNode ? index : this.tree.nodePool[index]
        if (!(node instanceof nodeType)) this.handleError(MindustryCompiler.CompileError.UNEXPECTED_NODE_TYPE, node)
        return node
    }

    handleError(error, errorNode) {
        this.error = error
        this.errorNode = errorNode
        console.warn("Error", ...arguments)
        throw error
    }

    /**
     * @param cons {(...args: (string|DynamicLink)) => ProcessorBlock}
     * @param args {string|DynamicLink}
     * @returns {ProcessorBlock}
     */
    block(cons, ...args) {
        var block = new cons(args)
        if (!(block instanceof ProcessorBlock)) throw "Invalid block type: " + cons
        this.blocks.add(block)
        return block
    }

    createLibFunctions() {
        if (typeof window.createLibFunctions === "function") {
            window.createLibFunctions()
        }
    }

    static createConstants() {
        if (MindustryCompiler.LOADED_ALL_DEFAULT_CONSTANTS) return
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
            MindustryCompiler.LOADED_ALL_DEFAULT_CONSTANTS = true
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
        // additional I added
        c.push(new co("@links", new ProcessorTypes.POSITIVE_INTEGER, 0))
        // just to make sure
        ProcessorTypes.reloadAll()
    }

    static {
        var http = new XMLHttpRequest()
        // <CORE>/editor/ or <CORE>/docs/ - doesn't matter
        var rootURL = document.location.origin + document.location.pathname
        // <CORE>/src/js/editor/ProcessorLanguage/logicids.dat
        http.open("GET", rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.lastIndexOf('/') - 1)) + "/src/js/editor/ProcessorLanguage/logicids.dat", true)
        http.responseType = "arraybuffer"
        http.onreadystatechange = (function (event) {
            if (this.readyState !== XMLHttpRequest.DONE) return
            if (this.status !== 200) {
                console.warn("Oh no:", this.status, this.statusText)
                alert(`An HTTP error occurred while loading logic blocks: ${this.status} ${this.statusText}`)
                return
            }
            MindustryCompiler.LogicIDsData = this.response
            MindustryCompiler.createConstants()
            if (typeof window.highlighter !== "undefined") {
                // Propagate the load event optimally to the editor
                window.highlighter.onInput()
                window.highlighter.onKeyUp()
            }
            if (typeof window.init === "function") {
                // Propagate the load event optimally to the docs
                window.init()
            }
        }).bind(http)
        http.onerror = err => {
            alert("An error occurred while loading logic blocks: ".concat(String(err)))
        }
        http.send()
    }
}
