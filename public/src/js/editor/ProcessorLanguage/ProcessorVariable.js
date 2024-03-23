var __author__ = "kubik.augustyn@post.cz"

class ProcessorVariable {
    /**
     * @type {string}
     */
    name
    /**
     * @type {ProcessorType}
     */
    type
    /**
     * @type {boolean}
     */
    constant
    /**
     * @type {boolean}
     */
    pointer
    /**
     * @type {boolean}
     */
    argument

    /**
     * @param name {string}
     * @param type {ProcessorType}
     * @param constant {boolean}
     * @param pointer {boolean}
     * @param argument {boolean}
     */
    constructor(name, type, constant, pointer, argument) {
        this.name = name
        this.type = type
        this.constant = constant
        this.pointer = pointer
        this.argument = argument
    }
}

class ProcessorVariables {
    /**
     * @type {Map<string,ProcessorVariable>}
     */
    variables
    /**
     * @type {ProcessorVariables[]}
     */
    childScopes
    /**
     * @type {ProcessorVariables|undefined}
     */
    parent

    /**
     * @param parent {ProcessorVariables|undefined}
     */
    constructor(parent = undefined) {
        this.variables = new Map()
        this.childScopes = []
        this.parent = parent
    }

    /**
     * @param nameOrVariable {string|ProcessorVariable}
     * @param type {ProcessorType}
     * @param constant {boolean}
     * @param pointer {boolean}
     * @param argument {boolean}
     * @returns {boolean} Whether the variable is valid
     */
    addVariable(nameOrVariable, type, constant, pointer, argument) {
        for (var child of this.childScopes) {
            if (nameOrVariable instanceof ProcessorVariable) {
                if (!child.variables.has(nameOrVariable.name)) child.variables.set(nameOrVariable.name, nameOrVariable)
            } else if (!child.variables.has(nameOrVariable))
                child.variables.set(nameOrVariable, new ProcessorVariable(nameOrVariable, type, constant, pointer, argument))
        }

        if (nameOrVariable instanceof ProcessorVariable) {
            if (this.variables.has(nameOrVariable.name)) return false
            this.variables.set(nameOrVariable.name, nameOrVariable)
            return true
        }
        if (this.variables.has(nameOrVariable)) return false
        this.variables.set(nameOrVariable, new ProcessorVariable(nameOrVariable, type, constant, pointer, argument))
        return true
    }

    /**
     * @param name {string}
     * @returns {ProcessorVariable}
     */
    getVariable(name) {
        return this.variables.get(name)
    }

    /**
     * @param name {string}
     * @returns {boolean}
     */
    hasVariable(name) {
        return this.variables.has(name)
    }

    /**
     * @param isChildScope {boolean}
     * @returns {ProcessorVariables}
     */
    clone(isChildScope = false) {
        var clone = new ProcessorVariables(this)
        for (var [name, variable] of this.variables.entries()) {
            if (name !== variable.name) throw Error("Variable name and pool name mismatch - never occurs")
            clone.addVariable(variable.name, variable.type, variable.constant, variable.pointer, variable.argument)
        }
        if (isChildScope) this.childScopes.push(clone)
        return clone
    }
}
