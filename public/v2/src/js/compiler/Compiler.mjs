/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {
    JumpInstruction,
    OperationInstruction,
    ReadInstruction, SensorInstruction,
    SetInstruction, StopInstruction,
    WriteInstruction
} from "../intructions/instructions.mjs";
import DynamicLink from "../intructions/DynamicLink.mjs";
import libmlog from "./libmlog.mjs";
import {NativeFunction, NativeJITFunction} from "./NativeFunction.mjs";
import {DEFAULT_SETTINGS} from "../intructions/SettingsDialog.mjs";

/**
 * @enum {string}
 * @readonly
 */
const ErrorType = {
    REQUIRED_TARGET_VAR_NAME: "REQUIRED_TARGET_VAR_NAME",
    NOT_IDENTIFIER: "NOT_IDENTIFIER",
    NOT_LITERAL: "NOT_LITERAL",
    UNEXPECTED_NODE_TYPE: "UNEXPECTED_NODE_TYPE",
    FUNCTION_MUST_BE_STATIC: "FUNCTION_MUST_BE_STATIC",
    NAMESPACE_NOT_FOUND: "NAMESPACE_NOT_FOUND",
    FUNCTION_NOT_FOUND: "FUNCTION_NOT_FOUND",
    FUNCTION_ARGUMENTS_BAD: "FUNCTION_ARGUMENTS_BAD",
    FUNCTION_RETURN_BAD: "FUNCTION_RETURN_BAD",
    FUNCTION_UNAVAILABLE: "FUNCTION_UNAVAILABLE", // Due to a failing access policy check
    NEVER: "NEVER"
}
export {ErrorType}

/**
 * @type {Map<string, string>}
 * @readonly
 */
const BinaryOperationToMLOG = new Map(Object.entries({
    "&&": "land",
    // "||": "???", // Logical OR
    "||": "or", // FIXME Logical OR != bitwise OR
    "|": "or",
    "^": "xor",
    "&": "and",
    "==": "equal",
    "!=": "notEqual",
    "!==": "notEqual", // TODO Really?
    "===": "strictEqual",
    "<": "lessThan",
    ">": "greaterThan",
    "<=": "lessThanEq",
    ">=": "greaterThanEq",
    "<<": "shl",
    ">>": "shr",
    "+": "add",
    "-": "sub",
    "*": "mul",
    "/": "div",
    // math.idiv() "//":"idiv",
    "%": "mod",
    "**": "pow",
    // math.max() "max"
    // math.min() "min"
    // math.angle() "angle"
    // math.angleDiff() "angleDiff"
    // math.len() "len"
    // math.noise() "noise"
}))

/**
 * @type {Map<string, string>}
 * @readonly
 */
const UnaryOperationToMLOG = new Map(Object.entries({
    // '!' is a special case because it is not in MLOG
    // '-' is a special case because it is a binary operation (-5 = 0 - 5)
    "~": "not",
    // math.abs() "abs"
    // math.log() "log"
    // math.log10() "log10"
    // math.floor() "floor"
    // math.ceil() "ceil"
    // math.sqrt() "sqrt"
    // math.rand() "rand"
    // math.sin() "sin"
    // math.cos() "cos"
    // math.tan() "tan"
    // math.asin() "asin"
    // math.acos() "acos"
    // math.atan() "atan"
}))

/**
 * @type {Map<string, string>}
 * @readonly
 */
const BinaryOperationToMLOGJump = new Map(Object.entries({
    "==": "equal",
    "!=": "notEqual",
    "!==": "notEqual", // TODO Really?
    "===": "strictEqual",
    "<": "lessThan",
    ">": "greaterThan",
    "<=": "lessThanEq",
    ">=": "greaterThanEq",
}))
/**
 * @type {Map<string, string>}
 * @readonly
 */
const BinaryOperationToMLOGInvertedJump = new Map(Object.entries({
    "==": "notEqual",
    "!=": "equal",
    "!==": "strictEqual",
    "===": "notEqual", // TODO Really?
    "<": "greaterThanEq",
    ">": "lessThanEq",
    "<=": "greaterThan",
    ">=": "lessThan",
}))

