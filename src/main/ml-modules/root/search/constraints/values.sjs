const { Constraint } = require('../Constraint');
const { DateTime, Interval, Duration } = require('../luxon');

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
        return this.typeConverter.makeCtsQuery({
            parsedQuery,
            constraintConfig: this.constraintConfig,
            valueOptions,
        });
    }

    toSubQuery({ parsedQuery, valueOptions = null, scopeOptions = null }) {
        const valueQueries = []
            .concat(...[valueOptions])
            .filter((v) => v != null)
            .map((valueOptions) => this.valueToCts({ parsedQuery, valueOptions }));

        const scopeQueries = []
            .concat(...[scopeOptions])
            .filter((v) => v != null)
            .map((scopeOptions) => this.scopeToCts({ parsedQuery, scopeOptions }));

        const queries = [...valueQueries, ...scopeQueries];

        if (queries.length > 1) {
            return cts.orQuery(queries);
        } else if (queries.length == 1) {
            return queries[0];
        } else {
            return cts.falseQuery();
        }
    }

    toCts({ parsedQuery }) {
        const ctsQuery = this.toSubQuery({
            parsedQuery,
            valueOptions: this.constraintConfig.value,
            scopeOptions: this.constraintConfig.scope,
        });

        if (this.constraintConfig.additionalQuery == null) {
            return ctsQuery;
        } else {
            return cts.andQuery([cts.query(this.constraintConfig.additionalQuery), ctsQuery]);
        }
    }

    makeCtsQueryForPropertyScope({
        constraintConfig,
        valueOptions,
        query = cts.trueQuery(),
    }) {
        const getInnerQuery = ({ valueOptions, constraintConfig, query }) => {
            switch (valueOptions.type) {
                case 'pathIndex':
                case 'fieldIndex':
                    return valueOptions.propertyForDne == null ? null : cts.jsonPropertyScopeQuery(valueOptions.propertyForDne, query);

                case 'jsonPropertyIndex':
                case 'jsonProperty':
                    return cts.jsonPropertyScopeQuery(valueOptions.value, query);

                default:
                    return null;
            }
        };

        return getInnerQuery({ valueOptions, constraintConfig, query });
    }

    scopeToCtsExists({ scopeOptions }) {
        const { property, value, scope } = scopeOptions;

        const subQuery = this.toExistsSubQuery({
            valueOptions: value,
            scopeOptions: scope,
        });
        return cts.jsonPropertyScopeQuery(property, subQuery);
    }

    valueToCtsExists({  valueOptions }) {
        return this.makeCtsQueryForPropertyScope({
            constraintConfig: this.constraintConfig,
            valueOptions,
        });
    }

    toExistsSubQuery({ valueOptions = null, scopeOptions = null }) {
        const valueQueries = []
            .concat(...[valueOptions])
            .filter((v) => v != null)
            .map((valueOptions) => this.valueToCtsExists({ valueOptions }))
            .filter((v) => v != null);

        const scopeQueries = []
            .concat(...[scopeOptions])
            .filter((v) => v != null)
            .map((scopeOptions) => this.scopeToCtsExists({ scopeOptions }))
            .filter((v) => v != null);

        const queries = [...valueQueries, ...scopeQueries];

        if (queries.length > 1) {
            return cts.andQuery(queries);
        } else if (queries.length == 1) {
            return queries[0];
        } else {
            return cts.falseQuery();
        }
    }

    toCtsDne({  }) {
        const ctsQuery = this.toExistsSubQuery({
            valueOptions: this.constraintConfig.value,
            scopeOptions: this.constraintConfig.scope,
        });

        if (this.constraintConfig.additionalQuery == null) {
            return cts.notQuery(ctsQuery);
        } else {
            return cts.andQuery([cts.query(this.constraintConfig.additionalQuery), ctsQuery]);
        }
    }

    facetValuesFor({ value = null, scope = null, property = null, facetAllReferences = false }) {
        const innerFacetValues = ({ valueOptions }) => {
            return []
                .concat(...[valueOptions])
                .filter((v) => v != null)
                .filter(
                    (valueOptions) =>
                        valueOptions != null && (!!valueOptions.facet || facetAllReferences)
                )
                .map((valueOptions) => {
                    return {
                        options: valueOptions,
                        reference: this.typeConverter.makeReference({ valueOptions }),
                    };
                })
                .filter((v) => v.reference != null);
        };

        const outValues = [];

        if (value != null) {
            innerFacetValues({ valueOptions: value }).forEach((v) => outValues.push(v));
        }

        if (scope != null) {
            this.facetValuesFor({
                value: scope.value,
                scope: scope.scope,
                property: scope.property,
                facetAllReferences,
            }).forEach((v) => outValues.push(v));
        }

        return outValues;
    }

    startFacet({ query }) {
        let references = this.facetValuesFor({
            value: this.constraintConfig.value,
            scope: this.constraintConfig.scope,
        });

        if (references.length == 0) {
            references = this.facetValuesFor({
                facetAllReferences: true,
                valueOptions: this.constraintConfig.value,
                scopeOptions: this.constraintConfig.scope,
            });
        }

        const additionalOptions = this.constraintConfig.facetOptions || [];
        return references.map((reference) => ({
            options: reference.options,
            values: cts.values(
                reference.reference,
                null,
                [].concat(['concurrent', ...additionalOptions]),
                query
            ),
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

        startValue.map((reference) => {
            let coercionFn = (x) => x.toString();
            switch (reference.options.display) {
                case 'boolean':
                    coercionFn = (x) => ('' + x == '1' ? 'true' : 'false');
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
                        count: cts.frequency(value),
                    };

                    out.push(newValue);
                    outHash[name] = newValue;
                }
            }
        });

        const facetValue =  {
            name: this.constraintConfig.name,
            values: out
        };

        if(this.constraintConfig.dne === 'include') {
            facetValue.dne = this.facetDne({ query });
        }

        return facetValue;
    }

    facetDne({ query }) {
        const start = DateTime.fromJSDate(new Date());

        const dneQuery = this.toCtsDne({  });
        const outDneQuery = cts.andQuery([].concat(...[ query, dneQuery ]).filter(v => v != null));
        const dneCount = cts.estimate(outDneQuery);

        const end = DateTime.fromJSDate(new Date());

        const dne = {
            count: dneCount
        };

        if(this.options.returnMetrics) {
            dne.metrics = {
                start: start.toISO(),
                end: end.toISO(),
                duration: Interval.fromDateTimes(start, end)
                    .toDuration(['minutes', 'seconds'])
                    .toISO(),
            };
        }

        return dne;
    }

    generateMatches({ doc, parsedQuery, constraintConfig }) {
        switch (parsedQuery.operator) {
            case 'DNE': {
                let query = this.toCtsDne({ parsedQuery, constraintConfig });
                let matched = cts.contains(doc, query);
                return {
                    matched,
                    query,
                    parsedQuery,
                    matches: [
                        {
                            type: 'missing',
                            'query-text': parsedQuery.input.text,
                        },
                    ],
                };
            }

            default: {
                let query = this.toCts({ parsedQuery, constraintConfig });
                let matches = this.matcher.generateMatches({ doc, query, parsedQuery });
                return matches != null && matches.length > 0
                    ? { matched: true, query, parsedQuery, matches }
                    : { matched: false, query, parsedQuery, matches: [] };
            }
        }
    }
}

module.exports = CodeValueConstraint;
