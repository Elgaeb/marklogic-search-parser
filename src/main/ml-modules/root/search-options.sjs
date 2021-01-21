const options = {
    constraints: [
        {
            name: "FirstName",
            type: "value",
            // faceted: false,
            wildcarded: true,
            includeMissingValues: false,
            options: ["item-order", "ascending", "fragment-frequency", "limit=3"],
            value: { type: "pathIndex", value: "//Name/firstName" }
        },
        {
            name: "Race",
            type: "value",
            faceted: true,
            wildcarded: false,
            includeMissingValues: true,
            options: ["frequency-order", "descending", "fragment-frequency", "limit=10"],
            value: { type: "jsonPropertyIndex", value: "race" },
        },
        {
            name: "Gender",
            type: "code-value",
            faceted: true,
            wildcarded: false,
            container: "Gender",
            includeMissingValues: true,
            code: { type: "jsonPropertyIndex", value: "genderCode" },
            value: { type: "jsonPropertyIndex", value: "gender" },
        }
    ],
    returnCtsQuery: false,
    returnParsedQuery: true,
    returnMatches: true,
    returnResults: true,
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