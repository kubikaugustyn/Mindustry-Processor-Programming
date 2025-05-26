/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {NativeJITFunction} from "../NativeFunction.mjs";

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libdatetime = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    now: new NativeJITFunction([], null, `
__RETURN__ = @time
    `),
})))
export default libdatetime
