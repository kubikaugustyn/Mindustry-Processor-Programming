/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

export default class AccessPolicy {
    /** @type {string} */
    name
    /** @type {string} */
    description
    /** @type {(function(policy: AccessPolicy, settings: TSettings): boolean)[]} */
    rules

    /**
     * @param name {string}
     * @param description {string}
     * @param rules {(function(policy: AccessPolicy, settings: TSettings): boolean)[]}
     */
    constructor(name, description, rules) {
        this.name = name
        this.description = description
        this.rules = rules
    }

    matches(settings) {
        return this.rules.every(rule => rule(this, settings))
    }
}

const AP_V7_ONLY = new AccessPolicy("V7 only", "Accessible only on V7", [
    (policy, settings) => settings.version === "release-146"
])
const AP_V8_OR_LATER_ONLY = new AccessPolicy("V8 or later only", "Accessible only on V8 or later releases", [
    (policy, settings) => settings.version === "be-25924"
])
const AP_WORLD_PROCESSOR_ONLY = new AccessPolicy("World processor only", "Accessible only on world processors", [
    (policy, settings) => settings.enableWorldProcessorInstructions === true
])

export {AP_V7_ONLY, AP_V8_OR_LATER_ONLY, AP_WORLD_PROCESSOR_ONLY}
