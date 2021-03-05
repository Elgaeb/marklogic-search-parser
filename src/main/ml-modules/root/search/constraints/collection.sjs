const { Constraint } = require('../Constraint');

class CollectionConstraint extends Constraint {
    constructor({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary }) {
        super({ options, matcher, parser, typeConverter, constraintConfig, dataDictionary });
    }

    toCts({ parsedQuery }) {
        const collectionName = `${
            this.constraintConfig.prefix == null ? '' : this.constraintConfig.prefix
        }${parsedQuery.value.value}`;

        const desiredValue = !this.constraintConfig.wildcarded
            ? [collectionName]
            : cts.valueMatch(cts.collectionReference([]), collectionName, []);

        return cts.collectionQuery(desiredValue);
    }

    toCtsDne({}) {
        return cts.falseQuery();
    }

    startFacet({ query }) {
        const reference = cts.collectionReference([]);
        const additionalOptions = this.constraintConfig.facetOptions || [];
        return cts.values(reference, null, [].concat(['concurrent', ...additionalOptions]), query);
    }

    finishFacet({ startValue, query }) {
        const out = [];
        const outHash = {};
        const prefix = this.constraintConfig.prefix == null ? '' : this.constraintConfig.prefix;

        for (let value of startValue) {
            const name = value.toString();
            if (name.startsWith(prefix)) {
                const existing = outHash[name];

                if (existing != null) {
                    existing.count += cts.frequency(value);
                } else {
                    const newValue = {
                        name: name,
                        count: cts.frequency(value),
                    };
                    out.push(newValue);
                    outHash[name] = newValue;
                }
            }
        }

        return prefix == ''
            ? out
            : out.map((value) => ({
                  name: value.name.substr(prefix.length),
                  count: value.count,
              }));
    }

    generateMatches({ doc, parsedQuery, constraintConfig }) {
        const collectionName = `${
            this.constraintConfig.prefix == null ? '' : this.constraintConfig.prefix
        }${parsedQuery.value.value}`;
        const desiredCollections = !this.constraintConfig.wildcarded
            ? [collectionName]
            : cts
                  .valueMatch(
                      cts.collectionReference([]),
                      collectionName,
                      [],
                      cts.documentQuery([fn.baseUri(doc)])
                  )
                  .toArray()
                  .map((v) => v.toString());

        const documentCollections = xdmp.documentGetCollections(fn.baseUri(doc));
        const matches = desiredCollections
            .filter((collection) => documentCollections.includes(collection))
            .map((collection) => ({
                type: 'collection',
                collection,
                'query-text': parsedQuery.input.text,
            }));
        const matched = matches.length > 0;

        return { matched, matches };
    }
}

module.exports = CollectionConstraint;
