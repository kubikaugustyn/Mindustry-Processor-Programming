var __author__ = "kubik.augustyn@post.cz"

var lexer = new MindustryLexer()
var parser = new MindustryParser()
var compiler = new MindustryCompiler()
compiler.createLibFunctions()

function init() {
    /**
     * @type {MindustryCompiler.NativeFunctionBinding}
     */
    var func
    var div
    var container = document.getElementById("functions")
    for (func of MindustryCompiler.DEFAULT_LIB_FUNCTIONS) {
        div = document.createElement("div")
        div.id = "function-" + func.name
        renderFunction(func, div)
        container.appendChild(div)
    }
    container = document.getElementById("types")
    var processorTypes = Object.keys(ProcessorTypes).filter(a => {
        try {
            return new ProcessorTypes[a] instanceof ProcessorType
        } catch {
            return false
        }
    })
    for (var processorType of processorTypes) {
        var type = new ProcessorTypes[processorType];
        div = document.createElement("div")
        div.id = "type-" + processorType.toLowerCase()
        renderProcessorType(type, processorType, div)
        container.appendChild(div)
    }
}

/**
 * @param processorType {ProcessorType}
 * @param name {string}
 * @param container {HTMLDivElement}
 */
function renderProcessorType(processorType, name, container) {
    //(["boolean", "unit"].includes(processorType.name) || !processorType.name) && console.log(processorType, container, processorType.toString())
    var header = document.createElement("h2")
    header.innerHTML = `<a href="#type-${name.toLowerCase()}">${name.replaceAll("_", " ")}</a>`
    container.appendChild(header)
    createP(container, processorType.toString())
    if (processorType.properties?.size > 0) createTable(container, mapTypeNamesToLinks(Array(...processorType.properties.entries()), a => "@" + a), ["Property name", "Type"])
    else createP(container, "Doesn't have properties")
}

function mapTypeNamesToLinks(typeEntries, nameModifier = a => a) {
    return typeEntries.map(([name, value]) => {
        var names = value.toString().split("|")
        return [nameModifier(name), names.map(name => name.includes('"') ? name : `<a href="#type-${name.toLowerCase()}">${name.replaceAll("_", " ")}</a>`).join(" OR ")]
    })
}

function mapTypesToLinks(typeNameEntries, nameModifier = a => a) {
    return mapTypeNamesToLinks(typeNameEntries, nameModifier)
}

function getProcessorTypeName(instance) {
    return Object.keys(ProcessorTypes).find(a => {
        try {
            var type = new ProcessorTypes[a]
            return type instanceof ProcessorType && type.equals(instance)
        } catch {
            return false
        }
    }) || '"' + instance + '"'
}

/**
 * @param func {MindustryCompiler.NativeFunctionBinding}
 * @param container {HTMLDivElement}
 */
function renderFunction(func, container) {
    //["read", "write"].includes(func.name) && console.log(func)
    var header = document.createElement("h2")
    var funcName = `${func.name}(${func.arguments.map(a => a[0]).join(", ")})`
    header.innerHTML = `<a href='#function-${func.name}'>${(func.returns ? "result = " : "")}${funcName}</a>`
    container.appendChild(header)
    if (func.returns) createP(container, `Return type: <a href="#type-${func.returns.toString().toLowerCase()}">${func.returns.toString().replaceAll("_", " ")}</a>`)
    else createP(container, "Doesn't return anything")
    if (func.arguments.length) createTable(container, mapTypesToLinks(func.arguments), ["Argument", "Type"])
    else createP(container, "Doesn't have arguments")
    if (func.instructions.length) createCode(container, func.instructions)
    else createP(container, "Doesn't have code")
    if (func.code) createMPPL(container, func.code)
    else createP(container, "Doesn't have MPPL implementation")
}

/**
 * @param container {HTMLDivElement}
 * @param elements {string[][]}
 * @param headline {string[], null}
 */
function createTable(container, elements, headline = null) {
    var table = document.createElement("table")
    var tr = document.createElement("tr")
    if (headline) {
        for (var header of headline) {
            var th = document.createElement("th")
            th.innerHTML = header
            tr.appendChild(th)
        }
        table.appendChild(tr)
    }
    for (var row of elements) {
        tr = document.createElement("tr")
        for (var col of row) {
            var td = document.createElement("td")
            td.innerHTML = col
            tr.appendChild(td)
        }
        table.appendChild(tr)
    }
    container.appendChild(table)
    return table
}

/**
 * @param container {HTMLDivElement}
 * @param text {string}
 */
function createP(container, text) {
    var p = document.createElement("p")
    p.innerHTML = text
    container.appendChild(p)
    return p
}

/**
 * @param container {HTMLDivElement}
 * @param code {ProcessorBlock[]}
 */
function createCode(container, code) {
    var blocksView = new ProcessorBlocksView()
    blocksView.setBlocks(code)
    var blocksViewContainer = blocksView.getContainer()
    blocksViewContainer.style.width = "calc(50vw - 20px)"
    container.appendChild(blocksViewContainer)
    return blocksViewContainer
}

/**
 * @param container {HTMLDivElement}
 * @param code {string}
 */
function createMPPL(container, code) {
    var cont = document.createElement("div")
    cont.style = "border: 1px solid black; width: fit-content; padding: 5px"
    var tokensGenerator = lexer.regenerateTokens(code)
    /**
     * @type {Token[]}
     */
    var tokens = Array.from(tokensGenerator)
    if (!MindustryCompiler.DEFAULT_CONSTANTS.length) new MindustryCompiler().createConstants()
    parser.reparse(tokens.filter(token =>
        !(token instanceof MindustryTokens.TAB || token instanceof MindustryTokens.COMMENT)
    ))
    highlightCode(cont, code, tokens)
    container.appendChild(cont)
    return cont
}

init()
// createMPPL(document.body, "NUMBER a = 8")
