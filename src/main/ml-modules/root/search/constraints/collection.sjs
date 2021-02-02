const { Constraint } = require('../Constraint');

class CollectionConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig }) {
        super({ options, matcher, parser, typeConverter, constraintConfig });
    }

    toCts({ parsedQuery }) {
        const collectionName = "" + parsedQuery.value.value;

        const desiredValue = (!this.constraintConfig.wildcarded) ?
            [ collectionName ] :
            cts.valueMatch(cts.collectionReference([]), collectionName);
    
        return cts.collectionQuery(desiredValue);
    }

    startFacet({ query }) {
        const reference = cts.collectionReference([]); 
        const additionalOptions = this.constraintConfig.facetOptions || [];
        return cts.values(reference, null, [].concat([ "concurrent", ...additionalOptions]), query);
    }
}

module.exports = CollectionConstraint;
