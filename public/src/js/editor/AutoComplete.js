var __author__ = "kubik.augustyn@post.cz"

class AutoComplete {
    constructor(highlighter, autoCompleter) {
        this.highlighter = highlighter
        this.autoCompleter = autoCompleter
        this.currentMatch = -1
        /**
         * @type {HTMLDivElement}
         */
        this.container = highlighter.editorElements.autoComplete
        this.activated = false
        this.deactivatedOnPhrase = undefined
        this.forced = false
        this.lastCursor = {start: 0, end: 0}
        this.lastKey = undefined

        this.blurListener = this.blurListener.bind(this);
        this.changeListener = this.changeListener.bind(this);
        this.keyListener = this.keyListener.bind(this);
        this.mousedownListener = this.mousedownListener.bind(this);
        this.mousemoveListener = this.mousemoveListener.bind(this);

        this.container.classList.add("autocomplete")
        var mc = this.matchesContainer = document.createElement("div")
        mc.classList.add("matches-container")
        this.container.appendChild(mc)

        this.container.addEventListener("blur", this.blurListener)
        this.highlighter.editorElements.input.addEventListener("blur", this.blurListener)
        this.highlighter.editorElements.input.addEventListener("change", this.changeListener)
        this.highlighter.editorElements.input.addEventListener("keyup", this.keyListener)
        this.highlighter.editorElements.input.addEventListener("keyup", () => this.lastKey = undefined)
        this.container.addEventListener("mousedown", this.mousedownListener)
        this.container.addEventListener("mousemove", this.mousemoveListener)
    }

    /**
     * @param matches {Map<string, string>} Matches inside map (text-info pairs)
     */
    openPopup(matches) {
        if (this.activated) this.closePopup()
        this.activated = true
        this.currentMatch = 0
        this.container.classList.add("visible")
        this.updateMatches(matches)
    }

    updateMatches(matches, scrollToMatch = true) {
        this.boundMatchesMovement(matches)
        this.matchesContainer.innerHTML = ""
        var i = 0
        var currentMatchDiv
        for (var [text, info] of matches.entries()) {
            var match = document.createElement("div")
            match.classList.add("match")
            if (i === this.currentMatch) {
                match.classList.add("selected")
                currentMatchDiv = match
            }
            match.innerText = text
            match.dataset.text = text
            match.dataset.info = info
            var matchInfo = document.createElement("span")
            matchInfo.classList.add("info")
            matchInfo.innerText = info

            match.appendChild(matchInfo)
            this.matchesContainer.appendChild(match)
            i++
        }
        if (scrollToMatch && currentMatchDiv) this.matchesContainer.scrollTop = currentMatchDiv.offsetTop // Scroll to the match
    }

    closePopup() {
        this.activated = false
        this.deactivatedOnPhrase = this.getPhrase(this.lastCursor)
        this.forced = false
        this.currentMatch = -1
        // console.log("TOD0")
        this.container.classList.remove("visible")
    }

    moveTo(x, y, cursor) {
        this.updateMatches(this.getMatches(cursor), true)
        var lines = this.highlighter.editorElements.input.value.split("\n")
        var i = 0
        var line = lines.findIndex(a => i + a.length >= cursor.start ? true : (i += a.length + 1, false))
        var col = cursor.start - i
        // console.log(line, col)
        var lineWidth = SyntaxHighlighter.getTextWidth(lines[line].slice(0, col), SyntaxHighlighter.getCanvasFont(this.highlighter.editorElements.input))
        this.matchesContainer.style.transform = `translate(${x + lineWidth}px, calc(${y}px + 20pt * ${line + 1}))`
    }

    blurListener(e) {
        var el = document.activeElement
        var text = this.highlighter.editorElements.input
        //console.log("TOD0")//, e, el, text, e.target)
        if (el !== text) this.closePopup()
    }

    changeListener(e) {
        //console.log("TOD0")
    }

    /**
     * @param cursor {{start: number, end: number}}
     * @param all {boolean}
     * @returns {Map<string, string>}
     */
    getMatches(cursor, all = false) {
        var currentPhrase = this.getPhrase(cursor)
        if (all) return this.autoCompleter(cursor, currentPhrase)
        if (!currentPhrase || currentPhrase.length < 2) return new Map()
        return this.autoCompleter(cursor, currentPhrase)
    }

