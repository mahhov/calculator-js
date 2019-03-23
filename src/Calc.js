const TYPE_ENUM = {
	VAR: 'variable',
	NUM: 'number',
	PAR: 'paren',
	OPR: 'operator',
};

// todo
// variables, variables that can be defined with other variables
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

const df = value => value !== undefined;
const or = (value, orValue) => df(value) ? value : orValue;
const defaultOp = (left, right) => df(left) ? {operator: '*', left, right} : right;

let debugG; // todo remove or find an alternative to this global var

class Calc {
	static do(stringExpression, debug) {
		debugG = debug;
		debug && console.log('debug on');
		let tokens = Calc.lex(stringExpression);
		debug && console.log(tokens);
		let parseTree = Calc.parse(tokens).tree;
		debug && Calc.printParseTree(parseTree);
		let computed = Calc.compute(parseTree);
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
			.match(/[a-zA-Z]+|[\d.,]+|[+\-*\/^%@=,;()\[\]{}<>|]/g) || [])
			.map(value => {
				if (value[0].match(/[a-zA-Z]/))
					return {type: TYPE_ENUM.VAR, value};
				if (value[0].match(/[\d.]/))
					return {type: TYPE_ENUM.NUM, value: Calc.parseNumber(value)};
				if (value[0] in PARENS || Object.values(PARENS).includes(value[0]))
					return {type: TYPE_ENUM.PAR, value};
				if (value[0] in OPERATORS)
					return {type: TYPE_ENUM.OPR, value};
			}).filter(a => a);
	}

	// return {operator, left, right}
	static parse(tokens, index = 0, operatorPriority = -1, closingParen) {
		let tree;
		while (index < tokens.length) {
			if (debugG)
				console.log(index, tree);

			let token = tokens[index];

			if (token.type === TYPE_ENUM.NUM) {
				tree = defaultOp(tree, token.value);

			} else if (token.type === TYPE_ENUM.PAR) {
				if (token.value in PARENS) {
					let closingParen = PARENS[token.value];
					let {tree: right, lastIndex} = Calc.parse(tokens, index + 1, undefined, closingParen);
					index = lastIndex;
					tree = defaultOp(tree, right);
				} else if (token.value === closingParen || operatorPriority !== -1)
					return {tree: tree || 0, lastIndex: index};

			} else if (token.type === TYPE_ENUM.OPR) {
				let operator = OPERATORS[token.value];
				if (operator.priority <= operatorPriority)
					return {tree, lastIndex: index - 1};
				let {tree: right = operator.defaultOperand, lastIndex} = Calc.parse(tokens, index + 1, operator.priority);
				index = lastIndex;
				tree = {operator: token.value, left: or(tree, operator.defaultOperand), right};
			}

			index++;
		}
		return {tree};
	}

	static printParseTree(tree, indent = 0) {
		if (tree === undefined)
			return;
		console.log(' '.repeat(indent), tree.operator || tree);
		Calc.printParseTree(tree.left, indent + 1);
		Calc.printParseTree(tree.right, indent + 1);
	}

	// return number
	static compute(tree) {
		return tree.operator ? OPERATORS[tree.operator].compute(Calc.compute(tree.left), Calc.compute(tree.right)) : tree;
	}
}

module.exports = Calc;