export class Compiler {
    /** @type {InstructionContainer} */
    instructionContainer
    /** @type {string|null} */
    targetVarName
    /** @type {string[]} */
    targetVarNames
    /** @type {string} */
    tmpID
    /** @type {number} */
    tmpVarCounter
    /** @type {DynamicLink|null} */
    breakTarget
    /** @type {DynamicLink[]} */
    breakTargets
    /** @type {DynamicLink|null} */
    continueTarget
    /** @type {DynamicLink[]} */
    continueTargets
    /**
     * @typedef {ReadonlyMap<string, NativeFunction|TNativeNamespace>} TNativeNamespace
     * @type {TNativeNamespace}
     */
    defaultLibrary
    /** @type {TSettings} */
    settings
    /**
     * @type {boolean}
     * @description Whether the compilation should optimize constants by only calculating them only once. Only works for constants that are in the top level of the code, e.g., not inside a function, and not after any other statement than a constant declaration.
     */
    optimiseConstants
    /**
     * @type {boolean}
     * @description Whether the compilation should move the jumps that jump to after the last instruction to the beginning of the program.
     */
    trimJumpsToAfterLastInstruction

    /**
     * @param instructionContainer {InstructionContainer} The container to which the instructions should be added.
     * @param defaultLibrary {TNativeNamespace|null} Overwrites the default library if passed a non-null value.
     * @param settings {TSettings|null} Overwrites the default settings if passed a non-null value.
     * @param optimiseConstants {boolean} Whether the compilation should optimize constants by only calculating them only once. Only works for constants that are in the top level of the code, e.g., not inside a function, and not after any other statement than a constant declaration.
     * @param trimJumpsToAfterLastInstruction {boolean} Whether the compilation should move the jumps that jump to after the last instruction to the beginning of the program.
     * @constructor
     * @example
     * const parser = new Parser(code)
     * const ast = parser.parse()
     *
     * const container = new InstructionContainer()
     * const compiler = new Compiler(container)
     * compiler.compile(ast)
     * // You now have the instructions in the container
     */
    constructor(instructionContainer, defaultLibrary = null, settings = null, optimiseConstants = true, trimJumpsToAfterLastInstruction = true) {
        this.instructionContainer = instructionContainer
        this.targetVarName = null
        this.targetVarNames = []
        this.tmpID = Math.random().toString(36).slice(2)
        this.tmpVarCounter = 0
        this.breakTarget = null
        this.breakTargets = []
        this.continueTarget = null
        this.continueTargets = []
        this.defaultLibrary = defaultLibrary ?? libmlog
        this.settings = settings ?? DEFAULT_SETTINGS
        this.optimiseConstants = optimiseConstants
        this.trimJumpsToAfterLastInstruction = trimJumpsToAfterLastInstruction
    }

    compile(astRootNode) {
        this.compileProgram(astRootNode)
        // TODO Reset the state before compiling the next program
    }

    addInstruction(instruction) {
        this.instructionContainer.push(instruction)
    }

    /**
     * @param errorType {ErrorType}
     * @param node {Object|null}
     * @return {never}
     */
    handleError(errorType, node) {
        throw new Error(`[${errorType}] ${node?.type} ${node?.name}`)
    }

    /**
     * Throws an error that should never be thrown. That means this method should never be called. Used, for example, in switch-default, when we cover all cases.
     * @return {never}
     */
    never() {
        this.handleError(ErrorType.NEVER, null)
    }

    getIdentifierName(node) {
        if (node.type !== "Identifier") this.handleError(ErrorType.NOT_IDENTIFIER, node)

        return node.name
    }

    getLiteralValue(node) {
        if (node.type !== "Literal") this.handleError(ErrorType.NOT_LITERAL, node)

        return node.raw
    }

    /**
     * @param node {Object}
     * @return {void|never}
     */
    requireTargetVarName(node) {
        if (this.targetVarName === null) this.handleError(ErrorType.REQUIRED_TARGET_VAR_NAME, node)
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
        this.targetVarName = this.targetVarNames.at(-1) ?? null
    }

