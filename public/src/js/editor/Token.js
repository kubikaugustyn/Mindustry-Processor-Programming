var __author__ = "kubik.augustyn@post.cz"

class Token {
    type = "default"
    subtype
    subtypeObject
    content
    style
    subtypeStyle

    /**
     * @param subtype {string}
     * @param content {string}
     * @param subtypeObject {any}
     */
    constructor(subtype = "", content = "", subtypeObject = undefined) {
        subtype && (this.subtype = subtype)
        content && (this.content = content)
        subtypeObject && (this.subtypeObject = subtypeObject)

        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(method => (method !== 'constructor')).forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }

    toString() {
        var str = ""
        if (this.type !== "default") str += this.type
        if (this.subtype) str += (this.type === "default" ? "" : "_") + this.subtype
        if (this.content) str += (this.subtype === "" ? "'" : ":'") + this.content + "'"
        return str
    }
}
