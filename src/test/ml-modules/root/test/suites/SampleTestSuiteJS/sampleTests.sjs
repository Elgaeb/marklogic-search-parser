const test = require('/test/test-helper.xqy');

const expected = 4;
const actual = 2 * 2;

const assertions = [
    test.assertEqual(expected, actual)
];

assertions;