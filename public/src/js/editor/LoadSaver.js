var __author__ = "kubik.augustyn@post.cz"

// TODO https://developer.mozilla.org/en-US/docs/Web/API/window/showDirectoryPicker

class LoadSaver {
    static LocalStoragePrefix = "load_saver-"
    /**
     * @type {HTMLDivElement}
     */
    container
    /**
     * @type {Map<string, string>}
     */
    projects = new Map()

    /**
     * @param container {HTMLDivElement}
     */
    constructor(container = null) {
        this.container = container || document.createElement("div")
        this.container.classList.add("load-saver")
    }

    /**
     * @returns {HTMLDivElement}
     */
    getContainer() {
        return this.container
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

    tryLoadProject() {
        console.log("Try load project")
        this.#loadProjects()
    }
}
