var __author__ = "kubik.augustyn@post.cz"

class MindustryTokens {
    /*static DUMMY = class extends Token { // Just a token to replace tokens when grouping tokens together
        // E.g. <PHRASE><PAREN_PAIR><PAREN_PAIR> --> <FUNCTION_CALL><DUMMY><DUMMY>
        // Because of our syntax highlighting algorithm
        type = "dummy"
        style = "copy"
        // DEPRECATED!!!!!!!
    }*/
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
                "aa": "https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient#gradient_with_multi-position_color_stops",
                "background-image": "linear-gradient(to right, gray 20%, red 20% 40%, green 40% 60%, blue 60% 80%, gray 80%)",
                /*"bbackground-image": "linear-gradient(to right, gray, gray, red, red, green, green, blue, blue, gray, gray)",
                "abackground-image": "linear-gradient(to right, black 0% 1.19em, red 1.19em 1.9em, black 1.9em 100%)",*/
                "-webkit-background-clip": "text",
                "-moz-background-clip": "text",
                "background-clip": "text",
                color: "transparent"
            },
            "color-invalid": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "rgb(245,158,108)",
                title: "Invalid color format"
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
            // color: "rgb(132, 25, 187)"
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

        init() {
            this.subtype = MindustryLexer?.SET_OP?.type
            this.content = ""
            this.subtypeObject = MindustryLexer?.SET_OP
        }
    }
    static COMMA = class extends Token {
        type = "comma"
    }
    static DOT = class extends Token {
        type = "dot"
    }
    static COLON = class extends Token {
        type = "colon"
    }
    static SEMICOLON = class extends Token {
        type = "semicolon"
    }
    static COMMENT = class extends Token {
        type = "comment"
        subtypeStyle = {
            "multiline": {
                color: "lightgray",
                margin: 0
            },
            "singleline": {
                color: "darkgray",
                margin: 0
            }
        }
    }
    static PHRASE = class extends Token {
        type = "phrase"
        subtypeStyle = {
            "invalid": {
                color: "black",
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "red"
            },
            "keyword-non-optimal-switch": {
                color: "rgb(0, 51, 179)",
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "lightgray",
                title: "Non-optimal switch"
            },
            "keyword": {color: "rgb(0, 51, 179)"},
            "function-call": {"font-style": "italic"},
            "function-declaration": {"font-style": "italic", color: "rgb(0, 97, 125)"},
            "function-param": {
                "text-decoration": "underline",
                "text-decoration-style": "solid",
                "text-decoration-color": "black"
            },
            "function-param-invalid": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "orange",
                title: "Parameter redefinition"
            },
            "variable-invalid-const-assignment": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "red",
                title: "Assignment to a constant variable"
            },
            "variable-invalid-redefinition": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "orange",
                title: "Variable redefinition"
            },
            "variable-invalid-not-defined": {
                "text-decoration": "underline",
                "text-decoration-style": "wavy",
                "text-decoration-color": "rgb(245,158,108)",
                title: "Variable not defined"
            },
            "constant": {color: "rgb(19,218,143)"},
            "default-constant": {color: "rgb(2,88,150)"},
            "default-value": {color: "rgb(31,15,178)"},
            "variable": {color: "rgb(36, 143, 143)"},
            "variable-type": {color: "rgb(97,47,225)"},
            "param": {color: "green"},
            // "label": {color: "lightgreen"}, Cancelled
            "link": {color: "gray", title: "A link to a block. Make sure to link that block to your processor"},
            "*": {color: "rgb(23,208,208)"}
        }
    }
}
