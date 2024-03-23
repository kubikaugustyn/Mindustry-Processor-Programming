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
    static SINGLE_CHARS = {
        ".": MindustryTokens.DOT,// Character considered dot
        ":": MindustryTokens.COLON,// Character considered colon
        ";": MindustryTokens.SEMICOLON// Character considered semicolon
    }
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
    // static COUNT_OPERATORS = (operators, start) => operators.reduce((prev, curr) => prev + Number(curr.startsWith(start)), 0)
    // https://github.com/kubikaugustyn/KUtil/blob/09ca67a0f7a7f669b5ae8f9e19b0006369f84e83/kutil/language/languages/javascript/JSParser.py#L104-L129
    static OPERATORS = [
        // Characters considered operators
        new MindustryLexer.OPERATOR("or", "or").prec(1), // Custom, a > 8 or b > 8
        new MindustryLexer.OPERATOR("and", "logical-AND").prec(2).proc("land"),
        new MindustryLexer.OPERATOR("|", "bitwise-OR").prec(3).proc("or"),
        new MindustryLexer.OPERATOR("^", "bitwise-XOR").prec(4).proc("xor"),
        new MindustryLexer.OPERATOR("&", "bitwise-AND").prec(5).proc("and"),
        new MindustryLexer.OPERATOR("==", "equal").prec(6).proc("equal"),
        new MindustryLexer.OPERATOR("!=", "not-equal").prec(6).proc("notEqual"),
        new MindustryLexer.OPERATOR("===", "strict-equal").prec(6).proc("strictEqual"),
        new MindustryLexer.OPERATOR("<", "smaller").prec(7).proc("lessThan"),
        new MindustryLexer.OPERATOR(">", "greater").prec(7).proc("greaterThan"),
        new MindustryLexer.OPERATOR("<=", "smaller-equal").prec(7).proc("lessThanEq"),
        new MindustryLexer.OPERATOR(">=", "greater-equal").prec(7).proc("greaterThanEq"),
        new MindustryLexer.OPERATOR("of", "of").prec(7), // Custom, @sand in smelter1 - bendn wanted it, so it's grammatically correct
        new MindustryLexer.OPERATOR("in", "in").prec(7), // Custom, @maxItems of smelter1
        new MindustryLexer.OPERATOR("<<", "left-bitshift").prec(8).proc("shl"),
        new MindustryLexer.OPERATOR(">>", "right-bitshift").prec(8).proc("shr"),
        new MindustryLexer.OPERATOR("+", "plus").prec(9).proc("add"),
        new MindustryLexer.OPERATOR("-", "minus").prec(9).proc("sub"),
        new MindustryLexer.OPERATOR("*", "multiply").prec(11).proc("mul"),
        new MindustryLexer.OPERATOR("/", "divide").prec(11).proc("div"),
        new MindustryLexer.OPERATOR("//", "integer-divide").prec(11).proc("idiv"),
        new MindustryLexer.OPERATOR("%", "modulo").prec(11).proc("mod"),
        new MindustryLexer.OPERATOR("**", "power").prec(12).proc("pow"),
        new MindustryLexer.OPERATOR("~", "bitwise-flip", false).prec(13).proc("not"),
        new MindustryLexer.OPERATOR("max", "maximum").prec(14).proc("max"),
        new MindustryLexer.OPERATOR("min", "minimum").prec(14).proc("min"),
        new MindustryLexer.OPERATOR("angle", "angle-vector").prec(14).proc("angle"),
        new MindustryLexer.OPERATOR("angle-diff", "angle-difference-vector").prec(14).proc("angleDiff"),
        new MindustryLexer.OPERATOR("len", "len-vector").prec(14).proc("len"),
        new MindustryLexer.OPERATOR("noise", "simplex-noise").prec(14).proc("noise"),
        new MindustryLexer.OPERATOR("abs", "absolute", false).prec(14).proc("abs"),
        new MindustryLexer.OPERATOR("log", "natural-logarithm", false).prec(14).proc("log"),
        new MindustryLexer.OPERATOR("log10", "base10-logarithm", false).prec(14).proc("log10"),
        new MindustryLexer.OPERATOR("floor", "floor", false).prec(14).proc("floor"),
        new MindustryLexer.OPERATOR("ceil", "ceil", false).prec(14).proc("ceil"),
        new MindustryLexer.OPERATOR("sqrt", "square-root", false).prec(14).proc("sqrt"),
        new MindustryLexer.OPERATOR("rand", "random", false).prec(14).proc("rand"),
        new MindustryLexer.OPERATOR("sin", "sine", false).prec(14).proc("sin"),
        new MindustryLexer.OPERATOR("cos", "cosine", false).prec(14).proc("cos"),
        new MindustryLexer.OPERATOR("tan", "tangent", false).prec(14).proc("tan"),
        new MindustryLexer.OPERATOR("asin", "arc-sine", false).prec(14).proc("asin"),
        new MindustryLexer.OPERATOR("acos", "arc-cosine", false).prec(14).proc("acos"),
        new MindustryLexer.OPERATOR("atan", "arc-tangent", false).prec(14).proc("atan"),
    ]
    static SET_OP = new MindustryLexer.OPERATOR("=", "set").prec(0);
    static BOOLEAN = {"true": true, "false": false}
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
    // static LABEL_PHRASE_PREFIX = ":" Cancelled
    static VALIDATE_PHRASE_CHAR = function (char) {
        return /[a-zA-Z0-9π.@\-_]/.test(char) || MindustryLexer.PARAM_PHRASE_PREFIX.includes(char)// || MindustryLexer.LABEL_PHRASE_PREFIX.includes(char)
    }
    /**
     * @type {{from:number,to:number}|undefined}
     */
    forceRange;

    /**
     * @return {Generator<Token>}
     */
    * generateTokens() {
        var limit = 10000
        var loopI = 0
        var num, i, operator
        while (!this.text.done && loopI < limit) {
            // console.group("Iteration #" + loopI)
            var foundToken = true
            if (MindustryLexer.SPACE.includes(this.currentChar)) {
                num = this.getSpacesNum()
                if (num % MindustryLexer.SPACE_TAB_SIZE === 0) {
                    for (i = 0; i < Math.floor(num / MindustryLexer.SPACE_TAB_SIZE); i++) {
                        this.startRange()
                        this.advanceBy(MindustryLexer.SPACE_TAB_SIZE)
                        this.endRange()
                        yield this.createToken(MindustryTokens.TAB)
                    }
                } else {
                    this.advanceBy(num, true)
                }
            } else if (MindustryLexer.TAB.startsWith(this.currentChar)) {
                num = this.getTabsNum()
                for (i = 0; i < num; i++) {
                    this.startRange()
                    this.advanceBy(MindustryLexer.TAB.length)
                    this.endRange()
                    yield this.createToken(MindustryTokens.TAB)
                }
            } else if (this.currentChar in MindustryLexer.SINGLE_CHARS) {
                var type = MindustryLexer.SINGLE_CHARS[this.currentChar]
                this.startRange()
                this.advance()
                this.endRange()
                yield this.createToken(type)
            } else if (MindustryLexer.DIGITS.includes(this.currentChar)) {
                yield this.generateNumber()
            } else if (MindustryLexer.OPERATORS.find(op => op.startsWith(this.currentChar))) {
                operator = this.generateOperator()
                if (!operator) foundToken = false
                else {
                    if (operator === MindustryLexer.SET_OP) yield this.createToken(MindustryTokens.SET)
                    else yield this.createToken(MindustryTokens.OPERATOR, operator.type, operator.chars, operator)
                }
            } else if (this.currentChar === MindustryLexer.SET) {
                console.log("When is this reached when this.generateOperator() should handle it?")
                this.startRange()
                this.advance()
                this.endRange()
                yield this.createToken(MindustryTokens.SET)
            } else if (MindustryLexer.PARENS.map(par => par.char === this.currentChar).includes(true)) {
                var paren = MindustryLexer.PARENS.filter(par => par.char === this.currentChar)[0]
                this.startRange()
                this.advance()
                this.endRange()
                yield this.createToken(MindustryTokens.PAREN, paren.type, paren.char, paren)
            } else if (MindustryLexer.NEWLINE.includes(this.currentChar)) {
                yield* this.generateNewlines()
            } else if (MindustryLexer.STRINGS.includes(this.currentChar)) {
                yield this.generateString()
            } else if (this.currentChar === MindustryLexer.COMMA) {
                this.startRange()
                this.advance()
                this.endRange()
                yield this.createToken(MindustryTokens.COMMA)
            } else if (this.currentChar === MindustryLexer.COMMENT) {
                yield this.generateComment()
            } else {
                foundToken = false
            }
            if (!foundToken) {
                var {phrase, phraseRange, comma, commaRange} = this.generatePhrase()
                this.forceRange = phraseRange
                if (phrase.startsWith(MindustryLexer.PARAM_PHRASE_PREFIX)) yield this.createToken(MindustryTokens.PHRASE, "param", phrase)
                // else if (phrase.startsWith(MindustryLexer.LABEL_PHRASE_PREFIX)) yield this.createToken(MindustryTokens.PHRASE, "label", phrase) Cancelled
                // else if (MindustryCompiler.DEFAULT_CONSTANTS.find(a => a.name === phrase)) yield this.createToken(MindustryTokens.PHRASE, "constant", phrase)
                else if (phrase in MindustryLexer.BOOLEAN) yield this.createToken(MindustryTokens.VALUE, "boolean", MindustryLexer.BOOLEAN[phrase])
                else if (phrase === "null") yield this.createToken(MindustryTokens.VALUE, "null", null)
                // else if (MindustryLexer.KNOWN_PHRASES.includes(phrase)) yield this.createToken(MindustryTokens.KNOWN_PHRASE, "", phrase)
                else if (this.checkPhraseLink(phrase)) yield this.createToken(MindustryTokens.PHRASE, "link", phrase)
                else yield this.createToken(MindustryTokens.PHRASE, "", phrase)

                if (comma) {
                    this.forceRange = commaRange
                    yield this.createToken(MindustryTokens.COMMA)
                }
            }
            loopI++
            // console.groupEnd()
        }
        if (loopI === limit) {
            throw new Error("Infinite loop limit while lexing reached")
        }
    }

    /**
     * @param phrase {string}
     * @returns {boolean}
     */
    checkPhraseLink(phrase) {
        if (!MindustryLexer.DIGITS.includes(phrase.slice(-1))) return false
        while (phrase.length && MindustryLexer.DIGITS.includes(phrase.slice(-1))) {
            // Remove the digits
            phrase = phrase.slice(0, -1)
        }
        // Check if it's a block that can be a link
        return !!ProcessorTypes.ALL_BLOCKS.find(a => a.split("-").at(-1) === phrase);
    }

    /**
     * @param type {(subtype: string, content: any, subtypeObject: any)=>Token}
     * @param args {any}
     * @returns {Token}
     */
    createToken(type, ...args) {
        var token = args ? new type(...args) : new type("", undefined, undefined)
        token.atLine(this.lineNumber)
        /**
         * @type {{from:number,to:number}}
         */
        var range
        if (this.forceRange) {
            range = this.forceRange;
            this.forceRange = undefined
        } else range = this.range
        token.atRange(range.from, range.to)
        return token
    }

    getSpacesNum() {
        var num = 0
        while (!this.text.peekDone(num)) {
            if (!MindustryLexer.SPACE.includes(this.text.peek(num))) break
            num += 1
        }
        return num
    }

    getTabsNum() {
        var num = 0
        while (!this.text.peekDone(num)) {
            if (MindustryLexer.TAB !== this.text.peek(num)) break
            num += 1
        }
        return num
    }

    generateNumber(nextToken = true) {
        var decimal_point_count = 0
        var number_str = this.currentChar
        var isHex = false
        var isColor = false
        nextToken && this.startRange()
        this.advance()

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

            if (number_str === MindustryLexer.HEX_ANNOTATION || number_str === MindustryLexer.COLOR_ANNOTATION) isHex = true
            if (number_str === MindustryLexer.COLOR_ANNOTATION) isColor = true
        }

        if (number_str.startsWith(MindustryLexer.DIGITS_SEP)) number_str = MindustryLexer.DIGITS[0] + number_str
        if (number_str.endsWith(MindustryLexer.DIGITS_SEP)) number_str += MindustryLexer.DIGITS[0]
        var value = isHex ? number_str : parseFloat(number_str)
        if (!isHex && this.currentChar === MindustryLexer.DIGITS_POWER) { // 6.8E10 to 68000000000 (6.8 * 10^10)
            this.advance()
            var to_power_of_ten = Number(this.generateNumber(false).content)
            value = value * (10 ** to_power_of_ten)
        }
        nextToken && this.endRange()
        return isColor ? this.createToken(MindustryTokens.VALUE, (number_str.length === 10) ? "color" : "color-invalid", number_str) :
            this.createToken(MindustryTokens.VALUE, isHex ? "hex-number" : "number", value)
    }

    /**
     * @return {Generator<Token>}
     */
    * generateNewlines() {
        while (MindustryLexer.NEWLINE.includes(this.currentChar)) {
            this.startRange()
            this.newline()
            var newlineType = this.currentChar
            if (!this.text.peekDone(1) && MindustryLexer.NEWLINE.includes(newlineType + this.text.peek(1))) {
                // Check for CRLF
                this.advance()
                newlineType += this.currentChar
            }
            this.advance()
            this.endRange()

            yield this.createToken(MindustryTokens.NEWLINE, null, newlineType)
        }
    }

    generateString() {
        // One line: "HI" or 'HI'
        // Multiline: "*HI*" or '*HI*'
        var beginning = this.currentChar // Either ' or "
        var text = ''
        this.startRange()
        this.advance()
        var multiline = false
        if (this.currentChar === MindustryLexer.MULTILINE_STRING) {
            this.advance()
            multiline = true
        }

        while (true) {
            if (this.currentChar === beginning && !multiline) {
                this.advance()
                break
            }
            if (MindustryLexer.NEWLINE.includes(this.currentChar) && !multiline)
                throw new Error("Non-multiline string cannot contain newlines")

            if (this.currentChar === MindustryLexer.MULTILINE_STRING && multiline) {
                this.advance()
                if (this.text.done) throw new Error("A string not ended")
                if (this.currentChar === beginning) {
                    this.advance()
                    break
                } else text += MindustryLexer.MULTILINE_STRING + this.currentChar
            } else if (this.text.done)
                throw new Error("A string not ended")
            else text += this.currentChar

            this.advance()
        }

        this.endRange()
        return this.createToken(MindustryTokens.VALUE, "string", text)
    }

    generateComment() {
        var comment = ''
        this.startRange()
        this.advance()
        var multiline
        if (this.currentChar === MindustryLexer.COMMENT) multiline = false
        else if (this.currentChar === MindustryLexer.MULTILINE_COMMENT) multiline = true
        else throw new Error(`Illegal '${this.currentChar}' after ${MindustryLexer.COMMENT} comment beginning`)
        this.advance()

        while (!this.text.done) {
            if (MindustryLexer.NEWLINE.includes(this.currentChar)) {
                if (!multiline) break
                this.newline()
                comment += this.currentChar
            } else if (this.currentChar === MindustryLexer.MULTILINE_COMMENT && multiline) {
                this.advance()
                if (this.currentChar === MindustryLexer.COMMENT) {
                    this.advance()
                    break
                } else comment += MindustryLexer.MULTILINE_COMMENT + this.currentChar
            } else comment += this.currentChar

            this.advance()
        }

        this.endRange()
        return this.createToken(MindustryTokens.COMMENT, multiline ? "multiline" : "singleline", comment)
    }

    /*generateToSpaceOrToken() {
        var text = this.currentChar

        while (!this.text.done && !MindustryLexer.SPACE.includes(this.currentChar) && !MindustryLexer.NEWLINE.includes(this.currentChar) && !MindustryLexer.PARENS.map(par => par.char === this.currentChar).includes(true)) {
            if (MindustryLexer.TAB !== this.text.peek(1)) break
            if (!MindustryLexer.SPACE.includes(this.text.peek(1))) break
            // console.log(`'${this.currentChar}'`)
            text += this.currentChar
            this.advance()
        }

        var num = this.getSpacesNum()
        return [text, num]
    }*/

    generateOperator() {
        var operator = this.currentChar, char = this.currentChar, ptr = 0
        var possibleOperators = MindustryLexer.OPERATORS.concat(MindustryLexer.SET_OP)
        var possiblePartOfPhrase = MindustryLexer.VALIDATE_PHRASE_CHAR(char)

        while (true) {
            possibleOperators = possibleOperators.filter(op => op.startsWith(operator))
            if (possibleOperators.length === 0) return undefined
            if (this.text.peekDone(ptr + 1)) break

            char = this.text.peek(++ptr)
            if (MindustryLexer.SPACE.includes(char) ||
                MindustryLexer.NEWLINE.includes(char) ||
                MindustryLexer.PARENS.map(par => par.char === char).includes(true) ||
                (possibleOperators.length === 1 && possibleOperators[0].chars === operator) ||
                !possibleOperators.find(op => op.startsWith(operator + char))) {
                break
            }
            if (possiblePartOfPhrase) possiblePartOfPhrase = MindustryLexer.VALIDATE_PHRASE_CHAR(char)
            operator += char
        }

        possibleOperators = possibleOperators.filter(op => op.chars === operator)
        if (possibleOperators.length !== 1) return undefined
        if (possiblePartOfPhrase && MindustryLexer.VALIDATE_PHRASE_CHAR(char)) return undefined

        this.startRange()
        this.advanceBy(operator.length)
        this.endRange()
        return possibleOperators[0]
    }

    /**
     * @return {{comma: boolean, phraseRange: {from: number, to: number}, commaRange: {from: number, to: number}|undefined, phrase: string}}
     */
    generatePhrase() {
        var text = ""
        var ptr = 0

        while (!this.text.peekDone(ptr)) {
            var char = this.text.peek(ptr)
            // console.log(`'${char}'`)
            if (!MindustryLexer.VALIDATE_PHRASE_CHAR(char)) break
            text += char
            ptr++
        }

        if (ptr === 0) {
            var err = new Error(`While generating phrase, encountered '${this.currentChar}' invalid character at the beginning.`)
            err.token = {lineNum: this.lineNumber, range: {from: this.tokenTo, to: this.tokenTo + 1}}
            throw err
        }

        var comma = false
        if (text.endsWith(MindustryLexer.COMMA)) {
            comma = true
            text = text.slice(0, -1)
        }
        this.startRange()
        this.advanceBy(text.length)
        this.endRange()
        var textRange = this.range, commaRange = undefined
        if (comma) {
            this.startRange()
            this.advance()
            this.endRange()
            commaRange = this.range
        }

        return {phrase: text, phraseRange: textRange, comma, commaRange}
    }
}
