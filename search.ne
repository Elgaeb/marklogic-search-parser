@{%
const moo = require("moo");

const lexer = moo.compile({
    double_quoted_string: {match: /"(?:\\["\\]|[^\n"\\])*"/, value: s => s.slice(1, -1).replace(/\\"/g, '"') },
    single_quoted_string: {match: /'(?:\\['\\]|[^\n'\\])*'/, value: s => s.slice(1, -1).replace(/\\'/g, "'") },
    whitespace: {match: /[ \t\n\r]+/, lineBreaks: true},
    lparen: '(',
    rparen: ')',
    colon: ':',
    slash: '/',
    dash: '-',
    number: /(?:\d+(?:[.]\d+)?|(?:[.]\d+))(?=[ \t\n\r)])/,
    dot: '.',
    times: '*',
    wildcarded_word: /[0-9\w?*]*[?*][\w?*]*/,
    date: [
        { match: /\d{4,4}[-/.]\d{1,2}[-/.]\d{1,2}(?=[ \t\n\r)])/, value: s => {
            const parts = s.split(/[-./]/);
            return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }},
        { match: /\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2,2}|\d{4,4})(?=[ \t\n\r)])/, value: s => {
            const parts = s.split(/[-./]/);
            let partialYear = parseInt(parts[2]);
            let year = partialYear >= 1000 ? partialYear : partialYear >= 70 ? 1900 + partialYear : 2000 + partialYear;
            return `${year}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }},
    ],
    word: {match: /[0-9A-Za-z]+[\w\-_]*/, type: moo.keywords({
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

function _word([token]) {
  return {
    type: 'WORD',
    word: token.value
  };
}

function _phrase([token]) {
  return {
    type: 'PHRASE',
    phrase: token.value
  };
}

function _constraint(name, operator, value) {
  return {
    type: "CONSTRAINT",
    name,
    operator,
    value
  };
}

/*
function _and(expressions) {
  return {
    type: "AND",
    expressions
  };
}
*/

function _and(expressions) {
  return {
    type: 'AND',
    expressions: [].concat(...[expressions[0], expressions[1].map(v => v[1][0])])
  }
}

/*
function _or(expressions) {
  return {
    type: "OR",
    expressions
  };
}
*/

function _or(expressions) {
  return {
    type: 'OR',
    expressions: [].concat(...[expressions[0], expressions[1].map(v => v[1][0])])
  }
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
    word: wx.value
  }
}

%}

@lexer lexer

# Use %token to match any token of that type instead of "token":

expression -> or_expression {% head %}

or_expression -> or_expression %kw_or and_expression {% ([ox, op, ax]) => __or(ox, ax) %}
or_expression -> and_expression

and_expression -> and_expression %kw_and group_expression {% ([ax, op, wx]) => __and(ax, wx) %}
and_expression -> group_expression {% head %}

group_expression -> %lparen expression %rparen {% ([lp, ex, rp]) => ex %}
group_expression -> word_terminal {% head %}

word_terminal -> %word {% ([wx]) => __word(wx) %}
