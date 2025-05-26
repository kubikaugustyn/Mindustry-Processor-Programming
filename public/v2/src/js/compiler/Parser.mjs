/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import * as acorn from "https://cdn.jsdelivr.net/npm/acorn@8.14.1/+esm"

// console.log("Acorn:", acorn)

/*const customOps = {
    _of: new acorn.TokenType('of', {binop: 7}), // 7 = precedence
};*/

function kw(name, options) {
    if (options === void 0) options = {};

    options.keyword = name;
    return acorn.keywordTypes[name] = new acorn.TokenType(name, options)
}

const customTokenTypes = {
    _of: kw("of", {beforeExpr: true, binop: 11}),
    _in: kw("in", {beforeExpr: true, binop: 11}), // not custom, but overwrites the default precedence (7)
}

// Create your custom parser by extending Acorn's parser
const MindustryParser = acorn.Parser.extend(
    function mindustryPlugin(Parser) {
        return class extends Parser {
            // Define the new keyword token
            constructor(options, input) {
                super(options, input);
                // Add 'of' as a keyword
                this.keywords = new RegExp(this.keywords.source.replace(/^\^\(\?:/, "^(?:of|"));
                // console.log(this.keywords)
            }


            readToken(code) {
                /*for (const op of Object.values(customOps)) {
                    if (code === op.label.charCodeAt(0) && this.input.slice(this.pos, this.pos + op.label.length) === op.label) {
                        this.pos += op.label.length;
                        return this.finishToken(op, op.label);
                    }
                }*/
                if (code === 64) { // ASCII '@'
                    return this.readMention();
                }
                return super.readToken(code);
            }


            readMention() {
                this.pos++; // skip '@'
                const word = this.readWord1()

                const value = '@'.concat(word)
                this.finishToken(acorn.tokTypes.name, value); // token type = identifier
            }

            /*parseExprOp(left, leftStartPos, leftStartLoc, minPrec) {
                if (this.type === customOps.exponentRight && customOps.exponentRight.binop > minPrec) {
                    console.log(super.parseExprOp)

                    const node = this.startNodeAt(leftStartPos, leftStartLoc);
                    const precedence = customOps.exponentRight.binop;
                    this.next();
                    const right = this.parseExprOp(this.parseMaybeUnary(), this.start, this.startLoc, precedence);
                    node.type = 'BinaryExpression';
                    node.operator = '**>';
                    node.left = left;
                    node.right = right;
                    return this.finishNode(node, 'BinaryExpression');
                }

                return super.parseExprOp(left, leftStartPos, leftStartLoc, minPrec);
            }*/

            // Extend variable declarations to support your custom types
            /*parseVarStatement(node) {
                const declaration = super.parseVarStatement(node);

                // Check for type annotations
                if (this.type.type === 'name' &&
                    ['BUILDING', 'POSITIVE_INTEGER', 'NUMBER'].includes(this.value)) {
                    declaration.valueType = this.value;
                    this.next(); // consume the type token
                }

                return declaration;
            }*/
        };
    }
);

// Export your parser
export class Parser {
    constructor(code, options = {}) {
        this.code = code;
        this.options = {
            ...options,
            ecmaVersion: 'latest', // Support modern JS
            sourceType: 'script',  // Don't support ES modules
            locations: true,       // Include location info
            // Add any other Acorn options you need
        };
    }

    parse() {
        const parser = new MindustryParser(this.options, this.code)
        return parser.parse();
    }
}

// Keep your type constants
export const MindustryTypes = {
    BUILDING: 'BUILDING',
    POSITIVE_INTEGER: 'POSITIVE_INTEGER',
    NUMBER: 'NUMBER'
};

export const NodeTypes = {
    MemoryAccess: 'MemoryAccess',
    MemoryRead: 'MemoryRead',
    MemoryWrite: 'MemoryWrite'
};
