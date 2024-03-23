var __author__ = "kubik.augustyn@post.cz"

var loadSaver = new LoadSaver()
var blocksView = new ProcessorBlocksView()
var lexer = new MindustryLexer()
var parser = new MindustryParser()
var compiler = new MindustryCompiler()
var DEBUG_OPTIONS = {LEX: true, PARSE: true, COMPILE: true}

function blocksContainerError(msg) {
    /*blocksView.getBlocksContainer().style.color = "red"
    blocksView.getBlocksContainer().innerHTML = msg*/
    if (msg instanceof Error) {
        // console.log("Error...", msg.name, msg.cause, msg.stack, msg.message)
        /*ProcessorBlocksView.DEBUG_LOG = true
        blocksView.copyToClipboard(msg.stack)
        ProcessorBlocksView.DEBUG_LOG = false*/
        msg = msg.stack || msg.name + msg.message
    }
    // console.log(msg)
    blocksView.addErrors(false, msg.replaceAll("<", "&lt;").replaceAll("    ", "<tab></tab>").replaceAll("\n", "<br>"))
    blocksView.setBlocks([])
}

function sanitizeCode(code) {
    return code.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\t", "<tab></tab>").replaceAll(MindustryLexer.TAB, "<tab></tab>")
}

function prepareCodeForRender(code) {
    return sanitizeCode(code).replaceAll(/\r\n|\r|\n/g, "<br>").replaceAll(" ", "&nbsp;")
}

function highlightCode(targetElement, code, tokens, errorToken) {
    targetElement.innerHTML = ""//`<pre style="margin-top: 0"></pre>`
    targetElement.style.removeProperty("color")
    var foundErrorToken = !errorToken
    var position = 0
    var tokenIndex = 0
    /**
     * @type {Token|undefined}
     */
    var token
    var loopI = 0
    while (position < code.length) {
        var moveBy = 0
        if (tokenIndex >= tokens.length) token = undefined
        while (tokenIndex < tokens.length) {
            token = tokens[tokenIndex]
            moveBy = token.range.from - position

            if (!tokens[tokenIndex].range) {
                tokenIndex++
                if (tokenIndex >= tokens.length) {
                    token = undefined
                    break
                }
            } else {
                tokenIndex++
                break
            }
        }
        if (!token) moveBy = code.length - position

        if (moveBy > 0) {
            var nonTokenSpan = document.createElement("span")
            nonTokenSpan.innerHTML = prepareCodeForRender(code.slice(position, position + moveBy))
            targetElement.appendChild(nonTokenSpan)
        }
        position += moveBy
        if (token) {
            if (position !== token.range.from) throw new Error("Severe position mismatch error when syntax highlighting")
            var tokenSpan = document.createElement("span")
            tokenSpan.innerHTML = prepareCodeForRender(code.slice(token.range.from, token.range.to))

            var title = undefined
            if (token.style) {
                var style = token.style
                var i = 2
                while (style === "copy") {
                    style = tokens[tokenIndex - i]?.style
                    i++
                }
                if (style) for (var [property, value] of Object.entries(style)) {
                    if (property === "title") {
                        title = value
                        continue
                    } else if (errorToken && property.startsWith("text-decoration")) continue
                    tokenSpan.style.setProperty(property, value)
                }
            }
            if (token.subtypeStyle) {
                var subtypeStyle = token.subtypeStyle[token.subtype] || token.subtypeStyle["*"]
                for (var [subtypeProperty, subtypeValue] of Object.entries(subtypeStyle)) {
                    if (subtypeProperty === "title") {
                        title = subtypeValue
                        continue
                    } else if (errorToken && subtypeProperty.startsWith("text-decoration")) continue
                    tokenSpan.style.setProperty(subtypeProperty, subtypeValue)
                }
            }
            if (errorToken && /*!(errorToken instanceof Token) &&*/ token.lineNum === errorToken?.lineNum) {
                foundErrorToken = true
                tokenSpan.style.textDecoration = "underline"
                tokenSpan.style.textDecorationStyle = "wavy"
                tokenSpan.style.textDecorationColor = "orange"
            }
            if (token === errorToken) {
                foundErrorToken = true
                if (["newline", "tab"].includes(token.type)) return false
                tokenSpan.style.textDecoration = "underline"
                tokenSpan.style.textDecorationStyle = "wavy"
                tokenSpan.style.textDecorationColor = "red"
                tokenSpan.style.color = "blue"
            }
            if (title) tokenSpan.title = title
            // TODO Show the title on hover (not have it obstructed by the textarea)

            targetElement.appendChild(tokenSpan)
            position = token.range.to
        }
        loopI++
        if (loopI >= 10_000) throw new Error("Infinite loop detected when syntax highlighting")
    }
    return foundErrorToken
}

/**
 * @param targetTitleElement {HTMLElement}
 * @param sourcePoolElement {HTMLElement}
 */
