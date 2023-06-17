var __author__ = "kubik.augustyn@post.cz"

class MindustryLexer extends Lexer {
    // Characters considered digits of number
    // Fist has value 0, third value 2 etc.
    static DIGITS = "0123456789"
    static HEX_DIGITS = "0123456789abcdef"
    static HEX_ANNOTATION = "0x" // 0xff
    static COLOR_ANNOTATION = "0c" // %00ff00ff
    static DIGITS_SEP = "." // 5.2
    static DIGITS_POWER = "E" // 6.8E10 to 68000000000 (6.8 * 10^10)
    static SPACE = " " // Character considered space
    static SPACE_TAB_SIZE = 4 // Number of space characters considered tab
    static TAB = "\t" // Character considered tab
    static NEWLINE = ["\r\n", "\n", "\r"] // Characters considered newline
    static STRINGS = ["'", '"'] // Character considered string
    static MULTILINE_STRING = "*" // Character considered multiline string prefix
    static PAREN = class Paren {
        /**
         * @type {string}
         */
        char
        /**
         * @type {string} Warning, type must be same for opening and closing parens
         */
        type
        /**
         * @type {boolean}
         */
        opening

        constructor(char, type, opening = true) {
            this.char = char
            this.type = type
            this.opening = opening
        }
    }
    static PARENS = [// Character considered parens
        new MindustryLexer.PAREN("(", "paren"),
        new MindustryLexer.PAREN(")", "paren", false),
        new MindustryLexer.PAREN("[", "bracket"),
        new MindustryLexer.PAREN("]", "bracket", false),
        new MindustryLexer.PAREN("{", "brace"),
        new MindustryLexer.PAREN("}", "brace", false),
    ]
    static OPERATOR = class Operator {
        /**
         * @type {string}
         */
        chars
        /**
         * @type {string}
         */
        type
        /**
         * @type {string}
         */
        processorString
        /**
         * @type {boolean}
         */
        has2inputs
        /**
         * @type {number}
         */
        precedence

        constructor(chars, type, has2inputs = true, precedence = 0) {
            this.chars = chars
            this.type = type
            this.has2inputs = has2inputs
            this.precedence = precedence
        }

        proc(processorString) {
            if (processorString) this.processorString = processorString
            return this
        }

        startsWith(char) {
            return this.chars.startsWith(char)
        }

        prec(precedence) {
            this.precedence = precedence
            return this
        }
    }
    static COUNT_OPERATORS = (operators, start) => operators.reduce((prev, curr) => prev + Number(curr.startsWith(start)), 0)
    static OPERATORS = [// Character considered operators
        new MindustryLexer.OPERATOR("+", "plus").prec(20).proc("add"),
        new MindustryLexer.OPERATOR("-", "minus").prec(20).proc("sub"),
        new MindustryLexer.OPERATOR("*", "multiply").prec(10).proc("mul"),
        new MindustryLexer.OPERATOR("/", "divide").prec(10).proc("div"),
        new MindustryLexer.OPERATOR("//", "integer-divide").proc("idiv"),
        new MindustryLexer.OPERATOR("%", "modulo").prec(10).proc("mod"),
        new MindustryLexer.OPERATOR("^", "power").proc("pow"),
        new MindustryLexer.OPERATOR("==", "equal").prec(40).proc("equal"),
        new MindustryLexer.OPERATOR("not", "not-equal").prec(40).proc("notEqual"),
        new MindustryLexer.OPERATOR("and", "logical-AND").proc("land"),
        new MindustryLexer.OPERATOR("<", "smaller").prec(40).proc("lessThan"),
        new MindustryLexer.OPERATOR("<=", "smaller-equal").prec(40).proc("lessThanEq"),
        new MindustryLexer.OPERATOR(">", "greater").prec(40).proc("greaterThan"),
        new MindustryLexer.OPERATOR(">=", "greater-equal").prec(40).proc("greaterThanEq"),
        new MindustryLexer.OPERATOR("===", "strict-equal").prec(40).proc("strictEqual"),
        new MindustryLexer.OPERATOR("<<", "left-bitshift").proc("shl"),
        new MindustryLexer.OPERATOR(">>", "right-bitshift").proc("shr"),
        new MindustryLexer.OPERATOR("or", "bitwise-OR").proc("or"),
        new MindustryLexer.OPERATOR("b-and", "bitwise-AND").proc("and"),
        new MindustryLexer.OPERATOR("xor", "bitwise-XOR").proc("xor"),
        new MindustryLexer.OPERATOR("flip", "bitwise-flip", false).proc("not"),
        new MindustryLexer.OPERATOR("max", "maximum").proc("max"),
        new MindustryLexer.OPERATOR("min", "minimum").proc("min"),
        new MindustryLexer.OPERATOR("angle", "angle-vector").proc("angle"),
        new MindustryLexer.OPERATOR("len", "len-vector").proc("len"),
        new MindustryLexer.OPERATOR("noise", "simplex-noise").proc("noise"),
        new MindustryLexer.OPERATOR("abs", "absolute", false).proc("abs"),
        new MindustryLexer.OPERATOR("log", "natural-logarithm", false).proc("log"),
        new MindustryLexer.OPERATOR("log10", "base10-logarithm", false).proc("log10"),
        new MindustryLexer.OPERATOR("floor", "floor", false).proc("floor"),
        new MindustryLexer.OPERATOR("ceil", "ceil", false).proc("ceil"),
        new MindustryLexer.OPERATOR("sqrt", "square-root", false).proc("sqrt"),
        new MindustryLexer.OPERATOR("rand", "random", false).proc("rand"),
        new MindustryLexer.OPERATOR("sin", "sine", false).proc("sin"),
        new MindustryLexer.OPERATOR("cos", "cosine", false).proc("cos"),
        new MindustryLexer.OPERATOR("tan", "tangent", false).proc("tan"),
        new MindustryLexer.OPERATOR("asn", "arc-sine", false).proc("asin"),
        new MindustryLexer.OPERATOR("acos", "arc-cosine", false).proc("acos"),
        new MindustryLexer.OPERATOR("atan", "arc-tangent", false).proc("atan"),
        new MindustryLexer.OPERATOR("of", "of").prec(10) // Custom, @maxItems of smelter1
    ]
    static SET_OP = new MindustryLexer.OPERATOR("=", "set").prec(Infinity);
    static BOOLEAN = ["true", "false"]
    static SET = "=";
    static COMMA = ",";
    static COMMENT = "#";
    static MULTILINE_COMMENT = "*"
    /*static KNOWN_PHRASES = [
        "if", "else", "elif", "while", "for",
        "read", "write",
        "draw.clear", "draw.color", "draw.col", "draw.stroke", "draw.line", "draw.rect", "draw.lineRect", "draw.poly", "draw.linePoly", "draw.triangle", "draw.image",
        "print",
        "drawflush", "printflush", "getlink",
        "control.enabled", "control.shoot", "control.shootp", "control.config", "control.color",
        "radar", "any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground", "distance", "health", "shield", "armor", "maxHealth",
        "of",
        "lookup.block", "lookup.unit", "lookup.item", "lookup.liquid",
        "packcolor",
        "wait", "stop", "end",
        "jump",
        "ubind",
        "ucontrol.idle", "ucontrol.stop", "ucontrol.move", "ucontrol.approach", "ucontrol.boost", "ucontrol.target", "ucontrol.targetp", "ucontrol.itemDrop", "ucontrol.itemTake", "ucontrol.payDrop", "ucontrol.payTake", "ucontrol.payEnter", "ucontrol.payEnterIfIn", "ucontrol.mine", "ucontrol.flag", "ucontrol.build", "ucontrol.getBlock", "ucontrol.within", "ucontrol.unbind",
        "uradar", "any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground", "distance", "health", "shield", "armor", "maxHealth",
        "ulocate.ore", "ulocate.building", "ulocate.spawn", "ulocate.damaged"
    ]*/
    static PARAM_PHRASE_PREFIX = "@"
    static LABEL_PHRASE_PREFIX = ":"
    static VALIDATE_PHRASE = function (phrase) {
        if (phrase.includes(MindustryLexer.PARAM_PHRASE_PREFIX)) {
            return /^[a-zA-Z0-9.-]+$/.test(phrase.slice(1)) && phrase.startsWith(MindustryLexer.PARAM_PHRASE_PREFIX)
        }
        if (phrase.includes(MindustryLexer.LABEL_PHRASE_PREFIX)) {
            return /^[a-zA-Z0-9.-]+$/.test(phrase.slice(1)) && phrase.startsWith(MindustryLexer.LABEL_PHRASE_PREFIX)
        }
        return /^[a-zA-Z0-9.-_]+$/.test(phrase)
    }
    static VALIDATE_PHRASE_CHAR = function (char) {
        return /[a-zA-Z0-9.@-_]/.test(char) || MindustryLexer.PARAM_PHRASE_PREFIX.includes(char) || MindustryLexer.LABEL_PHRASE_PREFIX.includes(char)
    };

