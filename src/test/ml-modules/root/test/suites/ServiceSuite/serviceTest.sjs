const spec = require('/test/spec');
const expect = require("/thirdparty/expect");

const { GET } = require('/marklogic.rest.resource/search/assets/resource.sjs');
const options = require("/search-options");


const context = {};
const params = {
    q: "Gender IS F AND FirstName IS *ï* Quote IS est 'Morbi        porttitor'",
    // q: "Collection IS m* AND FirstName IS c*",
    // collection: "",
    // directory: "",
    start: 1,
    pageLength: 5
}

GET(context, params);
