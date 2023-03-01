var __author__ = "kubik.augustyn@post.cz"

class MindustryTokens {
    static TAB = class extends Token {
        type = "tab"
    }
    static VALUE = class extends Token {
        type = "value"
    }
    static OPERATOR = class extends Token {
        type = "operator"
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
    }
    static PHRASE = class extends Token {
        type = "phrase"
    }
}
