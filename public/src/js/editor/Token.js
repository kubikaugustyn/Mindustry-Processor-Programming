var __author__ = "kubik.augustyn@post.cz"

class Token {
    static type = "default"
    static subtype = ""

    constructor(...args) {
        this.content = "<DEFAULT_TOKEN>"

        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(method => (method !== 'constructor')).forEach((method) => {
            this[method] = this[method].bind(this);
        });

        this.init(...args)
    }

    init() {
    }

    /**
     * @param content {string | Token | Token[]}
     * @returns {HTMLSpanElement | HTMLBRElement}
     */
    render(content = this.content) {
        if (this.constructor.type === MINDUSTRY_TOKEN_BASIC.NEWLINE.type) return document.createElement("br")
        var className = this.constructor.type
        if (this.constructor.subtype.length > 0) className = className.concat("-" + this.constructor.subtype)
        return Token.makeSpan([this.constructor.type, className], content === "<DEFAULT_TOKEN>" ? "" : content)
    }

    renderContent(i) {
        var cont = typeof i === "number" ? this.content[i] : this.content
        return cont instanceof Token ? cont.render() : cont
    }

    static makeText(text) {
        var elem = document.createElement("text")
        elem.innerHTML = Token.htmlToString(text)
        return elem
    }

    static renderToken(token) {
        var rendered = token.render()
        if (rendered instanceof Node) return rendered
        if (typeof rendered !== "string") rendered = rendered.toString()
        return Token.makeText(rendered)
    }

    static makeSpan(classNames, content) {
        var span = document.createElement("span")
        span.classList.add("token")
        if (typeof classNames === "string") span.classList.add(classNames)
        else span.classList.add(...classNames)
        console.log(content)

        if (content instanceof Node) span.appendChild(content)
        else if (content instanceof Token) span.appendChild(Token.renderToken(content))
        else if (content instanceof Array) content.forEach(child => span.appendChild(child instanceof Token ? Token.renderToken(child) : (typeof child === "string" ? Token.makeText(child) : child)))
        else span.innerHTML = Token.htmlToString(content.toString())
        return span
    }

    /**
     * @param html {string}
     * @returns {string}
     */
    static htmlToString(html) {
        html = html.replaceAll(new RegExp("<", "g"), "&lt;")
        html = html.replaceAll(new RegExp(">", "g"), "&gt;")
        return html
    }
}
