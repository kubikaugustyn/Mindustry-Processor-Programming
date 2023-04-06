var __author__ = "kubik.augustyn@post.cz"

var highlighter = new SyntaxHighlighter("Mindustry", function () {
    // this.editorElements.code.innerHTML = this.editorElements.input.value.replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")
    // this.editorElements.code.style.color = "blue"

    try {
        var lexer = new MindustryLexer(this.editorElements.input.value)
        var tokensGenerator = lexer.generateTokens()
        var tokens = []
        for (let token of tokensGenerator) tokens.push(token)

        var parser = new MindustryParser(tokens)
        var [newTokens, tree] = parser.parse()
        if (tree) {
            console.log(tree)
        }
        console.log(newTokens)
        tokens = newTokens

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
        var srcText, cmd, property, value, style
        while (!lexer.text.almostDone && !lexer.tokenText.almostDone) {
            srcText = lexer.text.next
            cmd = lexer.tokenText.next
            switch (cmd) {
                case "+":
                    currentToken = tokensFiltered[currentTokenIndex++]
                    currentSpan = document.createElement("span")
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
                        if (currentToken.type === "comment") {
                            currentSpan.innerHTML += srcText.replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")
                        } else currentSpan.innerHTML += srcText
                    }
                    break
                case "*":
                    currentSpan = undefined
                    currentToken = undefined
                    if (srcText === "\n") {
                        this.editorElements.code.appendChild(document.createElement("br"))
                        break
                    } else if (srcText === "\t") {
                        this.editorElements.code.appendChild(document.createElement("tab"))
                        break
                    }
                    var span = document.createElement("span")
                    span.innerHTML = srcText
                    this.editorElements.code.appendChild(span)
                    break
                default:
                    throw new Error(`Command ${cmd} not recognized!`)
            }
            // console.log(`${cmd} '${srcText}'`, currentSpan, currentToken)
            this.editorElements.code.style.removeProperty("color")
        }
    } catch (e) {
        console.warn(e)
        this.editorElements.code.style.color = "red"
        this.editorElements.code.innerHTML = this.editorElements.input.value.replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")
    }
})
var editor = highlighter.getEditor()
document.body.appendChild(editor)
editor.style.height = "300px"
highlighter.editorElements.input.value = `a = rand 9
c = 0 ## Default value
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
#*draw.col(0)
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
outX, outY, found, building = ulocate.damaged()*#`
highlighter.highlightSyntax()