    * generateTokens() {
        var limit = 10000
        var notFoundTokenCountLimit = 100
        var loopI = 0
        var num, i, operator, phrase, countSkip, notFoundTokenCount = 0
        while (!this.text.done && loopI < limit) {
            var foundToken = true
            if (MindustryLexer.SPACE.includes(this.currentChar)) {
                num = this.getSpacesNum()
                for (i = 0; i < num; i++) this.skipToken()
                if (num % MindustryLexer.SPACE_TAB_SIZE === 0) {
                    for (i = 0; i < Math.floor(num / MindustryLexer.SPACE_TAB_SIZE); i++) {
                        yield this.createToken(MindustryTokens.TAB)
                    }
                }
            } else if (MindustryLexer.TAB.includes(this.currentChar)) {
                num = this.getTabsNum()
                for (i = 0; i < num; i++) {
                    this.skipToken()
                    yield this.createToken(MindustryTokens.TAB)
                }
            } else if (this.currentChar === MindustryLexer.DIGITS_SEP || MindustryLexer.DIGITS.includes(this.currentChar)) {
                yield this.generateNumber()
            } else if (MindustryLexer.OPERATORS.find(op => op.startsWith(this.currentChar))) {
                [operator, countSkip] = this.generateToSpaceOrToken()
                var operatorObject = MindustryLexer.OPERATORS.find(op => op.chars === operator)
                if (operatorObject) {
                    this.nextToken()
                    for (i = 0; i < operator.length - 1; i++) this.keepToken()
                    for (i = 0; i < countSkip; i++) this.skipToken()
                    yield this.createToken(MindustryTokens.OPERATOR, operatorObject?.type, "", operatorObject)
                } else {
                    if (operator === MindustryLexer.SET) {
                        yield this.createToken(MindustryTokens.SET)
                        this.nextToken()
                        for (i = 0; i < countSkip; i++) this.skipToken()
                    } else {
                        this.text.undo(operator.length + 1 + countSkip)
                        this.advance()
                        foundToken = false
                    }
                }
            } else if (this.currentChar === MindustryLexer.SET) {
                yield this.createToken(MindustryTokens.SET)
                this.nextToken()
                this.advance()
            } else if (MindustryLexer.PARENS.map(par => par.char === this.currentChar).includes(true)) {
                var paren = MindustryLexer.PARENS.filter(par => par.char === this.currentChar)[0]
                yield this.createToken(MindustryTokens.PAREN, paren.type, "", paren)
                this.nextToken()
                this.advance()
            } else if (MindustryLexer.NEWLINE.includes(this.currentChar)) {
                yield this.generateNewline()
            } else if (MindustryLexer.STRINGS.includes(this.currentChar)) {
                yield this.generateString()
            } else if (this.currentChar === MindustryLexer.COMMA) {
                yield this.createToken(MindustryTokens.COMMA)
                this.nextToken()
                this.advance()
            } else if (this.currentChar === MindustryLexer.COMMENT) {
                yield this.generateComment()
            } else {
                foundToken = false
            }
            if (!foundToken) {
                [phrase, countSkip] = this.generatePhrase()
                if (!phrase) {
                    throw new Error(`Illegal non-alphanumeric or @ or . character in phrase.`)
                    /*notFoundTokenCount++
                    if (notFoundTokenCount >= notFoundTokenCountLimit) throw new class extends Error {
                        name = "MindustryLexerTokenError"
                        message = "No token was identified, error thrown to prevent infinite loop"
                    }
                    continue*/
                }
                var comma = false
                if (phrase.endsWith(MindustryLexer.COMMA)) {
                    comma = true
                    phrase = phrase.slice(0, -1)
                }
                // if (!MindustryLexer.VALIDATE_PHRASE(phrase)) throw new Error(`Illegal non-alphanumeric or @ or . character in '${phrase}' phrase.`)
                if (phrase.startsWith(MindustryLexer.PARAM_PHRASE_PREFIX)) yield this.createToken(MindustryTokens.PHRASE, "param", phrase)
                else if (phrase.startsWith(MindustryLexer.LABEL_PHRASE_PREFIX)) yield this.createToken(MindustryTokens.PHRASE, "label", phrase)
                else if (MindustryLexer.BOOLEAN.includes(phrase)) yield this.createToken(MindustryTokens.VALUE, "boolean", phrase)
                // else if (MindustryLexer.KNOWN_PHRASES.includes(phrase)) yield this.createToken(MindustryTokens.KNOWN_PHRASE, "", phrase)
                else if (MindustryLexer.DIGITS.includes(phrase.slice(-1))) yield this.createToken(MindustryTokens.PHRASE, "link", phrase)
                else yield this.createToken(MindustryTokens.PHRASE, "", phrase)
                this.nextToken()
                for (i = 0; i < phrase.length - 1; i++) this.keepToken()
                if (comma) {
                    yield this.createToken(MindustryTokens.COMMA)
                    this.nextToken()
                }
                for (i = 0; i < countSkip; i++) this.skipToken()
                /*console.log(`'${this.currentChar}'`)
                throw new class extends Error {
                    name = "MindustryLexerTokenError"
                    message = "No token was identified, error thrown to prevent infinite loop"
                }*/
            }
            loopI++
        }
    }

