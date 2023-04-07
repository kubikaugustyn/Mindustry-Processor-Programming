var __author__ = "kubik.augustyn@post.cz"

class ProcessorBlocksView {
    /**
     * @type {ProcessorBlock[]}
     */
    blocks
    /**
     * @type {HTMLDivElement}
     */
    container

    /**
     * @param container {HTMLDivElement}
     */
    constructor(container = null) {
        this.container = container || document.createElement("div")
    }

    /**
     * @returns {HTMLDivElement}
     */
    getContainer() {
        return this.container
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
        if (!this.container) return
        console.groupCollapsed("Render processor blocks")
        console.log(this.blocks)
        this.container.innerHTML = ""
        for (var [i, block] of Object.entries(this.blocks)) {
            var blockDiv = document.createElement("div")
            blockDiv.classList.add("processor-block", "category-" + block.normalizeCategory())
            this.container.appendChild(blockDiv)

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
        console.groupEnd()
    }
}
