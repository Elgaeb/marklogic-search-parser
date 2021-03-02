@{%
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
    children: [].concat(...[expression]),
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
    children: [].concat(...[expression]),
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

%}

@lexer lexer

# Use %token to match any token of that type instead of "token":

expression -> or_expression {% head %}

or_expression -> or_expression %kw_or and_expression {% ([ox, op, ax]) => __or(ox, ax) %}
or_expression -> and_expression {% head %}

and_expression -> and_expression %kw_and:? group_expression {% ([ax, op, wx]) => __and(ax, wx) %}
and_expression -> group_expression {% head %}

group_expression -> %lparen expression %rparen {% ([lp, ex, rp]) => ex %}
group_expression -> contains_expression {% head %}
group_expression -> not_expression {% head %}
group_expression -> terminal_expression {% head %}

contains_expression -> %word %kw_contains group_expression {% ([wx, cx, ex]) => __contains(wx, ex) %}

not_expression -> %kw_not group_expression {% ([not, expression]) => __not(not, expression) %}

terminal_expression -> value_terminal {% head %}
terminal_expression -> constraint_terminal {% head %}

value_terminal -> %word {% ([wx]) => __word(wx) %}
value_terminal -> %decimal {% ([wx]) => __decimal(wx) %}
value_terminal -> %integer {% ([wx]) => __integer(wx) %}
value_terminal -> %date {% ([wx]) => __date(wx) %}
value_terminal -> %single_quoted_string {% ([wx]) => __phrase(wx) %}
value_terminal -> %double_quoted_string {% ([wx]) => __phrase(wx) %}

constraint_terminal -> %word equality_terminal value_terminal {% ([wx, cx, tx]) => __constraint(wx, 'EQ', tx) %}
constraint_terminal -> %word range_terminal value_terminal {% ([wx, cx, tx]) => __constraint(wx, head(cx).value, tx) %}
constraint_terminal -> %word dne_terminal {% ([wx, ox]) => __dne_constraint(wx, head(ox)) %}

range_terminal -> %kw_lt
range_terminal -> %kw_le
range_terminal -> %kw_gt
range_terminal -> %kw_ge

equality_terminal -> (%kw_eq | %kw_is | %colon)

dne_terminal -> %kw_dne
