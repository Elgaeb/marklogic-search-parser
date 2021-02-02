const { makeCtsQuery, makeReference } = require("typeConverters");

function toCts({ parsedQuery, options, constraintConfig = {} }) {
    const collectionName = parsedQuery.value.value;

    const desiredValue = (!constraintConfig.wildcarded) ?
        [ "" + parsedQuery.value.value ] :
        cts.valueMatch(cts.collectionReference([]), "" + parsedQuery.value.value);

    return cts.collectionQuery(desiredValue);
}

function startFacet({ constraintConfig, query }) {
    const reference = cts.collectionReference([]);
    const additionalOptions = constraintConfig.facetOptions || [];
    return cts.values(reference, null, [].concat([ "concurrent", ...additionalOptions]), query);
}

function finishFacet({ startValue, constraintConfig, query }) {
    const out = [];

    for(let value of startValue) {
        out.push({ 
            name: value.toString(),
            count: cts.frequency(value)
         });
    }

    return out;
}

module.exports = {
    toCts,
    startFacet,
    finishFacet
};