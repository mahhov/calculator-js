const TYPE_ENUM = {
	VAR: 'variable',
	NUM: 'number',
	PAR: 'paren',
	OPR: 'operator',
	DLM: 'delimiter'
};

// todo
// variables, variables that can be defined with other variables
// $ and _ and $1... to use previous answers
// \ for root; 3\8 = 2
// & for invert; 4+2& = 4.5
// ` for keyword (e.g. PI, log)
// # for base 10; 4#3 = 4000
// @ =
// ||
// , ;
// sqrt, e, log

const PARENS = {
	'(': ')',
	'[': ']',
	'{': '}',
	'<': '>',
	'|': '|',
};

const OPERATORS = {
	'=': {
		priority: 0,
		type: 'binary',
		defaultOperand: 0,
		compute: (l, r, lookup) => {
			let value = Calc.compute(r, lookup);
			if (l.type === TYPE_ENUM.VAR)
				lookup[l.value] = value;
			return value;
		},
	},
	'+': {
		priority: 1,
		type: 'binary',
		defaultOperand: 0,
		compute: (l, r, lookup) => Calc.compute(l, lookup) + Calc.compute(r, lookup),
	},
	'-': {
		priority: 1,
		type: 'binary',
		defaultOperand: 0,
		compute: (l, r, lookup) => Calc.compute(l, lookup) - Calc.compute(r, lookup),
	},
	'*': {
		priority: 2,
		type: 'binary',
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) * Calc.compute(r, lookup),
	},
	'/': {
		priority: 2,
		type: 'binary',
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) / Calc.compute(r, lookup),
	},
	'%': {
		priority: 2,
		type: 'binary',
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) % Calc.compute(r, lookup),
	},
	'^': {
		priority: 3,
		type: 'binary',
		defaultOperand: 2,
		compute: (l, r, lookup) => Calc.compute(l, lookup) ** Calc.compute(r, lookup),
	},
};

const DELIMS = {
	'@': {
		compute: (l, r, lookup) => {
			Calc.compute(r, lookup);
			return Calc.compute(l, lookup);
		},
	},
	';': {
		compute: (l, r, lookup) => {
			Calc.compute(l, lookup);
			return Calc.compute(r, lookup);
		},
	},
};

const defaultOp = (left, right) => left ? {operator: '*', left, right} : right;
const numTok = value => ({type: TYPE_ENUM.NUM, value}); // todo consider creating shorthand for other token types as well

class Calc {
	static do(stringExpression, debug) {
		debug && console.log('debug on');
		let tokens = Calc.lex(stringExpression);
		debug && console.log('TOKENS:', tokens);
		let {tree} = Calc.parse(tokens);
		debug && Calc.printParseTree(tree);
		let computed = Calc.compute(tree);
		debug && console.log('=', computed);
		return computed;
	}

	static parseNumber(string) {
		let decimalCount = 0;
		string = string
			.replace(/,/g, '')
			.replace(/\./g, () => decimalCount++ ? '' : '.');
		return parseFloat(string);
	}

	// return [{type, value}, ...]
	static lex(stringExpression) {
		return (stringExpression
			.match(/[a-zA-Z]\w*|[\d.,]+|[+\-*\/^%@=;()\[\]{}<>]/g) || [])
			.map(value => {
				if (value[0].match(/[a-zA-Z]/))
					return {type: TYPE_ENUM.VAR, value};
				if (value[0].match(/[\d.,]/))
					return numTok(Calc.parseNumber(value));
				if (value[0] in PARENS || Object.values(PARENS).includes(value[0]))
					return {type: TYPE_ENUM.PAR, value};
				if (value[0] in OPERATORS)
					return {type: TYPE_ENUM.OPR, value};
				if (value[0] in DELIMS)
					return {type: TYPE_ENUM.DLM, value};
			}).filter(a => a);
	}

	// return {operator, left, right}
	static parse(tokens, index = 0, operatorPriority = -1, closingParen) {
		let tree;
		while (index < tokens.length) {
			let token = tokens[index];

			if (token.type === TYPE_ENUM.VAR || token.type === TYPE_ENUM.NUM) {
				tree = defaultOp(tree, token);

			} else if (token.type === TYPE_ENUM.PAR) {
				if (token.value in PARENS) {
					let {tree: right, lastIndex} = Calc.parse(tokens, index + 1, undefined, PARENS[token.value]);
					index = lastIndex;
					tree = defaultOp(tree, right);
				} else if (token.value === closingParen || operatorPriority !== -1)
					return {tree: tree || numTok(0), lastIndex: index};

			} else if (token.type === TYPE_ENUM.OPR) {
				let operator = OPERATORS[token.value];
				if (operator.priority <= operatorPriority)
					return {tree, lastIndex: index - 1};
				let {tree: right = numTok(operator.defaultOperand), lastIndex} = Calc.parse(tokens, index + 1, operator.priority);
				index = lastIndex;
				tree = {operator: token.value, left: tree || numTok(operator.defaultOperand), right};

			} else if (token.type === TYPE_ENUM.DLM) {
				if (operatorPriority !== -1)
					return {tree, lastIndex: index - 1};
				let {tree: right, lastIndex} = Calc.parse(tokens, index + 1);
				index = lastIndex;
				tree = {delimiter: token.value, left: tree, right};
			}

			index++;
		}
		return {tree};
	}

	static printParseTree(tree, indent = 0) {
		if (tree === undefined)
			return;
		console.log('  '.repeat(indent), tree.operator || tree.delimiter || tree.value);
		Calc.printParseTree(tree.left, indent + 1);
		Calc.printParseTree(tree.right, indent + 1);
	}

	// return number
	static compute(tree, lookup = {}) {
		if (tree.type === TYPE_ENUM.VAR)
			return lookup[tree.value] || 0;
		if (tree.type === TYPE_ENUM.NUM)
			return tree.value;
		if (tree.operator)
			return OPERATORS[tree.operator].compute(tree.left, tree.right, lookup);
		if (tree.delimiter)
			return DELIMS[tree.delimiter].compute(tree.left, tree.right, lookup);
	}
}

module.exports = Calc;
