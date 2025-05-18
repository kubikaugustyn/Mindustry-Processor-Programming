/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */
export default class DynamicLink {
    /** @type {number|null} */
    address

    constructor() {
        this.address = null
    }

    set target(address) {
        this.address = address
        console.warn("Setting the target is deprecated. Use the address property instead.")
    }

    toString() {
        // return "Dynamic Link" + (this.address !== null ? ` to ${this.address}` : "")
        return this.address === null ? "-1" : this.address.toString()
    }
}
