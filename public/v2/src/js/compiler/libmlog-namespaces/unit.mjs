/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {NativeFunction, NativeJITFunction} from "../NativeFunction.mjs";
import {
    JumpInstruction, OperationInstruction,
    ReadInstruction,
    UnitBindInstruction,
    UnitControlInstruction, UnitLocateInstruction, UnitRadarInstruction
} from "../../intructions/instructions.mjs";
import DynamicLink from "../../intructions/DynamicLink.mjs";

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libunitcontrol = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    idle: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("idle"))
    }),
    stop: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("stop"))
    }),
    move: new NativeFunction(["x", "y"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("move", kwargs.get("x").value, kwargs.get("y").value))
    }),
    approach: new NativeFunction(["x", "y", "radius"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("approach", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("radius").value))
    }),
    boost: new NativeFunction(["boostEnabled"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("boost", kwargs.get("boostEnabled").value))
    }),
    target: new NativeFunction(["x", "y", "shoot"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("target", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("shoot").value))
    }),
    targetp: new NativeFunction(["unit", "shoot"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("targetp", kwargs.get("unit").value, kwargs.get("shoot").value))
    }),
    itemDrop: new NativeFunction(["building", "amount"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("itemDrop", kwargs.get("building").value, kwargs.get("amount").value))
    }),
    itemTake: new NativeFunction(["building", "item", "amount"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("itemTake", kwargs.get("building").value, kwargs.get("item").value, kwargs.get("amount").value))
    }),
    payDrop: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("payDrop"))
    }),
    payTake: new NativeFunction(["unitCount"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("payTake", kwargs.get("unitCount").value))
    }),
    payEnter: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("payEnter"))
    }),
    payEnterIfIn: new NativeFunction(["radius", "x", "y"], false, (func, compiler, node, args, kwargs, returnManager) => {
        // dropped = unit.control.payEnterIfIn(<radius>, <x>, <y>) - Suggested by [UR] TyT|xexebe#1178
        const droppedVarName = returnManager.getReturn(), afterPayEnter = new DynamicLink()
        compiler.addInstruction(new UnitControlInstruction("within", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("radius").value, droppedVarName))
        compiler.addInstruction(new JumpInstruction(afterPayEnter, "strictEqual", droppedVarName, "false"))
        compiler.addInstruction(new UnitControlInstruction("payEnter"))
        afterPayEnter.address = compiler.instructionContainer.length
    }),
    mine: new NativeFunction(["x", "y"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("mine", kwargs.get("x").value, kwargs.get("y").value))
    }),
    flag: new NativeFunction(["flag"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("flag", kwargs.get("flag").value))
    }),
    build: new NativeFunction(["x", "y", "block", "rotation", "config"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("build", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("block").value, kwargs.get("rotation").value, kwargs.get("config").value))
    }),
    getBlock: new NativeFunction(["x", "y"], false, (func, compiler, node, args, kwargs, returnManager) => {
        returnManager.allocateReturns(3)
        compiler.addInstruction(new UnitControlInstruction("getBlock", kwargs.get("x").value, kwargs.get("y").value, returnManager.getReturn(0), returnManager.getReturn(1), returnManager.getReturn(2)))
    }),
    within: new NativeFunction(["x", "y", "radius"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("within", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("radius").value, returnManager.getReturn()))
    }),
    unbind: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitControlInstruction("unbind"))
    }),
})))

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libunitlocate = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    ore: new NativeFunction(["ore"], false, (func, compiler, node, args, kwargs, returnManager) => {
        returnManager.allocateReturns(3)
        compiler.addInstruction(new UnitLocateInstruction("ore", "0", "0", kwargs.get("ore").value, returnManager.getReturn(0), returnManager.getReturn(1), returnManager.getReturn(2), "0"))
    }),
    building: new NativeFunction(["group", "enemy"], false, (func, compiler, node, args, kwargs, returnManager) => {
        returnManager.allocateReturns(4)
        compiler.addInstruction(new UnitLocateInstruction("building", kwargs.get("group").value, kwargs.get("enemy").value, "0", returnManager.getReturn(0), returnManager.getReturn(1), returnManager.getReturn(2), returnManager.getReturn(3)))
    }),
    spawn: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        returnManager.allocateReturns(4)
        compiler.addInstruction(new UnitLocateInstruction("spawn", "0", "0", "0", returnManager.getReturn(0), returnManager.getReturn(1), returnManager.getReturn(2), returnManager.getReturn(3)))
    }),
    damaged: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        returnManager.allocateReturns(4)
        compiler.addInstruction(new UnitLocateInstruction("damaged", "0", "0", "0", returnManager.getReturn(0), returnManager.getReturn(1), returnManager.getReturn(2), returnManager.getReturn(3)))
    }),
})))

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libunitutil = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    bind: new NativeJITFunction(["unitType", "unitIndex", "unitInstance"], true, `
const __TMP_0__ = unit.getProcessorUniqueFlag(__ARG_unitIndex__)
let __TMP_1__ = null

if (__ARG_unitInstance__ != null) unit.bind(__ARG_unitInstance__) // If we are given a unit, we can just bind it (and check if it is correct, alive etc.)

if ((@flag of @unit) != __TMP_0__ || @dead of @unit || @type of @unit != __ARG_unitType__) {

while (__TMP_1__ == null && (@unit == null || @dead of @unit || @type of @unit != __ARG_unitType__ || (@flag of @unit) != __TMP_0__)) {
    unit.bind(__ARG_unitType__)
    __TMP_1__ = @unit
    if (__TMP_1__ == null) continue

    let foundBlankUnit = false, foundOurUnit = false
    // First, we need to find a unit
    while (true) {
        const __TMP_2__ = @flag of @unit
        if (__TMP_2__ === __TMP_0__) {
            foundOurUnit = true
            break
        }
        else if (__TMP_2__ == 0)
            foundBlankUnit = true

        unit.bind(__ARG_unitType__)
        if (@unit == null || @dead of __TMP_1__ || @unit == __TMP_1__) break
    }
    // If we don't find our unit, but find a unit without a flag, we can flag it
    if (!foundOurUnit && foundBlankUnit) {
        while (true) {
            if (@flag of @unit == 0) {
                unit.control.flag(__TMP_0__)
                break
            }

            unit.bind(__ARG_unitType__)
            if (@unit == null || @dead of __TMP_1__ || @unit == __TMP_1__) break
        }
    }
    __TMP_1__ = null
}

// const unitFlag = @flag of @unit
// if (unitFlag !== flag) panic()
// TODO Fix units that don't have a processor controlling them, but are flagged, aren't ever unflagged, and thus never get a new processor. That may be wanted behavior for units whose processor is often being destroyed. So IDK :D
__RETURN__ = @unit
}
`),
    adopt: new NativeJITFunction(["unitType", "unitIndex", "unitInstance"], true, `
const __TMP_0__ = unit.getProcessorUniqueFlag(__ARG_unitIndex__)

if (@unit != __ARG_unitInstance__) unit.bind(__ARG_unitInstance__)

if (@unit != __ARG_unitInstance__ || @unit == null || @type of @unit != __ARG_unitType__) __RETURN__ = false
else {
    let __TMP_1__ = @flag of @unit
    
    if (__TMP_1__ != 0 && __TMP_1__ != __TMP_0__) __RETURN__ = false
    else {
        if (__TMP_1__ == 0) unit.control.flag(__TMP_0__)
    
        if ((@flag of @unit) != __TMP_0__ || @dead of @unit || @type of @unit != __ARG_unitType__) __RETURN__ = false
        else __RETURN__ = true
    }
}
`),
    unbind: new NativeJITFunction(["unitType", "unitIndex", "unitInstance"], false, `
__TMP_0__ = unit.util.bind(__ARG_unitType__, __ARG_unitIndex__, __ARG_unitInstance__)
unit.control.flag(0)
unit.control.unbind()
`),
})))

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libunit = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    control: libunitcontrol,
    locate: libunitlocate,
    util: libunitutil,
    // Functions
    bind: new NativeFunction(["unitTypeOrUnit"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitBindInstruction(kwargs.get("unitTypeOrUnit").value))
    }),
    radar: new NativeFunction(["target1", "target2", "target3", "order", "sort"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new UnitRadarInstruction(kwargs.get("target1").value, kwargs.get("target2").value, kwargs.get("target3").value, kwargs.get("sort").value, "0", kwargs.get("order").value, returnManager.getReturn()))
    }),
    /*
    OLD:
    getProcessorUniqueFlag: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        // return ((@thisx & 0xFFFFFFFF) << 32) | @thisy
        const varName = returnManager.getReturn()
        compiler.addInstruction(new OperationInstruction("and", varName, "@thisx", "0xFFFFFFFF"))
        compiler.addInstruction(new OperationInstruction("shl", varName, varName, "32"))
        compiler.addInstruction(new OperationInstruction("or", varName, varName, "@thisy"))
    }),
    NEW: v*/
    getProcessorUniqueFlag: new NativeJITFunction(["index"], true, `__RETURN__ = ((@thisx & 1023) << 21) | ((@thisy & 1023) << 11) | ((__ARG_index__ & 1023) << 1) | 1`),
})))
export default libunit
