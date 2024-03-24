var __author__ = "kubik.augustyn@post.cz"

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

/**
 * @param container {HTMLDivElement}
 * @param code {string}
 */
function createMPPL(container, code) {
    var cont = document.createElement("div")
    cont.style = "border: 1px solid black; width: fit-content; padding: 5px"
    try {
        var tokensGenerator = lexer.regenerateTokens(code)
        /**
         * @type {Token[]}
         */
        var tokens = Array.from(tokensGenerator)
        MindustryCompiler.createConstants()
        parser.reparse(tokens.filter(token =>
            !(token instanceof MindustryTokens.TAB || token instanceof MindustryTokens.COMMENT)
        ))
        highlightCode(cont, code, tokens)
    } catch (e) {
        // Simple error handling
        cont.style.color = "red"
        cont.innerHTML = `${sanitizeCode(e.toString())}<hr>${prepareCodeForRender(code)}`
    }
    container.appendChild(cont)
    return cont
}

// createMPPL(document.body, "NUMBER a = 8")
