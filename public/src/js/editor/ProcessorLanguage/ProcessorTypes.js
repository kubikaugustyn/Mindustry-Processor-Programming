var __author__ = "kubik.augustyn@post.cz"

class ProcessorTypeValueRule {
    isValid(value) {
        return true
    }

    toString() {
        return "default rule"
    }
}

class ProcessorTypeValueRules {
    static IN_RANGE = class extends ProcessorTypeValueRule {
        min
        max

        constructor(min, max) {
            super();
            this.min = min
            this.max = max
        }

        isValid(value) {
            return value >= this.min && value <= this.max
        }

        toString() {
            return `in range &lt;${this.min}; ${this.max}&gt;`
        }
    }
    static INTEGER = class extends ProcessorTypeValueRule {
        isValid(value) {
            return Number.isInteger(value)
        }

        toString() {
            return `is integer`
        }
    }
    static POSITIVE = class extends ProcessorTypeValueRule {
        isValid(value) {
            return value >= 0
        }

        toString() {
            return `&gt;= 0`
        }
    }
}

class ProcessorType {
    /**
     * @type {string}
     */
    name
    /**
     * @type {Map|undefined}
     */
    properties
    /**
     * @type {Array<ProcessorTypeValueRule>|undefined}
     */
    rules

    /**
     * @param other {ProcessorType}
     * @returns {boolean}
     */
    equals(other) {
        return this.constructor === other.constructor
    }

    toString() {
        return this.name.toUpperCase() + (this.rules ? " (" + this.rules.map(rule => rule.toString()).join(", ") + ")" : "")
    }
}

class ProcessorTypes {
    static STRING = class extends ProcessorType {
        name = "string"
    }
    static BOOLEAN = class extends ProcessorType {
        name = "boolean"
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 1)
        ]
    }
    static NUMBER = class extends ProcessorType {
        name = "number"
    }
    static INTEGER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.INTEGER()
        ]
    }
    static COLOR = class extends ProcessorType {
        name = "color"
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.POSITIVE(),
            new ProcessorTypeValueRules.IN_RANGE(0, 255)
        ]
    }
    static BLOCK_ROTATION_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 3)
        ]
    }
    static UNIT_ROTATION_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.IN_RANGE(0, 360)
        ]
    }
    static CONTROLLED_NUMBER = class extends ProcessorTypes.NUMBER {
        /*
        1 - @ctrlProcessor - if unit controller is processor
        2 - @ctrlPlayer - if unit/building controller is player
        3 - @ctrlCommand - if unit controller is a player command
        0 - otherwise
        */
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 3)
        ]
    }
    static PERCENTAGE_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.IN_RANGE(0, 1)
        ]
    }
    static COLOR_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 0xFFFFFFFF)
        ]
    }
    static ITEMS_LIQUIDS_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, Infinity)
        ]
    }
    static POWER_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.INTEGER()
        ]
    }
    static POSITIVE_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.POSITIVE()
        ]
    }
    static POSITIVE_INTEGER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.POSITIVE()
        ]
    }
    static CONTENT = class extends ProcessorType {
        name = "content"
        properties = new Map([
            ["name", "STRING"],
            ["color", "NUMBER"] // Some bullsh*t float but whatever
        ])
    }
    static ALL_ITEMS = ["copper", "lead", "metaglass", "graphite", "sand", "coal", "titanium", "thorium", "scrap", "silicon", "plastanium", "phase-fabric", "surge-alloy", "spore-pod", "blast-compound", "pyratite", "beryllium", "fissile-matter", "dormant-cyst", "tungsten", "carbide", "oxide"]
    static ALL_LIQUIDS = ["water", "slag", "oil", "cryofluid", "neoplasm", "hydrogen", "ozone", "cyanogen", "gallium", "nitrogen", "arkycite"]
    static BUILDING = class extends ProcessorType {
        name = "building"
        properties = new Map([
            ...ProcessorTypes.ALL_ITEMS.map(name => [name, "POSITIVE_INTEGER"]),
            ...ProcessorTypes.ALL_LIQUIDS.map(name => [name, "POSITIVE_INTEGER"]),
            ["totalItems", "ITEMS_LIQUIDS_NUMBER"],
            ["firstItem", "CONTENT"],
            ["totalLiquids", "ITEMS_LIQUIDS_NUMBER"],
            ["totalPower", "POWER_NUMBER"],
            ["itemCapacity", "ITEMS_LIQUIDS_NUMBER"],
            ["liquidCapacity", "ITEMS_LIQUIDS_NUMBER"],
            ["powerNetStored", "POSITIVE_INTEGER"],
            ["powerNetCapacity", "POSITIVE_INTEGER"],
            ["powerNetIn", "POSITIVE_INTEGER"],
            ["powerNetOut", "POSITIVE_INTEGER"],
            ["ammo", "POSITIVE_INTEGER"],
            ["ammoCapacity", "POSITIVE_INTEGER"],
            ["health", "INTEGER"],
            ["maxHealth", "INTEGER"],
            ["heat", "PERCENTAGE_NUMBER"],
            ["efficiency", "BOOLEAN"],
            ["timescale", "NUMBER"],
            ["rotation", "BLOCK_ROTATION_NUMBER"],
            ["x", "INTEGER"],
            ["y", "INTEGER"],
            ["shootX", "INTEGER"],
            ["shootY", "INTEGER"],
            ["size", "POSITIVE_INTEGER"],
            ["range", "POSITIVE_NUMBER"],
            ["shooting", "BOOLEAN"],
            ["team", "POSITIVE_INTEGER"],
            ["type", "CONTENT"],
            ["controlled", "CONTROLLED_NUMBER"],
            ["enabled", "BOOLEAN"],
            ["config", "CONTENT|UNIT"],
            ["color", "COLOR_NUMBER"]
        ])
    }
    static UNIT = class extends ProcessorType {
        name = "unit"
        properties = new Map([
            ["totalItems", "POSITIVE_INTEGER"],
            ["firstItem", "CONTENT"],
            ["itemCapacity", "POSITIVE_INTEGER"],
            ["ammo", "BOOLEAN"],
            ["ammoCapacity", "BOOLEAN"],
            ["health", "POSITIVE_INTEGER"],
            ["maxHealth", "POSITIVE_INTEGER"],
            ["rotation", "UNIT_ROTATION_NUMBER"],
            ["x", "INTEGER"],
            ["y", "INTEGER"],
            ["shootX", "INTEGER"],
            ["shootY", "INTEGER"],
            ["size", "POSITIVE_INTEGER"],
            ["dead", "BOOLEAN"],
            ["range", "POSITIVE_NUMBER"],
            ["shooting", "BOOLEAN"],
            ["boosting", "BOOLEAN"],
            ["mineX", "INTEGER"],
            ["mineY", "INTEGER"],
            ["mining", "BOOLEAN"],
            ["speed", "INTEGER"],
            ["team", "POSITIVE_INTEGER"],
            ["flag", "INTEGER"],
            ["controlled", "CONTROLLED_NUMBER"],
            ["controller", "UNIT|BUILDING"], // If unit controlled by processor, return processor otherwise unit itself
            ["payloadCount", "POSITIVE_INTEGER"],
            ["payloadType", "CONTENT"]
        ])
    }

    static get(name) {
        return ProcessorTypes[name]
    }
}
