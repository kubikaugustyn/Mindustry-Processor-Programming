/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {importCSS} from "../utils.mjs";

importCSS("../src/css/SettingsDialog.css")

/**
 * @typedef {{
 *      version: string,
 *      enableWorldProcessorInstructions: boolean,
 * }} TSettings
 */

/** @type {Readonly<Object<string, string>>} */
const TARGET_VERSIONS = Object.freeze({
    "release-146": "Mindustry V7 (release 146)",
    "be-25924": "Mindustry V8 (bleeding-edge 25924)",
})

/** @type {Readonly<TSettings>} */
const DEFAULT_SETTINGS = Object.freeze({
    version: "release-146",
    enableWorldProcessorInstructions: false,
})
export {DEFAULT_SETTINGS}

/** @type {Readonly<string>} */
const SETTINGS_KEY = 'mindustry-processor-programming-v2-settings'

export default class SettingsDialog extends EventTarget {
    /** @type {HTMLElement} */
    _parent
    /** @type {HTMLDialogElement} */
    _container
    /** @type {HTMLFormElement} */
    _form
    /** @type {TSettings} */
    _currentSettings

    constructor(parent) {
        super()
        this._parent = parent
        this._create()
        this._parent.appendChild(this._container)

        this._loadSettings()
    }

    _create() {
        this._form = document.createElement("form")
        this._form.method = "dialog"

        this._form.appendChild(document.createElement("h3")).innerText = "Settings"

        const targetVersion = this._form.appendChild(document.createElement("label"))
        targetVersion.appendChild(new Text("Target Mindustry version: "))
        const targetVersionSelect = targetVersion.appendChild(document.createElement("select"))
        targetVersionSelect.name = "version"
        for (const [id, name] of Object.entries(TARGET_VERSIONS)) {
            const option = targetVersionSelect.appendChild(document.createElement("option"))
            option.value = id
            option.innerText = name
        }

        const enableWPI = this._form.appendChild(document.createElement("label"))
        const enableWPICheckbox = enableWPI.appendChild(document.createElement("input"))
        enableWPICheckbox.type = "checkbox"
        enableWPICheckbox.name = "enableWorldProcessorInstructions"
        enableWPI.appendChild(new Text(" Enable world processor instructions"))

        const menu = this._form.appendChild(document.createElement("menu"))
        const saveButton = menu.appendChild(document.createElement("button"))
        saveButton.value = "save"
        saveButton.innerText = "Save"
        const cancelButton = menu.appendChild(document.createElement("button"))
        cancelButton.value = "cancel"
        cancelButton.innerText = "Cancel"
        const resetButton = menu.appendChild(document.createElement("button"))
        resetButton.value = "reset"
        resetButton.innerText = "Reset"

        this._container = document.createElement("dialog")
        this._container.appendChild(this._form)
        this._container.classList.add("settings-dialog")
        const onClose = returnValue => {
            const formData = new FormData(this._form)

            if (returnValue === "cancel" && this._hasMadeChanges(formData) && !confirm("Discard changes?")) return false
            else if (returnValue === "reset" && !confirm("Reset to defaults?")) return false

            this._onClose(returnValue, formData)
            return true
        }
        this._container.addEventListener('close', e => {
            const returnValue = this._container.returnValue
            if (!returnValue) return

            if (!onClose(returnValue))
                this.open(false) // Sadly, we can't cancel the 'close' event
        })
        this._container.addEventListener('cancel', e => {
            if (!onClose("cancel"))
                e.preventDefault()
        })
    }

    _loadSettings() {
        let savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}
        if (typeof savedSettings !== 'object') savedSettings = {}

        this._currentSettings = Object.assign({}, DEFAULT_SETTINGS, savedSettings)
    }

    _saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._currentSettings))
    }

    _onClose(returnValue, formData) {
        switch (returnValue) {
            case "save":
                const OLD = JSON.stringify(this._currentSettings)

                this._readSettingsFromForm(formData)

                if (JSON.stringify(this._currentSettings) !== OLD)
                    this.dispatchEvent(new Event("change"))
                break
            case "cancel":
                // NOOP
                break
            case "reset":
                this._currentSettings = Object.assign({}, DEFAULT_SETTINGS)
                this.dispatchEvent(new Event("change"))
                break
        }

        this._saveSettings()

        this.dispatchEvent(new Event("close"))
    }

    /**
     * @param formData {FormData}
     * @private
     */
    _readSettingsFromForm(formData) {
        this._currentSettings.version = formData.get("version")
        this._currentSettings.enableWorldProcessorInstructions = formData.get("enableWorldProcessorInstructions") === "on"
    }

    _writeSettingsToForm() {
        this._form.elements["version"].value = this._currentSettings.version
        this._form.elements["enableWorldProcessorInstructions"].checked = this._currentSettings.enableWorldProcessorInstructions
    }

    _hasMadeChanges(formData) {
        return this._currentSettings.version !== formData.get("version") ||
            this._currentSettings.enableWorldProcessorInstructions !== (formData.get("enableWorldProcessorInstructions") === "on")
    }

    open(rewriteFormSettings = true) {
        if (rewriteFormSettings) this._writeSettingsToForm()
        this._container.showModal()
    }

    close() {
        this._container.close("cancel")
    }

    getSettings() {
        return Object.assign({}, DEFAULT_SETTINGS, this._currentSettings)
    }
}
