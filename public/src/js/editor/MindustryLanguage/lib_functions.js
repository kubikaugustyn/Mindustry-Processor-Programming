var __author__ = "kubik.augustyn@post.cz"

function createLibFunctions() {
    var fn = MindustryCompiler.NativeFunctionBinding
    MindustryCompiler.DEFAULT_LIB_FUNCTIONS = [
        new fn("read", [
                ["block", new ProcessorTypes.BUILDING],
                ["addr", new ProcessorTypes.POSITIVE_INTEGER]
            ], new ProcessorTypes.NUMBER, [new ProcessorTokens.READ(["$RETURN$", "$block$", "$addr$"])],
            "function read(BLOCK block; POSITIVE_INTEGER addr) {\n\treturn block[addr]\n}"),
        new fn("write", [
                ["val", new ProcessorTypes.NUMBER],
                ["block", new ProcessorTypes.BUILDING],
                ["addr", new ProcessorTypes.POSITIVE_INTEGER]
            ], undefined, [new ProcessorTokens.WRITE(["$val$", "$block$", "$addr$"])],
            "function write(NUMBER val; BUILDING block; POSITIVE_INTEGER addr) {\n\tblock[addr] = val\n}"),
        new fn("print", [
            ["text", new ProcessorTypes.ANY]
        ], undefined, [new ProcessorTokens.PRINT(["$text$"])]),
        new fn("println", [
                ["text", new ProcessorTypes.ANY],
                ["block", new ProcessorTypes.BUILDING]
            ], undefined, [new ProcessorTokens.PRINT(["$text$"]), new ProcessorTokens.PRINT_FLUSH(["$block$"])],
            "function println(ANY text; BUILDING block) {\n\tprint(text)\n\tprintFlush(block)\n}"),
        new fn("printFlush", [
            ["block", new ProcessorTypes.BUILDING]
        ], undefined, [new ProcessorTokens.PRINT_FLUSH(["$block$"])]),
        new fn("control.enabled", [
            ["block", new ProcessorTypes.BUILDING],
            ["value", new ProcessorTypes.ANY]
        ], undefined, [new ProcessorTokens.CONTROL(["enabled", "$block$", "$value$"])]),
        new fn("control.shoot", [
            ["block", new ProcessorTypes.BUILDING],
            ["x", new ProcessorTypes.NUMBER],
            ["y", new ProcessorTypes.NUMBER],
            ["shoot", new ProcessorTypes.BOOLEAN]
        ], undefined, [new ProcessorTokens.CONTROL(["shoot", "$block$", "$x$", "$y$", "$shoot$"])]),
        new fn("control.shootp", [
            ["block", new ProcessorTypes.BUILDING],
            ["unit", new ProcessorTypes.UNIT],
            ["shoot", new ProcessorTypes.BOOLEAN]
        ], undefined, [new ProcessorTokens.CONTROL(["shootp", "$block$", "$unit$", "$shoot$"])]),
        new fn("control.config", [
            ["block", new ProcessorTypes.BUILDING],
            ["config", new ProcessorTypes.ANY]
        ], undefined, [new ProcessorTokens.CONTROL(["config", "$block$", "$config$"])]),
        new fn("control.color", [
            ["block", new ProcessorTypes.BUILDING],
            ["color", new ProcessorTypes.COLOR]
        ], undefined, [new ProcessorTokens.CONTROL(["color", "$block$", "$color$"])]),
        new fn("radar", [
            ["block", new ProcessorTypes.BUILDING],
            ["target1", new ProcessorTypes.RADAR_TARGET],
            ["target2", new ProcessorTypes.RADAR_TARGET],
            ["target3", new ProcessorTypes.RADAR_TARGET],
            ["order", new ProcessorTypes.POSITIVE_INTEGER],
            ["sort", new ProcessorTypes.RADAR_SORT]
        ], new ProcessorTypes.UNIT, [new ProcessorTokens.RADAR(["$block$", "$target1$", "$target2$", "$target3$", "$order$", "$sort$", "$RETURN$"])]),
        new fn("getlink", [
            ["i", new ProcessorTypes.POSITIVE_INTEGER]
        ], new ProcessorTypes.BUILDING, [new ProcessorTokens.GET_LINK(["$RETURN$", "$i$"])]),
    ]
}
