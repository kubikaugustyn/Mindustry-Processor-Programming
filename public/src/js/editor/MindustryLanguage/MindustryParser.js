var __author__ = "kubik.augustyn@post.cz"

class MindustryParser extends Parser {
    static PAREN_PAIR = class ParenPair {
        /**
         * @type {number}
         */
        tmp_i
        /**
         * @type {MindustryLexer.Paren}
         */
        openParen
        /**
         * @type {MindustryLexer.Paren}
         */
        closeParen
        /**
         * @type {MindustryTokens.PAREN}
         */
        openParenToken
        /**
         * @type {MindustryTokens.PAREN}
         */
        closeParenToken
        /**
         * @type {Array}
         */
        contents = []
        /**
         * @type {MindustryParser.ParenPair}
         */
        parent
        /**
         * @type {boolean}
         */
        root = false
        /**
         * @type {ProcessorVariables}
         */
        variables

        constructor(openParen, token, parent, variables) {
            this.openParen = openParen
            this.openParenToken = token
            this.parent = parent
            this.variables = parent ? parent.variables.clone(true) : (variables || new ProcessorVariables())
        }

        newContent(content) {
            this.contents.push(content)
        }

        newContents(contents) {
            this.contents.push(...contents)
        }

        /**
         * @param paren {MindustryLexer.Paren}
         * @param token {MindustryTokens.PAREN}
         */
        close(paren, token) {
            this.closeParen = paren
            this.closeParenToken = token
        }

        clone() {
            var clone = new MindustryParser.PAREN_PAIR(this.openParen, this.openParenToken, this.parent)
            clone.root = this.root
            clone.newContents(this.contents.slice())
            clone.close(this.closeParen, this.closeParenToken)
            return clone
        }
    }
    static FUNCTION_ARGUMENT = class FunctionArgument {
        /**
         * @type {string}
         */
        name
        /**
         * @type {string}
         */
        description
        /**
         * @type {ProcessorType[]}
         */
        types

        /**
         * @param name {string}
         * @param description {string}
         * @param types {ProcessorType[]|ProcessorType}
         */
        constructor(name, description, types = []) {
            this.name = name
            this.description = description
            this.types = types instanceof Array ? types : [types]
        }
    }
    static FUNCTION = class Function {
        /**
         * @type {ProcessorType[][]}
         */
        returnTypes
        /**
         * @type {string}
         */
        functionName
        /**
         * @type {string}
         */
        functionDescription
        /**
         * @type {MindustryParser.FunctionArgument[]}
         */
        functionArguments

        /**
         * @param returnTypes {ProcessorType[][]}
         * @param functionName {string}
         * @param functionDescription {string}
         * @param functionArguments {MindustryParser.FunctionArgument[]}
         */
        constructor(returnTypes, functionName, functionDescription, functionArguments) {
            this.returnTypes = returnTypes
            this.functionName = functionName
            this.functionDescription = functionDescription
            this.functionArguments = functionArguments
        }
    }
    static FUNCTIONS = [
        new MindustryParser.FUNCTION([[ProcessorTypes.BUILDING]], "getlink", "Get a processor link by index. Starts at 0.", [
            new MindustryParser.FUNCTION_ARGUMENT("link#", "Link index", ProcessorTypes.POSITIVE_INTEGER)
        ]),
        new MindustryParser.FUNCTION([[ProcessorTypes.INTEGER]], "read", "Read a number from a linked memory cell.", [
            new MindustryParser.FUNCTION_ARGUMENT("link", "Linked cell", ProcessorTypes.BUILDING),
            new MindustryParser.FUNCTION_ARGUMENT("address", "Memory address to read at / from", ProcessorTypes.POSITIVE_INTEGER)
        ]),
        new MindustryParser.FUNCTION([], "write", "Write a number to a linked memory cell", [
            new MindustryParser.FUNCTION_ARGUMENT("link", "Linked cell", ProcessorTypes.BUILDING),
            new MindustryParser.FUNCTION_ARGUMENT("address", "Memory address to write at / to", ProcessorTypes.POSITIVE_INTEGER),
            new MindustryParser.FUNCTION_ARGUMENT("number", "Number to store", ProcessorTypes.INTEGER)
        ]),
        new MindustryParser.FUNCTION([], "draw.clear", "Clears / fills the canvas with color", [
            new MindustryParser.FUNCTION_ARGUMENT("R", "R value of the RGB color", ProcessorTypes.COLOR),
            new MindustryParser.FUNCTION_ARGUMENT("G", "G value of the RGB color", ProcessorTypes.COLOR),
            new MindustryParser.FUNCTION_ARGUMENT("B", "B value of the RGB color", ProcessorTypes.COLOR)
        ]),
        new MindustryParser.FUNCTION([], "draw.color", "Sets the draw color to RGBA value", [
            new MindustryParser.FUNCTION_ARGUMENT("R", "R value of the RGBA color", ProcessorTypes.COLOR),
            new MindustryParser.FUNCTION_ARGUMENT("G", "G value of the RGBA color", ProcessorTypes.COLOR),
            new MindustryParser.FUNCTION_ARGUMENT("B", "B value of the RGBA color", ProcessorTypes.COLOR),
            new MindustryParser.FUNCTION_ARGUMENT("A", "A value of the RGBA color", ProcessorTypes.COLOR)
        ]),
        new MindustryParser.FUNCTION([], "draw.col", "Sets the draw color", [
            new MindustryParser.FUNCTION_ARGUMENT("color", "Value of the color", ProcessorTypes.POSITIVE_INTEGER),
        ]),
        /*new MindustryParser.FUNCTION([], "draw.stroke", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.line", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.rect", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.lineRect", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.poly", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.linePoly", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.triangle", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.image", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.CONTENT], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "print", [[ProcessorTypes.STRING]]),
        new MindustryParser.FUNCTION([], "drawflush", [[ProcessorTypes.BUILDING]]),
        new MindustryParser.FUNCTION([], "printflush", [[ProcessorTypes.BUILDING]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.BUILDING]], "getlink", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "control.enabled", [[ProcessorTypes.BUILDING], [ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "control.shoot", [[ProcessorTypes.BUILDING], [ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER], [ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "control.shootp", [[ProcessorTypes.BUILDING], [ProcessorTypes.UNIT], [ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "control.config", [[ProcessorTypes.BUILDING], [ProcessorTypes.CONTENT, ProcessorTypes.UNIT]]),
        new MindustryParser.FUNCTION([], "control.color", [[ProcessorTypes.BUILDING], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.UNIT]], "radar", [
            ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
            ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
            ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
            [ProcessorTypes.BOOLEAN],
            ["distance", "health", "shield", "armor", "maxHealth"]
        ]),
        new MindustryParser.FUNCTION([[ProcessorTypes.CONTENT]], "lookup.block", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.CONTENT]], "lookup.unit", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.CONTENT]], "lookup.item", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.CONTENT]], "lookup.liquid", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.POSITIVE_INTEGER]], "packcolor", [[ProcessorTypes.COLOR], [ProcessorTypes.COLOR], [ProcessorTypes.COLOR], [ProcessorTypes.COLOR]]),
        new MindustryParser.FUNCTION([], "wait", [[ProcessorTypes.POSITIVE_NUMBER]]),
        new MindustryParser.FUNCTION([], "stop", []),
        new MindustryParser.FUNCTION([], "end", []),
        new MindustryParser.FUNCTION([], "jump", [[ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "ubind", [[ProcessorTypes.CONTENT]]),
        new MindustryParser.FUNCTION([], "ucontrol.idle", []),
        new MindustryParser.FUNCTION([], "ucontrol.stop", []),
        new MindustryParser.FUNCTION([], "ucontrol.move", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.approach", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.boost", [[ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "ucontrol.target", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER], [ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "ucontrol.targetp", [[ProcessorTypes.UNIT], [ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "ucontrol.itemDrop", [[ProcessorTypes.BUILDING], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.itemTake", [[ProcessorTypes.BUILDING], [ProcessorTypes.CONTENT], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.payDrop", []),
        new MindustryParser.FUNCTION([], "ucontrol.payTake", [[ProcessorTypes.BOOLEAN]]),
        new MindustryParser.FUNCTION([], "ucontrol.payEnter", []),
        new MindustryParser.FUNCTION([], "ucontrol.payEnterIfIn", [[ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.mine", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.flag", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.build", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER], [ProcessorTypes.CONTENT], [ProcessorTypes.BLOCK_ROTATION_NUMBER], [ProcessorTypes.CONTENT, ProcessorTypes.UNIT]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.CONTENT], [ProcessorTypes.BUILDING], [ProcessorTypes.CONTENT]], "ucontrol.getBlock", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.BOOLEAN]], "ucontrol.within", [[ProcessorTypes.INTEGER], [ProcessorTypes.INTEGER], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "ucontrol.unbind", []),
        new MindustryParser.FUNCTION([[ProcessorTypes.UNIT]], "uradar", [
            ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
            ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
            ["any", "enemy", "ally", "player", "attacker", "flying", "boss", "ground"],
            [ProcessorTypes.BOOLEAN],
            ["distance", "health", "shield", "armor", "maxHealth"]
        ]),
        new MindustryParser.FUNCTION([], "ulocate.ore", [[ProcessorTypes.CONTENT]]),
        new MindustryParser.FUNCTION([], "ulocate.building", []), // NOT DONE
        new MindustryParser.FUNCTION([], "", []), // NOT DONE
        new MindustryParser.FUNCTION([], "", []), // NOT DONE */
    ]
    static STATEMENT_PHRASES = ["if", "else", "elif", "while", "for"]