function seeTitleTrough(targetTitleElement, sourcePoolElement) {
    targetTitleElement.addEventListener("mousemove", ev => {
        // console.log(ev.clientX, ev.clientY)
        var found = false
        for (var child of sourcePoolElement.children) {
            var title = child.getAttribute("title")
            if (!title) continue
            var bbox = child.getBoundingClientRect()
            if (bbox.left > ev.clientX || bbox.right < ev.clientX) continue
            if (bbox.top > ev.clientY || bbox.bottom < ev.clientY) continue
            targetTitleElement.setAttribute("title", title)
            // console.log("Found title:", title)
            found = true
            break
        }
        if (!found) targetTitleElement.removeAttribute("title")
    })
}

var highlighter = new SyntaxHighlighter("Mindustry", function (code) {
    // The use of this.editorElements.input.value was removed
    // this.editorElements.code.innerHTML = sanitizeCode(code)
    // this.editorElements.code.style.color = "blue"
    blocksView.clearErrors(false)
    blocksView.clearWarnings(true)

    if (!DEBUG_OPTIONS.LEX) {
        this.editorElements.code.innerHTML = prepareCodeForRender(code)
        this.editorElements.code.style.color = "black"
        return
    }
    if (/*!DEBUG_OPTIONS.PARSE || !DEBUG_OPTIONS.COMPILE && */!MindustryCompiler.DEFAULT_CONSTANTS.length) {
        compiler.createConstants()
        ProcessorTypes.reloadAll()
    }

    function onError(msg, token, src) {
        //console.warn("onError", ...arguments)
        if (src instanceof Parser && src.quietError) {
            // console.log("Quiet error at line #", token?.lineNum + 1)
            // this.rawSyntax(code, "magenta")
            throw false
        }
        if (token instanceof Parser.ASTNode) token = token.sourceToken // Extract the token of a node
        var blocksMsg = msg
        if (typeof token?.range !== "undefined") {
            var nlRegex = /\r\n|\r|\n/g
            var codeTillToken = code.slice(0, token.range.from)
            var lineNo = codeTillToken.split(nlRegex).length
            var lastIndex = -1
            while (nlRegex.test(codeTillToken)) lastIndex = nlRegex.lastIndex
            var charOnLine = token.range.from - lastIndex
            blocksMsg += `\nAt line ${lineNo}, character ${charOnLine}`
        } else if (typeof token?.lineNum !== "undefined") {
            blocksMsg += `\nAt line ${token.lineNum + 1}`
        }
        blocksContainerError(blocksMsg)
        console.warn("Error:", msg, "at token", token)

        var highlightSuccessful = false
        if (token) highlightSuccessful = highlightCode(this.editorElements.code, code, tokens, token)
        if (!highlightSuccessful) {
            this.editorElements.code.style.color = "red"
            var errorTokenStyle = "color: blue; text-decoration: underline; text-decoration-style: wavy; text-decoration-color: red"
            if (typeof token?.range !== "undefined" && token.type !== "newline") {
                // Show the exact error token
                var safeCode = codePart => sanitizeCode(codePart).replaceAll(/\r\n|\r|\n/g, "<br>")
                this.editorElements.code.innerHTML = `${safeCode(code.slice(0, token.range.from))}`
                this.editorElements.code.innerHTML += `<span style="${errorTokenStyle}">${safeCode(code.slice(token.range.from, token.range.to))}</span>`
                this.editorElements.code.innerHTML += `${safeCode(code.slice(token.range.to))}`
            } else {
                // Show the token error line
                var lines = sanitizeCode(code).split(/\r\n|\r|\n/)
                if (typeof token?.lineNum === "undefined" || token?.lineNum >= lines.length) throw true
                // console.log("ERROR", msg, token.lineNum, token, this)
                this.editorElements.code.innerHTML = `<pre style="margin: 0">${lines.slice(0, token.lineNum).map(a => a || " ").join("<br>")}</pre>`
                this.editorElements.code.innerHTML += `<pre style="margin: 0; ${errorTokenStyle}">${lines[token.lineNum]}</pre>`
                this.editorElements.code.innerHTML += `<pre style="margin: 0">${lines.slice(token.lineNum + 1).map(a => a || " ").join("<br>")}</pre>`
            }
        }
        throw false
    }

    function onWarning(msg, token, src) {
        blocksView.addWarnings(false, sanitizeCode(msg))
    }

    try {
        var tokensGenerator = lexer.regenerateTokens(code)
        /**
         * @type {Token[]}
         */
        var tokens = []
        for (let token of tokensGenerator) {
            // console.log("Got token:", token)
            tokens.push(token)
        }

        // Will load the constants before compiler is implemented
        if (!MindustryCompiler.DEFAULT_CONSTANTS.length) new MindustryCompiler().createConstants()

        console.log(tokens)
        parser.throwError = onError.bind(this)
        // Parse (generate Abstract Syntax Tree)
        /**
         * @type {Parser.AST}
         */
        var tree = DEBUG_OPTIONS.PARSE ? parser.reparse(tokens.filter(token =>
            !(token instanceof MindustryTokens.TAB || token instanceof MindustryTokens.COMMENT)
        )) : undefined
        console.log(tree)
        if (tree) {
            compiler.throwError = onError.bind(this)
            compiler.warning = onWarning.bind(this)
            compiler.rootScope = parser.ctx.scope
            // Compile (Abstract Syntax Tree --> list of ProcessorBlock)
            var processorBlocks = DEBUG_OPTIONS.COMPILE ? compiler.recompile(tree) : undefined
            if (processorBlocks) {
                //console.log(MindustryCompiler.addedVarsCache, MindustryCompiler.addedFuncsCache)
                // console.log(processorBlocks)
                blocksView.setBlocks(processorBlocks)
            }
            tree.setFree()
        } else blocksView.setBlocks([])
        /*console.log(tokens.map(token => {
            return `${token.type}: ${token.range.from} - ${token.range.to} - '${token.content || ''}' - '${code.slice(token.range.from, token.range.to)}'`
        }).join("\n"))*/

        /*console.log(tokens.map(token => {
            if (token.type === "newline") return "\n"
            return token.toString()
        }).join(", "), tokens)*/
        // console.log(lexer.tokenText.toString())
        highlightCode(this.editorElements.code, code, tokens)
    } catch (e) {
        if (e?.name) {
            if (e?.token) try {
                console.log("Throw")
                onError.bind(this)(e, e.token)
            } catch {
            }
            else {
                console.warn(e)
                blocksContainerError(e)
                this.editorElements.code.style.color = "red"
                this.editorElements.code.innerHTML = `<pre style="margin-top: 0">${sanitizeCode(code)}</pre>`
            }
        }
    }
}, function (code, color = "blue") {
    this.editorElements.code.innerHTML = `<pre style="margin-top: 0">${sanitizeCode(code)}</pre>`
    this.editorElements.code.style.color = color
    blocksView.clearWarnings()
    blocksView.clearErrors()
}, function (cursor, currentPhrase) {
    return new Map()
    // TODO Return the autocompleter

    // console.warn("Get matches at", cursor.start, currentPhrase)
    var matches = new Map([
        //...Array.from(new ProcessorTypes.BUILDING().properties.entries()).map(a => ["@" + a[0], a[1].toLowerCase().replaceAll("_", " ").replaceAll("|", " OR ")]),
        ...MindustryCompiler.addedVarsCache.map(a => [a, "Variable"]),
        ...MindustryCompiler.addedFuncsCache.map(a => [a, "Function"]),
        ...Array.from(MindustryCompiler.libFunctions.entries()).map(([name, sig]) => [`${Object.keys(sig.returns).length ? Object.keys(sig.returns).join(", ").concat(" = ") : ""}${name}(${Object.keys(sig.arguments).join(", ")})`, "Lib Function"]),
        ...MindustryCompiler.DEFAULT_CONSTANTS.map(a => [a.name, /*typeof a.val !== "undefined" ? a.val : (*/a.type ? a.type.name.toLowerCase().replaceAll("_", " ") : "constant"/*)*/])
    ])
    /*matches.set("Apple", "fruit")
    matches.set("Pine", "other")
    matches.set("Carrot", "vegetable")
    matches.set("Pineapple", "fruit")*/
    if (!currentPhrase) return matches
    // console.log(matches.entries())
    for (var key of matches.keys()) if (!key.toLowerCase().includes(currentPhrase.toLowerCase()) || key === currentPhrase) matches.delete(key)
    return matches
})
seeTitleTrough(highlighter.editorElements.input, highlighter.editorElements.code)
document.body.classList.add("split-screen")
var editor = highlighter.getEditor()
editor.classList.add("left")
loadSaver.setHighlighter(highlighter)
editor.insertBefore(loadSaver.getContainer(), editor.firstChild)
document.body.appendChild(editor)
// TODO make it load in the UI
var codeExamples = []
var rootURL = document.location.origin + document.location.pathname;
(function () {
    var DEBUG = true;
    fetch(rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.lastIndexOf('/') - 1)) + "/src/js/editor/examples/examples.json").then(a => a.json()).then(examplesJson => {
        var examples = examplesJson.examples || []
        if (DEBUG) examplesJson.debug_examples?.forEach(a => examples.push(a))
        codeExamples = examples;

        if (!highlighter.editorElements.input.value) showSampleScript()
    }).catch(e => console.error(e))
})()
highlighter.editorElements.input.value = localStorage.getItem("editor_code") || ""

// Show a sample script
function showSampleScript() {
    var url = rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.lastIndexOf('/') - 1)) + "/src/js/editor/examples/" + codeExamples[0].path
    fetch(url).then(a => a.text()).then(text => {
        if (highlighter.editorElements.input.value) return
        highlighter.editorElements.input.value = text
        highlighter.onInput()
        highlighter.onKeyUp()
    }).catch(e => console.error(e))
}

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
