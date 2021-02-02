const { makeReference } = require('constraints/typeConverters')

function toSortOrder({ order, direction }) {
    const options = [ direction ];

    switch (order.type) {
        case "index":
            return cts.indexOrder(makeReference({ valueOptions: order.value }), options);
            break;
        case "score":
            return cts.scoreOrder(options);
            break;
        case "document":
            return cts.documentOrder(options);
            break;
        case "confidence":
            return cts.confidenceOrder(options);
            break;
        case "fitness":
            return cts.fitnessOrder(options);
            break;
        case "quality":
            return cts.qualityOrder(options);
            break;
        case "unordered":
        default:
            return cts.unordered();
    }
}

function makeSortOrder({ options, orderName, reverse = false }) {
    let sortOrderName = orderName == null ? options.defaultSortOrder : orderName;

    if(sortOrderName == null) {
        return cts.scoreOrder([ reverse ? "ascending" : "descending" ]);
    }

    let orderOptions = options.sortOrder[sortOrderName];

    if(orderOptions == null) {
        return cts.scoreOrder([ reverse ? "ascending" : "descending" ]);
    }

    return orderOptions.map(order => toSortOrder({ order, reverse }));

}

module.exports = { makeSortOrder };