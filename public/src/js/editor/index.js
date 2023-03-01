var __author__ = "kubik.augustyn@post.cz"

var highlighter = new SyntaxHighlighter("Mindustry", function () {
    this.editorElements.code.innerHTML = this.editorElements.input.value.replaceAll("\n", "<br>")
    this.editorElements.code.style.color = "blue"

    try {
        var lexer = new MindustryLexer(this.editorElements.input.value)
        var tokensGenerator = lexer.generateTokens()
        var tokens = []
        for (let token of tokensGenerator) tokens.push(token)
        console.log(tokens.map(token => {
            if (token.type === "newline") return "\n"
            return token.toString()
        }).join(", "), tokens)
    } catch (e) {
        console.warn(e)
        this.editorElements.code.style.color = "red"
    }
})
var editor = highlighter.getEditor()
document.body.appendChild(editor)
editor.style.height = "300px"
highlighter.highlightSyntax()
