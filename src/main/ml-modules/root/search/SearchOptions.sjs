const DEFAULT_SEARCH_OPTIONS = {
    "constraints": [
        {
            "name": "Collection",
            "type": "constraints/collection",
            "faceted": true,
            "wildcarded": true,
            "facetOptions": [
                "frequency-order",
                "fragment-frequency",
                "descending",
                "limit=20"
            ]
        }
    ],
    "returnQuery": true,
    "returnCtsQuery": false,
    "returnResults": true,
    "returnMatches": true,
    "returnFacets": true,
    "returnOptions": true,
    "defaultSortOrder": "score",
    "sortOrder": {
        "score": [
            {
                "type": "score",
                "direction": "descending"
            }
        ]
    }
};

class SearchOptions {
    constructor({ directory = "/search/options" } = {}) {
        this.directory = directory;
    }

    loadOptionsFromDocument({ name }) {
        if(name != null) {
            let uri = this.directory;
            if(!uri.endsWith('/')) {
                uri += '/';
            }
            uri += name + ".json";

            let doc = cts.doc(uri);
            if(doc != null) {
                return doc.toObject();
            }
        }

        return DEFAULT_SEARCH_OPTIONS;
    }
}

module.exports = {
    SearchOptions
};