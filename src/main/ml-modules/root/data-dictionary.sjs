const dictionary = {
    "$.Gender.genderCode": {
        description: "Code for the gender of the person."
    },
    "$.Name.firstName": {
        description: "First Name"
    },
    "$.favoriteQuote": {
        description: "Favorite quotation."
    }
};

function dictionaryLookup({ path }) {
    return (dictionary[path] || { description: `Unknown path: ${path}` }).description;
}

module.exports = dictionaryLookup;