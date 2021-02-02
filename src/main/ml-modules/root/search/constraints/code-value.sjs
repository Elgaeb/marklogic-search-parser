const { Constraint } = require('../Constraint');

class CodeValueConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig }) {
        super({ options, matcher, parser, typeConverter, constraintConfig });
    }

    toCts({ parsedQuery }) {
        const ctsQuery = cts.orQuery([
            this.typeConverter.makeCtsQuery({ parsedQuery, constraintConfig: this.constraintConfig, valueOptions: this.constraintConfig.value }),
            this.typeConverter.makeCtsQuery({ parsedQuery, constraintConfig: this.constraintConfig, valueOptions: this.constraintConfig.code }),
        ]);
    
        return this.constraintConfig.scope != null ? cts.jsonPropertyScopeQuery(this.constraintConfig.scope, ctsQuery) : ctsQuery;
    }

    startFacet({ query }) {
        const facetType = this.constraintConfig.facetType || "value";
        const options = this.constraintConfig[facetType];
        const reference = this.typeConverter.makeReference({ valueOptions: options });
        const additionalOptions = this.constraintConfig.facetOptions || [];
        return cts.values(reference, null, [].concat([ "concurrent", ...additionalOptions]), query);
    }
}

module.exports = CodeValueConstraint;