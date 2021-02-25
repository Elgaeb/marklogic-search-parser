const { Constraint } = require('../Constraint');

class URIConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary }) {
        super({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary });
    }

    toCts({ parsedQuery }) {
        const uri = parsedQuery.value.value;

        const uris = !this.constraintConfig.wildcarded
            ? [ uri ]
            : cts.valueMatch(cts.uriReference(), uri, [ ]);

        return cts.documentQuery(uris);
    }

    toCtsDne({  }) {
        return cts.falseQuery();
    }

    generateMatches({ doc, parsedQuery, constraintConfig }) {
        const query = this.toCts({ parsedQuery });
        let matched = cts.contains(doc, query);

        let matches = matched ? [{
            type: 'uri',
            'query-text': parsedQuery.input.text,
        }] : [];

        return { matched, matches };
    }
}

module.exports = URIConstraint;
