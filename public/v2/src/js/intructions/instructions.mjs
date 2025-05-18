/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import Instruction from "./Instruction.mjs";
import DynamicLink from "./DynamicLink.mjs";

export const INSTRUCTION = {
    // Input & Output
    READ: "read",
    WRITE: "write",
    DRAW: "draw",
    PRINT: "print",
    // Block Control
    DRAW_FLUSH: "drawflush",
    PRINT_FLUSH: "printflush",
    GET_LINK: "getlink",
    CONTROL: "control",
    RADAR: "radar",
    SENSOR: "sensor",
    // Operations
    SET: "set",
    OPERATION: "op",
    LOOKUP: "lookup",
    PACK_COLOR: "packcolor",
    // Flow control
    WAIT: "wait",
    STOP: "stop",
    END: "end",
    JUMP: "jump",
    // Unit control
    UNIT_BIND: "ubind",
    UNIT_CONTROL: "ucontrol",
    UNIT_RADAR: "uradar",
    UNIT_LOCATE: "ulocate"
}

const CATEGORY = {
    INPUT_OUTPUT: ["Input & Output", "input_output"],
    BLOCK_CONTROL: ["Block Control", "block_control"],
    OPERATIONS: ["Operations", "operations"],
    FLOW_CONTROL: ["Flow control", "flow_control"],
    UNIT_CONTROL: ["Unit control", "unit_control"]
}

// Input & Output
export class ReadInstruction extends Instruction {
    constructor(variable, memory, address) {
        super(INSTRUCTION.READ, [variable, memory, address], CATEGORY.INPUT_OUTPUT);
    }

    /** @return {string} */
    getName() {
        return "Read"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "text", content: "read"},
            {type: "input", content: this.operands[0]},
            {type: "text", content: "="},
            {type: "input", content: this.operands[1]},
            {type: "text", content: "at"},
            {type: "input", content: this.operands[2]}
        ]
    }
}

export class WriteInstruction extends Instruction {
    constructor(variable, memory, address) {
        super(INSTRUCTION.WRITE, [variable, memory, address], CATEGORY.INPUT_OUTPUT);
    }

    /** @return {string} */
    getName() {
        return "Write"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "text", content: "write"},
            {type: "input", content: this.operands[0]},
            {type: "text", content: "to"},
            {type: "input", content: this.operands[1]},
            {type: "text", content: "at"},
            {type: "input", content: this.operands[2]}
        ]
    }
}

export class DrawInstruction extends Instruction {
    /**
     * @param type {"clear"|"color"|"col"|"stroke"|"line"|"rect"|"lineRect"|"poly"|"linePoly"|"triangle"|"image"}
     * @param operands {string}
     */
    constructor(type, ...operands) {
        super(INSTRUCTION.DRAW, [type, ...operands], CATEGORY.INPUT_OUTPUT);
    }

    /** @return {string} */
    getName() {
        return "Draw"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        /** @type {"clear"|"color"|"col"|"stroke"|"line"|"rect"|"lineRect"|"poly"|"linePoly"|"triangle"|"image"} */
        const type = this.operands[0]
        /** @type {TInstructionContentElement} */
        const typeElement = {type: "enum", content: type};
        /** @type {TInstructionContentElement[]} */
        let rest = [{type: "text", content: "[???]"}]

        switch (type) {
            case "clear":
                rest = [
                    {type: "text", content: "r"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "g"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "b"},
                    {type: "input", content: this.operands[3]},
                ]
                break
            case "color":
                rest = [
                    {type: "text", content: "r"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "g"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "b"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "a"},
                    {type: "input", content: this.operands[4]},
                ]
                break
            case "col":
                rest = [
                    {type: "text", content: "color"},
                    {type: "input", content: this.operands[1]}
                ]
                break
            case "stroke":
                rest = [{type: "input", content: this.operands[1]}]
                break
            case "line":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "y"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "x2"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "y2"},
                    {type: "input", content: this.operands[4]},
                ]
                break
            case "rect":
            case "lineRect":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "y"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "width"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "height"},
                    {type: "input", content: this.operands[4]},
                ]
                break
            case "poly":
            case "linePoly":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "y"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "sides"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "radius"},
                    {type: "input", content: this.operands[4]},
                    {type: "text", content: "rotation"},
                    {type: "input", content: this.operands[5]},
                ]
                break
            case "triangle":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "y"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "x2"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "y2"},
                    {type: "input", content: this.operands[4]},
                    {type: "text", content: "x3"},
                    {type: "input", content: this.operands[5]},
                    {type: "text", content: "y3"},
                    {type: "input", content: this.operands[6]},
                ]
                break
            case "image":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "y"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "image"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "size"},
                    {type: "input", content: this.operands[4]},
                    {type: "text", content: "rotation"},
                    {type: "input", content: this.operands[5]},
                ]
                break
        }

        return [typeElement, ...rest]
    }
}

