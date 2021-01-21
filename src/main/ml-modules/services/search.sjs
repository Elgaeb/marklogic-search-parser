const { MLSearchParser } = require("/search/parser");
const constraint = require("/search/constraints/constraint");
const { match } = require("/search/matcher");
const { makeSortOrder } = require("/search/sort");

const options = require("/search-options");

function asNumber({ value, defaultValue }) {
    const val = parseInt(value);
    return isNaN(val) ? defaultValue : val;
}

function get(context, params) {
    const qtext = params.q || "";
    const collection = params.collection;
    const directory = params.directory;
    const start = asNumber({ value: params.start, defaultValue: 1 });
    const pageLength = asNumber({ value: params.pageLength, defaultValue: 10 });
    const orderName = params.sort;
    const reverse = !!params.reverse;

    const parser = new MLSearchParser({ queryString: qtext, options });

    const ctsQueries = [parser.ctsQuery];
    const queryOptions = ["faceted"];

    if(collection != null) {
        ctsQueries.push(cts.collectionQuery([].concat(...[collection])));
    }

    if(directory != null) {
        ctsQueries.push(cts.directoryQuery([].concat(...[collection]), "infinity"));
    }

    const searchOptions = [].concat(...[ "faceted", makeSortOrder({ options, orderName, reverse }) ]);
    const results = fn.subsequence(
        cts.search(cts.andQuery(ctsQueries), searchOptions),
        start,
        pageLength
    );

    const facets = constraint.doFacet({
        options,
        query: parser.ctsQuery
    });

    const resultsArr = results.toArray().map(doc => ({
        matches: match({ parsedQuery: parser.parsedQuery, doc }),
        content: doc
    }));

    return {
        total: cts.estimate(cts.andQuery(ctsQueries)),
        start,
        pageLength,
        count: resultsArr.length,
        qtext,
        parsedQuery: parser.parsedQuery,
        // query: parser.ctsQuery,
        results: resultsArr,
        facets,
        searchOptions
    }

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