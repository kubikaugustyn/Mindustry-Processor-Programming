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

importCSS("../src/js/codemirror-5.65.18/lib/codemirror.css")
importCSS("../src/js/codemirror-5.65.18/addon/hint/show-hint.css")
importCSS("../src/css/editor.css")

/** @type {SplitView|null} */
let splitView = null
/** @type {CodeMirror|null} */
let editor = null
/** @type {InstructionContainer|null} */
let instructionContainer = null

/**
 * @type {{_lastCodeHash: number, readonly _compile: (function(string, InstructionContainer, function(): boolean): Promise<boolean>), _isCompiling: boolean, readonly finishedGracefully: boolean, _recompileAfterFinished: boolean, _finishedGracefully: boolean, _shouldCancel: boolean, scheduleCompile(): void, scheduleCancelCompile(): void}}
 */
const compileManager = {
    _lastCodeHash: 0,
    _shouldCancel: false,
    _recompileAfterFinished: false,
    _isCompiling: false,
    _finishedGracefully: false,

    scheduleCompile() {
        if (this._isCompiling) {
            this.scheduleCancelCompile()
            this._recompileAfterFinished = true
            return
        }
        if (editor === null || instructionContainer === null) return
        /** @type {string} */
        const inputCode = editor.getValue()
        const codeHash = stringHashCode(inputCode)
        if (codeHash === this._lastCodeHash) return
        this._lastCodeHash = codeHash

        this._isCompiling = true
        this._shouldCancel = false
        setTimeout(async () => {
            if (!this._shouldCancel) {
                localStorage.setItem("tmp-name-stored-mind-proc-programming-v2-code", inputCode) // FIXME Tmp
                this._finishedGracefully = await this._compile(inputCode, instructionContainer, () => this._shouldCancel)
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

const exampleCode = `// 
`

function onLoad() {
    const root = document.getElementById("editor")
    splitView = new SplitView(root)

    editor = new CodeMirror(splitView.left, {
        value: localStorage.getItem("tmp-name-stored-mind-proc-programming-v2-code") ?? exampleCode,
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

    instructionContainer = new InstructionContainer(splitView.right)

    onCompiledCodeChange()
    compileManager.scheduleCompile()
}

function onCompiledCodeChange() {
    console.log("Instructions:", instructionContainer)
    if (instructionContainer === null) return
    instructionContainer.render()
}

document.addEventListener("readystatechange", e => document.readyState === "complete" && onLoad())
