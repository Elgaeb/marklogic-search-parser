const { DateTime } = require("/search/luxon");

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

function valueForWordQuery({ parsedQuery }) {
    const { value } = parsedQuery;
    switch(value.dataType) {
        case "phrase":
        case "string":
            return value.value;
        case "date":
            const when = DateTime.fromISO(value.value);
            return [
              when.toISODate(),
              when.toFormat("yyyy/LL/dd"),
              when.toFormat("L/d/yy"),
              when.toFormat("L/d/yyyy"),
              when.toFormat("LL/dd/yy"),
              when.toFormat("LL/dd/yyyy"),
            ];
        case "integer":
        case "decimal":
            return value.text;
        default:
            return new String(value.value);
    }
}

function referenceScalarType({ ref }) {
    const refObj = ref.toObject();
    return refObj[Object.keys(refObj)[0]].scalarType;
}

function parseNumber({ value, parse }) {
    switch(value.dataType) {
        case "phrase":
        case "string":
            let stringValue = value.value.trim();
            let v = parseInt(stringValue);
            if(isNaN(v)) {
                return /^(y|yes|t|true)$/i.test(value.value.trim()) ? 1 : 0;
            } else {
                return v;
            }
        case "date":
            const dateFromISO = DateTime.fromISO(value.value, { zone: "local" });
            return dateFromISO.toMillis();
        case "integer":
        case "decimal":
            return parse(value.value);
        default:
            return value.value;
    }
}


function valueForReferenceQuery({ parsedQuery, ref }) {
    const scalarType = referenceScalarType({ ref });
    const { value } = parsedQuery;

    switch(scalarType) {
        case "int":
        case "long":
            return parseNumber({value, parse: parseInt});

        case "unsignedInt":
        case "unsignedLong":
            return parseNumber({value, parse: x => Math.abs(parseInt(x)) });

        case "float":
        case "double":
        case "decimal":
            return parseNumber({value, parse: x => parseFloat });

        case "date":
            switch(value.dataType) {
                case "decimal":
                case "integer":
                    const dateFromMillis = DateTime.fromMillis(value.value, { zone: "local" });
                    return dateFromMillis.toISODate();

                case "date":
                    return value.value;

                case "phrase":
                case "string":
                default:
                    const dateFromISO = DateTime.fromISO(value.value, { zone: "local" });
                    return dateFromISO.isValid() ? dateFromISO.toISODate() : null;
            }

        case "dateTime":
            switch(value.dataType) {
                case "decimal":
                case "integer":
                    const dateFromMillis = DateTime.fromMillis(value.value, { zone: "local" });
                    return dateFromMillis.toISO();

                case "phrase":
                case "string":
                case "date":
                default:
                    const dateFromISO = DateTime.fromISO(value.value, { zone: "local" });
                    return dateFromISO.toISO();
            }

        case "string":
            return "" + value.value;

        case "time":
        case "gYearMonth":
        case "gYear":
        case "gMonth":
        case "gDay":
        case "yearMonthDuration":
        case "dayTimeDuration":
        case "anyURI":
        default:
            switch(value.dataType) {
                case "decimal":
                case "integer":
                    return value.text;
                default:
                    return value.value;
            }
    }
}

function referenceCanBeWildcarded({ ref, operator }) {
    const scalarType = referenceScalarType({ ref });
    return operator === "EQ" && scalarType === "string";
}

function makeCtsQuery({ parsedQuery, constraintConfig, options, valueOptions }) {
    function getInnerQuery({ parsedQuery, valueOptions, constraintConfig }) {
        switch(valueOptions.type) {
            case "pathIndex":
            case "jsonPropertyIndex":
                const rangeOperator = rangeOperators[parsedQuery.operator];
                const ref = makeReference({ valueOptions });
                const desiredValue = (!constraintConfig.wildcarded || !referenceCanBeWildcarded({ ref, operator: parsedQuery.operator })) ?
                    valueForReferenceQuery({ parsedQuery, ref }) :
                    cts.valueMatch(ref, "" + parsedQuery.value.value);
    
                return desiredValue == null ? 
                    cts.falseQuery() : 
                    cts.rangeQuery(ref, rangeOperator, desiredValue);
    
            case "jsonProperty":
                const ctsOptions = [
                    !!constraintConfig.wildcarded ? "wildcarded" : "unwildcarded"
                ];

                return !!valueOptions.useWordQuery ?
                    cts.jsonPropertyWordQuery(valueOptions.value, valueForWordQuery({ parsedQuery }), ctsOptions) :
                    cts.jsonPropertyValueQuery(valueOptions.value, valueForWordQuery({ parsedQuery }), ctsOptions);
                
            default:
                return null;
        }
    }

    return getInnerQuery({ parsedQuery, valueOptions, constraintConfig });
}

module.exports = {
    makeCtsQuery,
    makeReference,
    valueForWordQuery,
    valueForReferenceQuery
};