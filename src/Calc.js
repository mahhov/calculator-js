const TYPE_ENUM = {
	VAR: 'variable',
	NUM: 'number',
	PAR: 'paren',
	OPR: 'operator',
};

// todo
// variables, variables that can be defined with other variables
// ignore commas in numbers
// $ and _ and $1... to use previous answers
// \ for root; 3\8 = 2
// & for invert; 4+2& = 4.5
// ` for keyword (e.g. PI, log)
// # for base 10; 4#3 = 4000
// @ =
// () [] {} <> ||
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
	'+': {
		priority: 0,
		type: 'binary',
		defaultOperand: 0,
		compute: (l, r) => l + r,
	},
	'-': {
		priority: 0,
		type: 'binary',
		defaultOperand: 0,
		compute: (l, r) => l - r,
	},
	'*': {
		priority: 1,
		type: 'binary',
		defaultOperand: 1,
		compute: (l, r) => l * r,
	},
	'/': {
		priority: 1,
		type: 'binary',
		defaultOperand: 1,
		compute: (l, r) => l / r,
	},
	'%': {
		priority: 1,
		type: 'binary',
		defaultOperand: 1,
		compute: (l, r) => l % r,
	},
	'^': {
		priority: 2,
		type: 'binary',
		defaultOperand: 2,
		compute: (l, r) => l ** r,
	},
};

class Calc {
	static do(stringExpression, debug) {
		debug && console.log('debug on');
		let tokens = Calc.lex(stringExpression);
		debug && console.log(tokens);
		let parseTree = Calc.parse(tokens).tree;
		debug && Calc.printParseTree(parseTree);
		let computed = Calc.compute(parseTree);
		debug && console.log('=', computed)
		return computed;
	}

	// return [{type, value}, ...]
	static lex(stringExpression) {
		return (stringExpression
			.match(/[a-zA-Z]+|[\d.]+|[+\-*\/^%@=,;()\[\]{}<>|]/g) || [])
			.map(value => {
				if (value[0].match(/[a-zA-Z]/))
					return {type: TYPE_ENUM.VAR, value};
				if (value[0].match(/[\d.]/))
					return {type: TYPE_ENUM.NUM, value: parseFloat(value)};
				if (value[0] in PARENS || Object.values(PARENS).includes(value[0]))
					return {type: TYPE_ENUM.PAR, value}
				if (value[0] in OPERATORS)
					return {type: TYPE_ENUM.OPR, value};
			}).filter(a => a);
	}

	// return {operator, left, right}
	static parse(tokens, index = 0, operatorPriority = -1, closingParen) {
		let tree;
		while (index < tokens.length) {
			let token = tokens[index];

			if (token.type === TYPE_ENUM.NUM) {
				tree = tree ? {operator: '*', left: tree, right: token.value} : token.value;

			} else if (token.type === TYPE_ENUM.PAR) {
				if (token.value in PARENS) {
					let closingParen = PARENS[token.value];
					let {tree: right, nextIndex} = Calc.parse(tokens, index + 1, undefined, closingParen);
					index = nextIndex - 1;
					tree = tree ? {operator: '*', left: tree, right} : right
				} else if (token.value === closingParen) {
					return {tree: tree || 0, nextIndex: index + 1};
				}

			} else if (token.type === TYPE_ENUM.OPR) {
				let operator = OPERATORS[token.value];
				if (operator.priority <= operatorPriority) {
					tree = tree || {operator: token.value, left: operator.defaultOperand, right: operator.defaultOperand};
					return {tree, nextIndex: index};
				}
				let {tree: right = operator.defaultOperand, nextIndex} = Calc.parse(tokens, index + 1, operator.priority);
				index = nextIndex - 1;
				tree = {operator: token.value, left: tree || operator.defaultOperand, right};
			}

			index++;
		}
		return {tree, nextIndex: index};
	}

	static printParseTree(tree, indent = 0) {
		if (tree === undefined)
			return;
		console.log(' '.repeat(indent), tree.operator || tree);
		Calc.printParseTree(tree.left, indent + 1);
		Calc.printParseTree(tree.right, indent + 1);
	}

	// return int
	static compute(tree) {
		return tree.operator ? OPERATORS[tree.operator].compute(Calc.compute(tree.left), Calc.compute(tree.right)) : tree;
	}
}

module.exports = Calc;
