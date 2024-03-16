var __author__ = "kubik.augustyn@post.cz"

class SyntaxHighlighter {
    static ctx = document.createElement("canvas").getContext("2d")
    language
    editorElements
    highlightSyntax
    rawSyntax
    autoCompleter
    highlightOnKeyUp = null

    constructor(language, highlightSyntax, rawSyntax, autoCompleter) {
        this.language = language
        this.highlightSyntax = highlightSyntax?.bind?.(this)
        this.rawSyntax = rawSyntax?.bind?.(this)
        this.autoCompleter = autoCompleter?.bind?.(this)
        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(method => (method !== 'constructor')).forEach((method) => {
            this[method] = this[method].bind(this);
        });

        this.editor = document.createElement("div")
        this.editorElements = new function (highlighter) {
            var lineNumbers = this.lineNumbers = document.createElement("div")
            lineNumbers.classList.add("line-numbers")

            var inp = this.input = document.createElement("textarea")
            // inp.placeholder = `Enter ${highlighter.language} Source Code`
            inp.placeholder = `Enter Code`
            inp.spellcheck = false
            inp.classList.add("editing")
            /*oninput="update(this.value); sync_scroll(this);" onscroll="sync_scroll(this);" onkeydown="check_tab(this, event);"*/
            inp.addEventListener("input", highlighter.onInput)
            inp.addEventListener("scroll", highlighter.onScroll)
            inp.addEventListener("keydown", highlighter.onKeyDown)
            inp.addEventListener("keyup", highlighter.onKeyUp)

            var pre = this.pre = document.createElement("pre")
            pre.ariaHidden = true
            pre.classList.add("highlighting")

            var code = this.code = document.createElement("code")

            var autoComplete = this.autoComplete = document.createElement("div")
            autoComplete.classList.add("autocomplete")

            highlighter.editor.appendChild(inp)
            pre.appendChild(lineNumbers)
            pre.appendChild(code)
            highlighter.editor.appendChild(autoComplete)
            highlighter.editor.appendChild(pre)
        }(this)
        /*
        <div style="height: 200px;">
            <textarea placeholder="Enter HTML Source Code" id="editing" spellcheck="false"></textarea>
            <pre id="highlighting" aria-hidden="true">
                <code class="language-html" id="highlighting-content">
                &lt;span title=&quot;Start Typing&quot;&gt;Just start typing!&lt;/span&gt;
                </code>
            </pre>
        </div>
        */
        this.autoComplete = new AutoComplete(this, this.autoCompleter)
    }

    getEditor() {
        return this.editor
    }

    onInput() {
        this.update(this.editorElements.input.value)
        this.sync_scroll(this.editorElements.input)
    }

    onScroll() {
        this.sync_scroll(this.editorElements.input)
    }

    onKeyDown(ev) {
        this.check_tab(this.editorElements.input, ev)
    }

    onKeyUp() {
        if (typeof this.highlightOnKeyUp == "undefined") return
        this.highlightSyntax(this.highlightOnKeyUp)
        this.highlightOnKeyUp = undefined
    }

    setCode(code, shouldConfirm = true) {
        if (shouldConfirm && this.editorElements.input.value && !confirm("Do you really want to discard changes?")) return
        this.editorElements.input.value = code
        this.onInput()
        this.onKeyUp()
    }

    update(text) {
        // Handle final newlines (see article)
        if (text[text.length - 1] === "\n") {
            text += " ";
        }
        localStorage.setItem("editor_code", text)
        // Show line numbers
        var linesCountDelta = text.split("\n").length - this.editorElements.lineNumbers.childElementCount // How many to add = 5, how many to remove = -5
        var i
        if (linesCountDelta < 0) {
            for (i = 0; i < (0 - linesCountDelta); i++) this.editorElements.lineNumbers.removeChild(this.editorElements.lineNumbers.lastChild)
        } else {
            for (i = 0; i < linesCountDelta; i++) this.editorElements.lineNumbers.appendChild(document.createElement("span"))
        }
        // Syntax Highlight
        this.highlightOnKeyUp = text
        this.rawSyntax(text)
    }