    /**
     * @param breakTarget {DynamicLink}
     * @param continueTarget {DynamicLink}
     */
    pushLoopTargets(breakTarget, continueTarget) {
        this.breakTarget = breakTarget
        this.breakTargets.push(breakTarget)
        this.continueTarget = continueTarget
        this.continueTargets.push(continueTarget)
    }

    popLoopTargets() {
        this.breakTargets.pop()
        this.breakTarget = this.breakTargets.at(-1) ?? null
        this.continueTargets.pop()
        this.continueTarget = this.continueTargets.at(-1) ?? null
    }

    /**
     * @return {string}
     */
    tmpVarName() {
        return `tmp_${this.tmpID}_${this.tmpVarCounter++}`
    }

    // Compiling statement functions
    compileProgram(node) {
        this.trimJumpsToAfterLastInstruction && console.clear()
        // if (this.optimiseConstants)
        let isInConstStreak = true
        const constantsEnd = new DynamicLink()

        node.body.forEach(subStatement => {
            if (this.optimiseConstants && isInConstStreak && (subStatement.type !== "VariableDeclaration" || subStatement.kind !== "const")) {
                isInConstStreak = false
                constantsEnd.address = this.instructionContainer.length
            }

            this.compileStatement(subStatement)
        })

        if (this.optimiseConstants) {
            if (isInConstStreak) this.addInstruction(new StopInstruction()) // Why should we re-calculate constants?
            else this.addInstruction(new JumpInstruction(constantsEnd, "always", "0", "0"))
        }

        // Move the jumps to after the last instruction to point to the beginning of the program
        if (this.trimJumpsToAfterLastInstruction)
            this.instructionContainer.forEach(/** @param instruction {Instruction} */instruction => {
                instruction.operands.forEach(operand => {
                    if (operand instanceof DynamicLink && operand.address >= this.instructionContainer.length)
                        operand.address = constantsEnd.address ?? 0 // TODO Does this work? The constantsEnd.address?
                })
            })
    }

    compileStatement(node) {
        console.group("Compile statement:", node)
        switch (node.type) {
            case "Program":
                this.compileProgram(node)
                break
            case "BlockStatement":
                this.compileBlockStatement(node)
                break
            case "ExpressionStatement":
                this.compileExpressionStatement(node)
                break
            case "IfStatement":
                this.compileIfStatement(node)
                break
            case "WhileStatement":
                this.compileWhileStatement(node)
                break
            case "DoWhileStatement":
                this.compileDoWhileStatement(node)
                break
            case "BreakStatement":
                this.compileBreakStatement(node)
                break
            case "ContinueStatement":
                this.compileContinueStatement(node)
                break
            case "ForStatement":
                this.compileForStatement(node)
                break
            case "VariableDeclaration":
                this.compileVariableDeclarationStatement(node)
                break
            default:
                console.warn('Unhandled node type:', node.type)
            // this.never()
        }
        console.groupEnd()
    }

    compileBlockStatement(node) {
        node.body.forEach(subStatement => this.compileStatement(subStatement))
    }

    compileExpressionStatement(node) {
        this.compileExpression(node.expression)
    }

    compileIfStatement(node) {
        const {jumpIfFalse: afterIf} = this.compileCondition(node.test)
        this.compileStatement(node.consequent)
        if (node.alternate) {
            var afterElse = new DynamicLink
            this.addInstruction(new JumpInstruction(afterElse, "always", "0", "0"))
            afterIf.address = this.instructionContainer.length
            this.compileStatement(node.alternate)
            afterElse.address = this.instructionContainer.length
        }
        else afterIf.address = this.instructionContainer.length
    }

    compileWhileStatement(node) {
        const {jumpIfFalse: afterWhile, testPos} = this.compileCondition(node.test)
        this.pushLoopTargets(afterWhile, testPos)
        this.compileStatement(node.body)
        this.addInstruction(new JumpInstruction(testPos, "always", "0", "0"))
        afterWhile.address = this.instructionContainer.length
        this.popLoopTargets()
    }

