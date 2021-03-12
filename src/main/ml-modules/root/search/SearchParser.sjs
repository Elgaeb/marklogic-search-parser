const nearley = require('nearley');
const grammar = require('grammar');
const Numeral = require('numeral/numeral');
const Mutator = require('Mutator');

const { DataDictionary, DocumentDataDictionary } = require('DataDictionary.sjs');

const { DateTime } = require('/search/luxon');
const _ = require('underscore');

const NOT_NULL_FILTER = (v) => v != null;

class MutatorCache {
    constructor() {
        this.defaultMutator = Mutator;
        this.mutators = {};
    }

    getMutator({ modulePath }) {
        if (modulePath == null) {
            return new this.defaultMutator();
        } else {
            if (this.mutators[modulePath] == null) {
                this.mutators[modulePath] = require(modulePath);
            }

            const MutatorClass = this.mutators[modulePath];
            return new MutatorClass();
        }
    }
}

class TypeConverter {
    constructor({ options }) {
        this.rangeOperators = {
            EQ: '=',
            NE: '!=',
            GT: '>',
            GE: '>=',
            LT: '<',
            LE: '<=',
        };

        this.options = options;
        this.mutators = new MutatorCache();
    }

    makeReference({ valueOptions }) {
        const type = valueOptions.type;
        const options = valueOptions.options == null ? [] : [].concat(...[valueOptions.options]);

        switch (type) {
            case 'pathIndex':
                return cts.pathReference(valueOptions.value, options);
            case 'jsonPropertyIndex':
                return cts.jsonPropertyReference(valueOptions.value, options);
            case 'fieldIndex':
                return cts.fieldReference(valueOptions.value, options);
            default:
                return null;
        }
    }

    valueForWordQuery({ parsedQuery, valueOptions = { dataType: 'string' } }) {
        const { value } = parsedQuery;
        switch (value.dataType) {
            case 'date': {
                const when = DateTime.fromISO(value.value);

                switch (valueOptions.dataType) {
                    case 'number':
                        return when.toMillis();

                    case 'boolean':
                        return undefined;

                    case 'string':
                    default:
                        return [
                            when.toISODate(),
                            when.toFormat('yyyy/LL/dd'),
                            when.toFormat('L/d/yy'),
                            when.toFormat('L/d/yyyy'),
                            when.toFormat('LL/dd/yy'),
                            when.toFormat('LL/dd/yyyy'),
                        ];
                }
            }

            case 'integer':
            case 'decimal': {
                switch (valueOptions.dataType) {
                    case 'number':
                        return value.value;

                    case 'boolean':
                        return value.value != 0;

                    case 'string':
                    default:
                        return '' + value.value;
                }
            }

            case 'phrase':
            case 'string':
            default: {
                const valueStr = '' + value.value;
                switch (valueOptions.dataType) {
                    case 'number':
                        const num = Numeral(valueStr);
                        return num.value() == null
                            ? /^(y|yes|t|true)$/i.test(valueStr.trim())
                                ? 1
                                : /^(n|no|f|false)$/i.test(valueStr.trim())
                                ? 0
                                : null
                            : num.value();

                    case 'boolean':
                        return /^(1|y|yes|t|true)$/i.test(valueStr.trim());

                    case 'string':
                    default:
                        return valueStr;
                }
            }
        }
    }

    referenceScalarType({ ref }) {
        if(typeof(ref) === 'string') {
            return ref;
        }

        const refObj = ref.toObject();
        return refObj[Object.keys(refObj)[0]].scalarType;
    }

    parseNumber({ value, parse }) {
        switch (value.dataType) {
            case 'phrase':
            case 'string':
                let stringValue = value.value.trim();
                let v = parseInt(stringValue);
                if (isNaN(v)) {
                    return /^(y|yes|t|true)$/i.test(value.value.trim()) ? 1 : 0;
                } else {
                    return v;
                }
            case 'date':
                const dateFromISO = DateTime.fromISO(value.value, { zone: 'local' });
                return dateFromISO.toMillis();
            case 'integer':
            case 'decimal':
                return parse(value.value);
            default:
                return value.value;
        }
    }

