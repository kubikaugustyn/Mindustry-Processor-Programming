var __author__ = "kubik.augustyn@post.cz"

// TODO https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
// TODO https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write

class LoadSaver {
    static LocalStoragePrefix = "load_saver-"
    static PropertiesFile = "project.properties"
    static CanAccessFilesystem = typeof window.showSaveFilePicker !== "undefined"
    /**
     * @type {HTMLDivElement}
     */
    container
    /**
     * @type {HTMLDivElement}
     */
    popup
    /**
     * @type {HTMLDivElement}
     */
    popupContent
    /**
     * @type {HTMLButtonElement}
     */
    saveButton
    /**
     * @type {HTMLButtonElement}
     */
    loadButton
    /**
     * @type {HTMLButtonElement}
     */
    projectSelectButton
    /**
     * @type {HTMLButtonElement}
     */
    downloadButton
    /**
     * @type {Map<string, string>}
     */
    projects = new Map()
    /**
     * @type {string}
     */
    project = ""
    /**
     * @type {FileSystemFileHandle, undefined}
     */
    projectFile
    /**
     * @type {SyntaxHighlighter, undefined}
     */
    highlighter

    /**
     * @param container {HTMLDivElement}
     */
    constructor(container = null) {
        this.container = container || document.createElement("div")
        this.container.classList.add("load-saver")

        this.popup = document.createElement("div")
        this.popup.classList.add("popup")
        this.popup.addEventListener("click", this.#hidePopup.bind(this))
        this.popupContent = document.createElement("div")
        this.popupContent.classList.add("popup-content")
        this.saveButton = document.createElement("button")
        this.saveButton.classList.add("save")
        this.saveButton.addEventListener("click", this.#save.bind(this))
        this.loadButton = document.createElement("button")
        this.loadButton.classList.add("load")
        this.loadButton.addEventListener("click", this.#load.bind(this))
        this.projectSelectButton = document.createElement("button")
        this.projectSelectButton.classList.add("project-select")
        this.projectSelectButton.addEventListener("click", this.#projectSelect.bind(this))
        this.downloadButton = document.createElement("button")
        this.downloadButton.classList.add("download")
        this.downloadButton.addEventListener("click", this.#download.bind(this))

        this.popup.appendChild(this.popupContent)
        this.container.appendChild(this.popup)
        this.container.appendChild(this.saveButton)
        this.container.appendChild(this.loadButton)
        LoadSaver.CanAccessFilesystem && this.container.appendChild(this.projectSelectButton)
        this.container.appendChild(this.downloadButton)

        this.#hidePopup()
        this.#loadProjects()
    }

    /**
     * @returns {HTMLDivElement}
     */
    getContainer() {
        return this.container
    }

    setHighlighter(highlighter) {
        this.highlighter = highlighter
    }

    static loadJSONObject(key) {
        return JSON.parse(localStorage.getItem(LoadSaver.LocalStoragePrefix + key) || "{}")
    }

    static saveJSONObject(key, object) {
        return localStorage.setItem(LoadSaver.LocalStoragePrefix + key, JSON.stringify(object))
    }

    #loadProjects() {
        this.projects.clear()
        var projectsObject = LoadSaver.loadJSONObject("projects")
        for (var [name, id] of Object.entries(projectsObject)) this.projects.set(name, id)
    }

    #saveProjects() {
        var projectsObject = {}
        for (var [name, id] of this.projects.entries()) projectsObject[name] = id
        LoadSaver.saveJSONObject("projects", projectsObject)
    }

    #newProject(name) {
        if (!LoadSaver.CanAccessFilesystem) return
        if (!name) {
            name = window.prompt("Enter project name:", "MPPL project")
            if (this.projects.has(name)) window.alert("Project already exists. Try different name")
            if (!name) return
        }
        this.project = name
        this.#requestProjectDir().then(dir => {
            this.#fileSelected(dir)
            this.#newProjectInDir(name, dir)
        }).catch(reason => window.alert("Failed to select file for new project: " + reason))
    }

