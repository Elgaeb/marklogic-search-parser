const { Constraint } = require('../Constraint');

class CodeValueConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary }) {
        super({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary });
    }

    toCts({ parsedQuery }) {

        const valueQueries = [].concat(...[this.constraintConfig.value])
            .map(valueOptions => this.typeConverter.makeCtsQuery({ parsedQuery, constraintConfig: this.constraintConfig, valueOptions }));

        const ctsQuery = valueQueries.length > 1 ?
            cts.orQuery(valueQueries) :
            valueQueries.length == 0 ?
                cts.falseQuery() :
                valueQueries[0];

        const additionalQuery = this.constraintConfig.additionalQuery == null ? null : cts.query(this.constraintConfig.additionalQuery);

        const query = this.constraintConfig.scope != null ? cts.jsonPropertyScopeQuery(this.constraintConfig.scope, ctsQuery) : ctsQuery;

        return additionalQuery == null ? query : cts.andQuery([ additionalQuery, query ]);
    }

    startFacet({ query }) {

        const valueConfigs = [].concat(...[this.constraintConfig.value]);
        if (valueConfigs.length > 0) {
            let references = valueConfigs
                .filter(valueOptions => !!valueOptions.facet)
                .map(valueOptions => ({
                    options: valueOptions,
                    reference: this.typeConverter.makeReference({ valueOptions })
                }));

            if (references.length == 0) {
                // We had no values with "facet": true so use every reference defined that can map
                // to an index
                references = valueConfigs
                    .map(valueOptions => ({
                        options: valueOptions,
                        reference: this.typeConverter.makeReference({ valueOptions })
                    }))
                    .filter(v => v.reference != null)
                    ;

            }

            const additionalOptions = this.constraintConfig.facetOptions || [];

            return references.map(reference => ({
                options: reference.options,
                values: cts.values(reference.reference, null, [].concat(["concurrent", ...additionalOptions]), query)
            }));
        } else {
            return Sequence.from([]);
        }
    }

    /**
     * 
     * @param startValue the value returned from startFacet
     * @param query the cts query used to perform the initial search 
     */
    finishFacet({ startValue, query }) {
        const out = [];
        const outHash = {};

        startValue.map(reference => {
            let coercionFn = x => x.toString();
            switch(reference.options.display) {
                case "boolean": 
                    coercionFn = x => ("" + x) == "1" ? "true" : "false";
                    break;
                default:
                    break;
            }
            for (let value of reference.values) {
                const name = coercionFn(value);
                const existing = outHash[name];
    
                if (existing != null) {
                    existing.count += cts.frequency(value);
                } else {
                    const newValue = {
                        name: name,
                        count: cts.frequency(value)
                    };
                    out.push(newValue);
                    outHash[name] = newValue;
                }
            }
        });

        return out;
    }

}

module.exports = CodeValueConstraint;