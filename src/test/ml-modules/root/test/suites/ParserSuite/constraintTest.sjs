const spec = require('/test/spec');
const expect = require('/thirdparty/expect');
const cons = require('/search/constraints/constraint');

const { MLSearchParser, toCts } = require('/search/parser');
const { generateMatches } = require('/search/matcher');

// AND, OR, WORD
function leaves(parsedQuery) {
    switch (parsedQuery.type) {
        case 'AND':
        case 'OR':
            return [].concat(...parsedQuery.children.map((cq) => leaves(cq)));
        default:
            return [parsedQuery];
    }
}

const options = require('/search-options');

const queryString =
    // "Gender IS F AND FirstName IS *c*"
    // "2/2/87 AND Gender IS F AND FirstName IS cai*"
    // "Quote IS 'lorem' Quote IS 5/3/98"
    // "BirthDate EQ 3/3/97"
    // "Updated GT '2020-01-01'"
    'Updated GT 1577836800000';
const parser = new MLSearchParser({ queryString, options });
const results = fn.subsequence(cts.search(parser.ctsQuery, ['faceted']), 1, 1);

// for matching
// const leafQueries = leaves(parser.parsedQuery).map(lq => ({
//     ctsQuery: toCts({ parsedQuery: lq, options }),
//     ...lq
// }));

// leafQueries;

cons.doFacet({
    options,
    query: parser.ctsQuery,
});

// results

[parser.parsedQuery, parser.ctsQuery];
