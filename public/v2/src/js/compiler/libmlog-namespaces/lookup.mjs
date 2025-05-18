/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */


import {NativeFunction} from "../NativeFunction.mjs";
import {
    JumpInstruction,
    LookupInstruction,
    OperationInstruction,
    SetInstruction
} from "../../intructions/instructions.mjs";
import DynamicLink from "../../intructions/DynamicLink.mjs";

const generateLookupFunction = category => new NativeFunction(["index"], false, (func, compiler, node, args, kwargs, returnManager) => {
    compiler.addInstruction(new LookupInstruction(category, returnManager.getReturn(), kwargs.get("index").value))
})
const generateLookupReverseFunction = category => new NativeFunction(["item"], false, (func, compiler, node, args, kwargs, returnManager) => {
    // TODO lookup.item(@id of @copper) = @copper - no loops required
    const tmpItemVarName = compiler.tmpVarName(), indexVarName = returnManager.getReturn()
    const afterLoop = new DynamicLink(), loopStart = new DynamicLink()
    compiler.addInstruction(new SetInstruction(indexVarName, "0"))
    loopStart.address = compiler.instructionContainer.length
    compiler.addInstruction(new LookupInstruction(category, tmpItemVarName, indexVarName))
    compiler.addInstruction(new JumpInstruction(afterLoop, "strictEqual", tmpItemVarName, kwargs.get("item").value))
    compiler.addInstruction(new OperationInstruction("add", indexVarName, indexVarName, "1"))
    compiler.addInstruction(new JumpInstruction(loopStart, "lessThan", indexVarName, `@total${category[0].toUpperCase()}${category.slice(1)}s`))
    compiler.addInstruction(new SetInstruction(indexVarName, "-1"))
    afterLoop.address = compiler.instructionContainer.length
})

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const liblookup = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    block: generateLookupFunction("block"),
    unit: generateLookupFunction("unit"),
    item: generateLookupFunction("item"),
    liquid: generateLookupFunction("liquid"),
    blockReverse: generateLookupReverseFunction("block"),
    unitReverse: generateLookupReverseFunction("unit"),
    itemReverse: generateLookupReverseFunction("item"),
    liquidReverse: generateLookupReverseFunction("liquid"),
})))
export default liblookup
