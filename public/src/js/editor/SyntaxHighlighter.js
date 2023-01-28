var __author__ = "kubik.augustyn@post.cz"

class SyntaxHighlighter {
    static LANG_MINDUSTRY = "Mindustry"

    constructor(language) {
        this.language = language

        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(method => (method !== 'constructor')).forEach((method) => {
            this[method] = this[method].bind(this);
        });

        this.editor = document.createElement("div")
        this.editorElements = new function (highlighter) {
            var inp = this.input = document.createElement("textarea")
            // inp.placeholder = `Enter ${highlighter.language} Source Code`
            inp.placeholder = `Enter Code`
            inp.spellcheck = false
            inp.classList.add("editing")
            /*oninput="update(this.value); sync_scroll(this);" onscroll="sync_scroll(this);" onkeydown="check_tab(this, event);"*/
            inp.addEventListener("input", highlighter.onInput)
            inp.addEventListener("scroll", highlighter.onScroll)
            inp.addEventListener("keydown", highlighter.onKeyDown)

            var pre = this.pre = document.createElement("pre")
            pre.ariaHidden = true
            pre.classList.add("highlighting")

            var code = this.code = document.createElement("code")

            highlighter.editor.appendChild(inp)
            pre.appendChild(code)
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

    update(text) {
        // Handle final newlines (see article)
        if (text[text.length - 1] === "\n") {
            text += " ";
        }
        // Update code
        var code = text.replaceAll(new RegExp("&", "g"), "&amp;").replaceAll(new RegExp("<", "g"), "&lt;"); /* Global RegExp */
        // Syntax Highlight
        this.highlightSyntax(code)
    }


    sync_scroll(element) {
        /* Scroll result to scroll coords of event - sync with textarea */
        let result_element = this.editorElements.code//document.querySelector("#highlighting");
        // Get and set x and y
        result_element.scrollTop = element.scrollTop;
        result_element.scrollLeft = element.scrollLeft;
    }


    check_tab(element, event) {
        let code = element.value;
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

    highlightSyntax() {
        console.log("Highlight!")
        var tokens = [
            new MINDUSTRY_TOKEN.IF_CHECK(
                new MINDUSTRY_TOKEN.COMPARE_GRATER(
                    new MINDUSTRY_TOKEN.VALUE_NUMBER(8),
                    new MINDUSTRY_TOKEN.VALUE_NUMBER(2)
                ),
                new MINDUSTRY_TOKEN.MULTI_STATEMENT(
                    new MINDUSTRY_TOKEN.OFFSET(1),
                    new MINDUSTRY_TOKEN.COMPARE_GRATER(
                        new MINDUSTRY_TOKEN.VALUE_NUMBER(12),
                        new MINDUSTRY_TOKEN.VALUE_NUMBER(0)
                    ),
                    new MINDUSTRY_TOKEN.OFFSET(1),
                    new MINDUSTRY_TOKEN.COMPARE_SMALLER(
                        new MINDUSTRY_TOKEN.VALUE_NUMBER(179),
                        new MINDUSTRY_TOKEN.VALUE_NUMBER(28)
                    )
                )
            )
        ]
        this.editorElements.input.value = " "
        this.editorElements.code.innerHTML = ""
        tokens.forEach(token => this.editorElements.code.appendChild(Token.renderToken(token)))
    }
}