    /**
     * @param type {(subtype: string, content: any, subtypeObject: any)=>Token}
     * @param args {any}
     * @returns {Token}
     */
    createToken(type, ...args) {
        var token = args ? new type(...args) : new type("", undefined, undefined)
        token.atLine(this.lineNumber)
        return token
    }

    getSpacesNum() {
        var num = 0
        while (!this.text.done && MindustryLexer.SPACE.includes(this.currentChar)) {
            num += 1
            this.advance()
        }
        return num
    }

    getTabsNum() {
        var num = 0
        while (!this.text.done && MindustryLexer.TAB === this.currentChar) {
            num += 1
            this.advance()
        }
        return num
    }

    generateNumber(nextToken = true) {
        var decimal_point_count = 0
        var number_str = this.currentChar
        var isHex = false
        var isColor = false
        this.advance()
        nextToken ? this.nextToken() : this.keepToken()

        while (!this.text.done && (
            (isHex ? false : this.currentChar === MindustryLexer.DIGITS_SEP) ||
            (isHex ? MindustryLexer.HEX_DIGITS : MindustryLexer.DIGITS).includes(this.currentChar.toLowerCase()) ||
            (isHex ? false : this.currentChar === MindustryLexer.HEX_ANNOTATION[1]) ||
            (isHex ? false : this.currentChar === MindustryLexer.COLOR_ANNOTATION[1])
        )) {
            if (this.currentChar === MindustryLexer.DIGITS_SEP) {
                decimal_point_count++
                if (decimal_point_count > 1) break
            }

            number_str += this.currentChar
            this.advance()
            this.keepToken()

            if (number_str === MindustryLexer.HEX_ANNOTATION || number_str === MindustryLexer.COLOR_ANNOTATION) isHex = true
            if (number_str === MindustryLexer.COLOR_ANNOTATION) isColor = true
        }

        if (number_str.startsWith(MindustryLexer.DIGITS_SEP)) number_str = MindustryLexer.DIGITS[0] + number_str
        if (number_str.endsWith(MindustryLexer.DIGITS_SEP)) number_str += MindustryLexer.DIGITS[0]
        var value = isHex ? number_str : parseFloat(number_str)
        if (!isHex && this.currentChar === MindustryLexer.DIGITS_POWER) { // 6.8E10 to 68000000000 (6.8 * 10^10)
            this.advance()
            this.keepToken()
            var to_power_of_ten = Number(this.generateNumber(false).content)
            value = value * (10 ** to_power_of_ten)
        }
        return isColor ? this.createToken(MindustryTokens.VALUE, (number_str.length === 10) ? "color" : "color-invalid", number_str) :
            this.createToken(MindustryTokens.VALUE, isHex ? "hex-number" : "number", value)
    }

