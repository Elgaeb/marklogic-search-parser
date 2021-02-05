const { SearchParser } = require('/search/SearchParser');
const { DataDictionary } = require('DataDictionary.sjs');
const { DateTime, Interval, Duration } = require('luxon');

function asNumber({ value, defaultValue }) {
    const val = parseInt(value);
    return isNaN(val) ? defaultValue : val;
}

function time({ metricsProperty = 'metrics', resultProperty = 'result', timedFunction }) {
    const start = DateTime.fromJSDate(new Date());
    const result = timedFunction();
    const end = DateTime.fromJSDate(new Date());

    const out = {};
    out[metricsProperty] = {
        start: start.toISO(),
        end: end.toISO(),
        duration: Interval.fromDateTimes(start, end).toDuration(['minutes', 'seconds']).toISO()
    };
    out[resultProperty] = result;

    return out;
}

class SearchService {
    constructor({ options, dataDictionary = new DataDictionary() }) {
        this.options = options;
        this.dataDictionary = dataDictionary;
    }

    opt({ propertyName, params, defaultValue }) {
        if (params != null && params[propertyName] != null) {
            return params[propertyName];
        } else if (this.options[propertyName] != null) {
            return this.options[propertyName];
        } else {
            return defaultValue;
        }
    }

    parseParams(params) {
        const qtext = params.q || "";
        const collection = params.collection;
        const directory = params.directory;
        const start = asNumber({ value: params.start, defaultValue: 1 });
        const pageLength = asNumber({ value: params.pageLength, defaultValue: 10 });
        const orderName = params.sort;
        const reverse = !!params.reverse;

        const returnQuery = this.opt({ propertyName: 'returnQuery', params, defaultValue: false });
        const returnParsedQuery = this.opt({ propertyName: 'returnParsedQuery', params, defaultValue: false });
        const returnCtsQuery = this.opt({ propertyName: 'returnCtsQuery', params, defaultValue: false });
        const returnResults = this.opt({ propertyName: 'returnResults', params, defaultValue: true });
        const returnMatches = this.opt({ propertyName: 'returnMatches', params, defaultValue: true });
        const returnFacets = this.opt({ propertyName: 'returnFacets', params, defaultValue: true });
        const returnOptions = this.opt({ propertyName: 'returnQuery', params, defaultValue: false });
        const returnMetrics = this.opt({ propertyName: 'returnMetrics', params, defaultValue: false });

        return {
            qtext,
            collection,
            directory,
            start,
            pageLength,
            orderName,
            reverse,
            returnQuery,
            returnParsedQuery,
            returnCtsQuery,
            returnResults,
            returnMatches,
            returnFacets,
            returnOptions,
            returnMetrics
        };
    }

    GET({
        qtext,
        collection,
        directory,
        start,
        pageLength,
        orderName,
        reverse,
        returnQuery,
        returnParsedQuery,
        returnCtsQuery,
        returnResults,
        returnMatches,
        returnFacets,
        returnOptions,
        returnMetrics
    }) {
        const serviceStart = DateTime.fromJSDate(new Date());

        const metrics = {};
        const results = {};

        if(!!returnMetrics) {
            results.metrics = metrics;
        }

        const { parserInstantiationDuration, parser } = time({
            metricsProperty: 'parserInstantiationDuration',
            resultProperty: 'parser',
            timedFunction: () => {
                return new SearchParser({ options: this.options });
            }
        });

        metrics.parserInstantiationDuration = parserInstantiationDuration;
        
        const { parseDuration } = time({
            metricsProperty: 'parseDuration',
            timedFunction: () => parser.parse(qtext)
        });

        metrics.parseDuration = parseDuration;

        const ctsQueries = [parser.ctsQuery];

        if (collection != null) {
            ctsQueries.push(cts.collectionQuery([].concat(...[collection])));
        }

        if (directory != null) {
            ctsQueries.push(cts.directoryQuery([].concat(...[collection]), "infinity"));
        }

        const { searchDuration, searchResults } = time({
            metricsProperty: 'searchDuration',
            resultProperty: 'searchResults',
            timedFunction: () => {
                const searchOptions = [].concat(...["faceted", parser.makeSortOrder({ options: this.options, orderName, reverse })]);
                return fn.subsequence(
                    cts.search(cts.andQuery(ctsQueries), searchOptions),
                    start,
                    pageLength
                );
            }
        });

        metrics.searchDuration = searchDuration;

        if (returnFacets) {
            const { facetDuration, facets } = time({
                metricsProperty: 'facetDuration',
                resultProperty: 'facets',
                timedFunction: () => {
                    return parser.doFacet({
                        options: this.options,
                        query: parser.ctsQuery
                    });
                }
            });

            metrics.facetDuration = facetDuration;
            results.facets = facets;
        }

        const { resultsDuration, resultsArr } = time({
            metricsProperty: 'resultsDuration',
            resultProperty: 'resultsArr',
            timedFunction: () => {
                const resultsArr = [];
                if(returnResults) {
                    for(let doc of searchResults) {
                        const docResult = {
                            content: doc,
                            uri: fn.baseUri(doc)
                        };
            
                        if (returnMatches) {
                            const { matchDuration, matches } = time({
                                metricsProperty: 'matchDuration',
                                resultProperty: 'matches',
                                timedFunction: () => {
                                    return parser.match({ parsedQuery: parser.parsedQuery, doc });
                                }
                            });

                            if(!!returnMetrics) {
                                docResult.metrics = { matchDuration };
                            }
                            docResult.matches = matches;
                        }
        
                        resultsArr.push(docResult);
                    }
                }
                return resultsArr;
            }
        });

        metrics.resultsDuration = resultsDuration;

        results.total = cts.estimate(cts.andQuery(ctsQueries));
        results.start = start;
        results.pageLength = pageLength;
        results.count = resultsArr.length;

        if (returnQuery) {
            results.query = qtext;
        }
        if (returnParsedQuery) {
            results.parsedQuery = parser.parsedQuery;
        }
        if (returnCtsQuery) {
            results.ctsQuery = parser.ctsQuery;
        }
        if (returnResults) {
            results.results = resultsArr;
        }
        if (returnOptions) {
            results.options = this.options;
        }

        // results.constraintMap = parser.constraintMap;

        const serviceEnd = DateTime.fromJSDate(new Date());

        metrics.serviceDuration = {
            start: serviceStart.toISO(),
            end: serviceEnd.toISO(),
            duration: Interval.fromDateTimes(serviceStart, serviceEnd).toDuration(['minutes', 'seconds']).toISO()
        };

        return results;

    }
}

module.exports = { SearchService };