    valueForReferenceQuery({ parsedQuery, ref }) {
        const scalarType = this.referenceScalarType({ ref });
        const { value } = parsedQuery;

        switch (scalarType) {
            case 'int':
            case 'long':
                return this.parseNumber({ value, parse: parseInt });

            case 'unsignedInt':
            case 'unsignedLong':
                return this.parseNumber({ value, parse: (x) => Math.abs(parseInt(x)) });

            case 'float':
            case 'double':
            case 'decimal':
                return this.parseNumber({ value, parse: (x) => parseFloat });

            case 'date':
                switch (value.dataType) {
                    case 'decimal':
                    case 'integer':
                        const dateFromMillis = DateTime.fromMillis(value.value, { zone: 'local' });
                        return dateFromMillis.toISODate();

                    case 'date':
                        return value.value;

                    case 'phrase':
                    case 'string':
                    default:
                        const dateFromISO = DateTime.fromISO(value.value, { zone: 'local' });
                        return dateFromISO.isValid() ? dateFromISO.toISODate() : null;
                }

            case 'dateTime':
                switch (value.dataType) {
                    case 'decimal':
                    case 'integer':
                        const dateFromMillis = DateTime.fromMillis(value.value, { zone: 'local' });
                        return dateFromMillis.toISO();

                    case 'phrase':
                    case 'string':
                    case 'date':
                    default:
                        const dateFromISO = DateTime.fromISO(value.value, { zone: 'local' });
                        return dateFromISO.toISO();
                }

            case 'string':
                return '' + value.value;

            case 'time':
            case 'gYearMonth':
            case 'gYear':
            case 'gMonth':
            case 'gDay':
            case 'yearMonthDuration':
            case 'dayTimeDuration':
            case 'anyURI':
            default:
                switch (value.dataType) {
                    case 'decimal':
                    case 'integer':
                        return value.text;
                    default:
                        return value.value;
                }
        }
    }

    referenceCanBeWildcarded({ ref, operator }) {
        const scalarType = this.referenceScalarType({ ref });
        return operator === 'EQ' && scalarType === 'string';
    }

    makeCtsQuery({ parsedQuery, constraintConfig, valueOptions }) {
        const mutator = this.mutators.getMutator({ modulePath: valueOptions.inputMutator });

        const getInnerQuery = ({ parsedQuery, valueOptions, constraintConfig }) => {
            const weight = valueOptions.weight == null ? 1.0 : Numeral(valueOptions.weight).value();

            switch (valueOptions.type) {
                case 'pathIndex':
                case 'jsonPropertyIndex':
                case 'fieldIndex': {
                    // TODO?: Should we change wildcared on range queries to require the use of a mutator?

                    const rangeOperator = this.rangeOperators[parsedQuery.operator];
                    const ref = this.makeReference({ valueOptions });
                    const desiredValue = (!constraintConfig.wildcarded ||
                    !this.referenceCanBeWildcarded({ ref, operator: parsedQuery.operator })
                        ? [this.valueForReferenceQuery({ parsedQuery, ref })].filter(
                              NOT_NULL_FILTER
                          )
                        : cts.valueMatch(ref, parsedQuery.value.value).toArray()
                    ).map((value) => mutator.mutate(value));

                    return desiredValue == null
                        ? cts.falseQuery()
                        : cts.rangeQuery(ref, rangeOperator, desiredValue, [], weight);
                }
                case 'field':
                case 'jsonProperty': {
                    function getCtsFn({ useWordQuery, type }) {
                        if (type === 'field') {
                            return !!useWordQuery ? cts.fieldWordQuery : cts.fieldValueQuery;
                        } else {
                            return !!useWordQuery
                                ? cts.jsonPropertyWordQuery
                                : cts.jsonPropertyValueQuery;
                        }
                    }

                    const ctsOptions = new Set();

                    if (valueOptions.queryOptions != null) {
                        []
                            .concat(...[valueOptions.queryOptions])
                            .forEach((option) => ctsOptions.add(option));
                    }

                    if (constraintConfig.wildcarded != null) {
                        const isWildcarded =
                            !!constraintConfig.wildcarded &&
                            (valueOptions.dataType == null || valueOptions.dataType == 'string');
                        ctsOptions.add(isWildcarded ? 'wildcarded' : 'unwildcarded');
                    }

                    const values = []
                        .concat(...[this.valueForWordQuery({ parsedQuery, valueOptions })])
                        .filter(NOT_NULL_FILTER)
                        .map((value) => [].concat(...[mutator.mutate(value)]))
                        .filter(NOT_NULL_FILTER);

                    const valueSet = new Set();
                    values.forEach((v) => v.forEach((vv) => valueSet.add(vv)));

                    const value = [...valueSet];

                    if (value.length === 0) {
                        // the passed value couldn't be coerced
                        return cts.falseQuery();
                    }

                    const ctsFn = getCtsFn({
                        useWordQuery: valueOptions.useWordQuery,
                        type: valueOptions.type,
                    });

                    // cts.walk has an issue when passed a jsonPropertyValueQuery with multiple values
                    return value.length === 1
                        ? ctsFn(valueOptions.value, value, [...ctsOptions], weight)
                        : cts.orQuery(
                              value.map((v) =>
                                  ctsFn(valueOptions.value, v, [...ctsOptions], weight)
                              )
                          );
                }

                default:
                    return null;
            }
        };

        return getInnerQuery({ parsedQuery, valueOptions, constraintConfig });
    }
}

