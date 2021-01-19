// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");
const { DateTime } = require("luxon");

function wordsForDate(year, month, day) {
  const when = DateTime.local(year, month, day);
  return [
    when.toISODate(),
    when.toFormat("yyyy/LL/dd"),
    when.toFormat("L/d/yy"),
    when.toFormat("L/d/yyyy"),
    when.toFormat("LL/dd/yy"),
    when.toFormat("LL/dd/yyyy"),
  ];
}

const lexer = moo.compile({
    double_quoted_string: {match: /"(?:\\["\\]|[^\n"\\])*"/u, value: s => s.slice(1, -1).replace(/\\"/g, '"') },
    single_quoted_string: {match: /'(?:\\['\\]|[^\n'\\])*'/u, value: s => s.slice(1, -1).replace(/\\'/g, "'") },
    whitespace: {match: /[ \t\n\r]+/u, lineBreaks: true},
    lparen: /[(]/u,
    rparen: /[)]/u,
    colon: /:/u,
    slash: /[/]/u,
    dash: /-/u,
    number: /(?:\p{Nd}+(?:[.]\p{Nd}+)?|(?:[.]\p{Nd}+))(?=\p{Z}|$|[)])/u,
    wildcarded_word: /[0-9\w?*]*[?*][\w?*]*/u,
    date: [
        { match: /\d{4,4}[-/.]\d{1,2}[-/.]\d{1,2}(?=\p{Z}|$|[)])/u, value: s => {
            const parts = s.split(/[-./]/);
            return wordsForDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        }},
        { match: /\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2,2}|\d{4,4})(?=\p{Z}|$|[)])/u, value: s => {
            const parts = s.split(/[-./]/);
            let partialYear = parseInt(parts[2]);
            let year = partialYear >= 1000 ? partialYear : partialYear >= 70 ? 1900 + partialYear : 2000 + partialYear;

            return wordsForDate(year, parseInt(parts[0]), parseInt(parts[1]));
        }},
    ],
    word: { match: /(?:\p{L}\p{M}*|\p{N}|\p{S}|\p{Pc}|\p{Pd}|\p{Po})+/u, type: moo.keywords({ //{match: /[0-9A-Za-z]+[\w\-_]*/u, type: moo.keywords({
        "kw_and": "AND",
        "kw_or": "OR",
        "kw_not": "NOT",
        "kw_not_in": "NOT_IN",
        "kw_from": "FROM",
        "kw_to": "TO",
        "kw_eq": "EQ",
        "kw_is": "IS",
        "kw_lt": "LT",
        "kw_le": "LE",
        "kw_gt": "GT",
        "kw_ge": "GE",
        "kw_ne": "NE",
        "kw_near": "NEAR",
        "kw_boost": "BOOST",
        "kw_contains": "CONTAINS",
    })}
  });

lexer.next = (next => () => {
    let tok;
    while ((tok = next.call(lexer)) && tok.type === "whitespace") {}
    return tok;
})(lexer.next);


function head(arr) {
  return arr[0];
}

function __or(ox, ax) {
  return {
    type: 'OR',
    children: [].concat(...[ox, ax])
  };
}

function __and(ax, wx) {
  return {
    type: 'AND',
    children: [].concat(...[ax, wx])
  };
}

function __word(wx) {
  return {
    type: 'WORD',
    value: wx.value,
    text: wx.text
  }
}

function __phrase(wx) {
  return {
    type: 'PHRASE',
    value: wx.value
  }
}

function __constraint(name, operator, value) {
  return {
    type: 'CONSTRAINT',
    name,
    operator,
    value: value.text != null ? value.text : value.value
  }
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "expression", "symbols": ["or_expression"], "postprocess": head},
    {"name": "or_expression", "symbols": ["or_expression", (lexer.has("kw_or") ? {type: "kw_or"} : kw_or), "and_expression"], "postprocess": ([ox, op, ax]) => __or(ox, ax)},
    {"name": "or_expression", "symbols": ["and_expression"], "postprocess": head},
    {"name": "and_expression$ebnf$1", "symbols": [(lexer.has("kw_and") ? {type: "kw_and"} : kw_and)], "postprocess": id},
    {"name": "and_expression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "and_expression", "symbols": ["and_expression", "and_expression$ebnf$1", "group_expression"], "postprocess": ([ax, op, wx]) => __and(ax, wx)},
    {"name": "and_expression", "symbols": ["group_expression"], "postprocess": head},
    {"name": "group_expression", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "expression", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([lp, ex, rp]) => ex},
    {"name": "group_expression", "symbols": ["terminal_expression"], "postprocess": head},
    {"name": "terminal_expression", "symbols": ["word_terminal"], "postprocess": head},
    {"name": "terminal_expression", "symbols": ["phrase_terminal"], "postprocess": head},
    {"name": "terminal_expression", "symbols": ["constraint_terminal"], "postprocess": head},
    {"name": "word_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": ([wx]) => __word(wx)},
    {"name": "word_terminal", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": ([wx]) => __word(wx)},
    {"name": "word_terminal", "symbols": [(lexer.has("date") ? {type: "date"} : date)], "postprocess": ([wx]) => __word(wx)},
    {"name": "word_terminal", "symbols": [(lexer.has("wildcarded_word") ? {type: "wildcarded_word"} : wildcarded_word)], "postprocess": ([wx]) => __word(wx)},
    {"name": "phrase_terminal", "symbols": [(lexer.has("single_quoted_string") ? {type: "single_quoted_string"} : single_quoted_string)], "postprocess": ([wx]) => __phrase(wx)},
    {"name": "phrase_terminal", "symbols": [(lexer.has("double_quoted_string") ? {type: "double_quoted_string"} : double_quoted_string)], "postprocess": ([wx]) => __phrase(wx)},
    {"name": "constraint_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word), "equality_terminal", "literal_terminal"], "postprocess": ([wx, cx, tx]) => __constraint(wx.value, 'EQ', tx[0])},
    {"name": "constraint_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word), "range_terminal", "literal_terminal"], "postprocess": ([wx, cx, tx]) => __constraint(wx.value, cx[0].value, tx[0])},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_lt") ? {type: "kw_lt"} : kw_lt)]},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_le") ? {type: "kw_le"} : kw_le)]},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_gt") ? {type: "kw_gt"} : kw_gt)]},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_ge") ? {type: "kw_ge"} : kw_ge)]},
    {"name": "equality_terminal$subexpression$1", "symbols": [(lexer.has("kw_eq") ? {type: "kw_eq"} : kw_eq)]},
    {"name": "equality_terminal$subexpression$1", "symbols": [(lexer.has("kw_is") ? {type: "kw_is"} : kw_is)]},
    {"name": "equality_terminal$subexpression$1", "symbols": [(lexer.has("colon") ? {type: "colon"} : colon)]},
    {"name": "equality_terminal", "symbols": ["equality_terminal$subexpression$1"]},
    {"name": "literal_terminal$subexpression$1", "symbols": ["word_terminal"]},
    {"name": "literal_terminal$subexpression$1", "symbols": ["phrase_terminal"]},
    {"name": "literal_terminal", "symbols": ["literal_terminal$subexpression$1"], "postprocess": head}
]
  , ParserStart: "expression"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
