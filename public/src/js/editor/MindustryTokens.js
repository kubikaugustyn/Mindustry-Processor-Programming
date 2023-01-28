var __author__ = "kubik.augustyn@post.cz"

class MINDUSTRY_TOKEN_BASIC {
    static BRACKETS = class extends Token {
        static type = "brackets"
        static char = ['?', '?']

        init(content) {
            this.content = content
        }

        render() {
            return super.render([this.constructor.char[0], this.renderContent(), this.constructor.char[1]])
        }
    }
    static STATEMENT = class extends Token {
        static type = "statement"
    }
    static CHECK = class extends Token {
        static type = "check"

        /**
         * @param condition {MINDUSTRY_TOKEN.PARENTHESES_BRACKETS}
         * @param statement {MINDUSTRY_TOKEN.MULTI_STATEMENT | MINDUSTRY_TOKEN.SIMPLE_STATEMENT}
         */
        init(condition, statement) {
            this.content = [condition, statement]
        }

        /*render() {
            var condition = this.renderContent()
            console.log(condition, this.content)
            // return `${this.constructor.subtype} (${condition})`
            return super.render([this.constructor.subtype, " (", condition, ")"])
        }*/

        render() {
            var condition = this.renderContent(0)
            var statement = this.renderContent(1)
            return super.render([Token.makeSpan([this.constructor.type.concat("-text")], this.constructor.subtype), " ".concat(MINDUSTRY_TOKEN.PARENTHESES_BRACKETS.char[0]), condition, MINDUSTRY_TOKEN.PARENTHESES_BRACKETS.char[1], statement])
        }
    }
    static COMPARE = class extends Token {
        static type = "compare"
        static char = "?"

        init(A, B) {
            this.content = [A, B]
        }

        render() {
            var A = this.renderContent(0)
            var B = this.renderContent(1)
            // return `${A} ${this.constructor.char} ${B}`
            return super.render([A, ` ${this.constructor.char} `, B])
        }
    }
    static VALUE = class extends Token {
        static type = "value"

        init(value) {
            this.content = value
        }

        /*render() {
            return this.content
        }*/
    }
    static NEWLINE = class extends Token {
        static type = "newline"
    }
    static OFFSET = class extends Token {
        static type = "offset"

        init(offset) {
            this.content = offset
        }

        render() {
            var span = super.render("")
            span.setAttribute("style", "--offset: ".concat(this.content))
            return span
        }
    }
}

class MINDUSTRY_TOKEN {
    static NEWLINE = MINDUSTRY_TOKEN_BASIC.NEWLINE
    static OFFSET = MINDUSTRY_TOKEN_BASIC.OFFSET

    static PARENTHESES_BRACKETS = class extends MINDUSTRY_TOKEN_BASIC.BRACKETS {
        // (CONTENT)
        static subtype = "parentheses"
        static char = ['(', ')']
    }
    static BRACKET_BRACKETS = class extends MINDUSTRY_TOKEN_BASIC.BRACKETS {
        // [CONTENT]
        static subtype = "brackets"
        static char = ['[', ']']
    }
    static BRACES_BRACKETS = class extends MINDUSTRY_TOKEN_BASIC.BRACKETS {
        // {CONTENT}
        static subtype = "braces"
        static char = ['{', '}']
    }

    static MULTI_STATEMENT = class extends MINDUSTRY_TOKEN_BASIC.STATEMENT {
        static subtype = "multi"

        /**
         * @param statements {MINDUSTRY_TOKEN.SIMPLE_STATEMENT}
         */
        init(...statements) {
            this.content = statements
        }

        render() {
            // var statements = new Array(this.content.length * 2).fill(0).map((_, i) => i % 2 ? this.renderContent(Math.floor(i / 2)) : new MINDUSTRY_TOKEN_BASIC.NEWLINE())
            var statements = []
            this.content.forEach(cont => {
                var lastStatement = statements.pop() // Can't use the forEach i
                lastStatement && statements.push(lastStatement)
                if (lastStatement ? lastStatement.constructor.type !== MINDUSTRY_TOKEN.OFFSET.type : true) statements.push(new MINDUSTRY_TOKEN_BASIC.NEWLINE())
                statements.push(cont)
            })
            return super.render([MINDUSTRY_TOKEN.BRACES_BRACKETS.char[0], ...statements, new MINDUSTRY_TOKEN.NEWLINE(), MINDUSTRY_TOKEN.BRACES_BRACKETS.char[1]])
        }
    }
    static SIMPLE_STATEMENT = class extends MINDUSTRY_TOKEN_BASIC.STATEMENT {
        static subtype = "simple"

        init(...tokens) {
            this.content = tokens
        }
    }

    static IF_CHECK = class extends MINDUSTRY_TOKEN_BASIC.CHECK {
        static subtype = "if"
    }
    static ELIF_CHECK = class extends MINDUSTRY_TOKEN_BASIC.CHECK {
        static subtype = "elif"
    }
    static ELSE_CHECK = class extends MINDUSTRY_TOKEN_BASIC.CHECK {
        static subtype = "else"

        init() {

        }
    }

    static COMPARE_GRATER = class extends MINDUSTRY_TOKEN_BASIC.COMPARE {
        // Grater than (>)
        static subtype = "greater"
        static char = ">"
    }
    static COMPARE_SMALLER = class extends MINDUSTRY_TOKEN_BASIC.COMPARE {
        // Smaller than (<)
        static subtype = "smaller"
        static char = "<"
    }

    static VALUE_NUMBER = class extends MINDUSTRY_TOKEN_BASIC.VALUE {
        static subtype = "number"
    }
    static VALUE_STRING = class extends MINDUSTRY_TOKEN_BASIC.VALUE {
        static subtype = "string"
    }
}
