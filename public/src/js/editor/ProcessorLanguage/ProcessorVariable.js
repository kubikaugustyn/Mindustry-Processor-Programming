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
     * @param name {string}
     * @param type {ProcessorType}
     * @param constant {boolean}
     * @param pointer {boolean}
     */
    constructor(name, type, constant, pointer) {
        this.name = name
        this.type = type
        this.constant = constant
        this.pointer = pointer
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
    children

    constructor() {
        this.variables = new Map()
        this.children = []
    }

    /**
     * @param nameOrVariable {string|ProcessorVariable}
     * @param type {ProcessorType}
     * @param constant {boolean}
     * @param pointer {boolean}
     * @returns {boolean}
     */
    addVariable(nameOrVariable, type, constant, pointer) {
        for (var child of this.children) {
            if (nameOrVariable instanceof ProcessorVariable) {
                if (!child.variables.has(nameOrVariable.name)) child.variables.set(nameOrVariable.name, nameOrVariable)
            } else if (!child.variables.has(nameOrVariable))
                child.variables.set(nameOrVariable, new ProcessorVariable(nameOrVariable, type, constant, pointer))
        }

        if (nameOrVariable instanceof ProcessorVariable) {
            if (this.variables.has(nameOrVariable.name)) return false
            this.variables.set(nameOrVariable.name, nameOrVariable)
            return true
        }
        if (this.variables.has(nameOrVariable)) return false
        this.variables.set(nameOrVariable, new ProcessorVariable(nameOrVariable, type, constant, pointer))
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
        var clone = new ProcessorVariables()
        for (var [name, variable] of this.variables.entries()) {
            if (name !== variable.name) throw Error("Variable name and pool name mismatch - never occurs")
            clone.addVariable(variable.name, variable.type, variable.constant, variable.pointer)
        }
        if (isChildScope) this.children.push(clone)
        return clone
    }
}
