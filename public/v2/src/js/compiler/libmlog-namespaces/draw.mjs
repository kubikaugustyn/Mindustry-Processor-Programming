/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */
import {NativeFunction} from "../NativeFunction.mjs";
import {DrawInstruction, GetLinkInstruction, OperationInstruction} from "../../intructions/instructions.mjs";


/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libdraw = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    clear: new NativeFunction(["r", "g", "b"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("clear", kwargs.get("r").value, kwargs.get("g").value, kwargs.get("b").value))
    }),
    color: new NativeFunction(["r", "g", "b", "a"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("color", kwargs.get("r").value, kwargs.get("g").value, kwargs.get("b").value, kwargs.get("a").value))
    }),
    col: new NativeFunction(["color"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("col", kwargs.get("color").value))
    }),
    stroke: new NativeFunction(["width"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("stroke", kwargs.get("width").value))
    }),
    line: new NativeFunction(["x1", "y1", "x2", "y2"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("line", kwargs.get("x1").value, kwargs.get("y1").value, kwargs.get("x2").value, kwargs.get("y2").value))
    }),
    rect: new NativeFunction(["x", "y", "width", "height"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("rect", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("width").value, kwargs.get("height").value))
    }),
    lineRect: new NativeFunction(["x", "y", "width", "height"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("lineRect", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("width").value, kwargs.get("height").value))
    }),
    poly: new NativeFunction(["x", "y", "sides", "radius", "rotation"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("poly", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("sides").value, kwargs.get("radius").value, kwargs.get("rotation").value))
    }),
    linePoly: new NativeFunction(["x", "y", "sides", "radius", "rotation"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("linePoly", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("sides").value, kwargs.get("radius").value, kwargs.get("rotation").value))
    }),
    triangle: new NativeFunction(["x1", "y1", "x2", "y2", "x3", "y3"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("triangle", kwargs.get("x1").value, kwargs.get("y1").value, kwargs.get("x2").value, kwargs.get("y2").value, kwargs.get("x3").value, kwargs.get("y3").value))
    }),
    image: new NativeFunction(["x", "y", "image", "size", "rotation"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawInstruction("image", kwargs.get("x").value, kwargs.get("y").value, kwargs.get("image").value, kwargs.get("size").value, kwargs.get("rotation").value))
    }),
})))
export default libdraw
