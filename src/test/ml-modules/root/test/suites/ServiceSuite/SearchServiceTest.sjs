const spec = require('/test/spec');
const expect = require("/thirdparty/expect");

const { SearchService } = require('/search/SearchService.sjs');
const { SearchOptions } = require('/search/SearchOptions.sjs');

const options = new SearchOptions().loadOptionsFromDocument({ name: 'test' });
const service = new SearchService({ options });

const params = {
    // q: "Gender IS F AND FirstName IS *ï* Quote IS est 'Morbi        porttitor'",
    q: "Collection IS mock AND FirstName IS c*",
    // collection: "",
    // directory: "",
    start: 1,
    pageLength: 5,
    // returnCtsQuery: true,
    options: "test"
};

const searchParams = service.parseParams(params);
service.GET(searchParams);
