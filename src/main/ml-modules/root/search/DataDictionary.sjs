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
        const entry = this.dictionary[path];
        return entry != null ? this.dictionary[path].description : undefined;
    }
}

module.exports = {
    DataDictionary,
    DocumentDataDictionary,
};
