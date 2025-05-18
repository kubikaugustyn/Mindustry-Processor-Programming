/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */


import {NativeFunction} from "../NativeFunction.mjs";
import {ControlInstruction} from "../../intructions/instructions.mjs";

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libcontrol = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    enabled: new NativeFunction(["block", "enable"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new ControlInstruction("enabled", kwargs.get("block").value, kwargs.get("enable").value))
    }),
    shoot: new NativeFunction(["block", "x", "y", "shoot"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new ControlInstruction("shoot", kwargs.get("block").value, kwargs.get("x").value, kwargs.get("y").value, kwargs.get("shoot").value))
    }),
    shootp: new NativeFunction(["block", "unit", "shoot"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new ControlInstruction("shootp", kwargs.get("block").value, kwargs.get("unit").value, kwargs.get("shoot").value))
    }),
    config: new NativeFunction(["block", "config"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new ControlInstruction("config", kwargs.get("block").value, kwargs.get("config").value))
    }),
    color: new NativeFunction(["block", "color"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new ControlInstruction("color", kwargs.get("block").value, kwargs.get("color").value))
    }),
})))
export default libcontrol
