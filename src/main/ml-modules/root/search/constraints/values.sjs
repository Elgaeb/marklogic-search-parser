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

        return this.constraintConfig.scope != null ? cts.jsonPropertyScopeQuery(this.constraintConfig.scope, ctsQuery) : ctsQuery;
    }

    startFacet({ query }) {

        const valueConfigs = [].concat(...[this.constraintConfig.value]);
        if (valueConfigs.length > 0) {
            let references = valueConfigs
                .filter(valueOptions => !!valueOptions.facet)
                .map(valueOptions => this.typeConverter.makeReference({ valueOptions }));

            if (references.length == 0) {
                // We had no values with "facet": true so use every erference defined that can map
                // to an index
                references = valueConfigs
                    .map(valueOptions => this.typeConverter.makeReference({ valueOptions }))
                    .filter(v => v != null)
                    ;

            }

            const additionalOptions = this.constraintConfig.facetOptions || [];
            return cts.values(references, null, [].concat(["concurrent", ...additionalOptions]), query);
        } else {
            return Sequence.from([]);
        }
    }
}

module.exports = CodeValueConstraint;