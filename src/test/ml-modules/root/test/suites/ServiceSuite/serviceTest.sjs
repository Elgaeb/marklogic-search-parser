const spec = require('/test/spec');
const expect = require('/thirdparty/expect');

const { GET } = require('/marklogic.rest.resource/search/assets/resource.sjs');

const context = {};
const params = {
    // q: "Gender IS F AND FirstName IS *ï* Quote IS est 'Morbi        porttitor'",
    // q: "Collection IS mock AND FirstName IS c*",
    // q: "Gender:F",
    // q: 'FirstName:Wallaby',
    q: 'Gender DNE Marsupial',
    // collection: "",
    // directory: "",
    start: 1,
    pageLength: 5,
    options: 'test',
    returnMetrics: false,
    returnResults: true,
    returnCtsQuery: false,
    returnMatches: true,
};

GET(context, params);
