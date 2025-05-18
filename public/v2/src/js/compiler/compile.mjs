/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

/*import {
    Syntax,
    parse,
    parseModule,
    parseScript,
    tokenize,
    version
} from "https://cdn.jsdelivr.net/npm/esprima-next@6.0.3/dist/esprima.js"*/
import {
    ReadInstruction,
    WriteInstruction,
    DrawInstruction,
    PrintInstruction,
    DrawFlushInstruction,
    PrintFlushInstruction,
    GetLinkInstruction,
    ControlInstruction,
    RadarInstruction,
    SensorInstruction,
    SetInstruction,
    OperationInstruction,
    LookupInstruction,
    PackColorInstruction,
    WaitInstruction,
    StopInstruction,
    EndInstruction,
    JumpInstruction,
    UnitBindInstruction,
    UnitControlInstruction,
    UnitRadarInstruction,
    UnitLocateInstruction
} from "../intructions/instructions.mjs";
import {Parser} from "./Parser.mjs";
import {Compiler} from "./Compiler.mjs";

const EXAMPLE_INSTRUCTIONS = [
    // Input & Output
    /*new ReadInstruction("result", "cell1", "0"),
    new WriteInstruction("result", "cell1", "0"),
    new DrawInstruction("clear", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("color", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("col", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("stroke", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("line", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("rect", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("lineRect", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("poly", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("linePoly", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("triangle", "0", "0", "0", "0", "0", "0"),
    new DrawInstruction("image", "0", "0", "@copper", "32", "0", "0"),
    new PrintInstruction("\"frog is [green]green[], cuz that's how it is [[yeah] - [[CZ][#aaaaaa]Hacker[cyan]Kuba[blue]2009\""),*/

    // Block Control
    /*new DrawFlushInstruction("display1"),
    new PrintFlushInstruction("message1"),
    new GetLinkInstruction("result", "0"),
    new ControlInstruction("enabled", "block1", "0"),
    new ControlInstruction("shoot", "block1", "0", "0", "0"),
    new ControlInstruction("shootp", "block1", "0", "0"),
    new ControlInstruction("config", "block1", "@copper"),
    new ControlInstruction("color", "block1", "%ff0000"),
    new RadarInstruction("turret", "enemy", "boss", "any", "1", "distance", "result"),
    new SensorInstruction("result", "@copper", "block1"),*/

    // Operations
    /*new SetInstruction("result", "0"),
    ...[
        "add", "sub", "mul", "div", "idiv", "mod", "pow", "equal", "notEqual", "land", "lessThan", "lessThanEq",
        "greaterThan", "greaterThanEq", "strictEqual", "shl", "shr", "or", "and", "xor", "not", "max", "min", "angle",
        "angleDiff", "len", "noise", "abs", "log", "log10", "floor", "ceil", "sqrt", "rand", "sin", "cos", "tan",
        "asin", "acos", "atan"
    ].map(operation =>
        new OperationInstruction(operation, "result", "a", "b")
    ),
    new LookupInstruction("block", "result", "0"),
    new PackColorInstruction("result", "1", "0", "0", "1"),*/

    // Flow control
    /*new WaitInstruction("0.5"),
    new StopInstruction(),
    new EndInstruction(),
    new JumpInstruction("-1", "strictEqual", "x", "false"),
    new JumpInstruction("5", "always", "", ""),*/

    // Unit control
    /*new UnitBindInstruction("@poly"),
    ...[
        "idle",
        "stop",
        "move",
        "approach",
        "boost",
        "target",
        "targetp",
        "itemDrop",
        "itemTake",
        "payDrop",
        "payTake",
        "payEnter",
        "mine",
        "flag",
        "build",
        "getBlock",
        "within",
        "unbind"
    ].map(type => new UnitControlInstruction(type, "0", "1", "2", "3", "4")),
    new UnitRadarInstruction("enemy", "boss", "any", "distance", "0", "1", "result"),
    new UnitLocateInstruction("ore", "core", "true", "@copper", "outx", "outy", "found", "building"),
    new UnitLocateInstruction("building", "core", "true", "@copper", "outx", "outy", "found", "building"),
    new UnitLocateInstruction("spawn", "core", "true", "@copper", "outx", "outy", "found", "building"),
    new UnitLocateInstruction("damaged", "core", "true", "@copper", "outx", "outy", "found", "building"),*/
]

/**
 * @param inputCode {string} The code to compile.
 * @param instructionContainer {InstructionContainer} The instruction container to put the resulting instructions into.
 * @param getShouldCancel {function(): boolean} Whether the compilation should be canceled.
 * @param optimiseConstants {boolean} Whether the compilation should optimize constants by only calculating them only once. Only works for constants that are in the top level of the code, e.g., not inside a function, and not after any other statement than a constant declaration.
 * @param trimJumpsToAfterLastInstruction {boolean} Whether the compilation should move the jumps that jump to after the last instruction to the beginning of the program.
 * @return {Promise<boolean>}
 */
export default async function compile(inputCode, instructionContainer, getShouldCancel, optimiseConstants = true, trimJumpsToAfterLastInstruction = true) {
    // Parse the code
    const parser = new Parser(inputCode)
    let ast

    try {
        ast = parser.parse()
    } catch (error) {
        console.error(error)
        return false
    }

    console.log("AST:", ast)

    // Clear existing instructions
    instructionContainer.clear()

    try {
        const compiler = new Compiler(instructionContainer, null, optimiseConstants, trimJumpsToAfterLastInstruction)
        compiler.compile(ast)

        return true
    } catch (error) {
        console.error('Compilation error:', error)
        return false
    }
}
