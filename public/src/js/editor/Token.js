var __author__ = "kubik.augustyn@post.cz"

class Token {
    type = "default"

    constructor(subtype = "", content = "") {
        this.subtype = subtype
        this.content = content

        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(method => (method !== 'constructor')).forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }
}
