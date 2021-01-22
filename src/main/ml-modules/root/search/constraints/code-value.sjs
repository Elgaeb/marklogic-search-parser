const { makeCtsQuery, makeReference } = require("typeConverters");

function toCts({ parsedQuery, options, constraintConfig = {} }) {
    const ctsQuery = cts.orQuery([
        makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions: constraintConfig.value }),
        makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions: constraintConfig.code }),
    ]);

    return constraintConfig.scope != null ? cts.jsonPropertyScopeQuery(constraintConfig.scope, ctsQuery) : ctsQuery;
}

function startFacet({ constraintConfig, query }) {

    const facetType = constraintConfig.facetType || "value";
    const options = constraintConfig[facetType];
    const reference = makeReference({ valueOptions: options });
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
    // return {
    //     constraintConfig,
    //     out
    // };
}

module.exports = {
    toCts,
    startFacet,
    finishFacet
};