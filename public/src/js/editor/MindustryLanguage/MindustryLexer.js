var __author__ = "kubik.augustyn@post.cz"

class MindustryLexer extends Lexer {
    // Characters considered digits of number
    // Fist has value 0, third value 2 etc.
    static DIGITS = "0123456789"
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
         * @type {string}
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
        new MindustryLexer.PAREN("(", "left-paren"),
        new MindustryLexer.PAREN(")", "right-paren", false),
        new MindustryLexer.PAREN("[", "left-bracket"),
        new MindustryLexer.PAREN("]", "left-bracket", false),
        new MindustryLexer.PAREN("{", "left-brace"),
        new MindustryLexer.PAREN("}", "left-brace", false),
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
         * @type {boolean}
         */
        has2inputs

        constructor(chars, type, has2inputs = true) {
            this.chars = chars
            this.type = type
            this.has2inputs = has2inputs
        }

        startsWith(char) {
            return this.chars.startsWith(char)
        }
    }
    static COUNT_OPERATORS = (operators, start) => operators.reduce((prev, curr) => prev + Number(curr.startsWith(start)), 0)
    static OPERATORS = [// Character considered operators
        new MindustryLexer.OPERATOR("+", "plus"),
        new MindustryLexer.OPERATOR("-", "minus"),
        new MindustryLexer.OPERATOR("*", "multiply"),
        new MindustryLexer.OPERATOR("/", "divide"),
        new MindustryLexer.OPERATOR("//", "integer-divide"),
        new MindustryLexer.OPERATOR("%", "modulo"),
        new MindustryLexer.OPERATOR("^", "power"),
        new MindustryLexer.OPERATOR("==", "equal"),
        new MindustryLexer.OPERATOR("not", "not-equal"),
        new MindustryLexer.OPERATOR("and", "logical-AND"),
        new MindustryLexer.OPERATOR("<", "smaller"),
        new MindustryLexer.OPERATOR("<=", "smaller-equal"),
        new MindustryLexer.OPERATOR(">", "greater"),
        new MindustryLexer.OPERATOR(">=", "greater-equal"),
        new MindustryLexer.OPERATOR("===", "strict-equal"),
        new MindustryLexer.OPERATOR("<<", "left-bitshift"),
        new MindustryLexer.OPERATOR(">>", "right-bitshift"),
        new MindustryLexer.OPERATOR("or", "bitwise-OR"),
        new MindustryLexer.OPERATOR("b-and", "bitwise-AND"),
        new MindustryLexer.OPERATOR("xor", "bitwise-XOR"),
        new MindustryLexer.OPERATOR("flip", "bitwise-flip", false),
        new MindustryLexer.OPERATOR("max", "maximum"),
        new MindustryLexer.OPERATOR("min", "minimum"),
        new MindustryLexer.OPERATOR("angle", "angle-vector"),
        new MindustryLexer.OPERATOR("len", "len-vector"),
        new MindustryLexer.OPERATOR("noise", "simplex-noise"),
        new MindustryLexer.OPERATOR("abs", "absolute", false),
        new MindustryLexer.OPERATOR("log", "natural-logarithm", false),
        new MindustryLexer.OPERATOR("log10", "base10-logarithm", false),
        new MindustryLexer.OPERATOR("floor", "floor", false),
        new MindustryLexer.OPERATOR("ceil", "ceil", false),
        new MindustryLexer.OPERATOR("sqrt", "square-root", false),
        new MindustryLexer.OPERATOR("rand", "random", false),
        new MindustryLexer.OPERATOR("sin", "sine", false),
        new MindustryLexer.OPERATOR("cos", "cosine", false),
        new MindustryLexer.OPERATOR("tan", "tangent", false),
        new MindustryLexer.OPERATOR("asn", "arc-sine", false),
        new MindustryLexer.OPERATOR("acos", "arc-cosine", false),
        new MindustryLexer.OPERATOR("atan", "arc-tangent", false)
    ]
    static SET = "=";
    static COMMA = ",";
    static COMMENT = "#";
    static MULTILINE_COMMENT = "*"
    static KNOWN_PHRASES = [
        "if", "else", "while", "for", "link", "of"
    ]
    static PARAM_PHRASE_PREFIX = "@";

    * generateTokens() {
        var limit = 1000
        var loopI = 0
        var num, i
        while (!this.text.done && loopI < limit) {
            var foundToken = true
            if (MindustryLexer.SPACE.includes(this.currentChar)) {
                num = this.getSpacesNum()
                for (i = 0; i < num; i++) this.skipToken()
                if (num % MindustryLexer.SPACE_TAB_SIZE === 0) {
                    for (i = 0; i < Math.floor(num / MindustryLexer.SPACE_TAB_SIZE); i++) {
                        yield new MindustryTokens.TAB
                    }
                }
            } else if (MindustryLexer.TAB.includes(this.currentChar)) {
                num = this.getTabsNum()
                for (i = 0; i < num; i++) {
                    this.skipToken()
                    yield new MindustryTokens.TAB
                }
            } else if (this.currentChar === MindustryLexer.SET) {
                yield new MindustryTokens.SET()
                this.nextToken()
                this.advance()
            } else if (this.currentChar === MindustryLexer.DIGITS_SEP || MindustryLexer.DIGITS.includes(this.currentChar)) {
                yield this.generateNumber()
            } else if (MindustryLexer.OPERATORS.map(op => op.startsWith(this.currentChar)).includes(true)) {
                var operator = this.currentChar, operatorObject
                while (!this.text.done) {
                    this.advance()
                    var nextCount = this.currentChar ? MindustryLexer.COUNT_OPERATORS(MindustryLexer.OPERATORS, operator + this.currentChar) : 0
                    if (nextCount === 0) {
                        operatorObject = MindustryLexer.OPERATORS.filter(op => op.chars === operator)[0]
                        if (operatorObject) {
                            this.nextToken()
                            for (i = 0; i < operator.length - 1; i++) this.keepToken()
                            yield new MindustryTokens.OPERATOR(operatorObject?.type, "", operatorObject)
                        } else {
                            this.text.undo(operator.length + 1)
                            this.advance()
                            foundToken = false
                        }
                        break
                    } else if (this.currentChar) {
                        operator += this.currentChar
                    } else {
                        console.log("Ran out of characters!")
                        operatorObject = MindustryLexer.OPERATORS.filter(op => op.chars === operator)[0]
                        yield new MindustryTokens.OPERATOR(operatorObject?.type, "", operatorObject)
                        break
                    }
                }
            } else if (MindustryLexer.PARENS.map(par => par.char === this.currentChar).includes(true)) {
                var paren = MindustryLexer.PARENS.filter(par => par.char === this.currentChar)[0]
                yield new MindustryTokens.PAREN(paren.type, "", paren)
                this.nextToken()
                this.advance()
            } else if (MindustryLexer.NEWLINE.includes(this.currentChar)) {
                yield this.generateNewline()
            } else if (MindustryLexer.STRINGS.includes(this.currentChar)) {
                yield this.generateString()
            } else if (this.currentChar === MindustryLexer.COMMA) {
                yield new MindustryTokens.COMMA()
                this.nextToken()
                this.advance()
            } else if (this.currentChar === MindustryLexer.COMMENT) {
                yield this.generateComment()
            } else {
                foundToken = false
            }
            if (!foundToken) {
                var [phrase, countSkip] = this.generateToSpaceOrToken()
                if (!phrase) continue
                var comma = false
                if (phrase.endsWith(MindustryLexer.COMMA)) {
                    comma = true
                    phrase = phrase.slice(0, -1)
                }
                if (phrase.startsWith(MindustryLexer.PARAM_PHRASE_PREFIX)) yield new MindustryTokens.PARAM_PHRASE("", phrase)
                else if (MindustryLexer.KNOWN_PHRASES.includes(phrase)) yield new MindustryTokens.KNOWN_PHRASE("", phrase)
                else yield new MindustryTokens.PHRASE("", phrase)
                this.nextToken()
                for (i = 0; i < phrase.length - 1; i++) this.keepToken()
                if (comma) {
                    yield new MindustryTokens.COMMA()
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

    generateNumber() {
        var decimal_point_count = 0
        var number_str = this.currentChar
        this.advance()
        this.nextToken()

        while (!this.text.done && (this.currentChar === MindustryLexer.DIGITS_SEP || MindustryLexer.DIGITS.includes(this.currentChar))) {
            if (this.currentChar === MindustryLexer.DIGITS_SEP) {
                decimal_point_count++
                if (decimal_point_count > 1) break
            }

            number_str += this.currentChar
            this.advance()
            this.keepToken()
        }

        if (number_str.startsWith(MindustryLexer.DIGITS_SEP)) number_str = MindustryLexer.DIGITS[0] + number_str
        if (number_str.endsWith(MindustryLexer.DIGITS_SEP)) number_str += MindustryLexer.DIGITS[0]

        var value = parseFloat(number_str)
        if (this.currentChar === MindustryLexer.DIGITS_POWER) { // 6.8E10 to 68000000000 (6.8 * 10^10)
            this.advance()
            this.keepToken()
            var to_power_of_ten = Number(this.generateNumber().content)
            value = value * (10 ** to_power_of_ten)
        }
        return new MindustryTokens.VALUE("number", value)
    }

    generateNewline() {
        while (MindustryLexer.NEWLINE.includes(this.currentChar)) {
            this.advance()
            this.skipToken()
        }
        return new MindustryTokens.NEWLINE
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

        return new MindustryTokens.VALUE("string", text)
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
            if (MindustryLexer.NEWLINE.includes(this.currentChar) && !multiline) {
                this.advance()
                this.keepToken()
                break
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

        return new MindustryTokens.COMMENT("", comment)
    }

    generateToSpaceOrToken() {
        var text = this.currentChar
        this.advance()

        while (!this.text.done && !MindustryLexer.SPACE.includes(this.currentChar) && !MindustryLexer.NEWLINE.includes(this.currentChar) && !MindustryLexer.PARENS.map(par => par.char === this.currentChar).includes(true)) {
            console.log(`'${this.currentChar}'`)
            text += this.currentChar
            this.advance()
        }

        var num = this.getSpacesNum()
        return [text, num]
    }
}
