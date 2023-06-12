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
     * @type {HTMLDivElement}
     */
    container
    /**
     * @type {HTMLDivElement}
     */
    blocksContainer
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
        this.blocksContainer = document.createElement("div")
        this.blocksContainer.classList.add("container")
        this.copyElement = document.createElement("textarea")
        this.copyButton = copyButton || document.createElement("button")
        this.copyButton.addEventListener("click", this.copyToClipboard.bind(this))
        this.container.appendChild(this.copyButton)
        this.container.appendChild(this.copyElement)
        this.container.appendChild(this.blocksContainer)
    }

    copyToClipboard() {
        if (!this.blocks) return
        var code = this.blocks.map(block => block.toString()).join("\n")
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

    render() {
        if (!this.blocksContainer) return
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
            titleSpan.innerHTML = (block.blockTitle === "Jump" && block.params[0] !== "-1") ? `${block.blockTitle} -> ${block.params[0]}` : block.blockTitle
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
        if (ProcessorBlocksView.DEBUG_LOG) console.groupEnd()
    }
}