export class PrintInstruction extends Instruction {
    constructor(value) {
        super(INSTRUCTION.PRINT, [value], CATEGORY.INPUT_OUTPUT);
    }

    /** @return {string} */
    getName() {
        return "Print"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [{type: "input", content: this.operands[0]}]
    }
}

// Block Control
export class DrawFlushInstruction extends Instruction {
    constructor(display) {
        super(INSTRUCTION.DRAW_FLUSH, [display], CATEGORY.BLOCK_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Draw Flush"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "text", content: "to"},
            {type: "input", content: this.operands[0]}
        ]
    }
}

export class PrintFlushInstruction extends Instruction {
    constructor(message) {
        super(INSTRUCTION.PRINT_FLUSH, [message], CATEGORY.BLOCK_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Print Flush"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "text", content: "to"},
            {type: "input", content: this.operands[0]}
        ]
    }
}

export class GetLinkInstruction extends Instruction {
    constructor(variable, index) {
        super(INSTRUCTION.GET_LINK, [variable, index], CATEGORY.BLOCK_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Get Link"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "input", content: this.operands[0]},
            {type: "text", content: "= link#"},
            {type: "input", content: this.operands[1]}
        ]
    }
}

export class ControlInstruction extends Instruction {
    /**
     * @param property {"enabled"|"shoot"|"shootp"|"config"|"color"}
     * @param operands {string}
     */
    constructor(property, ...operands) {
        super(INSTRUCTION.CONTROL, [property, ...operands], CATEGORY.BLOCK_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Control"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        /** @type {"enabled"|"shoot"|"shootp"|"config"|"color"} */
        const property = this.operands[0]
        /** @type {TInstructionContentElement[]} */
        const commonBeginning = [
            {type: "text", content: "set"},
            {type: "enum", content: property}
        ];
        /** @type {TInstructionContentElement[]} */
        let rest = [{type: "text", content: "[???]"}]

        switch (property) {
            case "enabled":
            case "config":
            case "color":
                rest = [
                    {type: "text", content: "of"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "to"},
                    {type: "input", content: this.operands[2]},
                ]
                break
            case "shoot":
                rest = [
                    {type: "text", content: "of"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "x"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "y"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "shoot"},
                    {type: "input", content: this.operands[4]},
                ]
                break
            case "shootp":
                rest = [
                    {type: "text", content: "of"},
                    {type: "input", content: this.operands[1]},
                    {type: "text", content: "unit"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "shoot"},
                    {type: "input", content: this.operands[3]},
                ]
                break
        }

        return [...commonBeginning, ...rest]
    }
}

export class RadarInstruction extends Instruction {
    /**
     * @param from {string}
     * @param target1 {"any"|"enemy"|"ally"|"player"|"attacker"|"flying"|"boss"|"ground"}
     * @param target2 {"any"|"enemy"|"ally"|"player"|"attacker"|"flying"|"boss"|"ground"}
     * @param target3 {"any"|"enemy"|"ally"|"player"|"attacker"|"flying"|"boss"|"ground"}
     * @param order {string}
     * @param sort {"distance"|"health"|"shield"|"armor"|"maxHealth"}
     * @param output {string}
     */
    constructor(target1, target2, target3, sort, from, order, output) {
        super(INSTRUCTION.RADAR, [target1, target2, target3, sort, from, order, output], CATEGORY.BLOCK_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Radar"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "text", content: "from"},
            {type: "input", content: this.operands[4]},
            {type: "text", content: "target"},
            {type: "enum", content: this.operands[0]},
            {type: "text", content: "and"},
            {type: "enum", content: this.operands[1]},
            {type: "text", content: "and"},
            {type: "enum", content: this.operands[2]},
            {type: "text", content: "order"},
            {type: "input", content: this.operands[5]},
            {type: "text", content: "sort"},
            {type: "enum", content: this.operands[3]},
            {type: "text", content: "output"},
            {type: "input", content: this.operands[6]},
        ]
    }
}

export class SensorInstruction extends Instruction {
    /**
     * @param variable {string}
     * @param block {string}
     * @param property {string}
     */
    constructor(variable, block, property) {
        super(INSTRUCTION.SENSOR, [variable, block, property], CATEGORY.BLOCK_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Sensor"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "input", content: this.operands[0]},
            {type: "text", content: "="},
            {type: "input", content: this.operands[2]},
            {type: "text", content: "in"},
            {type: "input", content: this.operands[1]},
        ]
    }
}

// Operations
export class SetInstruction extends Instruction {
    constructor(variable, value) {
        super(INSTRUCTION.SET, [variable, value], CATEGORY.OPERATIONS);
    }

