class DataDictionary {
    lookup({ path }) {
        return undefined;
    }
}

class DocumentDataDictionary extends DataDictionary {
    constructor({ uri }) {
        super();
        this.dictionary = cts.doc(uri).toObject();
    }

    lookup({ path }) {
        return this.dictionary[path];
    }
}

module.exports = {
    DataDictionary,
    DocumentDataDictionary,
};
