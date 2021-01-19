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


const options = {
    constraints: [
        {
            name: "FirstName",
            type: "value",
            // faceted: false,
            wildcarded: true,
            includeMissingValues: false,
            options: [ "item-order", "ascending", "fragment-frequency", "limit=3" ],
            value: { type: "pathIndex", value: "//Name/firstName" }
        },
        {
            name: "Race",
            type: "value",
            faceted: true,
            wildcarded: false,
            includeMissingValues: true,
            options: [ "frequency-order", "descending", "fragment-frequency", "limit=10" ],
            value: { type: "jsonPropertyIndex", value: "race" },
        },
        {
            name: "Gender",
            type: "code-value",
            faceted: true,
            wildcarded: false,
            container: "Gender",
            includeMissingValues: true,
            code: { type: "jsonPropertyIndex", value: "genderCode" },
            value: { type: "jsonPropertyIndex", value: "gender" },
        }
    ]
};


const parser = new MLSearchParser({ queryString: "JOHN AND 2/3/2004", options });

parser.ctsQuery;