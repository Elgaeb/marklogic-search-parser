const spec = require('/test/spec');
const expect = require("/thirdparty/expect");
const cons = require("/search/constraints/constraint")

const { MLSearchParser, toCts } = require("/search/parser");
const { generateMatches } = require("/search/matcher");

const options = require("/search-options");

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

const queryString =
    // "JOHN DOE";
    // "Gender IS F AND FirstName IS *c*";
    "JOHN JANE (DOE OR DE LONG)";

const parser = new MLSearchParser({ queryString, options });
const results = fn.subsequence(cts.search(parser.ctsQuery, ["faceted"]), 1, 100);


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

parser.parsedQuery