    compileDoWhileStatement(node) {
        const whileStart = new DynamicLink, afterWhile = new DynamicLink, testPos = new DynamicLink
        whileStart.address = this.instructionContainer.length
        this.pushLoopTargets(afterWhile, testPos)
        this.compileStatement(node.body)
        this.popLoopTargets()
        const {jumpIfTrue: whileStartCondition, testPos: testPosCondition} = this.compileCondition(node.test, true)
        whileStartCondition.address = whileStart.address
        testPos.address = testPosCondition.address
        afterWhile.address = this.instructionContainer.length
    }

    compileBreakStatement(node) {
        if (!this.breakTarget) this.handleError(ErrorType.UNEXPECTED_NODE_TYPE, node)
        this.addInstruction(new JumpInstruction(this.breakTarget, "always", "0", "0"))
    }

    compileContinueStatement(node) {
        if (!this.continueTarget) this.handleError(ErrorType.UNEXPECTED_NODE_TYPE, node)
        this.addInstruction(new JumpInstruction(this.continueTarget, "always", "0", "0"))
    }

    compileForStatement(node) {
        const updatePos = new DynamicLink

        node.init.type.endsWith("Expression") ? this.compileExpression(node.init) : this.compileStatement(node.init) // TODO Why? "for (i = 0; i < 10; i++) {...}"
        var {jumpIfFalse: afterFor, testPos} = this.compileCondition(node.test, false)
        this.pushLoopTargets(afterFor, updatePos)
        this.compileStatement(node.body)
        updatePos.address = this.instructionContainer.length
        this.compileExpression(node.update)
        this.addInstruction(new JumpInstruction(testPos, "always", "0", "0"))
        afterFor.address = this.instructionContainer.length
        this.popLoopTargets()
    }

    compileVariableDeclarationStatement(node) {
        if (node.kind !== "let" && node.kind !== "const") this.never() // TODO

        node.declarations.forEach(declarator => {
            // compileVariableDeclaratorStatement(node)
            if (declarator.type !== "VariableDeclarator") this.never()

            if (declarator.init !== null)
                this.compileAssignmentExpression({
                    left: declarator.id,
                    right: declarator.init,
                    operator: "="
                })
        })
    }

    /**
     * @param conditionNode {Object}
     * @param checkIfTrue {boolean}
     * @returns {{testPos: DynamicLink, jumpIfTrue: DynamicLink}|{testPos: DynamicLink, jumpIfFalse: DynamicLink}}
     */
    compileCondition(conditionNode, checkIfTrue = false) {
        // TODO Optimise the check into the jump - UnaryExpression
        const jumpIfPasses = new DynamicLink
        const testPos = new DynamicLink

        testPos.address = this.instructionContainer.length

        if (conditionNode.type === "BinaryExpression" && BinaryOperationToMLOGJump.has(conditionNode.operator) && checkIfTrue) {
            // Use the given operation
            const left = this.compileAssignedExpression(conditionNode.left, true),
                right = this.compileAssignedExpression(conditionNode.right, true)
            this.addInstruction(new JumpInstruction(jumpIfPasses, BinaryOperationToMLOGJump.get(conditionNode.operator), left, right))
        }
        else if (conditionNode.type === "BinaryExpression" && BinaryOperationToMLOGInvertedJump.has(conditionNode.operator) && !checkIfTrue) {
            // Use an inverted operation to what we are given
            const left = this.compileAssignedExpression(conditionNode.left, true), // DRY...? Whatever.
                right = this.compileAssignedExpression(conditionNode.right, true)
            this.addInstruction(new JumpInstruction(jumpIfPasses, BinaryOperationToMLOGInvertedJump.get(conditionNode.operator), left, right))
        }
        else {
            // Use an operation and then compare the result
            const testVal = this.compileAssignedExpression(conditionNode, true)
            this.addInstruction(new JumpInstruction(jumpIfPasses, "equal", testVal, checkIfTrue ? "true" : "false"))
        }

        return checkIfTrue ?
            {testPos, jumpIfTrue: jumpIfPasses} :
            {testPos, jumpIfFalse: jumpIfPasses}
    }

