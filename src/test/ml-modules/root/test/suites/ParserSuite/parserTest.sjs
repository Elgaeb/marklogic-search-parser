const spec = require('/test/spec');
const expect = require('/thirdparty/expect');

const { MLSearchParser } = require('/search/parser');

spec(({ describe }) => {
    describe('An AND query', ({ it }) => {
        it('should produce a single AND condition', () => {
            const expected = {
                type: 'AND',
                children: [
                    {
                        type: 'WORD',
                        value: 'JOHN',
                        text: 'JOHN',
                    },
                    {
                        type: 'WORD',
                        value: 'DOE',
                        text: 'DOE',
                    },
                ],
            };

            const parser = new MLSearchParser({ queryString: 'JOHN DOE' });
            const actual = parser.parsedQuery;

            expect(actual).to.eql(expected);
        });
    });

    describe('An OR query', ({ it }) => {
        it('should produce a single OR condition', () => {
            const expected = {
                type: 'OR',
                children: [
                    {
                        type: 'WORD',
                        value: 'JOHN',
                        text: 'JOHN',
                    },
                    {
                        type: 'WORD',
                        value: 'DOE',
                        text: 'DOE',
                    },
                ],
            };

            const parser = new MLSearchParser({ queryString: 'JOHN OR DOE' });
            const actual = parser.parsedQuery;

            expect(actual).to.eql(expected);
        });
    });

    describe('A complex query', ({ it }) => {
        it('should produce the correct nested output', () => {
            const expected = {
                type: 'AND',
                children: [
                    {
                        type: 'AND',
                        children: [
                            {
                                type: 'WORD',
                                value: 'JOHN',
                                text: 'JOHN',
                            },
                            {
                                type: 'WORD',
                                value: 'JANE',
                                text: 'JANE',
                            },
                        ],
                    },
                    {
                        type: 'OR',
                        children: [
                            {
                                type: 'WORD',
                                value: 'DOE',
                                text: 'DOE',
                            },
                            {
                                type: 'AND',
                                children: [
                                    {
                                        type: 'WORD',
                                        value: 'DE',
                                        text: 'DE',
                                    },
                                    {
                                        type: 'WORD',
                                        value: 'LONG',
                                        text: 'LONG',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const parser = new MLSearchParser({ queryString: 'JOHN JANE (DOE OR DE LONG)' });
            const actual = parser.parsedQuery;

            expect(actual).to.eql(expected);
        });
    });

    /*
    describe("Multiple WORD queries OR'd together", ({ it }) => {
        it("should produce a single WORD block", () => {
            const expected = {
                "type": "WORD",
                "value": [
                    "JOHN",
                    "JANE"
                ]
              };

            const parser = new MLSearchParser({ queryString: "JOHN OR JANE" });
            const actual = parser.parsedQuery;

            expect(actual).to.eql(expected);
        });
    });
    */
});
