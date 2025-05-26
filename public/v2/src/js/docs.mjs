/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import "./codemirror-5.65.18/lib/codemirror.js" // Imports the global CodeMirror object
import "./codemirror-5.65.18/mode/javascript/javascript.js"
import "./codemirror-5.65.18/addon/hint/show-hint.js"
import "./codemirror-5.65.18/addon/hint/javascript-hint.js"
import {importCSS} from "./utils.mjs";
import compile from "./compiler/compile.mjs"
import InstructionContainer from "./intructions/InstructionContainer.mjs";
import SettingsDialog from "./intructions/SettingsDialog.mjs";
import libmlog from "./compiler/libmlog.mjs";
import {NativeFunction, NativeJITFunction} from "./compiler/NativeFunction.mjs";

importCSS("../src/js/codemirror-5.65.18/lib/codemirror.css")
importCSS("../src/js/codemirror-5.65.18/addon/hint/show-hint.css")
importCSS("../src/css/docs.css")

/** @type {SettingsDialog|null} */
let settingsDialog = null

function onLoad() {
    settingsDialog = new SettingsDialog(document.body)
    settingsDialog.addEventListener("change", () => {
        document.location.hash = ""
        render()
    })
    document.getElementById("open-settings").addEventListener("click", () => settingsDialog.open())

    render()
}

function render() {
    const settings = settingsDialog.getSettings()

    const contents = document.getElementById("contents")
    contents.innerHTML = ""
    const processNamespace = (path, namespace) => {
        const arr = []
        namespace.forEach((value, name) => {
            const fullName = path ? path.concat(".", name) : name

            if (value instanceof NativeFunction) {
                if (!value.accessPolicies.every(policy => policy.matches(settings))) return

                const args = value.arguments
                    .map(arg => (arg.spread ? "..." : "").concat(arg.name))
                    .join(", ")
                arr.push({title: fullName.concat("(", args, ")"), sub: null})
            }
            else
                arr.push({title: fullName, sub: processNamespace(fullName, value)})
        })
        return arr
    }
    const contentsArray = processNamespace("", libmlog)
    console.log("Contents:", contentsArray)
    const renderContents = (element, arr) => {
        for (const entry of arr) {
            const li = element.appendChild(document.createElement("li"))
            li.classList.add(entry.sub ? "namespace" : "function")
            const a = li.appendChild(document.createElement("a"))
            a.innerText = entry.title
            const hash = "#".concat(entry.title.replaceAll(" ", ""))
            a.href = hash
            li.addEventListener('click', e => {
                // if (e.target === a) return
                if (e.target === li) a.click()
            })
            if (hash === document.location.hash)
                setTimeout(() => a.scrollIntoView({behavior: "smooth"}), 100)

            if (entry.sub)
                renderContents(li.appendChild(document.createElement("ul")), entry.sub)
        }
    }
    const libMlog = contents.appendChild(document.createElement("li"))
    libMlog.classList.add("namespace")
    // libMlog.innerText = "libmlog"
    renderContents(libMlog, contentsArray)

    requestAnimationFrame(() => requestAnimationFrame(() => {
        const nativeLibrary = document.getElementById("native-library")
        nativeLibrary.innerHTML = ""
        const renderNamespace = (element, path, namespace) => {
            namespace.forEach((value, name) => {
                let fullName = path ? path.concat(".", name) : name
                const isNamespace = !(value instanceof NativeFunction)

                let args = ""
                if (!isNamespace) {
                    if (!value.accessPolicies.every(policy => policy.matches(settings))) return

                    args = value.arguments
                        .map(arg => (arg.spread ? "..." : "").concat(arg.name))
                        .join(", ")
                    fullName = fullName.concat("(", args, ")")
                }

                const header = element.appendChild(document.createElement(isNamespace ? "h2" : "h3"))
                header.id = fullName.replaceAll(" ", "")
                const a = header.appendChild(document.createElement("a"))
                a.innerText = fullName
                const hash = "#".concat(header.id)
                a.href = hash
                if (hash === document.location.hash)
                    setTimeout(() => a.scrollIntoView({behavior: "smooth"}), 100)

                const content = element.appendChild(document.createElement("div"))

                if (!isNamespace) {
                    if (!(value instanceof NativeFunction)) throw new Error("Huh?!")

                    const accessPolicies = content.appendChild(document.createElement("p"))
                    accessPolicies.innerText = "Access policies:"
                    if (value.accessPolicies.length)
                        value.accessPolicies.forEach(policy => {
                            accessPolicies.appendChild(document.createElement("br"))
                            accessPolicies.appendChild(document.createElement("b")).innerText = policy.name
                            accessPolicies.appendChild(new Text(" - ".concat(policy.description)))
                        })
                    else accessPolicies.innerText = "No access policies (public)"

                    const implementation = content.appendChild(document.createElement("div"))
                    implementation.classList.add("implementation")
                    implementation.innerText = "Native implementation:"
                    let code
                    if (value instanceof NativeJITFunction) {
                        code = value.code
                            .trim()
                            .split("\n")
                            .map(line => "\t".concat(line.trim()))
                            .join("\n")
                        code = `function ${name}(${args}) {\n\t// JIT:start\n${code}\n\t// JIT:end\n}`
                    }
                    else {
                        code = `function ${name}(${args}) { [native code] }`
                    }
                    new CodeMirror(implementation.appendChild(document.createElement("div")), {
                        value: code,
                        mode: 'javascript',
                        theme: "default",
                        lineNumbers: true,
                        tabSize: 4,
                        indentUnit: 4,
                        direction: "ltr",
                        spellcheck: false,
                        readOnly: true,
                    })
                }
                else renderNamespace(content, fullName, value)
            })
        }
        renderNamespace(nativeLibrary, "", libmlog)
    }))
}

document.addEventListener("readystatechange", e => document.readyState === "complete" && onLoad())
