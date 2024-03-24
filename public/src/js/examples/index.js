var __author__ = "kubik.augustyn@post.cz"

var lexer = new MindustryLexer()
var parser = new MindustryParser()
var compiler = new MindustryCompiler()
compiler.createLibFunctions()
var rootContainer = document.getElementById("examples")

// TODO make it load in the UI
var codeExamples = []
var codeExampleElements = {}
var rootURL = document.location.origin + document.location.pathname;
(function () {
    var DEBUG = document.location.hostname === "localhost";
    fetch(rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.lastIndexOf('/') - 1)) + "/src/js/examples/examples.json").then(a => a.json()).then(examplesJson => {
        var examples = examplesJson.examples || []
        examples.forEach(example => example.kind = "MPPL Example")
        examplesJson.real_examples?.forEach(example => {
            example.kind = "Real usage example"
            examples.push(example)
        })
        if (DEBUG) examplesJson.debug_examples?.forEach(example => {
            example.kind = "Debug example"
            examples.push(example)
        })
        codeExamples = examples;
        init()
    }).catch(e => console.error(e))
})()

async function loadAndShowExample(example, index) {
    var container = codeExampleElements[example.path] = document.createElement("div")
    rootContainer.appendChild(container)

    container.id = "example-".concat(index)
    container.innerHTML = `<h2><a href="#${container.id}">${example.name}</a></h2><p>(${example.kind})</p><p>${example.description}</p>`

    var exampleText = await fetch(rootURL.substring(0, rootURL.lastIndexOf('/', rootURL.lastIndexOf('/') - 1)) + "/src/js/examples/" + example.path).then(a => a.text())
    createMPPL(container, exampleText)

    if (document.location.hash) {
        // A trick to navigate to our example
        var hash = document.location.hash
        document.location.hash = ""
        document.location.hash = hash
    }
}

function init() {
    if (!codeExamples.length) {
        rootContainer.innerHTML = "Examples are loading..."
        return
    }
    rootContainer.innerHTML = ""
    codeExamples.forEach(loadAndShowExample)
}

init()
