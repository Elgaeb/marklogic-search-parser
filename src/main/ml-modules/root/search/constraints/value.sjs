const { makeCtsQuery, makeReference } = require("typeConverters");

function toCts({ parsedQuery, options, constraintConfig = {} }) {
    const ctsQuery = makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions: constraintConfig.value });
    return constraintConfig.scope != null ? cts.jsonPropertyScopeQuery(constraintConfig.scope, ctsQuery) : ctsQuery;
}

function startFacet({ constraintConfig, query }) {
    const valueOptions = constraintConfig.value;
    const reference = makeReference({ valueOptions });
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