    /** @return {string} */
    getName() {
        return "Set"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "input", content: this.operands[0]},
            {type: "text", content: "="},
            {type: "input", content: this.operands[1]}
        ]
    }
}

export class OperationInstruction extends Instruction {
    /**
     * @typedef {"land"|"or"|"xor"|"and"|"equal"|"notEqual"|"strictEqual"|"lessThan"|"greaterThan"|"lessThanEq"|"greaterThanEq"|"shl"|"shr"|"add"|"sub"|"mul"|"div"|"idiv"|"mod"|"pow"|"not"|"max"|"min"|"angle"|"angleDiff"|"len"|"noise"|"abs"|"log"|"log10"|"floor"|"ceil"|"sqrt"|"rand"|"sin"|"cos"|"tan"|"asin"|"acos"|"atan"} TOperationEnum
     */
    /**
     * @param operation {TOperationEnum}
     * @param variable {string}
     * @param a {string}
     * @param b {string|""}
     */
    constructor(operation, variable, a, b) {
        super(INSTRUCTION.OPERATION, [operation, variable, a, b], CATEGORY.OPERATIONS);
    }

    /** @return {string} */
    getName() {
        return "Operation"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        /**
         * @type {TOperationEnum|string}
         */
        const operation = this.operands[0]
        const [variable, a, b] = this.operands.slice(1)
        /** @type {TInstructionContentElement[]} */
        const commonBeginning = [
            {type: "input", content: variable},
            {type: "text", content: "="}
        ];
        /** @type {TInstructionContentElement[]} */
        let rest = [{type: "text", content: "[???]"}]

        /**
         * @type {Object<string, string[]>}
         */
        const binaryOperations = {
            "land": ["", "and"],
            "or": ["", "or"],
            "xor": ["", "xor"],
            "and": ["", "b-and"],
            "equal": ["", "=="],
            "notEqual": ["", "not"],
            "strictEqual": ["", "==="],
            "lessThan": ["", "<"],
            "greaterThan": ["", ">"],
            "lessThanEq": ["", "<="],
            "greaterThanEq": ["", ">="],
            "shl": ["", "<<"],
            "shr": ["", ">>"],
            "add": ["", "+"],
            "sub": ["", "-"],
            "mul": ["", "*"],
            "div": ["", "/"],
            "idiv": ["", "//"],
            "mod": ["", "%"],
            "pow": ["", "^"],
            "max": ["max", ""],
            "min": ["min", ""],
            "angle": ["angle", ""],
            "angleDiff": ["angle diff", ""],
            "len": ["len", ""],
            "noise": ["noise", ""],
        }
        /**
         * @type {Object<string, string>}
         */
        const unaryOperations = {
            "not": "flip",
            "abs": "abs",
            "log": "log",
            "log10": "log10",
            "floor": "floor",
            "ceil": "ceil",
            "sqrt": "sqrt",
            "rand": "rand",
            "sin": "sin",
            "cos": "cos",
            "tan": "tan",
            "asin": "asin",
            "acos": "acos",
            "atan": "atan",
        }

        if (binaryOperations.hasOwnProperty(operation)) {
            const [before, middle] = binaryOperations[operation]
            rest = [
                before && {type: "enum", content: before},
                {type: "input", content: a},
                middle && {type: "enum", content: middle},
                {type: "input", content: b},
            ].filter(Boolean) // Filter out the blank strings
        }
        else if (unaryOperations.hasOwnProperty(operation))
            rest = [
                {type: "enum", content: unaryOperations[operation]},
                {type: "input", content: a},
            ]

        return [...commonBeginning, ...rest]
    }
}

