const options = {
    constraints: [
        {
            name: "FirstName",
            type: "value",
            // faceted: false,
            wildcarded: true,
            includeMissingValues: false,
            options: [ "item-order", "ascending", "fragment-frequency", "limit=3" ],
            value: { type: "pathIndex", value: "//Name/firstName" }
        },
        {
            name: "Race",
            type: "value",
            faceted: true,
            wildcarded: false,
            includeMissingValues: true,
            options: [ "frequency-order", "descending", "fragment-frequency", "limit=10" ],
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
    ]
};

module.exports = options;