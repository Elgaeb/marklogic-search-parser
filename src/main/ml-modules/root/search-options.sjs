const options = {
    constraints: [
        {
            name: "BirthDate",
            type: "value",
            faceted: false,
            wildcarded: true,
            facetOptions: ["item-order", "descending", "fragment-frequency", "limit=3"],
            value: { type: "jsonPropertyIndex", value: "birthDate" }
        },
        {
            name: "Updated",
            type: "value",
            faceted: false,
            wildcarded: false,
            facetOptions: ["item-order", "descending", "fragment-frequency", "limit=3"],
            value: { type: "jsonPropertyIndex", value: "updatedDateTime" }
        },
        {
            name: "FirstName",
            type: "value",
            // faceted: false,
            wildcarded: true,
            facetOptions: ["item-order", "ascending", "fragment-frequency", "limit=3"],
            value: { type: "pathIndex", value: "//Name/firstName" }
        },
        {
            name: "Race",
            type: "value",
            faceted: true,
            wildcarded: false,
            facetOptions: ["frequency-order", "descending", "fragment-frequency", "limit=10"],
            value: { type: "jsonPropertyIndex", value: "race" },
        },
        {
            name: "Gender",
            type: "code-value",
            faceted: true,
            wildcarded: false,
            scope: "Gender",
            code: { type: "jsonPropertyIndex", value: "genderCode" },
            value: { type: "jsonPropertyIndex", value: "gender" },
        },
        {
            name: "Quote",
            type: "value",
            wildcarded: true,
            value: { type: "jsonProperty", value: "favoriteQuote", useWordQuery: true },
        }
    ],
    returnQuery: true,
    returnCtsQuery: false,
    returnResults: true,
    returnMatches: true,
    returnFacets: true,
    returnOptions: true,
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