export class LookupInstruction extends Instruction {
    /**
     * @param type {"block"|"unit"|"item"|"liquid"}
     * @param variable {string}
     * @param index {string}
     */
    constructor(type, variable, index) {
        super(INSTRUCTION.LOOKUP, [type, variable, index], CATEGORY.OPERATIONS);
    }

    /** @return {string} */
    getName() {
        return "Lookup"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "input", content: this.operands[1]},
            {type: "text", content: "="},
            {type: "enum", content: this.operands[0]},
            {type: "text", content: "#"},
            {type: "input", content: this.operands[2]}
        ]
    }
}

export class PackColorInstruction extends Instruction {
    constructor(variable, r, g, b, a) {
        super(INSTRUCTION.PACK_COLOR, [variable, r, g, b, a], CATEGORY.OPERATIONS);
    }

    /** @return {string} */
    getName() {
        return "Pack Color"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "input", content: this.operands[0]},
            {type: "text", content: "="},
            {type: "text", content: "pack"},
            {type: "input", content: this.operands[1]},
            {type: "input", content: this.operands[2]},
            {type: "input", content: this.operands[3]},
            {type: "input", content: this.operands[4]},
        ]
    }
}

// Flow control
export class WaitInstruction extends Instruction {
    constructor(seconds) {
        super(INSTRUCTION.WAIT, [seconds], CATEGORY.FLOW_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Wait"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "input", content: this.operands[0]},
            {type: "text", content: "sec"},
        ]
    }
}

export class StopInstruction extends Instruction {
    constructor() {
        super(INSTRUCTION.STOP, [], CATEGORY.FLOW_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Stop"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return []
    }
}

export class EndInstruction extends Instruction {
    constructor() {
        super(INSTRUCTION.END, [], CATEGORY.FLOW_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "End"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return []
    }
}

export class JumpInstruction extends Instruction {
    /**
     * @param address {DynamicLink|string|"-1"}
     * @param condition {"equal"|"notEqual"|"lessThan"|"lessThanEq"|"greaterThan"|"greaterThanEq"|"strictEqual"|"always"}
     * @param a {string|""}
     * @param b {string|""}
     */
    constructor(address, condition, a, b) {
        super(INSTRUCTION.JUMP, [address, condition, a, b], CATEGORY.FLOW_CONTROL);
    }

