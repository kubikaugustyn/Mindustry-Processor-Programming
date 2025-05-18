/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {elem} from "../utils.mjs";

/**
 * @typedef {
 *      {type: "text", content: string} |
 *      {type: "input", content: string} |
 *      {type: "enum", content: string}
 * } TInstructionContentElement
 */

// https://github.com/Anuken/Arc/blob/master/arc-core/src/arc/graphics/Color.java
const ColorMap = {
    white: "rgba(255, 255, 255, 1)",
    lightGray: "#bfbfbfff",
    gray: "#7f7f7fff",
    darkGray: "#3f3f3fff",
    black: "rgba(0, 0, 0, 1)",
    clear: "rgba(0, 0, 0, 0)",
    blue: "rgba(0, 0, 255, 1)",
    navy: "rgba(0, 0, 127, 1)",
    royal: "#4169e1ff",
    slate: "#708090ff",
    sky: "#87ceebff",
    cyan: "rgba(0, 255, 255, 1)",
    teal: "rgba(0, 127, 127, 1)",
    green: "#00ff00ff",
    acid: "#7fff00ff",
    lime: "#32cd32ff",
    forest: "#228b22ff",
    olive: "#6b8e23ff",
    yellow: "#ffff00ff",
    gold: "#ffd700ff",
    goldenrod: "#daa520ff",
    orange: "#ffa500ff",
    brown: "#8b4513ff",
    tan: "#d2b48cff",
    brick: "#b22222ff",
    red: "#ff0000ff",
    scarlet: "#ff341cff",
    crimson: "#dc143cff",
    coral: "#ff7f50ff",
    salmon: "#fa8072ff",
    pink: "#ff69b4ff",
    magenta: "rgba(255, 0, 255, 1)",
    purple: "#a020f0ff",
    violet: "#ee82eeff",
    maroon: "#b03060ff"
}
const colorRegex = new RegExp(`\\[(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|${Object.keys(ColorMap).join("|")}|)]`, "g")

export default class Instruction {
    /**
     * @param opcode {string}
     * @param operands {string[]}
     * @param category {string[]} [name, id] of the category
     * @param index {number}
     */
    constructor(opcode, operands, category, index = -1) {
        this.opcode /** @type {string} */ = opcode;
        this.operands /** @type {string[]} */ = operands;
        this.category /** @type {string[]} */ = category;
        this.index /** @type {number} */ = index;

        this.container /** @type {HTMLDivElement} */ = elem("div", ["instruction", `category-${this.category[1]}`])

        this.headerElem /** @type {HTMLDivElement} */ = elem("div", ["instruction-header"], this.container);
        this.contentElem /** @type {HTMLDivElement} */ = elem("div", ["instruction-content"], this.container);

        this.nameElem /** @type {HTMLDivElement} */ = elem("div", ["instruction-header-name"], this.headerElem);
        this.indexElem /** @type {HTMLDivElement} */ = elem("div", ["instruction-header-index"], this.headerElem);
    }

    /**
     * @abstract
     * @return {string}
     */
    getName() {
        return `[${this.opcode}]`
    }

    /**
     * @param parent {HTMLElement}
     */
    render(parent) {
        this.nameElem.innerText = this.getName()
        this.indexElem.innerText = this.index.toString()
        this.contentElem.innerHTML = ""

        /** @type {TInstructionContentElement[]} */
        const content = this.prepareContent()
        content.forEach(element => {
            var htmlElement = elem("div", ["instruction-content-" + element.type], this.contentElem)
            // Parse the color-coded text ("this text is white and [red]this is red[]. [#aaa]This is gray.[]")
            if (element.content.startsWith('"') && element.content.endsWith('"') &&
                element.content.includes("[") && element.content.includes("]")) {
                const originalContent = element.content.slice(1, -1)
                const matches = originalContent.matchAll(colorRegex)
                const parts = []

                let lastIndex = 0, lastColor = ""
                for (const match of matches) {
                    parts.push([originalContent.slice(lastIndex, match.index), lastColor])

                    if (match[1].startsWith("#"))
                        lastColor = match[1]
                    else if (match[1].length > 0)
                        lastColor = ColorMap[match[1]]
                    else lastColor = ""
                    lastIndex = match.index
                }
                parts.push([originalContent.slice(lastIndex), lastColor]) // The last push

                htmlElement.appendChild(new Text('"'))
                parts.forEach(([text, color]) => {
                    if (color) {
                        var element = elem("span", null, htmlElement)
                        element.innerText = text
                        element.style.color = color
                    }
                    else htmlElement.appendChild(new Text(text))
                })
                htmlElement.appendChild(new Text('"'))
            }
            else htmlElement.innerText = element.content
        })

        parent.appendChild(this.container)
    }

    /**
     * @abstract
     * @return {TInstructionContentElement[]}
     */
    prepareContent() {
        return [{type: "text", content: "[not implemented]"}]
    }

    toString() {
        return `${this.opcode} ${this.operands.join(" ")}`
    }
}
