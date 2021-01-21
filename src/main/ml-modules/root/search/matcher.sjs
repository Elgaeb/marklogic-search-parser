const _ = require("underscore");
const { toCts } = require("parser");

function generateMatches({ doc, query, parsedQuery }) {
    const matches = [];
    function callback(text, node, queries, start) {
        const path = [];

        function buildPath(node, child = null) {
            if (node.type == "document") {
                return;
            }

            const nodeKind = node.nodeKind;
            const nodeName = nodeKind == "document" ? "$" : fn.nodeName(node);
            let nodeIndex = null;

            if(nodeKind === "array") {
                const childAsObject = child.toObject();
                for(let i = 0; i < node.length; i++) {
                    if(_.isEqual(node[i].toObject(), childAsObject)) {
                        nodeIndex = i;
                        break;
                    }
                }
            }

            path.push({
                nodeName,
                nodeKind,
                nodeIndex,
            });

            const parentNode = fn.head(node.xpath(".."));
            if (parentNode != null) {
                buildPath(parentNode, node);
            }
        }

        buildPath(node);

        for (let i = 0; i < path.length; i++) {
            if (path[i].nodeKind === "array") {
                path[i + 1].nodeName += `[${path[i].nodeIndex}]`;
            }
        }

        const match = {
            path: path.filter(p => p.nodeName != null).reverse().map(p => p.nodeName).join("."),
            node: node.toString(),
            text
        };

        if(parsedQuery.input != null && parsedQuery.input.text != null) {
            match.queryText = parsedQuery.input.text;
        }
        const found = matches.find(m => 
            m.path == match.path
            && m.node == match.node
            && m.text == match.text
            && m.queryText == match.queryText
            );

        if(found == null) {
            matches.push({ ...match });
        }

        return "continue";
    };

    cts.walk(doc, query, callback);
    return matches;
}

function doMatch({ parsedQuery, doc }) {
    function doChildMatch({ parsedQuery, doc, abortOnMiss }) {
        const matches = {
            matched: true,
            matches: []
        };

        for(let cq of parsedQuery.children) {
            const childMatch = doMatch({ parsedQuery: cq, doc });
            if(childMatch.matched) {
                matches.matches = [].concat(...[ matches.matches, childMatch.matches ]);
            } else  if(abortOnMiss) {
                return { matched: false };
            }
        }

        return matches;
    }

    switch (parsedQuery.type) {
        case "AND":
            return doChildMatch({ parsedQuery, doc, abortOnMiss: true });

        case "OR":
            return doChildMatch({ parsedQuery, doc, abortOnMiss: false });

        case "TRUE":
            return {
                matched: true,
                matches: []
            };

        default:
            let query = toCts({ parsedQuery, options });
            let matches = generateMatches({ doc, query, parsedQuery });
            return (matches != null && matches.length > 0) ? 
                { matched: true, matches } : 
                { matched: false, matches: [] };
    }
}

function match({ parsedQuery, doc }) {
    return doMatch({ parsedQuery, doc }).matches;
}

module.exports = {
    match,
    doMatch,
    generateMatches
};