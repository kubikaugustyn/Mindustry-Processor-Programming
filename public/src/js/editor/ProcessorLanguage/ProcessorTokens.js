var __author__ = "kubik.augustyn@post.cz"

class ProcessorTokens { // Basically all block available in processor
    static READ = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
        blockTitle = "Read"
        format = "read {0} = {1} at {2}"
    }
    static WRITE = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
        blockTitle = "Write"
        format = "write {0} to {1} at {2}"
    }
    static DRAW = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
        blockTitle = "Draw"
        format = [
            [{0: "clear"}, "clear r {1} g {2} b {3}"],
            [{0: "color"}, "color r {1} g {2} b {3} a {4}"],
            [{0: "col"}, "col color {1}"],
            [{0: "stroke"}, "stroke {1}"],
            [{0: "line"}, "line x {1} y {2} x2 {3} y2 {4}"],
            [{0: "rect"}, "rect x {1} y {2} width {3} height {4}"],
            [{0: "lineRect"}, "lineRect x {1} y {2} width {3} height {4}"],
            [{0: "poly"}, "poly x {1} y {2} sides {3} radius {4} rotation {5}"],
            [{0: "linePoly"}, "linePoly x {1} y {2} sides {3} radius {4} rotation {5}"],
            [{0: "triangle"}, "triangle x {1} y {2} x2 {3} y2 {4} x3 {5} y3 {6}"],
            [{0: "image"}, "image x {1} y {2} image {3} size {4} rotation {5}"]
        ]
    }
    static PRINT = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_INPUT_OUTPUT
        blockTitle = "Print"
        format = "{0}"
    }

    static DRAW_FLUSH = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_BLOCK_CONTROL
        blockTitle = "Draw Flush"
        format = "to {0}"
    }
    static PRINT_FLUSH = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_BLOCK_CONTROL
        blockTitle = "Print Flush"
        format = "to {0}"
    }
    static GET_LINK = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_BLOCK_CONTROL
        blockTitle = "Get Link"
        format = "{0} = link# {1}"
    }
    static CONTROL = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_BLOCK_CONTROL
        blockTitle = "Control"
        format = [
            [{0: "enabled"}, "set {0} of {1} to {2}"],
            [{0: "shoot"}, "set {0} of {1} x {2} y {3} shoot {4}"],
            [{0: "shootp"}, "set {0} of {1} unit {2} shoot {3}"],
            [{0: "config"}, "set {0} of {1} to {2}"],
            [{0: "color"}, "set {0} of {1} to {2}"]
        ]
    }
    static RADAR = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_BLOCK_CONTROL
        blockTitle = "Radar"
        format = "from {0} target {1} and {2} and {3} order {4} sort {5} output {6}"
    }
    static SENSOR = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_BLOCK_CONTROL
        blockTitle = "Sensor"
        format = "{0} = {2} in {1}"
    }

    static SET = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_OPERATIONS
        blockTitle = "Set"
        format = "{0} = {1}"
    }
    static OPERATION = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_OPERATIONS
        blockTitle = "Operation"
        format = [
            [{0: "add"}, "{1} = {2} + {3}"],
            [{0: "sub"}, "{1} = {2} - {3}"],
            [{0: "mul"}, "{1} = {2} * {3}"],
            [{0: "div"}, "{1} = {2} / {3}"],
            [{0: "idiv"}, "{1} = {2} // {3}"],
            [{0: "mod"}, "{1} = {2} % {3}"],
            [{0: "pow"}, "{1} = {2} ^ {3}"],
            [{0: "equal"}, "{1} = {2} == {3}"],
            [{0: "notEqual"}, "{1} = {2} not {3}"],
            [{0: "land"}, "{1} = {2} and {3}"],
            [{0: "lessThan"}, "{1} = {2} < {3}"],
            [{0: "lessThanEq"}, "{1} = {2} <= {3}"],
            [{0: "greaterThan"}, "{1} = {2} > {3}"],
            [{0: "greaterThanEq"}, "{1} = {2} >= {3}"],
            [{0: "strictEqual"}, "{1} = {2} === {3}"],
            [{0: "shl"}, "{1} = {2} << {3}"],
            [{0: "shr"}, "{1} = {2} >> {3}"],
            [{0: "or"}, "{1} = {2} or {3}"],
            [{0: "and"}, "{1} = {2} b-and {3}"],
            [{0: "xor"}, "{1} = {2} xor {3}"],
            [{0: "not"}, "{1} = flip {2}"],
            [{0: "max"}, "{1} = max {2} {3}"],
            [{0: "min"}, "{1} = min {2} {3}"],
            [{0: "angle"}, "{1} = angle {2} {3}"],
            [{0: "len"}, "{1} = len {2} {3}"],
            [{0: "noise"}, "{1} = noise {2} {3}"],
            [{0: "abs"}, "{1} = abs {2}"],
            [{0: "log"}, "{1} = log {2}"],
            [{0: "log10"}, "{1} = log10 {2}"],
            [{0: "floor"}, "{1} = floor {2}"],
            [{0: "ceil"}, "{1} = ceil {2}"],
            [{0: "sqrt"}, "{1} = sqrt {2}"],
            [{0: "rand"}, "{1} = rand {2}"],
            [{0: "sin"}, "{1} = sin {2}"],
            [{0: "cos"}, "{1} = cos {2}"],
            [{0: "tan"}, "{1} = tan {2}"],
            [{0: "asin"}, "{1} = asin {2}"],
            [{0: "acos"}, "{1} = acos {2}"],
            [{0: "atan"}, "{1} = atan {2}"],
        ]
    }
    static LOOKUP = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_OPERATIONS
        blockTitle = "Lookup"
        format = "{1} = lookup {0} # {2}"
    }
    static PACK_COLOR = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_OPERATIONS
        blockTitle = "Pack Color"
        format = "{0} = pack {1} {2} {3} {4}"
    }

    static WAIT = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_FLOW_CONTROL
        blockTitle = "Wait"
        format = "{0} sec"
    }
    static STOP = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_FLOW_CONTROL
        blockTitle = "Stop"
        format = ""
    }
    static END = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_FLOW_CONTROL
        blockTitle = "End"
        format = ""
    }
    static JUMP = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_FLOW_CONTROL
        blockTitle = "Jump"
        format = [
            [{1: "equal"}, "if {2} == {3}"],
            [{1: "notEqual"}, "if {2} not {3}"],
            [{1: "lessThan"}, "if {2} < {3}"],
            [{1: "lessThanEq"}, "if {2} <= {3}"],
            [{1: "greaterThan"}, "if {2} > {3}"],
            [{1: "greaterThanEq"}, "if {2} >= {3}"],
            [{1: "strictEq"}, "if {2} === {3}"],
            [{1: "always"}, "if always"]
        ]
    }

    static UNIT_BIND = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_UNIT_CONTROL
        blockTitle = "Unit Bind"
        format = "type {0}"
    }
    static UNIT_CONTROL = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_UNIT_CONTROL
        blockTitle = "Unit Control"
        format = "[TODO]"
    }
    static UNIT_RADAR = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_UNIT_CONTROL
        blockTitle = "Unit Radar"
        format = "[TODO]"
    }
    static UNIT_LOCATE = class extends ProcessorBlock {
        category = ProcessorBlock.CATEGORY_UNIT_CONTROL
        blockTitle = "Unit Locate"
        format = "[TODO]"
    }
}
