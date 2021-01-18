const spec = require('/test/spec');
const expect = require("/thirdparty/expect");

const { MLSearchParser, toCts } = require("/search/parser");
const { generateMatches } = require("/search/matcher");

// AND, OR, WORD
function leaves(parsedQuery) {
    switch (parsedQuery.type) {
        case "AND":
        case "OR":
            return [].concat(...parsedQuery.children.map(cq => leaves(cq)));
        default:
                return parsedQuery;
    }
}

const parser = new MLSearchParser({ queryString: "JOHN AND JANE OR FirstName IS John AND LastName IS Doe" });
const actual = parser.parsedQuery;

actual;

const leafQueries = leaves(actual).map(lq => ({
    ctsQuery: toCts({ parsedQuery: lq, options: {} }),
    ...lq
}));

leafQueries;
