const spec = require('/test/spec');
const expect = require('/thirdparty/expect');
const cons = require('/search/constraints/constraint');

const { MLSearchParser, toCts } = require('/search/parser');
const { generateMatches, match } = require('/search/matcher');

const options = require('/search-options');

const dictionaryLookup = require('/data-dictionary.sjs');

const queryString =
    // "JOHN DOE";
    "Gender IS F AND FirstName IS *c* 'est      et'";
// "JOHN JANE (DOE OR DE LONG)";

const parser = new MLSearchParser({ queryString, options });
const results = fn.subsequence(cts.search(parser.ctsQuery, ['faceted']), 1, 5);

results.toArray().map((doc) => match({ parsedQuery: parser.parsedQuery, doc, dictionaryLookup }));
