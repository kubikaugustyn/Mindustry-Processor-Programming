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
    static NUMBER = class extends ProcessorTypeValueRule {
        isValid(value) {
            return typeof value === "number"
        }

        toString() {
            return `is number`
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
    static RADAR_TARGET = class extends ProcessorTypeValueRule {
        isValid(value) {
            return typeof value === "string" && [
                "any",
                "enemy",
                "ally",
                "player",
                "attacker",
                "flying",
                "boss",
                "ground"
            ].includes(value)
        }

        toString() {
            return `one of {any, enemy, ally, player, attacker, flying, boss, ground}`
        }
    }
    static RADAR_SORT = class extends ProcessorTypeValueRule {
        isValid(value) {
            return typeof value === "string" && [
                "distance",
                "health",
                "shield",
                "armor",
                "maxHealth"
            ].includes(value)
        }

        toString() {
            return `one of {distance, health, shield, armor, maxHealth}`
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
     * @type {ProcessorTypeValueRule[]|undefined}
     */
    rules

    constructor() {
        ProcessorTypes.ALL_INSTANCES.push(this)
        this.reload()
    }

    /**
     * Used to reload when ALL_ITEMS etc. is changed
     */
    reload() {

    }

    isValid(value) {
        for (var rule of this.rules) {
            if (!rule.isValid(value)) return false
        }
        return true
    }

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
    static ANY = class extends ProcessorType {
        name = "any"
    }
    static NULL = class extends ProcessorType {
        name = "null"
    }
    static STRING = class extends ProcessorType {
        name = "string"
    }
    static BOOLEAN = class extends ProcessorType {
        name = "boolean"
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 1)
        ]
    }
    static NUMBER = class extends ProcessorType {
        name = "number"
    }
    static INTEGER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER()
        ]
    }
    static COLOR_NUMBER = class extends ProcessorType {
        name = "color number"
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.POSITIVE(),
            new ProcessorTypeValueRules.IN_RANGE(0, 255)
        ]
    }
    static BLOCK_ROTATION_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 3)
        ]
    }
    static UNIT_ROTATION_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 360)
        ]
    }
    static CONTROLLED_NUMBER = class extends ProcessorTypes.NUMBER {
        static ctrlProcessor = 1
        static ctrlPlayer = 2
        static ctrlCommand = 3
        /*
        1 - @ctrlProcessor - if unit controller is processor
        2 - @ctrlPlayer - if unit/building controller is player
        3 - @ctrlCommand - if unit controller is a player command
        0 - otherwise
        */
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 3)
        ]
    }
    static PERCENTAGE_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 1)
        ]
    }
    static COLOR = class extends ProcessorTypes.NUMBER {
        name = "color"
        // 0xRRGGBBAA
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, 0xFFFFFFFF)
        ]
    }
    static ITEMS_LIQUIDS_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.IN_RANGE(0, Infinity)
        ]
    }
    static POWER_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER()
        ]
    }
    static POSITIVE_NUMBER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.POSITIVE()
        ]
    }
    static POSITIVE_INTEGER = class extends ProcessorTypes.NUMBER {
        rules = [
            new ProcessorTypeValueRules.NUMBER(),
            new ProcessorTypeValueRules.INTEGER(),
            new ProcessorTypeValueRules.POSITIVE()
        ]
    }
    static RADAR_TARGET = class extends ProcessorType {
        name = "radar target"
        rules = [
            new ProcessorTypeValueRules.RADAR_TARGET()
        ]
    }
    static RADAR_SORT = class extends ProcessorType {
        name = "radar sort"
        rules = [
            new ProcessorTypeValueRules.RADAR_SORT()
        ]
    }
    static CONTENT = class extends ProcessorType {
        name = "content"
        properties = new Map([
            ["name", "STRING"],
            ["color", "NUMBER"] // Some bullsh*t float but whatever
        ])
    }
    static ITEM = class extends ProcessorTypes.CONTENT {
        name = "content item"
    }
    static LIQUID = class extends ProcessorTypes.CONTENT {
        name = "content liquid"
    }
    static BLOCK = class extends ProcessorTypes.CONTENT {
        name = "content block"
    }
    static UNIT_TYPE = class extends ProcessorTypes.CONTENT {
        name = "content unit"
    }
    //Team.baseTeams
    static ALL_BASE_TEAMS = ["derelict", "sharded", "crux", "malis", "green", "blue"]
    //ContentType.item - Vars.content.items()
    static ALL_ITEMS = []
    //ContentType.liquid - Vars.content.liquids()
    static ALL_LIQUIDS = []
    //ContentType.block - Vars.content.blocks()
    static ALL_BLOCKS = []
    //ContentType.unit - Vars.content.units()
    static ALL_UNITS = []
    // LAccess.all
    static ALL_SENSORS = ['totalItems', 'firstItem', 'totalLiquids', 'totalPower', 'itemCapacity', 'liquidCapacity', 'powerCapacity', 'powerNetStored', 'powerNetCapacity', 'powerNetIn', 'powerNetOut', 'ammo', 'ammoCapacity', 'health', 'maxHealth', 'heat', 'efficiency', 'progress', 'timescale', 'rotation', 'x', 'y', 'shootX', 'shootY', 'size', 'dead', 'range', 'shooting', 'boosting', 'mineX', 'mineY', 'mining', 'speed', 'team', 'type', 'flag', 'controlled', 'controller', 'name', 'payloadCount', 'payloadType', 'enabled', 'shoot', 'shootp', 'config', 'color']
    // LAccess.senseable
    static ALL_SENSEABLE = ['totalItems', 'firstItem', 'totalLiquids', 'totalPower', 'itemCapacity', 'liquidCapacity', 'powerCapacity', 'powerNetStored', 'powerNetCapacity', 'powerNetIn', 'powerNetOut', 'ammo', 'ammoCapacity', 'health', 'maxHealth', 'heat', 'efficiency', 'progress', 'timescale', 'rotation', 'x', 'y', 'shootX', 'shootY', 'size', 'dead', 'range', 'shooting', 'boosting', 'mineX', 'mineY', 'mining', 'speed', 'team', 'type', 'flag', 'controlled', 'controller', 'name', 'payloadCount', 'payloadType', 'enabled', 'config', 'color']
    // LAccess.controls
    static ALL_CONTROLS = ['enabled', 'shoot', 'shootp', 'config', 'color']
    // LAccess.settable - Wtf
    static ALL_SETTABLE = ['x', 'y', 'rotation', 'team', 'flag', 'health', 'totalPower', 'payloadType']
    static BUILDING = class extends ProcessorType {
        name = "building"

        reload() {
            this.properties = new Map([
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
    }
    // Not content type unit, but unit in map, get content type unit by getting @type I think - TODO
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

    static ALL_TYPES = Object.keys(ProcessorTypes).filter(a => ProcessorTypes.hasOwnProperty(a) && !a.startsWith("ALL_"))
    /**
     * @type {ProcessorType[]}
     */
    static ALL_INSTANCES = []

    static reloadAll() {
        ProcessorTypes.ALL_INSTANCES.forEach(type => type.reload())
    }

    /**
     * @param name {string}
     * @returns {ProcessorType}
     */
    static get(name) {
        return ProcessorTypes[name]
    }
}
