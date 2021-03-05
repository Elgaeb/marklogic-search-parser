// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");
const { DateTime } = require("luxon");

function dateValue(year, month, day) {
  const when = DateTime.local(year, month, day);
  return when.toISODate();
  /*
  return [
    when.toISODate(),
    when.toFormat("yyyy/LL/dd"),
    when.toFormat("L/d/yy"),
    when.toFormat("L/d/yyyy"),
    when.toFormat("LL/dd/yy"),
    when.toFormat("LL/dd/yyyy"),
  ];
  */
}

const lexer = moo.compile({
    double_quoted_string: {match: /"(?:\\["\\]|[^\n"\\])*"/u, value: s => s.slice(1, -1).replace(/\\"/g, '"') },
    single_quoted_string: {match: /'(?:\\['\\]|[^\n'\\])*'/u, value: s => s.slice(1, -1).replace(/\\'/g, "'") },
    whitespace: {match: /[ \t\n\r]+/u, lineBreaks: true},
    lparen: /[(]/u,
    rparen: /[)]/u,
    colon: /:/u,
//    slash: /[/]/u,
//    dash: /-/u,
//    number: /(?:\p{Nd}+(?:[.]\p{Nd}+)?|(?:[.]\p{Nd}+))(?=\p{Z}|$|[)])/u,
    decimal: /(?:\p{Nd}*[.]\p{Nd}+(?=\p{Z}|$|[)]))/u,
    integer: /\p{Nd}+(?=\p{Z}|$|[)])/u,
    date: [
        { match: /\d{4,4}[-/.]\d{1,2}[-/.]\d{1,2}(?=\p{Z}|$|[)])/u, value: s => {
            const parts = s.split(/[-./]/);
            return dateValue(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        }},
        { match: /\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2,2}|\d{4,4})(?=\p{Z}|$|[)])/u, value: s => {
            const parts = s.split(/[-./]/);
            let partialYear = parseInt(parts[2]);
            let year = partialYear >= 1000 ? partialYear : partialYear >= 70 ? 1900 + partialYear : 2000 + partialYear;

           return dateValue(year, parseInt(parts[0]), parseInt(parts[1]));
        }},
    ],
    word: {
      match:
        // /[^\P{Po}:]+/u,
        /(?:\p{L}\p{M}*|\p{N}|\p{S}|\p{Pc}|\p{Pd}|[^\P{Po}:])+/u,
        // /(?:\p{L}\p{M}*|\p{N}|\p{S}|\p{Pc}|\p{Pd}|\p{Po})+/u,
        // /[0-9A-Za-z]+[\w\-_]*/u, type: moo.keywords({
      lineBreaks: true,
      type: moo.keywords({
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
        "kw_dne": "DNE",
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
  return Array.isArray(arr) ? arr[0] : arr;
}

function tail(arr) {
  return Array.isArray(arr) ? arr[arr.length - 1] : arr;
}


function __or(left, right) {
  const last = tail(right);
  const offset = left.input.offset;
  const length = last.input.length + last.input.offset - offset;
  return {
    type: 'OR',
    children: [].concat(...[left, right]),
    input: {
        offset,
        length
    }

  };
}

function __and(left, right) {
  const last = tail(right);
  const offset = left.input.offset;
  const length = last.input.length + last.input.offset - offset;
  return {
    type: 'AND',
    children: [].concat(...[left, right]),
    input: {
        offset,
        length
    }
  };
}

function __word(wx) {
  return {
    type: 'VALUE',
    value: {
      dataType: "string",
      value: wx.value,
      text: wx.text
    },
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

function __decimal(wx) {
  return {
    type: 'VALUE',
    value: {
      dataType: "decimal",
      value: parseFloat(wx.value),
      text: wx.text
    },
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

function __integer(wx) {
  return {
    type: 'VALUE',
    value: {
      dataType: "integer",
      value: parseFloat(wx.value),
      text: wx.text
    },
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

function __date(wx) {
  return {
    type: 'VALUE',
    value: {
      dataType: "date",
      value: wx.value,
      text: wx.text
    },
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

function __phrase(wx) {
  return {
    type: 'VALUE',
    value: {
      dataType: "phrase",
      value: wx.value,
      text: wx.text
    },
    input: {
      offset: wx.offset,
      length: wx.text.length,
    }
  }
}

function __contains(scope, expression) {
  const name = scope.value;

  const offset = scope.offset;
  const length = expression.input.length + expression.input.offset - offset;
  return {
    type: 'SCOPE',
    name: name,
    subquery: expression,
    input: {
      offset,
      length
    }
  }
}

function __not(not, expression) {
  const name = not.value;

  const offset = not.offset;
  const length = expression.input.length + expression.input.offset - offset;
  return {
    type: 'NOT',
    subquery: expression,
    input: {
      offset,
      length
    }
  }
}

function __constraint(wx, operator, nx) {
  const name = wx.value;
  const value = nx.value; //nx.text != null ? nx.text : nx.value;

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

function __dne_constraint(wx, ox) {
  const name = wx.value;

  const offset = wx.offset;
  const length = ox.text.length + ox.offset - offset;
  return {
    type: 'CONSTRAINT',
    name: name,
    operator: 'DNE',
    input: {
      offset,
      length
    }
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
    {"name": "group_expression", "symbols": ["contains_expression"], "postprocess": head},
    {"name": "group_expression", "symbols": ["not_expression"], "postprocess": head},
    {"name": "group_expression", "symbols": ["terminal_expression"], "postprocess": head},
    {"name": "contains_expression", "symbols": [(lexer.has("word") ? {type: "word"} : word), (lexer.has("kw_contains") ? {type: "kw_contains"} : kw_contains), "group_expression"], "postprocess": ([wx, cx, ex]) => __contains(wx, ex)},
    {"name": "not_expression", "symbols": [(lexer.has("kw_not") ? {type: "kw_not"} : kw_not), "group_expression"], "postprocess": ([not, expression]) => __not(not, expression)},
    {"name": "terminal_expression", "symbols": ["value_terminal"], "postprocess": head},
    {"name": "terminal_expression", "symbols": ["constraint_terminal"], "postprocess": head},
    {"name": "value_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": ([wx]) => __word(wx)},
    {"name": "value_terminal", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess": ([wx]) => __decimal(wx)},
    {"name": "value_terminal", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": ([wx]) => __integer(wx)},
    {"name": "value_terminal", "symbols": [(lexer.has("date") ? {type: "date"} : date)], "postprocess": ([wx]) => __date(wx)},
    {"name": "value_terminal", "symbols": [(lexer.has("single_quoted_string") ? {type: "single_quoted_string"} : single_quoted_string)], "postprocess": ([wx]) => __phrase(wx)},
    {"name": "value_terminal", "symbols": [(lexer.has("double_quoted_string") ? {type: "double_quoted_string"} : double_quoted_string)], "postprocess": ([wx]) => __phrase(wx)},
    {"name": "constraint_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word), "equality_terminal", "value_terminal"], "postprocess": ([wx, cx, tx]) => __constraint(wx, 'EQ', tx)},
    {"name": "constraint_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word), "range_terminal", "value_terminal"], "postprocess": ([wx, cx, tx]) => __constraint(wx, head(cx).value, tx)},
    {"name": "constraint_terminal", "symbols": [(lexer.has("word") ? {type: "word"} : word), "dne_terminal"], "postprocess": ([wx, ox]) => __dne_constraint(wx, head(ox))},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_lt") ? {type: "kw_lt"} : kw_lt)]},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_le") ? {type: "kw_le"} : kw_le)]},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_gt") ? {type: "kw_gt"} : kw_gt)]},
    {"name": "range_terminal", "symbols": [(lexer.has("kw_ge") ? {type: "kw_ge"} : kw_ge)]},
    {"name": "equality_terminal$subexpression$1", "symbols": [(lexer.has("kw_eq") ? {type: "kw_eq"} : kw_eq)]},
    {"name": "equality_terminal$subexpression$1", "symbols": [(lexer.has("kw_is") ? {type: "kw_is"} : kw_is)]},
    {"name": "equality_terminal$subexpression$1", "symbols": [(lexer.has("colon") ? {type: "colon"} : colon)]},
    {"name": "equality_terminal", "symbols": ["equality_terminal$subexpression$1"]},
    {"name": "dne_terminal", "symbols": [(lexer.has("kw_dne") ? {type: "kw_dne"} : kw_dne)]}
]
  , ParserStart: "expression"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
