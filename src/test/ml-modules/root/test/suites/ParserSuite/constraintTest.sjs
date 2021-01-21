const spec = require('/test/spec');
const expect = require("/thirdparty/expect");
const cons = require("/search/constraints/constraint")

const { MLSearchParser, toCts } = require("/search/parser");
const { generateMatches } = require("/search/matcher");

// AND, OR, WORD
function leaves(parsedQuery) {
    switch (parsedQuery.type) {
        case "AND":
        case "OR":
            return [].concat(...parsedQuery.children.map(cq => leaves(cq)));
        default:
            return [parsedQuery];
    }
}

const options = require("/search-options");



// const parser = new MLSearchParser({ queryString: "Gender IS F AND FirstName IS *c*", options });
const parser = new MLSearchParser({ queryString: "c* AND Gender IS F AND FirstName IS c*", options });
const results = fn.subsequence(cts.search(parser.ctsQuery, ["faceted"]), 1, 1);


// for matching
// const leafQueries = leaves(parser.parsedQuery).map(lq => ({
//     ctsQuery: toCts({ parsedQuery: lq, options }),
//     ...lq
// }));

// leafQueries;

cons.doFacet({
    options,
    query: parser.ctsQuery
});

// results

parser.parsedQuery