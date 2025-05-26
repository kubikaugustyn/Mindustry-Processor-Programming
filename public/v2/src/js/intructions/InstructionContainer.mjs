/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {importCSS} from "../utils.mjs";

importCSS("../src/css/InstructionContainer.css")

/**
 * A class that extends the Array prototype to manage and render a collection of instructions
 * within a specified HTML container element.
 *
 * The class provides methods to dynamically render and clear instruction elements stored in
 * the container.
 */
export default class InstructionContainer extends Array {
    /**
     * @param container {HTMLElement} The HTML element to put the instructions and other elements into.
     * @param openSettings {(function():void)|null} A function that should be called to open settings.
     */
    constructor(container, openSettings = null) {
        super();
        this.container /** @type {HTMLElement} */ = container;
        this.container.classList.add("instruction-container");

        // Header
        const copyToClipboard = document.createElement("button")
        copyToClipboard.innerText = "Copy to clipboard"
        copyToClipboard.addEventListener("click", () => {
            if (!this.length) return
            this.render()
            const code = this.rawMlog.value
            this.rawMlog.select();
            this.rawMlog.setSelectionRange(0, code.length + 1); // For mobile devices
            navigator.clipboard.writeText(code)
        })

        const updateVisibility = () => {
            this.instructionContainer.style.display = blocksOption.checked ? "block" : "none"
            this.rawMlog.style.display = rawOption.checked ? "block" : "none"
        }

        const blocksLabel = document.createElement("label")
        const blocksOption = document.createElement("input")
        blocksOption.type = "radio"
        blocksOption.checked = true
        blocksOption.value = "blocks"
        blocksOption.name = "instruction-container-view-mode"
        blocksOption.addEventListener("change", updateVisibility)
        blocksLabel.appendChild(blocksOption)
        blocksLabel.appendChild(new Text("Blocks"))

        const rawLabel = document.createElement("label")
        const rawOption = document.createElement("input")
        rawOption.type = "radio"
        rawOption.value = "raw"
        rawOption.name = "instruction-container-view-mode"
        rawOption.addEventListener("change", updateVisibility)
        rawLabel.appendChild(rawOption)
        rawLabel.appendChild(new Text("Raw"))

        const spacer = document.createElement("div")
        spacer.classList.add("spacer")

        const settingsButton = document.createElement("button")
        settingsButton.classList.add("settings-button")
        settingsButton.innerText = "Settings"
        settingsButton.addEventListener("click", () => openSettings?.())

        this.header = document.createElement("div")
        this.header.classList.add("header");
        this.header.appendChild(copyToClipboard)
        this.header.appendChild(blocksLabel)
        this.header.appendChild(rawLabel)
        this.header.appendChild(spacer)
        if (openSettings !== null) this.header.appendChild(settingsButton)
        else settingsButton.remove() // Delete the element. Not clean code, but whatever.
        this.container.appendChild(this.header)

        // Instructions
        this.instructionContainer = document.createElement("div")
        this.instructionContainer.classList.add("instructions");
        this.container.appendChild(this.instructionContainer)

        // Raw MLOG
        this.rawMlog = document.createElement("textarea")
        this.rawMlog.classList.add("raw-mlog")
        this.rawMlog.readOnly = true
        this.container.appendChild(this.rawMlog)
        updateVisibility()
    }

    render() {
        // Instructions
        this.instructionContainer.innerHTML = "";
        this.forEach(/** @param instruction {Instruction}
         * @param i {number} */(instruction, i) => {
            instruction.index = i
            instruction.render(this.instructionContainer)
        });

        // Raw MLOG
        this.rawMlog.value = Array.from(this).map(block => block.toString()).join("\n")
    }

    clear() {
        this.length = 0
    }
}
