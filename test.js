const fs = require('fs');
const requireFromString = require('require-from-string');

const nearley = require("nearley");
const version = require('nearley/package.json').version;
const generate = require('nearley/lib/generate.js');

const Compile = require('nearley/lib/compile.js');

const opts = {
    quiet: false,
    export: 'mlSearch'
};

function compileGrammar({ grammar, opts }) {
    const grammarParserGrammar = nearley.Grammar.fromCompiled(require('nearley/lib/nearley-language-bootstrapped.js'));
    const grammarParser = new nearley.Parser(grammarParserGrammar);
    
    grammarParser.feed(grammar);
    const compiledGrammarParserGrammar = Compile(grammarParser.results[0], { version, ...opts });
    
    const compiledAsString = generate(compiledGrammarParserGrammar, opts.export);
    return nearley.Grammar.fromCompiled(requireFromString(compiledAsString));
}

function writeTable(writeStream, parser) {
    writeStream.write("Table length: " + parser.table.length + "\n");
    writeStream.write("Number of parses: " + parser.results.length + "\n");
    writeStream.write("Parse Charts");
    parser.table.forEach(function (column, index) {
        writeStream.write("\nChart: " + index++ + "\n");
        var stateNumber = 0;
        column.states.forEach(function (state, stateIndex) {
            writeStream.write(stateIndex + ": " + state.toString() + "\n");
        })
    })
    writeStream.write("\n\nParse results: \n");
}

function flattenTree(node) {
    if(node.expressions == null) {
        return { ...node };
    }

    let expressions = [].concat(...node.expressions
    .map(expression => flattenTree(expression))
    .map(expression => {
        if((node.type == 'AND' || node.type == 'OR') && node.type == expression.type) {
            return expression.expressions;
        } else {
            return expression;
        }
    }));

    const flattenedNode = {
        ...node
    };
    flattenedNode.expressions = expressions;

    return flattenedNode;
}

function writeResults(writeStream, results) {
    writeStream.write(require('util').inspect(results, {colors: true, depth: null}));
    writeStream.write("\n");
}

// const searchString = "(FirstName:John OR LastName:Doe-Long) BirthDate FROM 6/2/76 TO 6-4-76 LastName CONTAINS 'Doe' OR LastName IS Purple";
// const searchString = "JANE LONG DOE OR JAMES ALLEN"
// const searchString = "JANE LONG DOE";

// const searchString = "JANE AND LONG AND DOE AND III";
// const searchString = "JANE AND LONG OR DOE AND III";
const searchString = "(JANE OR JOHN) 6/2/76 1.123 DOE OR Name : JOHN";
//const searchString = "JOHN 6/2/76";

const grammar = compileGrammar({
    grammar: fs.readFileSync('./search.ne', 'utf8'),
    opts
})
const parser = new nearley.Parser(grammar, {
    keepHistory: true,
});

parser.feed(searchString);
const results = parser.results;

// writeTable(process.stdout, parser);
// writeResults(process.stdout, results);


const queryTree = results[0];

//writeResults(process.stdout, flattenTree(queryTree));
//writeResults(process.stdout, queryTree);

writeResults(process.stdout, results);