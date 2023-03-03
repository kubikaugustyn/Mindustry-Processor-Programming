var __author__ = "kubik.augustyn@post.cz"

class MindustryTokens {
    static TAB = class extends Token {
        type = "tab"
    }
    static VALUE = class extends Token {
        type = "value"
        style = {
            color: "blue"
        }
    }
    static OPERATOR = class extends Token {
        type = "operator"
        style = {
            color: "magenta"
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
            color: "lightgray"
        }
    }
    static PHRASE = class extends Token {
        type = "phrase"
        style = {
            color: "cyan"
        }
    }
    static KNOWN_PHRASE = class extends Token {
        type = "known-phrase"
        style = {
            color: "magenta"
        }
    }
    static PARAM_PHRASE = class extends Token {
        type = "param-phrase"
        style = {
            color: "green"
        }
    }
}
