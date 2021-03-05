const { SearchService } = require('/search/SearchService.sjs');
const { SearchOptions } = require('/search/SearchOptions.sjs');

function get(context, params) {
    const options = new SearchOptions().loadOptionsFromDocument({ name: params.options });
    const service = new SearchService({ options });
    return service.GET(service.parseParams(params));
}

function post(context, params, input) {
    return get(context, params);
}

function put(context, params, input) {
    fn.error(null, 'RESTAPI-SRVEXERR', Sequence.from([405, 'Method Not Allowed']));
}

function deleteFunction(context, params) {
    fn.error(null, 'RESTAPI-SRVEXERR', Sequence.from([405, 'Method Not Allowed']));
}

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;