    // Compiling expression functions
    compileExpression(node) {
        console.group("Compile expression:", node)
        /** @type {string} */
        let result
        switch (node.type) {
            case "Identifier":
                result = this.getIdentifierName(node)
                break
            case "Literal":
                result = this.getLiteralValue(node)
                break
            case "AssignmentExpression":
                result = this.compileAssignmentExpression(node)
                break
            case "BinaryExpression":
            case "LogicalExpression":
                result = this.compileBinaryExpression(node)
                break
            case "UnaryExpression":
                result = this.compileUnaryExpression(node)
                break
            case "UpdateExpression":
                result = this.compileUpdateExpression(node)
                break
            case "MemberExpression":
                result = this.compileMemberExpression(node)
                break
            case "CallExpression":
                result = this.compileCallExpression(node)
                break
            case "SequenceExpression":
                result = this.compileSequenceExpression(node)
                break
            default:
                console.warn('Unhandled node type:', node.type)
                result = "<ERROR>"
            // this.never()
        }
        console.log("Compiled:", result)
        console.groupEnd()
        return result
    }

    compileAssignedExpression(node, forceTmpVar, forceOnlyVarName = false) {
        if (this.targetVarName === null)
            forceTmpVar = true

        forceTmpVar && this.pushTargetVarName(this.tmpVarName())
        const result = this.compileExpression(node)
        forceTmpVar && this.popTargetVarName()

        if (forceOnlyVarName && node.type !== "Identifier") {
            const tmpVarName = this.tmpVarName()
            this.compileAssignmentExpression({
                type: "AssignmentExpression",
                left: {type: "Identifier", name: tmpVarName},
                operator: "=",
                right: {type: "Literal", raw: result}
            })
            return tmpVarName
        }

        return result
    }

    compileAssignmentExpression(node) {
        if (node.left.type === "MemberExpression") {
            // Special case: we treat the member expression as reading from a cell, not an array/object property getter
            // cell1[address] = value

            const right = this.compileAssignedExpression(node.right, true)

            const memory = this.compileAssignedExpression(node.left.object, true)
            const address = this.compileAssignedExpression(node.left.property, true)

            this.addInstruction(new WriteInstruction(right, memory, address))
            return right
        }

        const varName = this.getIdentifierName(node.left)

        this.pushTargetVarName(varName)
        const right = this.compileExpression(node.right)
        this.popTargetVarName(varName)

        if (node.operator === "+=")
            this.addInstruction(new OperationInstruction("add", varName, varName, right))
        else if (node.operator === "-=")
            this.addInstruction(new OperationInstruction("sub", varName, varName, right))
        else if (node.operator === "=") {
            if (varName !== right) // if (varName == right): for example: b = 3 + a
                this.addInstruction(new SetInstruction(varName, right))
        }
        else this.never()

        return varName
    }

    compileBinaryExpression(node) {
        this.requireTargetVarName(node)
        var left = this.compileAssignedExpression(node.left, true),
            right = this.compileAssignedExpression(node.right, true)

        if (node.operator === "-" && left.startsWith("@") && !right.startsWith("@") && right.match(/^[a-z]+$/i)) {
            // Special case: cheat for @thorium-reactor etc.
            // TODO Use a proper method
            return left.concat("-", right)
        }

        if (BinaryOperationToMLOG.has(node.operator))
            this.addInstruction(new OperationInstruction(BinaryOperationToMLOG.get(node.operator), this.targetVarName, left, right))
        else if (node.operator === "in" || node.operator === "of") {
            this.addInstruction(new SensorInstruction(this.targetVarName, right, left))
        }
        else this.never()

        return this.targetVarName
    }

    compileUnaryExpression(node) {
        this.requireTargetVarName(node)
        var argument = this.compileAssignedExpression(node.argument, true)

        if (UnaryOperationToMLOG.has(node.operator))
            this.addInstruction(new OperationInstruction(UnaryOperationToMLOG.get(node.operator), this.targetVarName, argument, "0"))
        else if (node.operator === "!") {
            // Special case: '!' is a logical inversion
            this.addInstruction(new OperationInstruction("notEqual", this.targetVarName, argument, "true"))
        }
        else if (node.operator === "-") {
            // Special case: '-' is a binary operation
            this.addInstruction(new OperationInstruction("sub", this.targetVarName, "0", argument))
        }
        else this.never()

        return this.targetVarName
    }

