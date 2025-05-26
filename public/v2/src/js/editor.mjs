/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import "./codemirror-5.65.18/lib/codemirror.js" // Imports the global CodeMirror object
import "./codemirror-5.65.18/mode/javascript/javascript.js"
import "./codemirror-5.65.18/addon/hint/show-hint.js"
import "./codemirror-5.65.18/addon/hint/javascript-hint.js"
import SplitView from "./SplitView.mjs"
import {importCSS, stringHashCode} from "./utils.mjs";
import compile from "./compiler/compile.mjs"
import InstructionContainer from "./intructions/InstructionContainer.mjs";
import SettingsDialog from "./intructions/SettingsDialog.mjs";

importCSS("../src/js/codemirror-5.65.18/lib/codemirror.css")
importCSS("../src/js/codemirror-5.65.18/addon/hint/show-hint.css")
importCSS("../src/css/editor.css")

/** @type {Readonly<string>} */
const CODE_KEY = 'mindustry-processor-programming-v2-code'

/** @type {SplitView|null} */
let splitView = null
/** @type {CodeMirror|null} */
let editor = null
/** @type {InstructionContainer|null} */
let instructionContainer = null
/** @type {SettingsDialog|null} */
let settingsDialog = null

/**
 * @type {{_lastCodeHash: number, readonly _compile: (function(string, InstructionContainer, function(): boolean): Promise<boolean>), _isCompiling: boolean, readonly finishedGracefully: boolean, _recompileAfterFinished: boolean, _finishedGracefully: boolean, _shouldCancel: boolean, scheduleCompile(force?: boolean): void, scheduleCancelCompile(): void}}
 */
const compileManager = {
    _lastCodeHash: 0,
    _shouldCancel: false,
    _recompileAfterFinished: false,
    _isCompiling: false,
    _finishedGracefully: false,

    scheduleCompile(force = false) {
        if (this._isCompiling) {
            this.scheduleCancelCompile()
            this._recompileAfterFinished = true
            return
        }
        if (editor === null || instructionContainer === null) return
        /** @type {string} */
        const inputCode = editor.getValue()
        const codeHash = stringHashCode(inputCode)
        if (codeHash === this._lastCodeHash && !force) return
        this._lastCodeHash = codeHash

        this._isCompiling = true
        this._shouldCancel = false
        setTimeout(async () => {
            if (!this._shouldCancel) {
                if (inputCode !== exampleCode) localStorage.setItem(CODE_KEY, inputCode)
                this._finishedGracefully = await this._compile(inputCode, instructionContainer, () => this._shouldCancel, settingsDialog.getSettings())
                setTimeout(onCompiledCodeChange, 0)
            }

            this._isCompiling = false
            if (this._recompileAfterFinished) {
                this._recompileAfterFinished = false
                this.scheduleCompile()
                console.assert(this._isCompiling) // Should be true by now
            }
        }, 500)
    },
    scheduleCancelCompile() {
        if (!this._isCompiling) return
        if (this._shouldCancel) return

        this._shouldCancel = true
    },
    get finishedGracefully() {
        return this._finishedGracefully
    },
    get _compile() {
        return compile
    }
}

const exampleCode = `/*
Link this to a message (optional) and to multiple thorium reactors
When the reactor reaches less than 10 cryofluid, it will be disabled.
As you can see, complicated MLOG is simple with MPPL.
Note that it can be further simplified, not creating so many variables.
*/

let hasMessage = message1 != null
let reactorI = 1
for (let i = 0; i < @links; i++){
    // First we get the link and check if it's a reactor
    const reactor = getlink(i)
    const type = @type of reactor
    if (type != @thorium-reactor) continue

    // Then we read the important values
    const cryo = @cryofluid in reactor,
          heat = @heat in reactor

    // Then we decide whether it should be enabled
    const enable = cryo > 10 && heat == 0

    // Finally enable/disable it
    control.enabled(reactor, enable)

    // Some printing to the message
    if (hasMessage) {
        print("Reactor #")
        print(reactorI)
        reactorI = reactorI + 1
        if (enable) print(" [green]enabled[]\\n")
        else print(" [red]disabled[]\\n")
    }
}
if (hasMessage) printFlush(message1)
`

function onLoad() {
    const root = document.getElementById("editor")
    splitView = new SplitView(root)

    editor = new CodeMirror(splitView.left, {
        value: localStorage.getItem(CODE_KEY) ?? exampleCode,
        mode: 'javascript',
        theme: "default", // TODO Maybe use a custom/preset theme? "abcdef"?
        lineNumbers: true,
        matchBrackets: true,
        indentWithTabs: true,
        tabSize: 4,
        indentUnit: 4,
        hintOptions: {
            // https://codemirror.net/5/doc/manual.html#addon_show-hint
            // Most of the options are the same as default, but I wanted to make sure they're specified
            completeSingle: true,
            alignWithWord: true,
            closeCharacters: /[\s:?,]/,
            closeOnUnfocus: true,
            completeOnSingleClick: true,
            container: splitView.left,
            scrollMargin: 0,
            // These are extra keys for the hinting plugin
            /*extraKeys: {
                "Esc": cm => {
                    // We don't want any Escape when forced completion is true
                    console.assert(editor === cm, "The CodeMirror instance does not match the instance provided in the key listener")

                    codemirror.closeHint()
                    codemirror.getOption("hintOptions").completeSingle = true
                }
            }*/
        },
        direction: "ltr",
        // See CodeMirror.commands for all the possible values
        // Functions can also be provided
        // https://codemirror.net/5/doc/manual.html#keymaps
        // TODO Add keys for Mac users
        extraKeys: {
            "Ctrl-Space": cm => {
                console.assert(editor === cm, "The CodeMirror instance does not match the instance provided in the key listener")
                cm.execCommand("autocomplete")
            },
            "Tab": "indentMore", // 'insertSoftTab' is harder for "newbies", but inserts space characters
            "Shift-Tab": "indentLess",
            "Ctrl-Y": "deleteLine", // Not 'redo', that can be done with 'Shift-Ctrl-Z'
            "Ctrl-Enter": "openLine",
            "Enter": "newlineAndIndent",
            "Insert": cm => void 0, // A noop to prevent the Insert key from doing bad stuff
        },
        showCursorWhenSelecting: true,
        spellcheck: false,
        autocorrect: false,
        autocapitalize: false,
    })
    editor.on('cursorActivity', function (instance) {

    });
    editor.on('change', function (instance) {
        compileManager.scheduleCompile()
    });
    editor.on('startCompletion', function (instance) {
        compileManager.scheduleCancelCompile()
    });
    editor.on('endCompletion', function (instance) {
        compileManager.scheduleCompile()
    });
    editor.on('focus', function (instance, event) {
        compileManager.scheduleCompile()
    });
    editor.on('blur', function (instance, event) {
        compileManager.scheduleCancelCompile()
    });

    settingsDialog = new SettingsDialog(document.body)
    settingsDialog.addEventListener("change", () => compileManager.scheduleCompile(true))
    instructionContainer = new InstructionContainer(splitView.right, () => settingsDialog.open())

    onCompiledCodeChange()
    compileManager.scheduleCompile()
}

function onCompiledCodeChange() {
    console.log("Instructions:", instructionContainer)
    if (instructionContainer === null) return
    instructionContainer.render()
}

document.addEventListener("readystatechange", e => document.readyState === "complete" && onLoad())
