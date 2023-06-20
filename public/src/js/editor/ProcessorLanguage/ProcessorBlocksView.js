var __author__ = "kubik.augustyn@post.cz"

class ProcessorBlocksView {
    /**
     * @type {boolean}
     */
    static DEBUG_LOG = false
    /**
     * @type {ProcessorBlock[]}
     */
    blocks
    /**
     * @type {string[]}
     */
    warnings
    /**
     * @type {string[]}
     */
    errors
    /**
     * @type {HTMLDivElement}
     */
    container
    /**
     * @type {HTMLDivElement}
     */
    scrollContainer
    /**
     * @type {HTMLDivElement}
     */
    blocksContainer
    /**
     * @type {HTMLDivElement}
     */
    warningsContainer
    /**
     * @type {HTMLDivElement}
     */
    errorsContainer
    /**
     * @type {HTMLTextAreaElement}
     */
    copyElement
    /**
     * @type {HTMLButtonElement}
     */
    copyButton

    /**
     * @param container {HTMLDivElement}
     * @param copyButton {HTMLButtonElement}
     */
    constructor(container = null, copyButton = null) {
        this.container = container || document.createElement("div")
        this.container.classList.add("processor-blocks")
        this.scrollContainer = document.createElement("div")
        this.scrollContainer.classList.add("container")
        this.blocksContainer = document.createElement("div")
        this.blocksContainer.classList.add("blocks-container")
        this.warningsContainer = document.createElement("div")
        this.warningsContainer.classList.add("warnings-container")
        this.errorsContainer = document.createElement("div")
        this.errorsContainer.classList.add("errors-container")
        this.copyElement = document.createElement("textarea")
        this.copyButton = copyButton || document.createElement("button")
        this.copyButton.addEventListener("click", this.copyToClipboard.bind(this))
        this.container.appendChild(this.copyButton)
        this.container.appendChild(this.copyElement)
        this.container.appendChild(this.scrollContainer)
        this.scrollContainer.appendChild(this.warningsContainer)
        this.scrollContainer.appendChild(this.errorsContainer)
        this.scrollContainer.appendChild(this.blocksContainer)
        this.warnings = []
        this.errors = []
    }

    copyToClipboard(code = undefined) {
        if (!code && !this.blocks) return
        code = code instanceof Event ? this.blocks.map(block => block.toString()).join("\n") : code
        this.copyElement.innerText = code
        this.copyElement.select();
        this.copyElement.setSelectionRange(0, code.length + 1); // For mobile devices
        navigator.clipboard.writeText(code)
        if (ProcessorBlocksView.DEBUG_LOG) console.log("Copy to clipboard:", code)
    }

    /**
     * @returns {HTMLDivElement}
     */
    getContainer() {
        return this.container
    }

    /**
     * @returns {HTMLDivElement}
     */
    getBlocksContainer() {
        return this.blocksContainer
    }

    /**
     * @param blocks {ProcessorBlock[]}
     * @param render {boolean}
     */
    setBlocks(blocks, render = true) {
        this.blocks = blocks
        if (render) this.render()
    }

    /**
     * @param render {boolean}
     * @param warnings {string}
     */
    addWarnings(render = false, ...warnings) {
        this.warnings.push(...warnings)
        if (render) this.render()
    }

    /**
     * @param render {boolean}
     * @param errors {string}
     */
    addErrors(render = false, ...errors) {
        this.errors.push(...errors)
        if (render) this.render()
    }

    render() {
        if (!this.scrollContainer) return
        if (!this.blocksContainer) return
        if (!this.warningsContainer) return
        if (!this.errorsContainer) return
        if (ProcessorBlocksView.DEBUG_LOG) console.groupCollapsed("Render processor blocks")
        if (ProcessorBlocksView.DEBUG_LOG) console.log(this.blocks)
        this.copyButton.disabled = !this.blocks.length
        this.blocksContainer.innerHTML = ""
        for (var [i, block] of Object.entries(this.blocks)) {
            var blockDiv = document.createElement("div")
            blockDiv.classList.add("processor-block", "category-" + block.normalizeCategory())
            this.blocksContainer.appendChild(blockDiv)

            var headlineDiv = document.createElement("div")
            headlineDiv.classList.add("headline")
            blockDiv.appendChild(headlineDiv)

            var titleSpan = document.createElement("span")
            titleSpan.classList.add("title")
            titleSpan.innerHTML = (block.blockTitle === "Jump" && block.params[0] !== "-1") ? `${block.blockTitle} → ${block.params[0]}` : block.blockTitle
            headlineDiv.appendChild(titleSpan)

            var indexSpan = document.createElement("span")
            indexSpan.classList.add("index")
            indexSpan.innerHTML = i
            headlineDiv.appendChild(indexSpan)

            var contentDiv = document.createElement("div")
            contentDiv.classList.add("content")
            contentDiv.innerHTML = block.applyFormat(param => `<span class="param">${param}</span>`)
            blockDiv.appendChild(contentDiv)
        }
        this.warningsContainer.innerHTML = ""
        var firstLineEnd, firstLine, rest
        for (var warning of this.warnings) {
            var warningDiv = document.createElement("div")
            warningDiv.classList.add("warning")
            firstLineEnd = warning.indexOf("<br>") === -1 ? warning.length : warning.indexOf("<br>")
            firstLine = warning.slice(0, firstLineEnd)
            rest = warning.slice(firstLineEnd + 4)
            warningDiv.innerHTML = `${firstLine}<span style="font-size: .5rem">${rest}</span>`
            this.warningsContainer.appendChild(warningDiv)
        }
        this.errorsContainer.innerHTML = ""
        for (var error of this.errors) {
            var errorDiv = document.createElement("div")
            errorDiv.classList.add("error")
            firstLineEnd = error.indexOf("<br>") === -1 ? error.length : error.indexOf("<br>")
            firstLine = error.slice(0, firstLineEnd)
            rest = error.slice(firstLineEnd + 4)
            errorDiv.innerHTML = `${firstLine}<br><span style="font-size: .5rem">${rest}</span>`
            this.errorsContainer.appendChild(errorDiv)
        }
        if (ProcessorBlocksView.DEBUG_LOG) console.groupEnd()
        this.warnings = []
        this.errors = []
    }
}
