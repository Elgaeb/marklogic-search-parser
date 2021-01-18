const { makeCtsQuery, makeReference } = require("typeConverters");

function toCts({ parsedQuery, constraintConfig = {} }) {
    return cts.orQuery([
        makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions: constraintConfig.value }),
        makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions: constraintConfig.code }),
    ]);
}

function startFacet({ constraintConfig, query }) {

    const facetType = constraintConfig.facetType || "value";
    const options = constraintConfig[facetType];
    const reference = makeReference({ valueOptions: options });
    const additionalOptions = constraintConfig.options || [];
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

    return {
        constraintConfig,
        out
    };
}

module.exports = {
    toCts,
    startFacet,
    finishFacet
};