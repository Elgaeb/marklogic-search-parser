const { Constraint } = require('../Constraint');

class CodeValueConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary }) {
        super({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary });
    }

    scopeToCts({ parsedQuery, scopeOptions }) {
        const { property, value, scope } = scopeOptions;
        const subQuery = this.toSubQuery({ parsedQuery, valueOptions: value, scopeOptions: scope });
        return cts.jsonPropertyScopeQuery(property, subQuery);
    }

    valueToCts({ parsedQuery, valueOptions }) {
        return this.typeConverter.makeCtsQuery({ parsedQuery, constraintConfig: this.constraintConfig, valueOptions });
    }

    toSubQuery({ parsedQuery, valueOptions = null, scopeOptions = null }) {
        const valueQueries = [].concat(...[valueOptions])
            .filter(v => v != null)
            .map(valueOptions => this.valueToCts({ parsedQuery, valueOptions }));

        const scopeQueries = [].concat(...[scopeOptions])
            .filter(v => v != null)
            .map(scopeOptions => this.scopeToCts({ parsedQuery, scopeOptions }));

        const queries = [ ...valueQueries, ...scopeQueries ];

        if(queries.length > 1) {
            return cts.orQuery(queries);
        } else if(queries.length == 1) {
            return queries[0];
        } else {
            return cts.falseQuery();
        }
    }

    toCts({ parsedQuery }) {
        const ctsQuery = this.toSubQuery({
            parsedQuery,
            valueOptions: this.constraintConfig.value,
            scopeOptions: this.constraintConfig.scope
        });

        if(this.constraintConfig.additionalQuery == null) {
            return ctsQuery;
        } else {
            return cts.andQuery([
                cts.query(this.constraintConfig.additionalQuery),
                ctsQuery
            ]);
        }
    }

    facetValuesFor({ value = null, scope = null, property = null, facetAllReferences = false }) {
        const innerFacetValues = ({ valueOptions }) => {
            return [].concat(...[valueOptions])
                .filter(v => v != null)
                .filter(valueOptions => valueOptions != null && (!!valueOptions.facet || facetAllReferences))
                .map(valueOptions => {
                    return {
                        options: valueOptions,
                        reference: this.typeConverter.makeReference({ valueOptions })
                    }
                })
                .filter(v => v.reference != null);
        };

        const outValues  = [];

        if(value != null) {
            innerFacetValues({ valueOptions: value }).forEach(v => outValues.push(v));
        }

        if(scope != null) {
            this.facetValuesFor({
                value: scope.value,
                scope: scope.scope,
                property: scope.property,
                facetAllReferences
            }).forEach(v => outValues.push(v));
        }

        return outValues;
    }

    startFacet({ query }) {
        let references = this.facetValuesFor({
            value: this.constraintConfig.value,
            scope: this.constraintConfig.scope
        });

        if(references.length == 0) {
            references = this.facetValuesFor({
                facetAllReferences: true,
                valueOptions: this.constraintConfig.value,
                scopeOptions: this.constraintConfig.scope
            });
        }

        const additionalOptions = this.constraintConfig.facetOptions || [];
        return references.map(reference => ({
            options: reference.options,
            values: cts.values(reference.reference, null, [].concat(["concurrent", ...additionalOptions]), query)
        }));
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
