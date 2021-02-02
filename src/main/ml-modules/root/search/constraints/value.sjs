const { Constraint } = require('../Constraint');

class ValueConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig }) {
        super({ options, matcher, parser, typeConverter, constraintConfig });
    }

    toCts({ parsedQuery }) {
        const ctsQuery = this.typeConverter.makeCtsQuery({ 
            parsedQuery, 
            constraintConfig: this.constraintConfig, 
            valueOptions: this.constraintConfig.value 
        });
        return this.constraintConfig.scope != null ? cts.jsonPropertyScopeQuery(this.constraintConfig.scope, ctsQuery) : ctsQuery;
    }

    startFacet({ query }) {
        const valueOptions = this.constraintConfig.value;
        const reference = this.typeConverter.makeReference({ valueOptions });
        const additionalOptions = this.constraintConfig.facetOptions || [];
        return cts.values(reference, null, [].concat([ "concurrent", ...additionalOptions]), query);
    }
}

module.exports = ValueConstraint;