    /** @return {string} */
    getName() {
        let address = this.operands[0]
        if (address instanceof DynamicLink)
            address = (address.address ?? -1).toString()

        return address === "-1" ?
            "Jump" :
            `Jump -> ${address}`
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        if (this.operands[1] === "always")
            return [
                {type: "text", content: "if"},
                {type: "enum", content: "always"},
            ]

        return [
            {type: "text", content: "if"},
            {type: "input", content: this.operands[2]},
            {
                type: "enum", content: {
                    "equal": "==",
                    "notEqual": "not",
                    "lessThan": "<",
                    "lessThanEq": "<=",
                    "greaterThan": ">",
                    "greaterThanEq": ">=",
                    "strictEqual": "==="
                }[this.operands[1]]
            },
            {type: "input", content: this.operands[3]},
        ]
    }
}

// Unit control
export class UnitBindInstruction extends Instruction {
    constructor(unitType) {
        super(INSTRUCTION.UNIT_BIND, [unitType], CATEGORY.UNIT_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Unit Bind"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            {type: "text", content: "type"},
            {type: "input", content: this.operands[0]},
        ]
    }
}

export class UnitControlInstruction extends Instruction {
    /**
     * @param type {"idle"|"stop"|"move"|"approach"|"boost"|"target"|"targetp"|"itemDrop"|"itemTake"|"payDrop"|"payTake"|"payEnter"|"mine"|"flag"|"build"|"getBlock"|"within"|"unbind"}
     * @param p1 {string}
     * @param p2 {string}
     * @param p3 {string}
     * @param p4 {string}
     * @param p5 {string}
     */
    constructor(type, p1, p2, p3, p4, p5) {
        super(INSTRUCTION.UNIT_CONTROL, [type, p1, p2, p3, p4, p5], CATEGORY.UNIT_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Unit Control"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        /** @type {"idle"|"stop"|"move"|"approach"|"boost"|"target"|"targetp"|"itemDrop"|"itemTake"|"payDrop"|"payTake"|"payEnter"|"mine"|"flag"|"build"|"getBlock"|"within"|"unbind"} */
        const type = this.operands[0]
        /** @type {string} */
        const [p1, p2, p3, p4, p5] = this.operands.slice(1)
        const typeElement = {type: "enum", content: type}
        let rest = [{type: "text", content: "[???]"}]

        switch (type) {
            case "idle":
            case "stop":
            case "payDrop":
            case "payEnter":
            case "unbind":
                rest = []
                break
            case "move":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2},
                ]
                break
            case "approach":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2},
                    {type: "text", content: "radius"},
                    {type: "input", content: p3}
                ]
                break
            case "boost":
                rest = [
                    {type: "text", content: "enable"},
                    {type: "input", content: p1},
                ]
                break
            case "target":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2},
                    {type: "text", content: "shoot"},
                    {type: "input", content: p3}
                ]
                break
            case "targetp":
                rest = [
                    {type: "text", content: "unit"},
                    {type: "input", content: p1},
                    {type: "text", content: "shoot"},
                    {type: "input", content: p2}
                ]
                break
            case "itemDrop":
                rest = [
                    {type: "text", content: "to"},
                    {type: "input", content: p1},
                    {type: "text", content: "amount"},
                    {type: "input", content: p2}
                ]
                break
            case "itemTake":
                rest = [
                    {type: "text", content: "from"},
                    {type: "input", content: p1},
                    {type: "text", content: "item"},
                    {type: "input", content: p2},
                    {type: "text", content: "amount"},
                    {type: "input", content: p3}
                ]
                break
            case "payTake":
                rest = [
                    {type: "text", content: "takeUnits"},
                    {type: "input", content: p1}
                ]
                break
            case "mine":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2}
                ]
                break
            case "flag":
                rest = [
                    {type: "text", content: "value"},
                    {type: "input", content: p1}
                ]
                break
            case "build":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2},
                    {type: "text", content: "block"},
                    {type: "input", content: p3},
                    {type: "text", content: "rotation"},
                    {type: "input", content: p4},
                    {type: "text", content: "config"},
                    {type: "input", content: p5}
                ]
                break
            case "getBlock":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2},
                    {type: "text", content: "type"},
                    {type: "input", content: p3},
                    {type: "text", content: "building"},
                    {type: "input", content: p4},
                    {type: "text", content: "floor"},
                    {type: "input", content: p5}
                ]
                break
            case "within":
                rest = [
                    {type: "text", content: "x"},
                    {type: "input", content: p1},
                    {type: "text", content: "y"},
                    {type: "input", content: p2},
                    {type: "text", content: "radius"},
                    {type: "input", content: p3},
                    {type: "text", content: "result"},
                    {type: "input", content: p4}
                ]
                break
        }

        return [typeElement, ...rest]
    }
}

