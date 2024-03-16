var __author__ = "kubik.augustyn@post.cz"

/**
 * @type {Object<string, symbol>}
 */
var MindustryNodeTypes = Object.fromEntries([
    "VARIABLE_DECLARATOR",
    "VARIABLE_DECLARATION",
    "IDENTIFIER",
    "ASSIGNMENT_EXPRESSION",
    "BINARY_EXPRESSION",
    "UNARY_EXPRESSION",
    "CALL_EXPRESSION",
    "COMPUTED_MEMBER_EXPRESSION",
    "STATIC_MEMBER_EXPRESSION",
    "VALUE",
    "DEREF_EXPRESSION",
    "IF_STATEMENT",
    "FOR_STATEMENT",
    "WHILE_STATEMENT",
    "SWITCH_STATEMENT",
    "CASE_STATEMENT",
    "DEFAULT_STATEMENT",
    "RETURN_STATEMENT",
    "CONTINUE_STATEMENT",
    "BREAK_STATEMENT",
    "BLOCK_STATEMENT",
    "EMPTY_STATEMENT",
    "ASSIGN_STATEMENT",
    "EXPRESSION_STATEMENT",
    "FUNCTION_DECLARATION",
    "PARAMETER", // of a function declaration
].map(name => [name, Symbol(name)]))
var MindustryNodeType = name => {
    if (!(name in MindustryNodeTypes)) throw Error(`Mindustry node type ${name} not found`)
    return MindustryNodeTypes[name]
}

