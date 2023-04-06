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
     * @param name {string}
     * @param type {ProcessorType}
     */
    constructor(name, type) {
        this.name = name
        this.type = type
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
     * @param type {ProcessorType|undefined}
     * @returns {boolean}
     */
    addVariable(nameOrVariable, type = undefined) {
        for (var child of this.children) {
            if (nameOrVariable instanceof ProcessorVariable) {
                if (!child.variables.has(nameOrVariable.name)) child.variables.set(nameOrVariable.name, nameOrVariable)
            }
            else if (!child.variables.has(nameOrVariable)) child.variables.set(nameOrVariable, new ProcessorVariable(nameOrVariable, type))
        }

        if (nameOrVariable instanceof ProcessorVariable) {
            if (this.variables.has(nameOrVariable.name)) return false
            this.variables.set(nameOrVariable.name, nameOrVariable)
            return true
        }
        if (this.variables.has(nameOrVariable)) return false
        this.variables.set(nameOrVariable, new ProcessorVariable(nameOrVariable, type))
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
        for (var [name, type] of this.variables.entries()) clone.addVariable(name, type)
        if (isChildScope) this.children.push(clone)
        return clone
    }
}