    compileUpdateExpression(node) {
        var target = this.compileAssignedExpression(node.argument, true)

        if (node.operator === "++")
            this.addInstruction(new OperationInstruction("add", target, target, "1"))
        else if (node.operator === "--")
            this.addInstruction(new OperationInstruction("sub", target, target, "1"))
        else this.never()

        return target
    }

    compileMemberExpression(node) {
        // Special case: we treat the member expression as reading from a cell, not an array/object property getter
        // value = cell1[address]

        this.requireTargetVarName(node)
        const memory = this.compileAssignedExpression(node.object, true)
        const address = this.compileAssignedExpression(node.property, true)

        this.addInstruction(new ReadInstruction(this.targetVarName, memory, address))
        return this.targetVarName
    }

    compileCallExpression(node) {
        const returnManager = this._compileMacroCall(node, node.callee, node.arguments, this.targetVarName !== null ? [this.targetVarName] : null)
        return returnManager.singleReturnValue ?? "null"
    }

    compileSequenceExpression(node) {
        // Special case: we treat the sequence expression as a call to a function returning a tuple
        // outX, outY, found, building = unit.locate.building(core, true)
        const firstVarNames = node.expressions.slice(0, -1).map(identifier => this.getIdentifierName(identifier))
        const lastExpression = node.expressions.at(-1)
        if (lastExpression.type !== "AssignmentExpression" || lastExpression.operator !== "=") this.never()
        const lastVarName = this.getIdentifierName(lastExpression.left)
        const returnVarNames = [...firstVarNames, lastVarName]

        const callExpression = lastExpression.right
        if (callExpression.type !== "CallExpression") this.never()

        console.log("Return:", returnVarNames)
        const returnManager = this._compileMacroCall(callExpression, callExpression.callee, callExpression.arguments, returnVarNames)
        if (returnManager.usedReturnCount !== returnVarNames.length) this.handleError(ErrorType.FUNCTION_RETURN_BAD, node)

        return returnManager.singleReturnValue ?? "null"
    }

    /**
     * Compiles a call to a macro function.
     * @param node {Object} The call expression node.
     * @param callee {Object} The callee node (identifier, property expression, etc.).
     * @param _arguments {Object[]} The argument nodes.
     * @param returnVarNames {string[]|null} The var names to store the return values in. If null, the return values are discarded.
     * @return {NativeFunctionReturnManager}
     * @private
     */
    _compileMacroCall(node, callee, _arguments, returnVarNames) {
        const name_ify = node => {
            if (node.type === "Identifier")
                return this.getIdentifierName(node)
            else if (node.type === "MemberExpression")
                return name_ify(node.object).concat(".", this.getIdentifierName(node.property))
            else this.handleError(ErrorType.FUNCTION_MUST_BE_STATIC, node)
        }

        let calleeName = name_ify(callee)
        console.log("Function name:", calleeName)

        const parts = calleeName.split(".")
        const namespaces = parts.slice(0, -1)
        const name = parts.at(-1)

        let ns = this.defaultLibrary
        for (const namespace of namespaces) {
            if (!ns.has(namespace) || !(ns.get(namespace) instanceof Map)) // Either the namespace doesn't exist, or it's a function
                this.handleError(ErrorType.NAMESPACE_NOT_FOUND, node)

            ns = ns.get(namespace)
        }
        if (!ns.has(name) || !(ns.get(name) instanceof NativeFunction))
            this.handleError(ErrorType.FUNCTION_NOT_FOUND, node)
        /** @type {NativeFunction} */
        const fn = ns.get(name)

        console.log("Function:", fn)

        const argumentValues = _arguments.map(arg => this.compileAssignedExpression(arg, true, fn instanceof NativeJITFunction))
        return fn.compile(this, node, argumentValues, returnVarNames)
    }
}
