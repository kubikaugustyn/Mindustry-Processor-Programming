var __author__ = "kubik.augustyn@post.cz"

class Token {
    type = "default"
    subtype
    subtypeObject
    content
    style
    subtypeStyle
    lineNum
    /**
     * @type {{from:number,to:number}|undefined} From, to char index
     */
    range
    original

    /**
     * @param subtype {string}
     * @param content {any}
     * @param subtypeObject {any}
     */
    constructor(subtype = "", content = undefined, subtypeObject = undefined) {
        this.subtype = subtype
        this.content = content
        this.subtypeObject = subtypeObject
        this.init()
        this.original = true

        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(method => (method !== 'constructor')).forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }

    /**
     * @abstract
     */
    init() {
    }

    atLine(line) {
        this.lineNum = line
    }

    atRange(from, to) {
        this.range = {from, to}
    }

    toString() {
        var str = ""
        if (this.type !== "default") str += this.type
        if (this.subtype) str += (this.type === "default" ? "" : "_") + this.subtype
        if (typeof this.content !== "undefined") str += (this.subtype === "" ? "'" : ":'") + this.content + "'"
        return str
    }

    switchTo(other) {
        if (!(other instanceof Token)) throw new Error("Cannot switch token to non-token object")
        for (var [key, val] of Object.entries(other)) this[key] = val
        this.original = false
    }

    represent() {
        return this.content
    }
}
