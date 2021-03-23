const Mutator = require('../Mutator');
const Numeral = require('../numeral/numeral');

class DoubleMetaphoneMutator extends Mutator {
    mutate(value) {
        switch(typeof(value)) {
            case "boolean":
                return value;

            case "number":
                return value != 0;

            case "string":
            default:
                return /^(y|yes|t|true|1)$/i.test(('' + value).trim())
        }
    }
}

module.exports = DoubleMetaphoneMutator;
