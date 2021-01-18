const _ = require("underscore");

function generateMatches({ doc, query }) {
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

        matches.push({
            path: path.filter(p => p.nodeName != null).reverse().map(p => p.nodeName).join("."),
            node,
            text
        });

        return "continue";
    };

    cts.walk(results, query, callback);
    return matches;
}

module.exports = {
    generateMatches
};