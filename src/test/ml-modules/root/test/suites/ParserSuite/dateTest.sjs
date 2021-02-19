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

const parser = new MLSearchParser({ queryString: '2/3/2004', options });

parser.parsedQuery;