    generateNewline() {
        while (MindustryLexer.NEWLINE.includes(this.currentChar)) {
            this.advance()
            this.skipToken()
        }
        var token = this.createToken(MindustryTokens.NEWLINE)
        this.newline()
        return token
    }

    generateString() {
        var beginning = this.currentChar
        var text = ''
        this.advance()
        this.nextToken()
        var multiline = false
        if (this.currentChar === MindustryLexer.MULTILINE_STRING) {
            this.advance()
            this.keepToken()
            beginning = this.currentChar
            multiline = true
        }

        while (!this.text.done) {
            if (this.currentChar === beginning && !multiline) {
                this.advance()
                this.keepToken()
                break
            }
            if (this.currentChar === MindustryLexer.MULTILINE_STRING && !multiline) {
                this.advance()
                this.keepToken()
                if (this.currentChar === beginning) {
                    this.advance()
                    this.keepToken()
                    break
                } else text += MindustryLexer.MULTILINE_STRING + this.currentChar
            } else text += this.currentChar

            this.advance()
            this.keepToken()
        }

        return this.createToken(MindustryTokens.VALUE, "string", text)
    }

    generateComment() {
        var comment = ''
        this.advance()
        this.nextToken()
        var multiline
        if (this.currentChar === MindustryLexer.COMMENT) multiline = false
        else if (this.currentChar === MindustryLexer.MULTILINE_COMMENT) multiline = true
        else throw new Error(`Illegal '${this.currentChar}' after ${MindustryLexer.COMMENT} comment beginning`)
        this.advance()
        this.keepToken()

        while (!this.text.done) {
            if (MindustryLexer.NEWLINE.includes(this.currentChar)) {
                if (!multiline) break
                this.newline()
                comment += this.currentChar
            } else if (this.currentChar === MindustryLexer.MULTILINE_COMMENT && multiline) {
                this.advance()
                this.keepToken()
                if (this.currentChar === MindustryLexer.COMMENT) {
                    this.advance()
                    this.keepToken()
                    break
                } else comment += MindustryLexer.MULTILINE_COMMENT + this.currentChar
            } else comment += this.currentChar

            this.advance()
            this.keepToken()
        }

        return this.createToken(MindustryTokens.COMMENT, multiline ? "multiline" : "singleline", comment)
    }

    generateToSpaceOrToken() {
        var text = this.currentChar
        this.advance()

        while (!this.text.done && !MindustryLexer.SPACE.includes(this.currentChar) && !MindustryLexer.NEWLINE.includes(this.currentChar) && !MindustryLexer.PARENS.map(par => par.char === this.currentChar).includes(true)) {
            // console.log(`'${this.currentChar}'`)
            text += this.currentChar
            this.advance()
        }

        var num = this.getSpacesNum()
        return [text, num]
    }

    generatePhrase() {
        var text = ""
        var phraseLen = 0

        while (!this.text.done && MindustryLexer.VALIDATE_PHRASE_CHAR(this.currentChar)) {
            // console.log(`'${this.currentChar}'`)
            text += this.currentChar
            this.advance()
            phraseLen++
        }

        if (!phraseLen) console.warn(`While generating phrase, encountered '${this.currentChar}' invalid character at the beginning.`)

        var num = this.getSpacesNum()
        return [text, num]
    }
}