export class UnitRadarInstruction extends Instruction {
    /**
     * This instruction is the equivalent of the Radar instruction, it just sets the "from" operand of the radar instruction to @unit.
     * @param target1 {"any"|"enemy"|"ally"|"player"|"attacker"|"flying"|"boss"|"ground"}
     * @param target2 {"any"|"enemy"|"ally"|"player"|"attacker"|"flying"|"boss"|"ground"}
     * @param target3 {"any"|"enemy"|"ally"|"player"|"attacker"|"flying"|"boss"|"ground"}
     * @param order {string}
     * @param sort {"distance"|"health"|"shield"|"armor"|"maxHealth"}
     * @param ignored {"0"} This is a value that is ignored (it is overwritten to @unit, the FROM operand of the radar instruction), see: https://github.com/Anuken/Mindustry/blob/611d866d68747d55e0f4309f3640ac0db880e8a5/core/src/mindustry/logic/LStatements.java#L1047-L1049
     * @param output {string}
     */
    constructor(target1, target2, target3, sort, ignored, order, output) {
        super(INSTRUCTION.UNIT_RADAR, [target1, target2, target3, sort, ignored, order, output], CATEGORY.UNIT_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Unit Radar"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        return [
            // Same as in RadarInstruction, just the "from" operand is not present
            {type: "text", content: "target"},
            {type: "enum", content: this.operands[0]},
            {type: "text", content: "and"},
            {type: "enum", content: this.operands[1]},
            {type: "text", content: "and"},
            {type: "enum", content: this.operands[2]},
            {type: "text", content: "order"},
            {type: "input", content: this.operands[5]},
            {type: "text", content: "sort"},
            {type: "enum", content: this.operands[3]},
            {type: "text", content: "output"},
            {type: "input", content: this.operands[6]},
        ]
    }
}

export class UnitLocateInstruction extends Instruction {
    /**
     * @param locate {"ore"|"building"|"spawn"|"damaged"}
     * @param flag {"core"|"storage"|"generator"|"turret"|"factory"|"repair"|"battery"|"reactor"}
     * @param enemy {string}
     * @param ore {string}
     * @param outX {string}
     * @param outY {string}
     * @param outFound {string}
     * @param outBuild {string}
     */
    constructor(locate, flag, enemy, ore, outX, outY, outFound, outBuild) {
        super(INSTRUCTION.UNIT_LOCATE, [locate, flag, enemy, ore, outX, outY, outFound, outBuild], CATEGORY.UNIT_CONTROL);
    }

    /** @return {string} */
    getName() {
        return "Unit Locate"
    }

    /** @return {TInstructionContentElement[]} */
    prepareContent() {
        /** @type {"ore"|"building"|"spawn"|"damaged"} */
        const locate = this.operands[0]
        const locateElements = [
            {type: "text", content: "find"},
            {type: "enum", content: locate}
        ]
        let rest = [{type: "text", content: "[???]"}]

        switch (locate) {
            case "ore":
                rest = [
                    {type: "text", content: "ore"},
                    {type: "input", content: this.operands[3]},
                    {type: "text", content: "outX"},
                    {type: "input", content: this.operands[4]},
                    {type: "text", content: "outY"},
                    {type: "input", content: this.operands[5]},
                    {type: "text", content: "found"},
                    {type: "input", content: this.operands[6]},
                ]
                break
            case "building":
                rest = [
                    {type: "text", content: "group"},
                    {type: "enum", content: this.operands[1]},
                    {type: "text", content: "enemy"},
                    {type: "input", content: this.operands[2]},
                    {type: "text", content: "outX"},
                    {type: "input", content: this.operands[4]},
                    {type: "text", content: "outY"},
                    {type: "input", content: this.operands[5]},
                    {type: "text", content: "found"},
                    {type: "input", content: this.operands[6]},
                    {type: "text", content: "building"},
                    {type: "input", content: this.operands[7]},
                ]
                break
            case "spawn":
            case "damaged":
                rest = [
                    {type: "text", content: "outX"},
                    {type: "input", content: this.operands[4]},
                    {type: "text", content: "outY"},
                    {type: "input", content: this.operands[5]},
                    {type: "text", content: "found"},
                    {type: "input", content: this.operands[6]},
                    {type: "text", content: "building"},
                    {type: "input", content: this.operands[7]},
                ]
                break
        }

        return [...locateElements, ...rest]
    }
}
