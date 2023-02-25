var __author__ = "kubik.augustyn@post.cz"

class MindustryLexer extends Lexer {
    static DIGITS = "0123456789"
    static SPACE = " "
    static TAB = ["    "]
    static NEWLINE = ["\r\n", "\n", "\r"]
    static STRINGS = ["'", '"']
    static ALL_PARENS = "()[]{}";

    * generateTokens() {
        while (!this.text.done) {
            if (MindustryLexer.SPACE.includes(this.currentChar)) {
                var num = this.getSpacesNum()
                for (var t of MindustryLexer.TAB) {
                    if (num % t.length === 0) {
                        for (var i = 0; i < Math.floor(num / t.length); i++) {
                            yield new MindustryTokens.TAB
                        }
                    }
                }
            } else {
                throw new class extends Error {
                    name = "MindustryLexerTokenError"
                    message = "No token was identified, error thrown to prevent infinite loop"
                }
            }
        }
    }

    getSpacesNum() {
        var num = 0
        while (this.currentChar !== undefined && MindustryLexer.SPACE.includes(this.currentChar)) {
            num += 1
            this.advance()
        }
        return num
    }
}
