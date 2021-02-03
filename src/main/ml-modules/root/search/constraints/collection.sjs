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

    generateMatches({ doc, parsedQuery, constraintConfig, dictionaryLookup }) {
        const collectionName = "" + parsedQuery.value.value;
        const documentUri = fn.baseUri(doc);
        const desiredCollections = (!this.constraintConfig.wildcarded) ?
            [ collectionName ] :
            cts.valueMatch(cts.collectionReference([]), collectionName).toArray().map(v => v.toString());

        const documentCollections = xdmp.documentGetCollections(fn.baseUri(doc));
        const matches = desiredCollections
            .filter(collection => documentCollections.includes(collection))
            .map(collection => ({
                type: 'collection',
                collection,
                queryText: parsedQuery.input.text,
            }));
        const matched = matches.length > 0;

        return { matched, matches };
    }

}

module.exports = CollectionConstraint;
