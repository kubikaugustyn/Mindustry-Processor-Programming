var __author__ = "kubik.augustyn@post.cz"

var highlighter = new SyntaxHighlighter(SyntaxHighlighter.LANG_MINDUSTRY)
var editor = highlighter.getEditor()
document.body.appendChild(editor)
editor.style.height = "300px"
highlighter.highlightSyntax()
