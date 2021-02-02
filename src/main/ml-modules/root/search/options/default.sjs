const options = {
    "constraints": [
      {
        "name": "Collection",
        "type": "collection",
        "faceted": true,
        "facetOptions": ["frequency-order", "descending", "fragment-frequency", "limit=20"]
      }
    ],
    "returnQuery": true,
    "returnCtsQuery": false,
    "returnResults": true,
    "returnMatches": true,
    "returnFacets": true,
    "returnOptions": false,
    "defaultSortOrder": "all",
    "sortOrder": {
      "all": [
        { "type": "score", "direction": "descending" }
      ]
    }
  };

module.exports = options;