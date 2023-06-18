var __author__ = "kubik.augustyn@post.cz"

var blocksView = new ProcessorBlocksView()
var lexer = new MindustryLexer()
var parser = new MindustryParser()
var compiler = new MindustryCompiler()

function blocksContainerError(msg) {
    /*blocksView.getBlocksContainer().style.color = "red"
    blocksView.getBlocksContainer().innerHTML = msg*/
    if (msg instanceof Error) {
        //console.log("Error...", msg.name, msg.cause, msg.stack, msg.message)
        /*ProcessorBlocksView.DEBUG_LOG = true
        blocksView.copyToClipboard(msg.stack)
        ProcessorBlocksView.DEBUG_LOG = false*/
        msg = msg.stack || msg.name + msg.message
    }
    blocksView.addErrors(false, msg.replaceAll("<", "&lt;").replaceAll("    ", "<tab></tab>").replaceAll("\n", "<br>"))
    blocksView.setBlocks([])
}

var highlighter = new SyntaxHighlighter("Mindustry", function (code) {
    // this.editorElements.code.innerHTML = this.editorElements.input.value.replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")
    // this.editorElements.code.style.color = "blue"

    function onError(msg, token, src) {
        //console.warn("onError", ...arguments)
        if (src instanceof Parser && src.quietError) {
            // console.log("Quiet error at line #", token?.lineNum + 1)
            // this.rawSyntax(code, "magenta")
            throw false
        }
        blocksContainerError(msg)
        console.warn("Error:", msg, "at token", token)
        var lines = this.editorElements.input.value.replaceAll("<", "&lt;").replaceAll("\t", "<tab></tab>").split("\n")
        if (typeof token?.lineNum === "undefined" || token?.lineNum >= lines.length) throw true
        // console.log("ERROR", msg, token.lineNum, token, this)
        this.editorElements.code.style.color = "red"
        this.editorElements.code.innerHTML = `<pre style="margin: 0">${lines.slice(0, token.lineNum).map(a => a || " ").join("<br>")}</pre>`
        this.editorElements.code.innerHTML += `<pre style="margin: 0; color: blue">${lines[token.lineNum]}</pre>`
        this.editorElements.code.innerHTML += `<pre style="margin: 0">${lines.slice(token.lineNum + 1).map(a => a || " ").join("<br>")}</pre>`
        throw false
    }

    try {
        var tokensGenerator = lexer.regenerateTokens(this.editorElements.input.value)
        var tokens = []
        for (let token of tokensGenerator) tokens.push(token)

        parser.throwError = onError.bind(this)
        // Parse (generate Abstract Syntax Tree)
        var tree = parser.reparse(tokens.filter(token =>
            !(token instanceof MindustryTokens.TAB || token instanceof MindustryTokens.COMMENT)
        ))
        if (tree) {
            // console.log(tree)
            compiler.throwError = onError.bind(this)
            // Compile (Abstract Syntax Tree --> list of ProcessorBlock)
            var processorBlocks = compiler.recompile(tree)
            if (processorBlocks) {
                // console.log(processorBlocks)
                blocksView.setBlocks(processorBlocks)
            }
        }
        // console.log(newTokens)

        /*console.log(tokens.map(token => {
            if (token.type === "newline") return "\n"
            return token.toString()
        }).join(", "), tokens)*/
        // console.log(lexer.tokenText.toString())
        lexer.text.reset()
        lexer.tokenText.reset()
        var currentSpan = undefined
        var currentToken = undefined
        var currentTokenIndex = 0
        var tokensFiltered = tokens.filter(a => !(a instanceof MindustryTokens.TAB || a instanceof MindustryTokens.NEWLINE))
        this.editorElements.code.innerHTML = ""
        var srcText, cmd, property, value, style, skipText = ""
        while (!lexer.text.almostDone && !lexer.tokenText.almostDone) {
            srcText = lexer.text.next
            cmd = lexer.tokenText.next
            if (skipText) {
                if (cmd !== "*" || srcText === "\n" || srcText === "\t") {
                    var span = document.createElement("span")
                    span.innerHTML = skipText.replaceAll("<", "&lt;")
                    this.editorElements.code.appendChild(span)
                    skipText = ""
                }
            }
            switch (cmd) {
                case "+":
                    currentToken = tokensFiltered[currentTokenIndex++]
                    currentSpan = document.createElement(currentToken?.type === "comment" ? "pre" : "span")
                    if (currentToken.type === "comment") {
                        lexer.text.undo(2)
                        if (lexer.text.next !== "\n") currentSpan.style.display = "inline"
                        lexer.text.next
                    }
                    if (currentToken?.style) {
                        style = currentToken.style
                        var i = 1
                        while (style === "copy") {
                            style = tokensFiltered[currentTokenIndex - i]?.style
                            i++
                        }
                        if (style) for ([property, value] of Object.entries(style)) currentSpan.style.setProperty(property, value)
                    }
                    if (currentToken?.subtypeStyle) {
                        var subtypeStyle = currentToken.subtypeStyle[currentToken.subtype] || currentToken.subtypeStyle["*"]
                        for (var [subtypeProperty, subtypeValue] of Object.entries(subtypeStyle)) currentSpan.style.setProperty(subtypeProperty, subtypeValue)
                    }
                    this.editorElements.code.appendChild(currentSpan)
                case "=": // Don't add break up there!!!
                    if (currentSpan) {
                        if (currentToken?.type === "comment") {
                            currentSpan.innerHTML += srcText.replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")
                        } else currentSpan.innerHTML += srcText.replaceAll("<", "&lt;")
                    }
                    break
                case "*":
                    // console.log(srcText === "\n" || srcText === "\t", srcText, tokensFiltered[currentTokenIndex])
                    if (srcText === "\n") {
                        if (currentToken?.type === "comment" && currentSpan?.style?.display !== "inline") break
                        this.editorElements.code.appendChild(document.createElement("br"))
                        break
                    }
                    currentSpan = undefined
                    currentToken = undefined
                    if (srcText === "\t") {
                        this.editorElements.code.appendChild(document.createElement("tab"))
                        break
                    } else if (srcText === " ") srcText = "&nbsp;"
                    skipText += srcText
                    break
                default:
                    throw new Error(`Command ${cmd} not recognized!`)
            }
            // console.log(cmd, `'${srcText}'`, currentToken)
            // console.log(`${cmd} '${srcText}'`, currentSpan, currentToken)
            this.editorElements.code.style.removeProperty("color")
        }
    } catch (e) {
        if (e?.name) {
            if (e?.token) try {
                onError.bind(this)(e, e.token)
            } catch {
            }
            else {
                console.warn(e)
                blocksContainerError(e)
                this.editorElements.code.style.color = "red"
                this.editorElements.code.innerHTML = `<pre style="margin-top: 0">${this.editorElements.input.value.replaceAll("<", "&lt;").replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")}</pre>`
            }
        }
    }
}, function (code, color = "blue") {
    this.editorElements.code.innerHTML = `<pre style="margin-top: 0">${code.replaceAll("<", "&lt;").replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")}</pre>`
    this.editorElements.code.style.color = color
})
document.body.classList.add("split-screen")
var editor = highlighter.getEditor()
editor.classList.add("left")
document.body.appendChild(editor)
// TODO load from /examples/examples.json
var codeExamples = [
    `## First code example, should cover most of MPPL capabilities
a = rand 9
c = 0 ## Default value
@counter = 7
if (a > 8){
\ta = 8
\tb = rand 9
\tc = a max b
}
d = getlink(c)
e = @maxItems of d

result = read(cell1, 0)
##draw.clear() = read(cell1, 0) ## Temporary
write(cell1, 0, result)
draw.clear(0, 0, 0)
draw.color(0, 0, 0, 255)
draw.col(0)
f = 0xff
draw.col(0c00ff00ff) ## %RRGGBBAA (hexadecimal)
draw.stroke(0)
draw.line(0, 0, 0, 0)
draw.rect(0, 0, 0, 0)
draw.lineRect(0, 0, 0, 0)
draw.poly(0, 0, 0, 0, 0)
draw.linePoly(0, 0, 0, 0, 0)
draw.triangle(0, 0, 0, 0, 0, 0)
draw.image(0, 0, @copper, 32, 0)
print("Hello world")

drawflush(display1)
printflush(message1)
result = getlink(0)
control.enabled(block1, 0)
control.shoot(block1, 0, 0, 0)
control.shootp(block1, 0, 0)
control.config(block1, 0)
control.color(block1, 0)
result = radar(turret1, enemy, any, any, 1, distance)
result = @copper of block1

result = 0
result = a + b
result = lookup.block(0)
result = lookup.unit(0)
result = lookup.item(0)
result = lookup.liquid(0)
result = packcolor(0, 0, 0, 1)

wait(0.5)
stop()
end()
jump(5, x == false)
jump(5, x not false)
jump(5, x < false)
jump(5, x <= false)
jump(5, x > false)
jump(5, x >= false)
jump(5, x === false)
jump(5)

ubind(@poly)
ucontrol.idle()
ucontrol.stop()
ucontrol.move(0, 0)
ucontrol.approach(0, 0, 5)
ucontrol.boost(0)
ucontrol.target(0, 0, 0)
ucontrol.targetp(0, 0)
ucontrol.itemDrop(0, 0)
ucontrol.itemTake(0, 0, 0)
ucontrol.payDrop()
ucontrol.payTake(0)
ucontrol.payEnter()
## dropped = ucontrol.payEnterIfIn(<radius>, <x>, <y>) - Suggested by [UR] TyT|xexebe#1178
dropped = ucontrol.payEnterIfIn(5, a, b)
ucontrol.mine(0, 0)
ucontrol.flag(0)
ucontrol.build(0, 0, @copper-wall, 0, 0)
type, building, floor = ucontrol.getBlock(0, 0)
result = ucontrol.within(0, 0, 0)
ucontrol.unbind()
result = uradar(enemy, any, any, distance)
outX, outY, found = ulocate.ore(@copper)
outX, outY, found, building = ulocate.building(core, true)
outX, outY, found, building = ulocate.spawn()
outX, outY, found, building = ulocate.damaged()`,
    `a = 8 + 7
#*AST should be:
        SET
      /     \\
     a      ADD (OPERATION:ADD)
           /   \\
          8     7
*#`,
    `a = 8 xor (7 + 3)
#*AST should be:
        SET
      /     \\
     a      XOR (OPERATION:XOR)
           /   \\
          8     ADD (OPERATION:ADD)
               /   \\
              7     3
*#`,
    `8 xor (7 + 3)
#*AST should be:
  XOR (OPERATION:XOR)
       /   \\
      8     ADD (OPERATION:ADD)
           /   \\
          7     3
*#`,
    `a = 8 + a(4)`,
    `if (8 < 1){
\ta()
}
else {
\tb()
}`,
    `i = 0
while (i < 100){
\tucontrol.approach(@thisx, (@thisy + 2), 5)
\ti = i + 1
}`,
    `function sqr(a){
\treturn a * a
}
## TODO Don't need to store result in var if func is void
a = control.config(sorter1, lookup.block(sqr(3)))`,
    `i = 0
y = @thisy + 2
while (i < 100){
\tucontrol.approach(@thisx, y, 5)
\tif (ucontrol.within(@thisx, y, 10) == 1){
\t\tbreak
\t}
\ti = i + 1
}`,
    `control.enabled(press1, 0)`,
    `outX, outY, found = ulocate.ore(@copper)`,
    `a = rand 9
b = 6 max a
c = a max b`,
    `result = read(cell1, 0)\nwrite(cell1, 0, result)`,
    `a = 9\n## Test\na = read(cell1, 0) ## Reads cell1`,
    `##Test of multiline\na = 9\n#* Test\nTest1*#\na = read(cell1, 0) #*Reads cell1\netc.*#`,
    `##Fails, because floor is operator - fixed\noutX, outY, found, building = ulocate.damaged()\ntype, building, floor = ucontrol.getBlock(0, 0)`,
    `result = a()\nb()`,
    "a = 8 + 7 * 3 % (@j of @k)",
    "a = 0caabbccdd",
    "## Store a and b into c\na = 123 ## 8 bits (0 - 255)\nb = 231 ## 8 bits\nc = a << 8 + b\nwrite(cell1, 0, c)\n\n## Back\nc = read(cell1, 0)\nb = c b-and 0xFF\na = (c >> 8) b-and 0xFF",
    "if (a not 8 + 6){\n\ta = 8\n}\nelse {\n\ta = rand 100\n}",
    "target = @titanium\nwhile (a < @itemsCount){\n\tcmp = lookup.item(a)\n\tif (cmp == target) {\n\t\tbreak\n\t}\n\ta = a + 1\n}",
    "cmp = lookup.item(a)\nif (cmp == target) {\n\ta = 7\n}\nelse {\n\ta = rand 92\n}\nb = 72 max a"
]
highlighter.editorElements.input.value = codeExamples[0]
var blocksViewContainer = blocksView.getContainer()
blocksViewContainer.classList.add("right")
blocksViewContainer.style.height = "calc(100vh - 21px)"
blocksViewContainer.style.width = "calc(50vw - 20px)"
document.body.appendChild(blocksViewContainer)

var clearDiv = document.createElement("div")
clearDiv.classList.add("clear")
document.body.appendChild(clearDiv)

highlighter.onInput()
highlighter.onKeyUp()
/*
read result cell1 0
op add result result 1
write result cell1 0
*/
/*blocksView.setBlocks([
    new ProcessorTokens.SET(["i", "0"]),
    new ProcessorTokens.READ(["result", "cell1", "0"]),
    new ProcessorTokens.PRINT(['"Result: "']),
    new ProcessorTokens.PRINT(["result"]),
    new ProcessorTokens.PRINT_FLUSH(["message1"]),
    new ProcessorTokens.OPERATION(["add", "result", "result", "1"]),
    new ProcessorTokens.WRITE(["result", "cell1", "0"]),
    new ProcessorTokens.OPERATION(["add", "i", "i", "1"]),
    new ProcessorTokens.JUMP(["1", "lessThan", "i", "10"])
])*/
