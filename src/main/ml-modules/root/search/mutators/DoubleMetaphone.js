const Mutator = require('../Mutator');

class DoubleMetaphoneMutator extends Mutator {
    mutate(value) {
        return spell
            .doubleMetaphone(value)
            .toArray()
            .filter((v) => v != null && v.trim() !== '');
    }
}

module.exports = DoubleMetaphoneMutator;
