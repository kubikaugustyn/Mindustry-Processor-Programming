/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */
import {ErrorType} from "./Compiler.mjs";
import compile from "./compile.mjs";
import InstructionContainer from "../intructions/InstructionContainer.mjs";
import DynamicLink from "../intructions/DynamicLink.mjs";

export class NativeFunctionReturnManager {
    /** @type {NativeFunction} */
    nativeFunction
    /** @type {Compiler} */
    compiler
    /** @type {Object} */
    node
    /** @type {string[]|null} */
    returnVarNames
    /** @type {Set<number>} */
    allocatedReturnIndices

    /**
     * @param nativeFunction {NativeFunction}
     * @param compiler {Compiler}
     * @param node {Object}
     * @param returnVarNames {string[]|null}
     */
    constructor(nativeFunction, compiler, node, returnVarNames) {
        this.nativeFunction = nativeFunction
        this.compiler = compiler
        this.node = node
        this.returnVarNames = returnVarNames
        this.allocatedReturnIndices = new Set()
    }

    // Writing functions (used in the libraries)
    allocateReturns(count = 0) {
        if (typeof count !== "number" || count <= 0) throw new Error("Invalid return count")
        if (this.returnVarNames === null && count === 0) return // No return values
        if (count > this.returnVarNames.length) this.compiler.handleError(ErrorType.FUNCTION_RETURN_BAD, this.node)

        for (let i = 0; i < count; i++)
            this.allocatedReturnIndices.add(i)
    }

    getReturn(index = 0) {
        if (this.allocatedReturnIndices.has(index)) return this.returnVarNames[index]

        if (typeof index !== "number" || index < 0) throw new Error("Invalid return index")
        if (this.returnVarNames === null) return this.compiler.tmpVarName() // The value should be discarded
        if (index >= this.returnVarNames.length) this.compiler.handleError(ErrorType.FUNCTION_RETURN_BAD, this.node)
        this.allocatedReturnIndices.add(index)
        return this.returnVarNames[index]
    }

    // Reading functions (used in the compiler)
    get singleReturnValue() {
        if (this.returnVarNames === null) return null
        if (this.returnVarNames.length !== 1) return null
        return this.returnVarNames[0]
    }

    /** @return {number} */
    get usedReturnCount() {
        return Math.max(-1, ...this.allocatedReturnIndices.values()) + 1
    }
}

export class NativeFunction {
    /**
     * @typedef {function(func: NativeFunction, compiler: Compiler, node: Object, args: TArgument[], kwargs: Map<string, TArgument>, returnManager: NativeFunctionReturnManager): void} TNativeFunctionCompileFn
     * @typedef {{name: string, spread: boolean, value: string|string[]|null}} TArgument
     */
    /** @type {TArgument[]} */
    arguments
    /** @type {boolean} */
    acceptInfiniteArgCount
    /** @type {TNativeFunctionCompileFn} */
    compileFn

    /**
     * @param args {string[]}
     * @param lastArgumentIsSpread {boolean}
     * @param compileFn {TNativeFunctionCompileFn}
     */
    constructor(args, lastArgumentIsSpread, compileFn) {
        this.arguments = args.map((name, i, args) => {
            return {
                name,
                spread: i === args.length - 1 && lastArgumentIsSpread,
                value: null
            }
        })
        this.acceptInfiniteArgCount = lastArgumentIsSpread
        this.compileFn = compileFn
    }

    /**
     * Compiles the native function with the provided compiler, arguments and return variable names.
     *
     * @param compiler {Compiler} The compiler... what did you expect?
     * @param node {Object} The call expression node (for error handling).
     * @param argValues {string[]} The arguments to pass to the function.
     * @param returnVarNames {string[]|null} The return variables to store the function's result into. Must be valid JS identifiers (@unit... also count).
     * @return {NativeFunctionReturnManager} You can access the result of the "function call" through this object.
     */
    compile(compiler, node, argValues, returnVarNames) {
        if (this.acceptInfiniteArgCount ?
            argValues.length < this.arguments.length :
            argValues.length !== this.arguments.length)
            compiler.handleError(ErrorType.FUNCTION_ARGUMENTS_BAD)
        /** @type {TArgument[]} */
        const args = []
        /** @type {Map<string, TArgument>} */
        const kwargs = new Map()
        for (let i = 0; i < this.arguments.length; i++) {
            /** @type {TArgument} */
            const argument = {
                name: this.arguments[i].name,
                spread: this.arguments[i].spread,
                value: this.arguments[i].spread ?
                    argValues.slice(i) :
                    argValues[i]
            }

            args.push(argument)
            kwargs.set(argument.name, argument)

            if (argument.spread && i + 1 < this.arguments.length) compiler.never()
        }

        const returnManager = new NativeFunctionReturnManager(this, compiler, node, returnVarNames)
        this.compileFn(this, compiler, node, args, kwargs, returnManager)
        return returnManager
    }
}

export class NativeJITFunction extends NativeFunction {
    /**
     * @param args {string[]}
     * @param _ {null} Deprecated, no longer does anything. TODO Remove it completely.
     * @param code {string}
     * @param constants {ReadonlyMap<string, string>|null}
     */
    constructor(args, _, code, constants = null) {
        /** @type {TNativeFunctionCompileFn} */
        const compileFn = (func, compiler, node, args, kwargs, returnManager) => {
            let substitutedCode = code
            // Return variables
            if (substitutedCode.includes("__RETURN__"))
                substitutedCode = substitutedCode.replaceAll("__RETURN__", returnManager.getReturn())
            else if (substitutedCode.includes("__RETURN_0__"))
                for (let i = 0; i < 1000; i++) {
                    if (!substitutedCode.includes(`__RETURN_${i}__`)) break
                    substitutedCode = substitutedCode
                        .replaceAll(`__RETURN_${i}__`, returnManager.getReturn(i))
                }
            // Arguments
            for (let i = 0; i < args.length; i++) {
                /** @type {TArgument} */
                const arg = args[i]
                substitutedCode = substitutedCode
                    .replaceAll(`__ARG_${i}__`, arg.value)
                    .replaceAll(`__ARG_${arg.name}__`, arg.value)
            }
            // Temporary variables
            for (let i = 0; i < 1000; i++) {
                if (!substitutedCode.includes(`__TMP_${i}__`)) break
                substitutedCode = substitutedCode
                    .replaceAll(`__TMP_${i}__`, compiler.tmpVarName()) // TODO Use the TMP var names from the actual macro compiler, not the parent
            }
            // Constants
            if (constants !== null)
                for (const [name, value] of constants)
                    substitutedCode = substitutedCode.replaceAll(`__CONST_${name}__`, value)

            // Compile
            const instructions = new InstructionContainer(document.createElement("div"))
            compile(substitutedCode, instructions, () => false, false, false)

            // Add the instructions to our "parent" compiler
            const jumpOffset = compiler.instructionContainer.length
            // Because the same links CAN be re-used, we need to increment them only once
            // Took me like 1 hour to debug and realize that I was incrementing the same link twice
            /** @type {Set<DynamicLink>} */
            const dynamicLinks = new Set()
            instructions.forEach(/** @param instruction {Instruction} */instruction => {
                instruction.operands.forEach(operand => {
                    if (operand instanceof DynamicLink) dynamicLinks.add(operand)
                })
                compiler.addInstruction(instruction)
            })
            // Offset dynamic links
            dynamicLinks.forEach(link => link.address += jumpOffset)
            // De-allocate stuff [???]
            instructions.container.remove()
            instructions.clear()
        }

        super(args, false, compileFn);
    }
}