    /**
     * @returns {Promise<FileSystemFileHandle>}
     */
    #requestProjectDir() {
        return window.showSaveFilePicker({
            suggestedName: this.project,
            types: [
                {
                    description: "MPPL file",
                    accept: {"text/mppl": [".mppl"]},
                },
            ],
        })
    }

    /**
     * @param file {FileSystemFileHandle}
     */
    #fileSelected(file) {
        this.projectFile = file
    }

    /**
     * @param name {string}
     * @param file {FileSystemFileHandle}
     */
    #newProjectInDir(name, file) {
        console.log("New project", name, "in", file)
        this.#verifyPermission(file, true).then(success => {
            if (!success) {
                window.alert("You need to grant permissions to read and write to the project file.")
                return
            }
            this.projects.set(name, Math.random().toString(36).slice(2))
            this.#saveProjects()
        })
    }

    /**
     * @param fileHandle {FileSystemFileHandle}
     * @param withWrite {boolean}
     * @returns {Promise<boolean>}
     */
    async #verifyPermission(fileHandle, withWrite) {
        // Simplified https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle#queryrequest_permissions
        var opts = {};
        if (withWrite) {
            opts.mode = "readwrite";
        }
        if ((await fileHandle.queryPermission(opts)) === "granted") {
            return true;
        }
        return (await fileHandle.requestPermission(opts)) === "granted";
    }

    #save() {
        console.log("Save!")
        /**
         * @type {HTMLTextAreaElement}
         */
        var input = this.highlighter?.editorElements?.input
        if (!input) return

        if (LoadSaver.CanAccessFilesystem) {
            console.log("Save!")
            return
        }
        localStorage.setItem(LoadSaver.LocalStoragePrefix + "code", input.value)
    }

    #load() {
        /**
         * @type {HTMLTextAreaElement}
         */
        var input = this.highlighter?.editorElements?.input
        if (!input) return

        if (LoadSaver.CanAccessFilesystem) {
            console.log("Load!")
            return
        }
        var code = localStorage.getItem(LoadSaver.LocalStoragePrefix + "code") || "## Enter code here\n## Code couldn't be loaded"
        this.highlighter.setCode(code)
    }

    #loadProject(name) {
        if (!LoadSaver.CanAccessFilesystem) return
        // console.log("Load project:", name, this.projects.get(name))
        this.project = name
        this.#requestProjectDir().then(file => {
            this.#fileSelected(file)
            console.log("Load from file:", file)
        }).catch(reason => window.alert("Failed to select file for project '" + name + "': " + reason))
    }

    #projectSelect() {
        console.log("Select project!")
        this.popupContent.innerHTML = "<h2>Select project</h2>"
        var newButton = document.createElement("button")
        newButton.innerText = "New project"
        newButton.addEventListener("click", () => {
            this.#hidePopup()
            this.#newProject()
        })
        this.popupContent.appendChild(newButton)
        for (var name of this.projects.keys()) {
            this.popupContent.appendChild(document.createElement("br"))
            var projButton = document.createElement("button")
            projButton.innerText = name
            const name1 = name // Lol
            projButton.addEventListener("click", () => {
                this.#hidePopup()
                this.#loadProject(name1)
            })
            this.popupContent.appendChild(projButton)
        }
        this.#showPopup()
    }

    #download() {
        var code = this.highlighter?.editorElements?.input?.value
        if (!code) {
            window.alert("You need to input code to be able to download.")
            return
        }
        var a = document.createElement("a")
        a.download = "code.mppl"
        a.target = "_blank"
        a.href = "data:text/mppl;charset=utf-8,".concat(encodeURIComponent(code))
        a.click()
    }

    #showPopup(content) {
        content && (this.popupContent.innerHTML = content)
        this.popup.classList.remove("hidden")
    }

    #hidePopup(e) {
        if (typeof e !== "undefined" && e.target !== this.popup) return
        this.popup.classList.add("hidden")
    }
}