class PathMatcher {
    constructor({ options, dataDictionary }) {
        this.options = options;
        this.dataDictionary = dataDictionary;
    }

    buildMatchPath({ node, child = null, path = [] }) {
        if (node.type == 'document') {
            return;
        }

        const nodeKind = node.nodeKind;
        const nodeName = nodeKind == 'document' ? '$' : fn.nodeName(node);
        let nodeIndex = undefined;

        if (nodeKind === 'array') {
            const childAsObject = child.toObject();
            for (let i = 0; i < node.length; i++) {
                if (_.isEqual(node[i].toObject(), childAsObject)) {
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

        const parentNode = fn.head(node.xpath('..'));
        if (parentNode != null) {
            this.buildMatchPath({ node: parentNode, child: node, path });
        }

        return path;
    }

    /**
     * @private
     */
    matchPathCallback({ text, node, queries, start, matches, parsedQuery }) {
        const path = this.buildMatchPath({ node }).reverse();

        let dictionaryPath = [];
        let actualPath = [];
        for (let i = 0; i < path.length; i++) {
            const part = path[i];
            if (part.nodeName != null) {
                dictionaryPath.push(part.nodeName);
                switch (part.nodeKind) {
                    case 'array':
                        actualPath.push(`${part.nodeName}[${part.nodeIndex}]`);
                        i++;
                        break;
                    default:
                        actualPath.push(part.nodeName);
                        break;
                }
            }
        }
        const fullPath = actualPath.join('.');
        const fullPathForDictionary = dictionaryPath.join('.');

        const pathDescription = this.dataDictionary.lookup({ path: fullPathForDictionary });

        const match = {};

        match['type'] = 'document';
        // match['raw-path'] = path;
        match['path'] = fullPath;
        // match['dictionary-path'] = fullPathForDictionary;
        match['path-description'] = pathDescription;
        match['match-text'] = node.toString();
        match['matched-text'] = text;

        if (parsedQuery.input != null && parsedQuery.input.text != null) {
            match['query-text'] = parsedQuery.input.text;
        }
        const found = matches.find(
            (m) =>
                m.path == match.path &&
                m.node == match.node &&
                m.text == match.text &&
                m.queryText == match.queryText
        );

        if (found == null) {
            matches.push({ ...match });
        }

        return 'continue';
    }

    generateMatches({ doc, query, parsedQuery }) {
        const matches = [];
        const callback = (text, node, queries, start) =>
            this.matchPathCallback({ text, node, queries, start, matches, parsedQuery });
        cts.walk(doc, query, callback);
        return matches;
    }
}

class SearchParser {
    constructor({ options = {}, queryString = null, dataDictionary = null }) {
        this.options = options;
        this.constraintMap = this.generateConstraintMap({ constraints: options.constraints || [] });

        this.typeConverter = new TypeConverter({ options });
        this.typeModules = {};

        this.dataDictionary = dataDictionary || this.generateDataDictionary();

        this.matcher = new PathMatcher({ options, dataDictionary: this.dataDictionary });

        if (queryString != null) {
            this.parse(queryString);
        }
    }

    generateDataDictionary() {
        if (this.options.dataDictionary != null) {
            if (
                this.options.dataDictionary.document != null &&
                fn.docAvailable(this.options.dataDictionary.document)
            ) {
                return new DocumentDataDictionary({ uri: this.options.dataDictionary.document });
            }
        }

        return new DataDictionary();
    }

    /**
     * @public
     */
    parse(queryString) {
        function enrich(parsedQuery) {
            function enrichChildren(parsedQuery) {
                const children = [].concat(
                    ...parsedQuery.children
                        .map((cq) => enrich(cq))
                        .map((cq) => {
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
                        children,
                    };
                }
            }

            switch (parsedQuery.type) {
                case 'AND':
                    return enrichChildren(parsedQuery);
                case 'OR':
                    return enrichChildren(parsedQuery);
                default:
                    if (parsedQuery.input != null) {
                        const { offset, length } = parsedQuery.input;
                        if (offset != null && length != null) {
                            parsedQuery.input.text = queryString.substring(offset, offset + length);
                        }
                    }
                    return { ...parsedQuery };
            }
        }

        this.queryString = queryString;

        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(queryString);

        this.rawParsedQuery = parser.results;
        if (this.rawParsedQuery.length == 0) {
            this.rawParsedQuery = [
                {
                    type: 'TRUE',
                },
            ];
        }
        this.parsedQuery = enrich(this.rawParsedQuery[0]);

        this.ctsQuery = this.toCts({
            parsedQuery: this.parsedQuery,
            options: this.options,
        });
        return this.parsedQuery;
    }

    getScopePropertyForName({ name }) {
        if (this.options.containers != null && this.options.containers[name] != null) {
            const prop = this.options.containers[name].property;
            return prop == null ? name : prop;
        } else {
            return name;
        }
    }

    /**
     * @private
     */
    toCts({ parsedQuery }) {
        const collectChildren = (parsedQuery) => {
            if (parsedQuery.children != null) {
                return parsedQuery.children.map((childQuery) =>
                    this.toCts({ parsedQuery: childQuery })
                );
            } else {
                return [];
            }
        };

        switch (parsedQuery.type) {
            case 'AND':
                return cts.andQuery(collectChildren(parsedQuery));

            case 'OR':
                return cts.orQuery(collectChildren(parsedQuery));

            case 'VALUE':
                const values = this.typeConverter.valueForWordQuery({ parsedQuery });
                return cts.wordQuery([].concat(...[values]));

            case 'TRUE':
                return cts.trueQuery();

            case 'NOT':
                return cts.notQuery(this.toCts({ parsedQuery: parsedQuery.subquery }));

            case 'SCOPE':
                return cts.jsonPropertyScopeQuery(
                    this.getScopePropertyForName({ name: parsedQuery.name }),
                    this.toCts({ parsedQuery: parsedQuery.subquery })
                );

            case 'CONSTRAINT':
                return this.constraintToCts({ parsedQuery });

            default:
                break;
        }
    }

    /**
     * @private
     */
    generateConstraintMap({ constraints = [] }) {
        return constraints.reduce((acc, c) => {
            acc[c.name] = c;
            return acc;
        }, {});
    }

    /**
     * @private
     */
    doMatch_old({ parsedQuery, doc }) {
        const doChildMatch = ({ parsedQuery, doc, abortOnMiss }) => {
            const matches = {
                matched: true,
                matches: [],
            };

            for (let cq of parsedQuery.children) {
                const childMatch = this.doMatch({ parsedQuery: cq, doc });
                if (childMatch.matched) {
                    matches.matches = [].concat(...[matches.matches, childMatch.matches]);
                } else if (abortOnMiss) {
                    return { matched: false };
                }
            }

            return matches;
        };

        switch (parsedQuery.type) {
            case 'AND':
                return doChildMatch({ parsedQuery, doc, abortOnMiss: true });

            case 'OR':
                return doChildMatch({ parsedQuery, doc, abortOnMiss: false });

            case 'TRUE':
                return {
                    matched: true,
                    matches: [],
                };

            case 'CONSTRAINT':
                const constraintConfig = this.constraintMap[parsedQuery.name];
                if (constraintConfig != null) {
                    const constraint = this.getConstraint({
                        constraintConfig,
                        dataDictionary: this.dataDictionary,
                    });
                    return constraint.generateMatches({ doc, parsedQuery, constraintConfig });
                }
                return { matched: true, matches: [] };

            default:
                let query = this.toCts({ parsedQuery });
                let matches = this.matcher.generateMatches({ doc, query, parsedQuery });
                return matches != null && matches.length > 0
                    ? { matched: true, matches }
                    : { matched: false, matches: [] };
        }
    }

    /**
     * @private
     */
    doMatch({ parsedQuery, doc }) {
        const doChildMatch = ({ parsedQuery, doc, abortOnMiss }) => {
            const matches = {
                matched: true,
                matches: [],
            };

            for (let cq of parsedQuery.children) {
                const childMatch = this.doMatch({ parsedQuery: cq, doc });
                if (childMatch.matched) {
                    matches.matches = [].concat(...[matches.matches, childMatch.matches]);
                } else if (abortOnMiss) {
                    return { matched: false };
                }
            }

            return matches;
        };

        switch (parsedQuery.type) {
            case 'AND':
                return doChildMatch({ parsedQuery, doc, abortOnMiss: true });

            case 'OR':
                return doChildMatch({ parsedQuery, doc, abortOnMiss: false });

            case 'TRUE':
                return {
                    matched: true,
                    matches: [],
                };

            case 'CONSTRAINT':
                const constraintConfig = this.constraintMap[parsedQuery.name];
                if (constraintConfig != null) {
                    const constraint = this.getConstraint({
                        constraintConfig,
                        dataDictionary: this.dataDictionary,
                    });
                    return constraint.generateMatches({ doc, parsedQuery, constraintConfig });
                }
                return { matched: true, matches: [] };

            default:
                let query = this.toCts({ parsedQuery });
                let matches = this.matcher.generateMatches({ doc, query, parsedQuery });
                return matches != null && matches.length > 0
                    ? { matched: true, matches }
                    : { matched: false, matches: [] };
        }
    }

    /**
     * @public
     */
    match({ parsedQuery, doc }) {
        return this.doMatch({ parsedQuery, doc }).matches;
    }

    /**
     * @private
     */
    toSortOrder({ order, direction }) {
        const options = [direction];

        switch (order.type) {
            case 'index':
                return cts.indexOrder(
                    this.typeConverter.makeReference({ valueOptions: order.value }),
                    options
                );
                break;
            case 'score':
                return cts.scoreOrder(options);
                break;
            case 'document':
                return cts.documentOrder(options);
                break;
            case 'confidence':
                return cts.confidenceOrder(options);
                break;
            case 'fitness':
                return cts.fitnessOrder(options);
                break;
            case 'quality':
                return cts.qualityOrder(options);
                break;
            case 'unordered':
            default:
                return cts.unordered();
        }
    }

    makeSortOrder({ options, orderName, reverse = false }) {
        let sortOrderName = orderName == null ? options.defaultSortOrder : orderName;

        if (sortOrderName == null) {
            return cts.scoreOrder([reverse ? 'ascending' : 'descending']);
        }

        let orderOptions = options.sortOrder[sortOrderName];

        if (orderOptions == null) {
            return cts.scoreOrder([reverse ? 'ascending' : 'descending']);
        }

        return orderOptions.map((order) => this.toSortOrder({ order, reverse }));
    }

    getConstraint({ constraintConfig, dataDictionary }) {
        const { type } = constraintConfig;
        let ConstraintClass = this.typeModules[type] || (this.typeModules[type] = require(type));
        return new ConstraintClass({
            options: this.options,
            matcher: this.matcher,
            parser: this,
            typeConverter: this.typeConverter,
            constraintConfig,
            dataDictionary,
        });
    }

    constraintToCts({ parsedQuery }) {
        const constraintConfig = this.constraintMap[parsedQuery.name];

        if (constraintConfig != null) {
            const constraint = this.getConstraint({ constraintConfig });
            switch (parsedQuery.operator) {
                case 'DNE':
                    return constraint.toCtsDne({ constraintConfig });

                default:
                    return constraint.toCts({ parsedQuery, constraintConfig });
            }
        } else {
            switch (parsedQuery.operator) {
                case 'DNE':
                    return cts.falseQuery();

                default:
                    return cts.trueQuery();
            }
        }
    }

    /**
     * @private
     */
    startFacet({ constraintConfig, query }) {
        return this.getConstraint({ constraintConfig }).startFacet({ constraintConfig, query });
    }

    /**
     * @private
     */
    finishFacet({ startValue, constraintConfig, query }) {
        return this.getConstraint({ constraintConfig }).finishFacet({
            startValue,
            constraintConfig,
            query,
        });
    }

    /**
     * @public
     */
    doFacet({ options, query }) {
        const startValues = options.constraints
            .map((constraintConfig) => {
                if (!!constraintConfig.faceted) {
                    return {
                        constraintConfig,
                        startValue: this.startFacet({
                            constraintConfig,
                            query,
                        }),
                    };
                } else {
                    return null;
                }
            })
            .filter((v) => v != null);

        return startValues.map((sv) => {
            const values = this.finishFacet({
                startValue: sv.startValue,
                constraintConfig: sv.constraintConfig,
                query,
            });

            return {
                name: sv.constraintConfig.name,
                values,
            };
        });
    }
}

module.exports = {
    SearchParser,
    TypeConverter,
    PathMatcher,
};
