const { SearchParser } = require('/search/SearchParser');
const { DataDictionary } = require('DataDictionary.sjs');

function asNumber({ value, defaultValue }) {
    const val = parseInt(value);
    return isNaN(val) ? defaultValue : val;
}

class SearchService {
    constructor({ options, dataDictionary = new DataDictionary() }) {
        this.options = options;
        this.dataDictionary = dataDictionary;
    }

    opt({ propertyName, params, defaultValue }) {
        if(params != null && params[propertyName] != null) {
            return params[propertyName];
        } else if (this.options[propertyName] != null) {
            return this.options[propertyName];
        } else {
            return defaultValue;
        }
    }

    parseParams(params) {
        const qtext = params.q || "";
        const collection = params.collection;
        const directory = params.directory;
        const start = asNumber({ value: params.start, defaultValue: 1 });
        const pageLength = asNumber({ value: params.pageLength, defaultValue: 10 });
        const orderName = params.sort;
        const reverse = !!params.reverse;
    
        const returnQuery = this.opt({ propertyName: 'returnQuery', params, defaultValue: false });
        const returnParsedQuery = this.opt({ propertyName: 'returnParsedQuery', params, defaultValue: false });
        const returnCtsQuery = this.opt({ propertyName: 'returnCtsQuery', params, defaultValue: false });
        const returnResults = this.opt({ propertyName: 'returnResults', params, defaultValue: true });
        const returnMatches = this.opt({ propertyName: 'returnMatches', params, defaultValue: true });
        const returnFacets = this.opt({ propertyName: 'returnFacets', params, defaultValue: true });
        const returnOptions = this.opt({ propertyName: 'returnQuery', params, defaultValue: false });

        return {
            qtext,
            collection,
            directory,
            start,
            pageLength,
            orderName,
            reverse,
            returnQuery,
            returnParsedQuery,
            returnCtsQuery,
            returnResults,
            returnMatches,
            returnFacets,
            returnOptions
        };
    }

    GET({
        qtext,
        collection,
        directory,
        start,
        pageLength,
        orderName,
        reverse,
        returnQuery,
        returnParsedQuery,
        returnCtsQuery,
        returnResults,
        returnMatches,
        returnFacets,
        returnOptions
    }) {

        const results = {};

        const parser = new SearchParser({ queryString: qtext, options: this.options });
    
        const ctsQueries = [parser.ctsQuery];
    
        if(collection != null) {
            ctsQueries.push(cts.collectionQuery([].concat(...[collection])));
        }
    
        if(directory != null) {
            ctsQueries.push(cts.directoryQuery([].concat(...[collection]), "infinity"));
        }
    
        const searchOptions = [].concat(...[ "faceted", parser.makeSortOrder({ options: this.options, orderName, reverse }) ]);
        const searchResults = fn.subsequence(
            cts.search(cts.andQuery(ctsQueries), searchOptions),
            start,
            pageLength
        );
    
        if(returnFacets) {
            results.facets = parser.doFacet({
                options: this.options,
                query: parser.ctsQuery
            });
        }
    
        const resultsArr = !returnResults ? [] : searchResults.toArray().map(doc => {
            const docResult = {
                content: doc
            };
    
            if(returnMatches) {
                docResult.matches = parser.match({ parsedQuery: parser.parsedQuery, doc });
            }
    
            return docResult;
        });
    
        results.total = cts.estimate(cts.andQuery(ctsQueries));
        results.start = start;
        results.pageLength = pageLength;
        results.count = resultsArr.length;
    
        if(returnQuery) {
            results.query = qtext;
        }
        if(returnParsedQuery) {
            results.parsedQuery = parser.parsedQuery;
        }
        if(returnCtsQuery) {
            results.ctsQuery = parser.ctsQuery;
        }
        if(returnResults) {
            results.results = resultsArr;
        }
        if(returnOptions) {
            results.options = this.options;
        }

        results.constraintMap = parser.constraintMap;
    
        return results;
    
    }
}

module.exports = { SearchService };