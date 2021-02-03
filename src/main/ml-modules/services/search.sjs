const { SearchService } = require('/search/SearchService.sjs');
const { SearchOptions } = require('/search/SearchOptions.sjs');

function get(context, params) {
    const options = new SearchOptions().loadOptionsFromDocument({ name: params.options });
    const service = new SearchService({ options });
    return service.GET(service.parseParams(params));
};

function post(context, params, input) {
    // return zero or more document nodes
};

function put(context, params, input) {
    // return at most one document node
};

function deleteFunction(context, params) {
    // return at most one document node
};

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;