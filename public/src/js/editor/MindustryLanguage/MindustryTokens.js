var __author__ = "kubik.augustyn@post.cz"

class MindustryTokens {
    static DUMMY = class extends Token { // Just a token to replace tokens when grouping tokens together
        // E.g. <PHRASE><PAREN_PAIR><PAREN_PAIR> --> <FUNCTION_CALL><DUMMY><DUMMY>
        // Because of our syntax highlighting algorithm
        type = "dummy"
        style = "copy"
    }
    static TAB = class extends Token {
        type = "tab"
    }
    static VALUE = class extends Token {
        type = "value"
        subtypeStyle = {
            "string": {
                color: "lightgreen"
            },
            "color": {
                "background-image": "linear-gradient(to right, gray, red, red, green, green, blue, blue, gray, gray)",
                "-webkit-background-clip": "text",
                "-moz-background-clip": "text",
                "background-clip": "text",
                color: "transparent"
            },
            "color-invalid": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "red"
            },
            "*": {
                color: "blue"
            }
        }

        represent() {
            if (this.subtype === "hex-number") return this.content
            if (this.subtype === "number") return MindustryCompiler.OBFUSCATE ? "0x" + this.content.toString(16) : this.content.toString()
            if (this.subtype === "string") return '"' + this.content + '"'
            if (this.subtype === "color") return this.content
            return "[VALUE]"
        }
    }
    static OPERATOR = class extends Token {
        type = "operator"
        style = {
            color: "magenta"
        }
        static subtypeToProcessorName = {
            "random": "rand",
            "maximum": "max"
        }

        represent() {
            if (!Object.keys(MindustryTokens.OPERATOR.subtypeToProcessorName).includes(this.subtype)) return "[OPERATOR]"
            return MindustryTokens.OPERATOR.subtypeToProcessorName[this.subtype]
        }
    }
    static PAREN = class extends Token {
        type = "paren"
    }
    static NEWLINE = class extends Token {
        type = "newline"
        content = "\n"
    }
    static SET = class extends Token {
        type = "set"
    }
    static COMMA = class extends Token {
        type = "comma"
    }
    static COMMENT = class extends Token {
        type = "comment"
        style = {
            color: "lightgray",
            margin: 0
        }
    }
    static PHRASE = class extends Token {
        type = "phrase"
        subtypeStyle = {
            "invalid": {color: "red"},
            "keyword": {color: "rgb(0, 49, 180)"},
            "function-call": {"font-style": "italic"},
            "variable-invalid-reassignment": {"text-decoration": "underline", "text-decoration-color": "blue"},
            "variable-invalid-not-assigned": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "red"
            },
            "variable": {color: "rgb(36, 143, 143)"},
            "param": {color: "green"},
            "link": {color: "gray"},
            "*": {color: "cyan"}
        }
    }
}
