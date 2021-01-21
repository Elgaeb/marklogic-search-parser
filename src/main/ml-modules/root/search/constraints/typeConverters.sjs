const rangeOperators = {
    "EQ": "=",
    "NE": "!=",
    "GT": ">",
    "GE": ">=",
    "LT": "<",
    "LE": "<=",
};


function makeReference({ valueOptions }) {
    const type = valueOptions.type;
    const options = valueOptions.options == null ? [] : [].concat(...[valueOptions.options]);

    switch(type) {
        case "pathIndex":
            return cts.pathReference(valueOptions.value, options);
        case "jsonPropertyIndex":
            return cts.jsonPropertyReference(valueOptions.value, options);
        default:
            return null;
    }
}

function makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions }) {
    const type = valueOptions.type;

    switch(type) {
        case "pathIndex":
        case "jsonPropertyIndex":
            const rangeOperator = rangeOperators[parsedQuery.operator];
            const ref = makeReference({ valueOptions });
            const desiredValue = !constraintConfig.wildcarded ?
                parsedQuery.value :
                cts.valueMatch(ref, parsedQuery.value);

            return cts.rangeQuery(ref, rangeOperator, desiredValue);

        case "jsonPropertyIndex":
            const options = [];
            options.push(constraintConfig.wildcarded ? "wildcarded" : "unwildcarded");
            
            return cts.jsonPropertyWordQuery(valueOptions.value, parsedQuery.value, options);
            
        default:
            return null;
    }
    
}

module.exports = {
    makeCtsQuery,
    makeReference
};