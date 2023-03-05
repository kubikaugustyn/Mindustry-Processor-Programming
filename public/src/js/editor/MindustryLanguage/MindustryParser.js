var __author__ = "kubik.augustyn@post.cz"

class MindustryParser extends Parser {
    static PAREN_PAIR = class ParenPair {
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

        constructor(openParen, token, parent) {
            this.openParen = openParen
            this.openParenToken = token
            this.parent = parent
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
    static FUNCTION = class Function {
        /**
         * @type {Array<Array<ProcessorType>>}
         */
        returnTypes
        /**
         * @type {string}
         */
        functionName
        /**
         * @type {Array<Array<ProcessorType>>}
         */
        functionArguments

        /**
         * @param returnTypes {Array<Array<ProcessorType>>}
         * @param functionName {string}
         * @param functionArguments {Array<Array<ProcessorType>>}
         */
        constructor(returnTypes, functionName, functionArguments) {
            this.returnTypes = returnTypes
            this.functionName = functionName
            this.functionArguments = functionArguments
        }
    }
    static FUNCTIONS = [
        new MindustryParser.FUNCTION([[ProcessorTypes.BUILDING]], "getlink", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([[ProcessorTypes.INTEGER]], "read", [[ProcessorTypes.BUILDING], [ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "write", [[ProcessorTypes.BUILDING], [ProcessorTypes.POSITIVE_INTEGER], [ProcessorTypes.INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.clear", [[ProcessorTypes.COLOR], [ProcessorTypes.COLOR], [ProcessorTypes.COLOR]]),
        new MindustryParser.FUNCTION([], "draw.color", [[ProcessorTypes.COLOR], [ProcessorTypes.COLOR], [ProcessorTypes.COLOR], [ProcessorTypes.COLOR]]),
        new MindustryParser.FUNCTION([], "draw.col", [[ProcessorTypes.POSITIVE_INTEGER]]),
        new MindustryParser.FUNCTION([], "draw.stroke", [[ProcessorTypes.POSITIVE_INTEGER]]),
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
        new MindustryParser.FUNCTION([], "", []),
        new MindustryParser.FUNCTION([], "", []),
        new MindustryParser.FUNCTION([], "", []),
    ]

    parse() {
        if (!this.currentToken) {
            return undefined
        }

        var result = this.pairParens()

        if (!result) this.throwError()

        // return back parsed tokens
        /**
         * @type {MindustryParser.ParenPair}
         */
        var paren = result.clone()
        var allTokens = []
        while (true) {
            var cont = paren.contents.shift()
            console.log(cont)
            if (cont instanceof MindustryParser.PAREN_PAIR) {
                allTokens.push(cont.openParenToken)
                cont.parent = paren
                paren = cont.clone()
            } else if (cont) allTokens.push(cont)
            if (!paren.contents.length) {
                if (!paren.parent) break
                allTokens.push(paren.closeParenToken)
                console.log(paren, paren.parent)
                paren = paren.parent
            }
        }

        return [allTokens, result]
    }

    pairParens() {
        var limit = 10000
        var loopI = 0
        /**
         * @type {MindustryParser.ParenPair|undefined}
         */
        var paren = new MindustryParser.PAREN_PAIR()
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
