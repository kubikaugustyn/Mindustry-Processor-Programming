var __author__ = "kubik.augustyn@post.cz"

var highlighter = new SyntaxHighlighter("Mindustry", function () {
    // this.editorElements.code.innerHTML = this.editorElements.input.value.replaceAll("\n", "<br>").replaceAll("\t", "<tab></tab>")
    // this.editorElements.code.style.color = "blue"

    try {
        var lexer = new MindustryLexer(this.editorElements.input.value)
        var tokensGenerator = lexer.generateTokens()
        var tokens = []
        for (let token of tokensGenerator) tokens.push(token)
        console.log(tokens.map(token => {
            if (token.type === "newline") return "\n"
            return token.toString()
        }).join(", "), tokens)
        console.log(lexer.tokenText.toString())
        lexer.text.reset()
        lexer.tokenText.reset()
        var currentSpan = undefined
        var currentToken = undefined
        var tokensCopy = tokens.filter(a => !(a instanceof MindustryTokens.TAB || a instanceof MindustryTokens.NEWLINE))
        this.editorElements.code.innerHTML = ""
        while (!lexer.text.almostDone && !lexer.tokenText.almostDone) {
            var srcText = lexer.text.next
            var cmd = lexer.tokenText.next
            switch (cmd) {
                case "+":
                    currentToken = tokensCopy.shift()
                    currentSpan = document.createElement("span")
                    if (currentToken.style) for (var [property, value] of Object.entries(currentToken.style)) currentSpan.style.setProperty(property, value)
                    this.editorElements.code.appendChild(currentSpan)
                case "=": // Don't add break up there!!!
                    if (currentSpan) currentSpan.innerHTML += srcText
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
            console.log(`${cmd} '${srcText}'`, currentSpan, currentToken)
        }
    } catch (e) {
        console.warn(e)
        this.editorElements.code.style.color = "red"
    }
})
var editor = highlighter.getEditor()
document.body.appendChild(editor)
editor.style.height = "300px"
highlighter.editorElements.input.value = `a = rand 9
if (a > 8){
\ta = 8
\tb = rand 9
\tc = a max b
}
d = link c
e = @maxItems of d`
highlighter.highlightSyntax()
