const testHelper = require('/test/test-helper.xqy');

class Suite {
    constructor() {}
}

function test(callback) {




    const suites = [];

    callback({
        describe: function describe(message, callback) {
            const suite = {
                suite: message,
                tests: []
            };
            suites.push(suite);
        
            callback({
                it: function it(message, callback) {
                    const test = {
                        test: message,
                        success: true
                    };
                    suite.tests.push(test);
                    try {
                        callback();
                    } catch (ex) {
                        test.success = false;
                        test.error = ex;
                    }
                }
            });
        
            const failed = suite.tests.filter(test => !test.success);
            if(failed.length > 0) {
                const errorMessage = failed.map(test => test.message).join("; ");
                fn.error(xs.QName("TEST-FAILED"), errorMessage);
            }
        }
    });


    return [].concat(...suites.map(suite => [].concat(...suite.tests.map(test => testHelper.success()))));
};


module.exports = test;