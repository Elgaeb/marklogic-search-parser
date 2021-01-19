const { makeCtsQuery, makeReference } = require("typeConverters");

function toCts({ parsedQuery, options, constraintConfig = {} }) {
    const valueOptions = constraintConfig.value;
    return makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions });
}

function startFacet({ constraintConfig, query }) {
    const valueOptions = constraintConfig.value;
    const reference = makeReference({ valueOptions });
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