    parse() {
        if (!this.currentToken) {
            return undefined
        }
        var globalVariables = new ProcessorVariables()
        var result = this.pairParens(globalVariables)

        if (!result) this.throwError()

        /*MindustryParser.loopThroughParens(result, (old, i, whole) => {
            console.log(old, i)
            if (old instanceof MindustryTokens.OPERATOR) return new MindustryTokens.DUMMY()
            return old
        })*/
        MindustryParser.loopThroughParens(result, (old, i, whole, variables) => {
            if (old instanceof MindustryTokens.PHRASE) {
                var iOfSet = whole.indexOf(whole.slice(i + 1).find(tok => tok instanceof MindustryTokens.SET))
                var iOfNL = whole.indexOf(whole.slice(i + 1).find(tok => tok instanceof MindustryTokens.NEWLINE))
                if ((iOfNL ? iOfSet < iOfNL : iOfSet > -1) && iOfSet > i) {
                    // console.log("New variable:", old.content)
                    var variable = variables.getVariable(old.content)
                    var type = "???" // TODO Resolve this
                    var valid = true
                    if (variable) { // Check if variable type we're assigning to is the same as the type of what are we assigning
                        if (type !== "???") valid = type.equals(variable.type)
                    } else { // Create / Add the variable to our list
                        if (old.content.startsWith("tmp_")) valid = false
                        else {
                            variable = new ProcessorVariable(old.content, type)
                            valid = variables.addVariable(variable)
                        }
                    }
                    return new MindustryTokens.VARIABLE_PHRASE(valid ? "default-set" : "invalid-reassignment", old.content, variable)
                }
            }
            return old
        })
        MindustryParser.loopThroughParens(result, (old, i, whole, variables) => {
            if (old instanceof MindustryTokens.PHRASE) {
                if (whole.length > i + 1 && whole[i + 1] instanceof MindustryParser.PAREN_PAIR) {
                    if (MindustryParser.STATEMENT_PHRASES.includes(old.content)) {
                        if (whole.length > i + 2 && whole[i + 2] instanceof MindustryParser.PAREN_PAIR) {
                            var statementCondition = whole[i + 1]
                            var statementContent = whole[i + 2]
                            whole[i + 1] = new MindustryTokens.DUMMY("unpack", statementCondition)
                            whole[i + 2] = new MindustryTokens.DUMMY("unpack", statementContent)
                            return new MindustryTokens.STATEMENT_PHRASE(old.content, statementContent, statementCondition)
                        }
                    } else {
                        // TODO Also make there check of inputs
                        var func = MindustryParser.FUNCTIONS.find(function (func) {
                            return func.functionName === old.content
                        })
                        var functionArgs = whole[i + 1]
                        whole[i + 1] = new MindustryTokens.DUMMY("unpack", functionArgs)
                        return new MindustryTokens.FUNCTION_CALL_PHRASE(func ? "default" : "invalid", [old.content, functionArgs], func)
                    }
                } else {
                    var variable = variables.hasVariable(old.content)
                    // console.log(variable ? "default" : "invalid", old.content, variables.getVariable(old.content))
                    return new MindustryTokens.VARIABLE_PHRASE(variable ? "default-get" : "invalid-not-assigned", old.content, variable)
                }
            }
            return old
        })

        // return back parsed tokens
        /**
         * @type {MindustryParser.ParenPair}
         */
        var paren = result.clone()
        var allTokens = []
        while (true) {
            var cont = paren.contents.shift()
            if (cont instanceof MindustryParser.PAREN_PAIR) {
                allTokens.push(cont.openParenToken)
                cont.parent = paren
                // console.log("Shift", paren, cont)
                paren = cont.clone()
            } else if (cont instanceof MindustryTokens.DUMMY && cont.subtype === "unpack") { // If some token has been replaced with dummy
                // We'll add that to the paren contents
                console.log("Unpack dummy:", cont, cont.content) // TODO Fix unpacking dummy
                paren.contents.push(cont.content)
            } else if (cont) allTokens.push(cont)
            // console.log(cont)
            if (!paren.contents.length) {
                if (!paren.parent) break
                allTokens.push(paren.closeParenToken)
                // console.log("Shift back", paren, paren.parent)
                paren = paren.parent
            }
        }

        return [allTokens, result]
    }