    sync_scroll(element) {
        /* Scroll result to scroll coords of event - sync with textarea */
        // Get and set x and y
        // result_element.scrollTop = element.scrollTop;
        // result_element.scrollLeft = element.scrollLeft;
        var lineNumbersWidth = Math.floor(this.editorElements.lineNumbers.getBoundingClientRect().width)
        this.editor.style.setProperty("--lineNumbersWidth", lineNumbersWidth + "px")
        this.editorElements.code.style.transform = `translate(${-element.scrollLeft}px, ${-element.scrollTop}px)`
        this.editorElements.lineNumbers.style.transform = `translate(${-element.scrollLeft - lineNumbersWidth - 10}px, ${-element.scrollTop}px)`
        var cursor = this.getCursorPos(this.editorElements.input)
        if (!cursor) {
            this.autoComplete.closePopup()
            cursor = {start: 0, end: 0}
        }
        this.autoComplete.moveTo(-element.scrollLeft, -element.scrollTop, cursor)
    }

    /**
     * @param element {HTMLTextAreaElement}
     * @param event {KeyboardEvent}
     */
    check_tab(element, event) {
        let code = element.value;
        if (!this.autoComplete.keyListener(event)) {
            event.preventDefault(); // stop normal
            return
        }
        if (event.key === "Tab") {
            /* Tab key pressed */
            event.preventDefault(); // stop normal
            let before_tab = code.slice(0, element.selectionStart); // text before tab
            let after_tab = code.slice(element.selectionEnd, element.value.length); // text after tab
            let cursor_pos = element.selectionStart + 1; // where cursor moves after tab - moving forward by 1 char to after tab
            element.value = before_tab + "\t" + after_tab; // add tab char
            // move cursor
            element.selectionStart = cursor_pos;
            element.selectionEnd = cursor_pos;
            this.update(element.value); // Update text to include indent
        }
    }

    /**
     * @param input {HTMLInputElement, HTMLTextAreaElement}
     * @returns {null|{start: number, end: number}}
     */
    getCursorPos(input) {
        if ("selectionStart" in input && document.activeElement === input) {
            return {
                start: input.selectionStart,
                end: input.selectionEnd
            }
        } else if (input.createTextRange) {
            var sel = document.selection.createRange();
            if (sel.parentElement() === input) {
                var rng = input.createTextRange();
                rng.moveToBookmark(sel.getBookmark());
                for (var len = 0;
                     rng.compareEndPoints("EndToStart", rng) > 0;
                     rng.moveEnd("character", -1)) {
                    len++;
                }
                rng.setEndPoint("StartToStart", input.createTextRange());
                for (var pos = {start: 0, end: len};
                     rng.compareEndPoints("EndToStart", rng) > 0;
                     rng.moveEnd("character", -1)) {
                    pos.start++;
                    pos.end++;
                }
                return pos;
            }
        }
        return null;
    }

    /**
     * @param input {HTMLInputElement, HTMLTextAreaElement}
     * @param start {number}
     * @param end {number, null}
     */
    setCursorPos(input, start, end = null) {
        if (arguments.length < 3 || end === null) end = start
        if ("selectionStart" in input) {
            setTimeout(function () {
                input.selectionStart = start
                input.selectionEnd = end
            }, 1)
        } else if (input.createTextRange) {
            var rng = input.createTextRange()
            rng.moveStart("character", start)
            rng.collapse()
            rng.moveEnd("character", end - start)
            rng.select()
        }
    }

    /**
     * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
     *
     * @param {string} text The text to be rendered.
     * @param {string} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
     *
     * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
     */
    static getTextWidth(text, font) {
        SyntaxHighlighter.ctx.font = font;
        const metrics = SyntaxHighlighter.ctx.measureText(text);
        return metrics.width;
    }

    static getCssStyle(element, prop) {
        return window.getComputedStyle(element, null).getPropertyValue(prop);
    }

    static getCanvasFont(el = document.body) {
        const fontWeight = SyntaxHighlighter.getCssStyle(el, 'font-weight') || 'normal';
        const fontSize = SyntaxHighlighter.getCssStyle(el, 'font-size') || '16px';
        const fontFamily = SyntaxHighlighter.getCssStyle(el, 'font-family') || 'Times New Roman';

        return `${fontWeight} ${fontSize} ${fontFamily}`;
    }
}
