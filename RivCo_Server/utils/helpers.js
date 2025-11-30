function haversine_dist(lat, lng, lat2, lng2) {
    var R = 3958.8;
    var rlat1 = lat2 * (Math.PI / 180);
    var rlat2 = lat * (Math.PI / 180);
    var difflat = rlat2 - rlat1;
    var difflon = (lng - lng2) * (Math.PI / 180);
    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

const TAX_RATE = 0.09;
const BASE_DELIVERY_FEE = 10;
const MIN_BILLABLE_DISTANCE_MILES = 1;

const toCents = (value) => {
    if (value === null || value === undefined || value === "") {
        return 0;
    }
    const numeric = typeof value === "string" ? parseFloat(value) : Number(value);
    if (!Number.isFinite(numeric)) {
        return 0;
    }
    return Math.round(numeric * 100);
};

const centsToFixed = (cents, decimals = 2) => (cents / 100).toFixed(decimals);

const safeJsonParse = (payload, fallback) => {
    if (payload === null || payload === undefined || payload === "") {
        return fallback;
    }
    if (Array.isArray(payload) || typeof payload === "object") {
        return payload;
    }
    try {
        return JSON.parse(payload);
    } catch (err) {
        console.warn("JSON parse failed, using fallback", err);
        return fallback;
    }
};

const isSelectedIngredient = (entry) => {
    if (!entry) return false;
    const flag = Array.isArray(entry) ? entry[0] : entry;
    if (typeof flag === "string") {
        return flag === "1" || flag.toLowerCase() === "true";
    }
    return Boolean(Number(flag) === 1 || flag === true);
};

const formatIngredientSummary = (ingredientsRows, selections, halfSelections) => {
    let summary = "";
    for (let i = 0; i < ingredientsRows.length; i++) {
        const ingredientRow = ingredientsRows[i];
        if (!ingredientRow) continue;
        const selection = selections[i];
        if (!isSelectedIngredient(selection)) continue;

        const customizeChoice = Array.isArray(selection) && typeof selection[1] === "string"
            ? selection[1]
            : "";
        const halfChoice = Array.isArray(halfSelections[i]) && typeof halfSelections[i][0] === "string"
            ? halfSelections[i][0]
            : "";

        const halfSuffix = ingredientRow.halfable && halfChoice
            ? `; ${halfChoice}`
            : "";
        const customizeSuffix = ingredientRow.customize
            ? ` (${customizeChoice}${halfSuffix})`
            : "";
        const ingredientName = ingredientRow.ingredients_name || "";

        if (ingredientName) {
            summary += `[${ingredientName}${customizeSuffix}] `;
        }
    }
    return summary.trim();
};

const buildUserAddress = (userRow) => {
    const streetNumber = userRow?.address_street_number ? String(userRow.address_street_number).trim() : "";
    const streetName = userRow?.address_street ? String(userRow.address_street).trim() : "";
    const streetLine = [streetNumber, streetName].filter(Boolean).join(" ").trim();

    const city = userRow?.address_city ? String(userRow.address_city).trim() : "";
    const state = userRow?.address_state ? String(userRow.address_state).trim() : "";
    const cityState = [city, state].filter(Boolean).join(", ").trim();

    const zip = userRow?.address_zip ? String(userRow.address_zip).trim() : "";

    const segments = [streetLine, cityState].filter(Boolean);
    let formatted = segments.join(", ");
    if (zip) {
        formatted = formatted ? `${formatted} ${zip}` : zip;
    }
    return formatted;
};

module.exports = {
    haversine_dist,
    TAX_RATE,
    BASE_DELIVERY_FEE,
    MIN_BILLABLE_DISTANCE_MILES,
    toCents,
    centsToFixed,
    safeJsonParse,
    isSelectedIngredient,
    formatIngredientSummary,
    buildUserAddress
};

