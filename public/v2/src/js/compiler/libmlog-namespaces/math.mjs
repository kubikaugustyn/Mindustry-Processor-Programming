/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */
import {NativeFunction} from "../NativeFunction.mjs";
import {OperationInstruction} from "../../intructions/instructions.mjs";

const generateMathBinaryOpFunction = mlogName =>
    new NativeFunction(["a", "b"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new OperationInstruction(mlogName, returnManager.getReturn(), kwargs.get("a").value, kwargs.get("b").value))
    })
const generateMathUnaryOpFunction = mlogName =>
    new NativeFunction(["a"], false, (func, compiler, node, args, kwargs, returnManager) => {
        compiler.addInstruction(new OperationInstruction(mlogName, returnManager.getReturn(), kwargs.get("a").value, "0"))
    })

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libmath = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    idiv: generateMathBinaryOpFunction("idiv", "idiv"),
    max: generateMathBinaryOpFunction("max"),
    min: generateMathBinaryOpFunction("min"),
    angle: generateMathBinaryOpFunction("angle"),
    angleDiff: generateMathBinaryOpFunction("angleDiff"),
    len: generateMathBinaryOpFunction("len"),
    noise: generateMathBinaryOpFunction("noise"),
    abs: generateMathUnaryOpFunction("abs"),
    log: generateMathUnaryOpFunction("log"),
    log10: generateMathUnaryOpFunction("log10"),
    floor: generateMathUnaryOpFunction("floor"),
    ceil: generateMathUnaryOpFunction("ceil"),
    sqrt: generateMathUnaryOpFunction("sqrt"),
    rand: generateMathUnaryOpFunction("rand"),
    sin: generateMathUnaryOpFunction("sin"),
    cos: generateMathUnaryOpFunction("cos"),
    tan: generateMathUnaryOpFunction("tan"),
    asin: generateMathUnaryOpFunction("asin"),
    acos: generateMathUnaryOpFunction("acos"),
    atan: generateMathUnaryOpFunction("atan"),
})))
export default libmath
