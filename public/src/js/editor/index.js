var __author__ = "kubik.augustyn@post.cz"

var loadSaver = new LoadSaver()
var blocksView = new ProcessorBlocksView()
var lexer = new MindustryLexer()
var parser = new MindustryParser()
var compiler = new MindustryCompiler()

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

var highlighter = new SyntaxHighlighter("Mindustry", function (code) {
    // The use of this.editorElements.input.value was removed
    // this.editorElements.code.innerHTML = sanitizeCode(code)
    // this.editorElements.code.style.color = "blue"

    function onError(msg, token, src) {
        //console.warn("onError", ...arguments)
        if (src instanceof Parser && src.quietError) {
            // console.log("Quiet error at line #", token?.lineNum + 1)
            // this.rawSyntax(code, "magenta")
            throw false
        }
        var blocksMsg = msg
        if (token?.range) {
            var nlRegex = /\r\n|\r|\n/g
            var codeTillToken = code.slice(0, token.range.from)
            var lineNo = codeTillToken.split(nlRegex).length + 1
            var lastIndex = -1
            while (nlRegex.test(codeTillToken)) lastIndex = nlRegex.lastIndex
            var charOnLine = token.range.from - lastIndex
            blocksMsg += `\nAt line ${lineNo}, character ${charOnLine}`
        } else if (token?.lineNum) {
            blocksMsg += `\nAt line ${token.lineNum + 1}`
        }
        blocksContainerError(blocksMsg)
        console.warn("Error:", msg, "at token", token)

        this.editorElements.code.style.color = "red"
        var errorTokenStyle = "color: blue; text-decoration: underline; text-decoration-style: wavy; text-decoration-color: red"
        if (typeof token?.range !== "undefined") {
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
        var tree = parser.reparse(tokens.filter(token =>
            !(token instanceof MindustryTokens.TAB || token instanceof MindustryTokens.COMMENT)
        ))
        console.log(tree)
        if (tree) {
            // console.log(tree)
            /*compiler.throwError = onError.bind(this)
            compiler.warning = onWarning.bind(this)
            // Compile (Abstract Syntax Tree --> list of ProcessorBlock)
            var processorBlocks = compiler.recompile(tree)
            if (processorBlocks) {
                //console.log(MindustryCompiler.addedVarsCache, MindustryCompiler.addedFuncsCache)
                // console.log(processorBlocks)
                blocksView.setBlocks(processorBlocks)
            }*/
            tree.setFree()
        }
        /*console.log(tokens.map(token => {
            return `${token.type}: ${token.range.from} - ${token.range.to} - '${token.content || ''}' - '${code.slice(token.range.from, token.range.to)}'`
        }).join("\n"))*/
        blocksView.render() // TODO Remove when compilation is added

        /*console.log(tokens.map(token => {
            if (token.type === "newline") return "\n"
            return token.toString()
        }).join(", "), tokens)*/
        // console.log(lexer.tokenText.toString())
        lexer.text.reset()
        // var currentSpan = undefined
        // var currentToken = undefined
        // var currentTokenIndex = 0
        // var tokensFiltered = tokens.filter(a => !(a instanceof MindustryTokens.TAB || a instanceof MindustryTokens.NEWLINE))
        this.editorElements.code.innerHTML = ""//`<pre style="margin-top: 0"></pre>`
        this.editorElements.code.style.removeProperty("color")
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
                nonTokenSpan.innerHTML = sanitizeCode(code.slice(position, position + moveBy)).replaceAll(/\r\n|\r|\n/g, "<br>")
                this.editorElements.code.appendChild(nonTokenSpan)
            }
            position += moveBy
            if (token) {
                if (position !== token.range.from) throw new Error("Severe position mismatch error when syntax highlighting")
                var tokenSpan = document.createElement("span")
                tokenSpan.innerHTML = sanitizeCode(code.slice(token.range.from, token.range.to)).replaceAll(/\r\n|\r|\n/g, "<br>")

                if (token.style) {
                    var style = token.style
                    var i = 2
                    while (style === "copy") {
                        style = tokens[tokenIndex - i]?.style
                        i++
                    }
                    if (style) for (var [property, value] of Object.entries(style))
                        tokenSpan.style.setProperty(property, value)
                }
                if (token.subtypeStyle) {
                    var subtypeStyle = token.subtypeStyle[token.subtype] || token.subtypeStyle["*"]
                    for (var [subtypeProperty, subtypeValue] of Object.entries(subtypeStyle))
                        tokenSpan.style.setProperty(subtypeProperty, subtypeValue)
                }

                this.editorElements.code.appendChild(tokenSpan)
                position = token.range.to
            }
            loopI++
            if (loopI >= 10_000) throw new Error("Infinite loop detected when syntax highlighting")
        }
        // var srcText, cmd, property, value, style, skipText = ""
        /*while (!lexer.text.almostDone && !lexer.tokenText.almostDone) {
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
                    `break`
                default:
                    throw new Error(`Command ${cmd} not recognized!`)
            }
            // console.log(cmd, `'${srcText}'`, currentToken)
            // console.log(`${cmd} '${srcText}'`, currentSpan, currentToken)
            this.editorElements.code.style.removeProperty("color")
        }*/
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
document.body.classList.add("split-screen")
var editor = highlighter.getEditor()
editor.classList.add("left")
loadSaver.setHighlighter(highlighter)
editor.insertBefore(loadSaver.getContainer(), editor.firstChild)
document.body.appendChild(editor)
// TODO make it load in the UI
var codeExamples = [];
(function () {
    var DEBUG = true;
    var rootURL = document.location.origin + document.location.pathname
    fetch(rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.length - 2)) + "/src/js/editor/examples/examples.json").then(a => a.json()).then(examplesJson => {
        var examples = examplesJson.examples || []
        if (DEBUG) examplesJson.debug_examples?.forEach(a => examples.push(a))
        codeExamples = examples;
    }).catch(e => console.error(e))
})()
highlighter.editorElements.input.value = localStorage.getItem("editor_code") || ""
// Show a sample script
if (!highlighter.editorElements.input.value) highlighter.editorElements.input.value = `#######################\n## Declare variables ##\n#######################\n## A constant variable of type NUMBER\nconst NUMBER a = a() + 8 + 3 angle-diff 9\n## Multiple mutable variables of type STRING\nSTRING b = "hello world", c = '*multiline*'\n## The color syntax is intuitive\nCOLOR d = 0caabbccdd\n## Wrong colors get highlighted\nCOLOR e = 0cabc\n## Now the pointer hell: this is a pointer to an ITEM\n*ITEM ptr = @titanium ## itemPointer 'called' at compilation\n## Dereference the pointer to an item\nITEM item = &ptr\n## Create a reference to the item once again\n*ITEM backPtr = itemPointer(item)\n## Get the arguments of a block\nNUMBER size = @size of 8\n## A more English approach\nNUMBER items = @items in 8\n\n#########################\n## Other functionality ##\n#########################\n## Declare functions\nfunction ahoj(NUMBER param1, param2; STRING err){\n\tif (param1  < 5) raiseToDefineMethod(err)\n\treturn 69 * param1 + param2\n}\n## Call functions like so:\ninit(arg1, 8, true, arg4)\n\n## Switch statement\nswitch (a) {\n\tcase 0:\n\t\tprint("Got 0")\n\tcase 1:\n\t\tprint("Got 1")\n\tdefault:\n\t\tprint("Got something else")\n}\n\n## This while loop\nNUMBER a = 0\nwhile (a < 8) {\n\tdoSomething()\n\ta = a + 1\n}\n## Is the equivalent of this one\nNUMBER a = 0\ndo {\n\tdoSomething()\n\ta = a + 1\n} while (a < 8)\n## Which can be further simplified to this:\nfor (NUMBER a = 0; a < 8; a = a + 1){\n\tdoSomething()\n}\n## Some iteration manipulation\nNUMBER a = 0\nwhile (true) {\n\tif (a >= 8) break\n\telse if (a == 3) continue\n\tdoSomething()\n\ta = a + 1\n}\n\n## As you have seen, flow control is simple\nif (a > 2) a = 2\nelse if (a < 0 - 2) a = 0 - 2\nelse a = rand a`
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
