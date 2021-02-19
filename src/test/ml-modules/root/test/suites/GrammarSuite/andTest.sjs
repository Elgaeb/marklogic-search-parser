const boot = require('/test/spec');
const expect = require('/thirdparty/expect');
const _ = require('/thirdparty/underscore');
const nearley = require('/search/nearley');
const grammar = require('/search/grammar');

boot(({ describe }) => {
    describe('A suite', ({ it }) => {
        it('contains spec with an expectation', () => {
            const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
            parser.feed('JOHN DOE');

            const expected = [
                [
                    {
                        type: 'AND',
                        children: [
                            {
                                type: 'WORD',
                                value: 'JOHN',
                            },
                            {
                                type: 'WORD',
                                value: 'DOE',
                            },
                        ],
                    },
                ],
            ];

            expect(parser.results).to.eql(expected);
        });
    });
});
