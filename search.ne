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


function word([token]) {
  return {
    word: token.value
  };
}

function head(arr) {
  return arr[0];
}


function _constraint(name, operator, value) {
  return {
    type: "CONSTRAINT",
    name,
    operator,
    value
  };
}

function _and(expressions) {
  return {
    type: "AND",
    expressions
  };
}

function _or(expressions) {
  return {
    type: "OR",
    expressions
  };
}


%}

@lexer lexer

# Use %token to match any token of that type instead of "token":

expression -> 
      solo_expression {% head %}
    | or_expression {% head %}
    | and_expression {% head %}

group_expression ->
    %lparen expression %rparen {% ([_l, ex1, _r]) => _and([ex1]) %}

literal ->
    %word {% head %}
    | %number {% head %}
    | %date {% head %}
    | %wildcarded_word {% head %}
    | %single_quoted_string {% head %}
    | %double_quoted_string {% head %}

solo_expression ->
    literal {% word %}
    | group_expression {% head %}
    | constraint {% head %}

or_expression ->
    solo_expression %kw_or expression {% ([ex1, _j, ex2]) => _or([ex1, ex2]) %}

and_expression ->
      solo_expression %kw_and expression {% ([ex1, _j, ex2]) => _and([ex1, ex2]) %}
    | solo_expression expression {% ([ex1, ex2]) => _and([ex1, ex2]) %}

joiner ->
      %kw_and expression
    | %kw_or expression

equality_operator ->
    %colon
    | %kw_eq
    | %kw_is

range_operator ->
    %kw_lt
    | %kw_le
    | %kw_gt
    | %kw_ge

constraint ->
      %word equality_operator literal {% ([constraint, _c, value]) => _constraint(constraint.value, "EQ", value.value) %}
    | %word range_operator literal {% ([constraint, op, value]) => _constraint(constraint.value, head(op).value, value.value) %}
    | %word %kw_contains literal {% ([constraint, op, value]) => _constraint(constraint.value, op.value, value.value) %}
    | %word %kw_from literal %kw_to literal {% ([constraint, _b, l1, _a, l2]) => 
        _and([
        _constraint(constraint.value, "GE", l1.value),
        _constraint(constraint.value, "LE", l2.value),
      ]) %}