    /**
     * @param parenPair {MindustryParser.ParenPair}
     * @param callbackFn {(value: Token, index: number, array: Token[], variables: ProcessorVariables) => Token}
     */
    static loopThroughParens(parenPair, callbackFn) {
        if (!callbackFn) return
        /**
         * @type {MindustryParser.ParenPair}
         */
        var paren = parenPair
        /**
         * @type {number}
         */
        var i = 0
        var limit = 5000
        var loopI = 0
        WholeLoop:
            while (loopI < limit) {
                var cont = paren.contents[i++]
                if (cont instanceof MindustryParser.PAREN_PAIR) {
                    paren.tmp_i = i
                    cont.parent = paren
                    paren = cont
                    i = 0
                } else if (cont) paren.contents[i - 1] = callbackFn(cont, i - 1, paren.contents, paren.variables)
                while (i === paren.contents.length) {
                    if (!paren.parent || paren.root) break WholeLoop
                    paren = paren.parent
                    i = paren.tmp_i || 0
                }
                loopI++
            }
        if (loopI === limit) console.warn("Limit reached:", limit)
    }

    /**
     * @param globalVariables {ProcessorVariables}
     * @returns {MindustryParser.ParenPair}
     */
    pairParens(globalVariables) {
        var limit = 10_000
        var loopI = 0
        /**
         * @type {MindustryParser.ParenPair|undefined}
         */
        var paren = new MindustryParser.PAREN_PAIR(null, null, null, globalVariables)
        paren.root = true
        while (!this.tokens.done && loopI < limit) {
            // console.log(this.currentToken instanceof MindustryTokens.PAREN, paren, this.currentToken)
            if (this.currentToken instanceof MindustryTokens.PAREN) {
                /**
                 * @type {MindustryLexer.Paren}
                 */
                var currentParen = this.currentToken.subtypeObject
                if (currentParen.opening) {
                    if (paren) {
                        var newPair = new MindustryParser.PAREN_PAIR(currentParen, this.currentToken, paren)
                        paren.newContent(newPair)
                        paren = newPair
                    } else {
                    }
                } else {
                    if (!paren || paren.root) this.throwError()
                    if (paren.openParen.type !== currentParen.type) this.throwError("You cannot close paren with different type than it was open")
                    paren.close(currentParen, this.currentToken)
                    paren = paren.parent
                }
            } else if (paren) {
                paren.newContent(this.currentToken)
            }
            this.advance()
            loopI++
        }
        return paren
    }
}
