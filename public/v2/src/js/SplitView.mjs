/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {importCSS} from "./utils.mjs";

importCSS("../src/css/SplitView.css")

export default class SplitView {
    /**
     * @param container {HTMLElement}
     */
    constructor(container) {
        this.container /** @type {HTMLElement} */ = container;
        this.container.classList.add("split-view-root");

        this.left /** @type {HTMLDivElement} */ = document.createElement("div")
        this.separator /** @type {HTMLDivElement} */ = document.createElement("div")
        this.right /** @type {HTMLDivElement} */ = document.createElement("div")

        this.left.classList.add("split-view-side", "split-view-left");
        this.separator.classList.add("split-view-separator");
        this.right.classList.add("split-view-side", "split-view-right");

        this.container.appendChild(this.left)
        this.container.appendChild(this.separator)
        this.container.appendChild(this.right)
    }
}
