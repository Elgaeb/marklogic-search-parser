const nearley = require("nearley");
const grammar = require("grammar");
const cons = require("constraints/constraint");

function toCts({ parsedQuery, options = {} }) {

    function collectChildren(parsedQuery) {
        if (parsedQuery.children != null) {
            return parsedQuery.children.map(childQuery => toCts({ parsedQuery: childQuery, options }));
        }
        else {
            return [];
        }
    }

    switch (parsedQuery.type) {
        case "AND":
            return cts.andQuery(collectChildren(parsedQuery));

        case "OR":
            return cts.orQuery(collectChildren(parsedQuery));

        case "WORD":
        case "PHRASE":
            return cts.wordQuery([].concat(...[parsedQuery.value]));

        case "TRUE":
            return cts.trueQuery();

        case "CONSTRAINT":
            return cons.toCts({ parsedQuery, options });

        default:
            break;
    }
}

function generateConstraintMap({ constraints = [] }) {
    return constraints.reduce((acc, c) => {
        acc[c.name] = c;
        return acc;
    }, {});
}

class MLSearchParser {
    constructor({ options = {}, queryString = null }) {
        this.options = options;
        options.constraintMap = generateConstraintMap({ constraints: options.constraints || [] });

        if (queryString != null) {
            this.parse(queryString);
        }

    }

    parse(queryString) {
        function flatten(parsedQuery) {
            function flattenChildren(parsedQuery) {
                const children = [].concat(...parsedQuery.children
                    .map(cq => flatten(cq))
                    .map(cq => {
                        if (cq.type == parsedQuery.type) {
                            return cq.children;
                        } else {
                            return cq;
                        }
                    })
                );

                if (children.length == 1) {
                    return children[0];
                } else {
                    return {
                        type: parsedQuery.type,
                        children
                    }
                }
            }

            switch (parsedQuery.type) {
                case "AND":
                    return flattenChildren(parsedQuery);
                case "OR":
                    return flattenChildren(parsedQuery);
                default:
                    return { x: 1, ...parsedQuery };
            }
        }

        this.queryString = queryString;

        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(queryString);

        this.rawParsedQuery = parser.results;
        if(this.rawParsedQuery.length == 0) {
            this.rawParsedQuery = [ {
                type: "TRUE"
            } ];
        }
        this.parsedQuery = this.rawParsedQuery[0];

        this.ctsQuery = toCts({
            parsedQuery: this.parsedQuery,
            options: this.options
        });
        return this.rawParsedQuery;
    }
}

module.exports = {
    MLSearchParser,
    toCts
};