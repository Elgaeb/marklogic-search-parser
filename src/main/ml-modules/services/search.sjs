const { MLSearchParser } = require("/search/parser");
const constraint = require("/search/constraints/constraint");
const { match } = require("/search/matcher");
const { makeSortOrder } = require("/search/sort");

const options = require("/search-options");
const dictionaryLookup = require("/data-dictionary.sjs")

function asNumber({ value, defaultValue }) {
    const val = parseInt(value);
    return isNaN(val) ? defaultValue : val;
}

function opt({ propertyName, params, defaultValue }) {
    if(params != null && params[propertyName] != null) {
        return params[propertyName];
    } else if (options[propertyName] != null) {
        return options[propertyName];
    } else {
        return defaultValue;
    }
}

function get(context, params) {
    const qtext = params.q || "";
    const collection = params.collection;
    const directory = params.directory;
    const start = asNumber({ value: params.start, defaultValue: 1 });
    const pageLength = asNumber({ value: params.pageLength, defaultValue: 10 });
    const orderName = params.sort;
    const reverse = !!params.reverse;

    const returnQuery = opt({ propertyName: 'returnQuery', params, defaultValue: false });
    const returnParsedQuery = opt({ propertyName: 'returnParsedQuery', params, defaultValue: false });
    const returnCtsQuery = opt({ propertyName: 'returnCtsQuery', params, defaultValue: false });
    const returnResults = opt({ propertyName: 'returnResults', params, defaultValue: true });
    const returnMatches = opt({ propertyName: 'returnMatches', params, defaultValue: true });
    const returnFacets = opt({ propertyName: 'returnFacets', params, defaultValue: true });
    const returnOptions = opt({ propertyName: 'returnQuery', params, defaultValue: false });

    const results = {};

    const parser = new MLSearchParser({ queryString: qtext, options });

    const ctsQueries = [parser.ctsQuery];

    if(collection != null) {
        ctsQueries.push(cts.collectionQuery([].concat(...[collection])));
    }

    if(directory != null) {
        ctsQueries.push(cts.directoryQuery([].concat(...[collection]), "infinity"));
    }

    const searchOptions = [].concat(...[ "faceted", makeSortOrder({ options, orderName, reverse }) ]);
    const searchResults = fn.subsequence(
        cts.search(cts.andQuery(ctsQueries), searchOptions),
        start,
        pageLength
    );

    if(returnFacets) {
        results.facets = constraint.doFacet({
            options,
            query: parser.ctsQuery
        });
    }

    const resultsArr = !returnResults ? [] : searchResults.toArray().map(doc => {
        const docResult = {
            content: doc
        };

        if(returnMatches) {
            docResult.matches = match({ parsedQuery: parser.parsedQuery, doc, dictionaryLookup });
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
        results.options = options;
    }

    return results;
};

function post(context, params, input) {
    // return zero or more document nodes
};

function put(context, params, input) {
    // return at most one document node
};

function deleteFunction(context, params) {
    // return at most one document node
};

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;