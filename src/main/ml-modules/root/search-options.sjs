const options = {
    constraints: [
        {
            name: "Collection",
            type: "constraints/collection",
            faceted: true,
            wildcarded: true,
            "facetOptions": ["frequency-order", "descending", "fragment-frequency", "limit=20"]
        },
        {
            name: "BirthDate",
            type: "constraints/value",
            faceted: false,
            wildcarded: true,
            facetOptions: ["item-order", "descending", "fragment-frequency", "limit=3"],
            value: { type: "jsonPropertyIndex", value: "birthDate" }
        },
        {
            name: "Updated",
            type: "constraints/value",
            faceted: false,
            wildcarded: false,
            facetOptions: ["item-order", "descending", "fragment-frequency", "limit=3"],
            value: { type: "jsonPropertyIndex", value: "updatedDateTime" }
        },
        {
            name: "FirstName",
            type: "constraints/value",
            // faceted: false,
            wildcarded: true,
            facetOptions: ["item-order", "ascending", "fragment-frequency", "limit=3"],
            value: { type: "pathIndex", value: "//Name/firstName" }
        },
        {
            name: "Race",
            type: "constraints/value",
            faceted: true,
            wildcarded: false,
            facetOptions: ["frequency-order", "descending", "fragment-frequency", "limit=10"],
            value: { type: "jsonPropertyIndex", value: "race" },
        },
        {
            name: "Gender",
            type: "constraints/code-value",
            faceted: true,
            wildcarded: false,
            scope: "Gender",
            code: { type: "jsonPropertyIndex", value: "genderCode" },
            value: { type: "jsonPropertyIndex", value: "gender" },
        },
        {
            name: "Quote",
            type: "constraints/value",
            wildcarded: true,
            value: { type: "jsonProperty", value: "favoriteQuote", useWordQuery: true },
        }
    ],
    returnQuery: true,
    returnCtsQuery: false,
    returnResults: true,
    returnMatches: true,
    returnFacets: true,
    returnOptions: false,
    defaultSortOrder: "birthDate",
    sortOrder: {
        birthDate: [
            {
                type: "index",
                value: {
                    type: "jsonPropertyIndex",
                    value: "birthDate"
                },
                direction: "descending"
            },
            { type: "score", direction: "descending" },
        ],
        all: [
            { type: "score", direction: "ascending" },
            { type: "document", direction: "ascending" },
            { type: "confidence", direction: "ascending" },
            { type: "fitness", direction: "ascending" },
            { type: "quality", direction: "ascending" },
            { type: "unordered" },
        ]
    }
};

module.exports = options;