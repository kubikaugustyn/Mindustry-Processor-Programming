/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {NativeFunction} from "./NativeFunction.mjs";
import {
    DrawFlushInstruction, EndInstruction,
    GetLinkInstruction, PackColorInstruction,
    PrintFlushInstruction,
    PrintInstruction, RadarInstruction,
    ReadInstruction, StopInstruction, UnitBindInstruction, WaitInstruction,
    WriteInstruction
} from "../intructions/instructions.mjs";
import libmath from "./libmlog-namespaces/math.mjs";
import libdraw from "./libmlog-namespaces/draw.mjs";
import libcontrol from "./libmlog-namespaces/control.mjs";
import liblookup from "./libmlog-namespaces/lookup.mjs";
import libunit from "./libmlog-namespaces/unit.mjs";
import libprocnet from "./libmlog-namespaces/procnet.mjs";
import libdatetime from "./libmlog-namespaces/datetime.mjs";

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libmlog = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    math: libmath,
    draw: libdraw,
    control: libcontrol,
    lookup: liblookup,
    unit: libunit,
    procnet: libprocnet,
    datetime: libdatetime,
    // Functions
    read: new NativeFunction(["memory", "address"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new ReadInstruction(returnManager.getReturn(), kwargs.get("memory").value, kwargs.get("address").value))
    }),
    write: new NativeFunction(["memory", "address", "value"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new WriteInstruction(kwargs.get("value").value, kwargs.get("memory").value, kwargs.get("address").value))
    }),
    getlink: new NativeFunction(["index"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new GetLinkInstruction(returnManager.getReturn(), kwargs.get("index").value))
    }),
    print: new NativeFunction(["values"], true, (func, compiler, node, args, kwargs, returnManager) => {
        for (const value of kwargs.get("values").value)
            compiler.addInstruction(new PrintInstruction(value))
    }),
    println: new NativeFunction(["values"], true, (func, compiler, node, args, kwargs, returnManager) => {
        for (const value of kwargs.get("values").value)
            compiler.addInstruction(new PrintInstruction(value))
        // TODO Add the \n to the last value (if it is a string)
        compiler.addInstruction(new PrintInstruction('"\\n"'))
    }),
    printFlush: new NativeFunction(["message"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new PrintFlushInstruction(kwargs.get("message").value))
    }),
    drawFlush: new NativeFunction(["display"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new DrawFlushInstruction(kwargs.get("display").value))
    }),
    radar: new NativeFunction(["from", "target1", "target2", "target3", "order", "sort"], false, (func, compiler, node, args, kwargs, returnManager) => {
        // TODO Accept the enum instead of just literals for target1..3
        compiler.addInstruction(new RadarInstruction(kwargs.get("target1").value, kwargs.get("target2").value, kwargs.get("target3").value, kwargs.get("sort").value, kwargs.get("from").value, kwargs.get("order").value, returnManager.getReturn()))
    }),
    packcolor: new NativeFunction(["r", "g", "b", "a"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new PackColorInstruction(returnManager.getReturn(), kwargs.get("r").value, kwargs.get("g").value, kwargs.get("b").value, kwargs.get("a").value))
    }),
    wait: new NativeFunction(["seconds"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new WaitInstruction(kwargs.get("seconds").value))
    }),
    stop: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new StopInstruction())
    }),
    end: new NativeFunction([], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new EndInstruction())
    }),
})))

export default libmlog