var MindustryNodes = {
    VariableDeclarator: class VariableDeclarator extends Parser.ASTNode {
        type = MindustryNodeType("VARIABLE_DECLARATOR")
        /**
         * @type {number}
         */
        variableName
        /**
         * @type {number}
         */
        initializer
        /**
         * @type {boolean}
         */
        isConst
        /**
         * @type {Token}
         */
        valueType
    },
    VariableDeclaration: class VariableDeclaration extends Parser.ASTNode {
        type = MindustryNodeType("VARIABLE_DECLARATION")
        /**
         * @type {number[]}
         */
        declarators
    },
    Identifier: class Identifier extends Parser.ASTNode {
        type = MindustryNodeType("IDENTIFIER")
        /**
         * @type {string}
         */
        name

        /**
         * @param name {string}
         */
        constructor(name) {
            super();
            this.name = name
        }
    },
    AssignmentExpression: class AssignmentExpression extends Parser.ASTNode {
        type = MindustryNodeType("ASSIGNMENT_EXPRESSION")
        /**
         * @type {number}
         */
        left
        /**
         * @type {number}
         */
        right

        /**
         * @param left {number}
         * @param right {number}
         */
        constructor(left, right) {
            super();
            this.left = left
            this.right = right
        }
    },
    BinaryExpression: class BinaryExpression extends Parser.ASTNode {
        type = MindustryNodeType("BINARY_EXPRESSION")
        /**
         * @type {MindustryLexer.OPERATOR}
         */
        operator
        /**
         * @type {number}
         */
        left
        /**
         * @type {number}
         */
        right

        /**
         * @param operator {MindustryLexer.OPERATOR}
         * @param left {number}
         * @param right {number}
         */
        constructor(operator, left, right) {
            super();
            this.operator = operator
            this.left = left
            this.right = right
        }
    },
    UnaryExpression: class UnaryExpression extends Parser.ASTNode {
        type = MindustryNodeType("UNARY_EXPRESSION")
        /**
         * @type {MindustryLexer.OPERATOR}
         */
        operator
        /**
         * @type {number}
         */
        left

        /**
         * @param operator {MindustryLexer.OPERATOR}
         * @param left {number}
         */
        constructor(operator, left) {
            super();
            this.operator = operator
            this.left = left
        }
    },
    CallExpression: class CallExpression extends Parser.ASTNode {
        type = MindustryNodeType("CALL_EXPRESSION")
        /**
         * @type {number}
         */
        callee
        /**
         * @type {number[]}
         */
        arguments

        /**
         * @param callee {number}
         * @param args {number[]}
         */
        constructor(callee, args) {
            super();
            this.callee = callee
            this.arguments = args
        }
    },
    ComputedMemberExpression: class ComputedMemberExpression extends Parser.ASTNode {
        type = MindustryNodeType("COMPUTED_MEMBER_EXPRESSION")
        /**
         * @type {number}
         */
        expression
        /**
         * @type {number}
         */
        property

        /**
         * @param expression {number}
         * @param property {number}
         */
        constructor(expression, property) {
            super();
            this.expression = expression
            this.property = property
        }
    },
    StaticMemberExpression: class StaticMemberExpression extends Parser.ASTNode {
        type = MindustryNodeType("STATIC_MEMBER_EXPRESSION")
        /**
         * @type {number}
         */
        expression
        /**
         * @type {number}
         */
        property

        /**
         * @param expression {number}
         * @param property {number}
         */
        constructor(expression, property) {
            super();
            this.expression = expression
            this.property = property
        }
    },
    Value: class Value extends Parser.ASTNode {
        type = MindustryNodeType("VALUE")
        /**
         * @type {number|string|boolean|null}
         */
        value

        /**
         * @param value {number|string|boolean|null}
         */
        constructor(value) {
            super();
            this.value = value
        }
    },
    DerefExpression: class DerefExpression extends Parser.ASTNode {
        type = MindustryNodeType("DEREF_EXPRESSION")
        /**
         * @type {number}
         */
        value

        /**
         * @param value {number}
         */
        constructor(value) {
            super();
            this.value = value
        }
    },
    IfStatement: class IfStatement extends Parser.ASTNode {
        type = MindustryNodeType("IF_STATEMENT")
        /**
         * @type {number}
         */
        test
        /**
         * @type {number}
         */
        consequent
        /**
         * @type {number|undefined}
         */
        alternate

        /**
         * @param test {number}
         * @param consequent {number}
         * @param alternate {number|undefined}
         */
        constructor(test, consequent, alternate) {
            super();
            this.test = test
            this.consequent = consequent
            this.alternate = alternate
        }
    },
    ForStatement: class ForStatement extends Parser.ASTNode {
        type = MindustryNodeType("FOR_STATEMENT")
        /**
         * @type {number|undefined}
         */
        init
        /**
         * @type {number|undefined}
         */
        test
        /**
         * @type {number|undefined}
         */
        update
        /**
         * @type {number}
         */
        body

        /**
         * @param init {number|undefined}
         * @param test {number|undefined}
         * @param update {number|undefined}
         * @param body {number}
         */
        constructor(init, test, update, body) {
            super();
            this.init = init
            this.test = test
            this.update = update
            this.body = body
        }
    },
    WhileStatement: class WhileStatement extends Parser.ASTNode {
        type = MindustryNodeType("WHILE_STATEMENT")
        /**
         * @type {number}
         */
        test
        /**
         * @type {number}
         */
        body

        /**
         * @param test {number}
         * @param body {number}
         */
        constructor(test, body) {
            super();
            this.test = test
            this.body = body
        }
    },
    SwitchStatement: class SwitchStatement extends Parser.ASTNode {
        type = MindustryNodeType("SWITCH_STATEMENT")
        /**
         * @type {number}
         */
        discriminant
        /**
         * @type {number[]}
         */
        cases
        /**
         * @type {number|undefined}
         */
        default

        /**
         * @param discriminant {number}
         * @param cases {number[]}
         * @param default_case {number|undefined}
         */
        constructor(discriminant, cases, default_case) {
            super();
            this.discriminant = discriminant
            this.cases = cases
            this.default = default_case
        }
    },
    CaseStatement: class CaseStatement extends Parser.ASTNode {
        type = MindustryNodeType("CASE_STATEMENT")
        /**
         * @type {number}
         */
        test
        /**
         * @type {number[]}
         */
        consequent

        /**
         * @param test {number}
         * @param consequent {number[]}
         */
        constructor(test, consequent) {
            super();
            this.test = test
            this.consequent = consequent
        }
    },
    DefaultStatement: class DefaultStatement extends Parser.ASTNode {
        type = MindustryNodeType("DEFAULT_STATEMENT")
        /**
         * @type {number[]}
         */
        consequent

        /**
         * @param consequent {number[]}
         */
        constructor(consequent) {
            super();
            this.consequent = consequent
        }
    },
    ReturnStatement: class ReturnStatement extends Parser.ASTNode {
        type = MindustryNodeType("RETURN_STATEMENT")
        /**
         * @type {number|undefined}
         */
        argument

        /**
         * @param argument {number|undefined}
         */
        constructor(argument) {
            super();
            this.argument = argument
        }
    },
    ContinueStatement: class ContinueStatement extends Parser.ASTNode {
        type = MindustryNodeType("CONTINUE_STATEMENT")
    },
    BreakStatement: class BreakStatement extends Parser.ASTNode {
        type = MindustryNodeType("BREAK_STATEMENT")
    },
    BlockStatement: class BlockStatement extends Parser.ASTNode {
        type = MindustryNodeType("BLOCK_STATEMENT")
        /**
         * @type {number[]}
         */
        block

        /**
         * @param block {number[]}
         */
        constructor(block) {
            super();
            this.block = block
        }
    },
    EmptyStatement: class EmptyStatement extends Parser.ASTNode {
        type = MindustryNodeType("EMPTY_STATEMENT")
    },
    ExpressionStatement: class ExpressionStatement extends Parser.ASTNode {
        type = MindustryNodeType("EXPRESSION_STATEMENT")
        /**
         * @type {number}
         */
        expression

        /**
         * @param expression {number}
         */
        constructor(expression) {
            super();
            this.expression = expression
        }
    },
    FunctionDeclaration: class FunctionDeclaration extends Parser.ASTNode {
        type = MindustryNodeType("FUNCTION_DECLARATION")
        /**
         * @type {number}
         */
        identifier
        /**
         * @type {number[]}
         */
        params
        /**
         * @type {number}
         */
        body

        /**
         * @param identifier {number}
         * @param params {number[]}
         * @param body {number}
         */
        constructor(identifier, params, body) {
            super();
            this.identifier = identifier
            this.params = params
            this.body = body
        }
    },
    Parameter: class Parameter extends Parser.ASTNode {
        type = MindustryNodeType("PARAMETER")
        /**
         * @type {number}
         */
        parameterName
        /**
         * @type {Token}
         */
        valueType

        /**
         * @param parameterName {number}
         * @param valueType {Token}
         */
        constructor(parameterName, valueType) {
            super();
            this.parameterName = parameterName
            this.valueType = valueType
        }
    },
}