    keyListener(e) {
        var cursor = this.highlighter.getCursorPos(this.highlighter.editorElements.input) || this.lastCursor
        if (!cursor) {
            this.closePopup()
            return true
        }
        this.lastCursor = cursor
        if (e.key === " " && e.ctrlKey) {
            if (this.lastKey === " ") return false // Continue when key is held
            this.forced = true
            this.openPopup(this.getMatches(cursor, true))
            this.lastKey = e.key
            return false
        }
        /**
         * @type {Map<string, string>}
         */
        var matches = this.getMatches(cursor, this.forced)
        if (!matches.size) {
            this.closePopup()
            return true
        }
        if (!this.activated && (this.deactivatedOnPhrase !== this.getPhrase(cursor) || this.forced)) {
            this.openPopup(matches)
            return true
        }
        if (e.key === "Tab") {
            if (this.lastKey === "Tab") return false // Continue when key is held
            var match = Array.from(matches.keys())[this.currentMatch]
            this.insertMatch(match, cursor)
            this.lastKey = e.key
            return false
        }
        if (e.key === "Escape") {
            if (this.lastKey === "Escape") return false // Continue when key is held
            this.closePopup()
            this.lastKey = e.key
            return false
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            if (this.lastKey === "ArrowUp" || this.lastKey === "ArrowDown") return false // Continue when key is held
            this.moveInMatches(e.key === "ArrowUp", cursor)
            this.lastKey = e.key
            return false
        }
        return true
    }

    moveInMatches(up, cursor) {
        /**
         * @type {Map<string, string>}
         */
        var matches = this.getMatches(cursor, this.forced)
        if (!matches.size) {
            this.closePopup()
            return true
        }
        this.currentMatch += up ? -1 : 1
        this.boundMatchesMovement(matches)
        this.updateMatches(matches)
    }

    boundMatchesMovement(matches) {
        if (this.currentMatch < 0) this.currentMatch = matches.size - 1
        if (this.currentMatch >= matches.size) this.currentMatch = 0
    }

    getPhraseStartPos(code, cursor, sep = " ") {
        return Math.max(
            0,
            code.lastIndexOf(sep, cursor.start - 1) + 1,
            code.lastIndexOf("\n", cursor.start - 1) + 1
        )
    }

    getPhrase(cursor, sep = " ") {
        /**
         * @type {string}
         */
        var code = this.highlighter.editorElements.input.value
        return code.substring(this.getPhraseStartPos(code, cursor, sep), cursor.start)
    }

    mousedownListener(e) {
        if (!this.activated) return
        if (!e.target?.classList?.contains?.("match")) return
        this.insertMatch(e.target.dataset.text)
    }

    mousemoveListener(e) {
        if (!this.activated) return
        var matchDiv = e.target
        if (!matchDiv) return
        if (!matchDiv.classList.contains("match")) {
            matchDiv = matchDiv.parentNode
            if (!matchDiv || !matchDiv.classList.contains("match")) return
        }
        /**
         * @type {Map<string, string>}
         */
        var matches = this.getMatches(this.lastCursor, this.forced)
        if (!matches.size) return
        this.currentMatch = Array.from(this.matchesContainer.children).indexOf(matchDiv)
        if (this.currentMatch < 0) this.currentMatch = matches.size - 1
        if (this.currentMatch >= matches.size) this.currentMatch = 0
        this.updateMatches(matches, false)
    }

    goTo(where) {
        this.highlighter.editorElements.input.focus()
        this.highlighter.setCursorPos(this.highlighter.editorElements.input, where)
    }

    insertMatch(text, position = null) {
        position = position || this.highlighter.getCursorPos(this.highlighter.editorElements.input)
        if (!position) {
            console.log("Can't insert without knowing cursor position")
            return
        }
        /**
         * @type {string}
         */
        var code = this.highlighter.editorElements.input.value
        var phraseStartPos = this.getPhraseStartPos(code, position)
        this.highlighter.setCode(code.substring(0, phraseStartPos).concat(text).concat(code.substring(position.start)), false)
        this.goTo(this.lastCursor.start = this.lastCursor.end = phraseStartPos + text.length)
        this.closePopup()
        // console.log("TOD0 Insert at", position.start, text)
    }
}
