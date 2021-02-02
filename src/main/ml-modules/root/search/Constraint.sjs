class Constraint {

    /**
     * @param options the search options in use 
     */
    constructor({ options, matcher, parser, typeConverter, constraintConfig }) {
        this.options = options;
        this.matcher = matcher;
        this.parser = parser;
        this.typeConverter = typeConverter;
        this.constraintConfig = constraintConfig;
    }

    /**
     * Generate a cts query used to constrain the search.
     * 
     * @param parsedQuery the intermediate form of the query
     */
    toCts({ parsedQuery }) {
        return cts.trueQuery();
    }

    /**
     * @param query the cts query used to perform the initial search 
     */
    startFacet({  query }) {
        return Sequence.from([]);
    }

    /**
     * 
     * @param startValue the value returned from startFacet
     * @param query the cts query used to perform the initial search 
     */
    finishFacet({ startValue, query }) {
        const out = [];
    
        for(let value of startValue) {
            out.push({ 
                name: value.toString(),
                count: cts.frequency(value)
             });
        }
    
        return out;
    }

    generateMatches({ doc, parsedQuery, constraintConfig, dictionaryLookup }) {
        let query = this.toCts({ parsedQuery, constraintConfig });
        let matches = this.matcher.generateMatches({ doc, query, parsedQuery, dictionaryLookup });
        return (matches != null && matches.length > 0) ? 
            { matched: true, matches } : 
            { matched: false, matches: [] };
    }

}

module.exports = {
    Constraint
};