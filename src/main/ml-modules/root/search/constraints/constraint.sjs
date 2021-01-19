const typeModules = {};

function toCts({ parsedQuery, options }) {
    const { constraintMap } = options;
    const constraintConfig = constraintMap[parsedQuery.name];

    if (constraintConfig != null) {
        const { type, faceted } = constraintConfig;
        const evaluator = typeModules[type] || (typeModules[type] = require(type));
        return evaluator.toCts({ parsedQuery, options, constraintConfig });
    } else {
        return cts.trueQuery();
    }
}

function startFacet({ constraintConfig, query }) {
    const { type, faceted } = constraintConfig;
    const evaluator = typeModules[type] || (typeModules[type] = require(type));

    return evaluator.startFacet({ constraintConfig, query });
}

function finishFacet({ startValue, constraintConfig, query }) {
    const { type, faceted } = constraintConfig;
    const evaluator = typeModules[type] || (typeModules[type] = require(type));

    return evaluator.finishFacet({ startValue, constraintConfig, query });
}

function doFacet({ options, query }) {
    const startValues = options.constraints.map(constraintConfig => {
        if(!!constraintConfig.faceted) {
            return {
                constraintConfig,
                startValue: startFacet({
                    constraintConfig,
                    query
                })
            };
        } else {
            return null;
        }
    }).filter(v => v != null);
    
    return startValues.map(sv => {
        const values = finishFacet({
            startValue: sv.startValue,
            constraintConfig: sv.constraintConfig,
            query
        });

        return {
            name: sv.constraintConfig.name,
            values
        }
    });
}

module.exports = {
    toCts,
    doFacet
};