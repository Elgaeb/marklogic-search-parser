@{%
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
    text: wx.text,
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

function __phrase(wx) {
  return {
    type: 'PHRASE',
    value: wx.value,
    text: wx.text,
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

/*
function __constraint(name, operator, value) {
  return {
    type: 'CONSTRAINT',
    name: name,
    operator,
    value: value.text != null ? value.text : value.value
  }
}
*/

function __constraint(wx, operator, nx) {
  const name = wx.value;
  const value = nx.text != null ? nx.text : nx.value;

  const offset = wx.offset;
  const length = nx.input.length + nx.input.offset - offset;
  return {
    type: 'CONSTRAINT',
    name: name,
    operator,
    value,
    input: {
      offset,
      length
    }
  }
}

function __text(values) {
  return [].concat(...values).map(v => v.text).join(" ");
}

%}

@lexer lexer

# Use %token to match any token of that type instead of "token":

expression -> or_expression {% head %}

or_expression -> or_expression %kw_or and_expression {% ([ox, op, ax]) => __or(ox, ax) %}
or_expression -> and_expression {% head %}

and_expression -> and_expression %kw_and:? group_expression {% ([ax, op, wx]) => __and(ax, wx) %}
and_expression -> group_expression {% head %}

group_expression -> %lparen expression %rparen {% ([lp, ex, rp]) => ex %}
group_expression -> terminal_expression {% head %}

terminal_expression -> word_terminal {% head %}
terminal_expression -> phrase_terminal {% head %}
terminal_expression -> constraint_terminal {% head %}

word_terminal -> %word {% ([wx]) => __word(wx) %}
word_terminal -> %number {% ([wx]) => __word(wx) %}
word_terminal -> %date {% ([wx]) => __word(wx) %}

phrase_terminal -> %single_quoted_string {% ([wx]) => __phrase(wx) %}
phrase_terminal -> %double_quoted_string {% ([wx]) => __phrase(wx) %}

constraint_terminal -> %word equality_terminal literal_terminal {% ([wx, cx, tx]) => __constraint(wx, 'EQ', tx[0]) %}
constraint_terminal -> %word range_terminal literal_terminal {% ([wx, cx, tx]) => __constraint(wx, head(cx).value, head(tx)) %}

range_terminal -> %kw_lt
range_terminal -> %kw_le
range_terminal -> %kw_gt
range_terminal -> %kw_ge
equality_terminal -> (%kw_eq | %kw_is | %colon)
literal_terminal -> (word_terminal | phrase_terminal) {% head %}