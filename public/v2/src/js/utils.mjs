/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

export function importCSS(url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
}

/**
 * Creates an HTML element.
 * @param tagName {string}
 * @param classList {string[]|null}
 * @param parentElement {HTMLElement|null}
 */
export function elem(tagName, classList = null, parentElement = null) {
    var element = document.createElement(tagName)
    classList !== null && element.classList.add(...classList)
    parentElement !== null && parentElement.appendChild(element)
    return element
}

/**
 * Calculates a hash code for a string.
 *
 * @author https://stackoverflow.com/a/7616484
 * @param str {string} The string to calculate a hash for.
 * @return {number} The resulting hash.
 */
export function stringHashCode(str) {
    if (typeof str !== "string")
        throw new Error("The provided value is not a string");

    let hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
