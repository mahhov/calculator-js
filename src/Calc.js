const TYPE_ENUM = {
	VAR: 'variable',
	NUM: 'number',
	PAR: 'paren',
	POP: 'pre_operator',
	OPR: 'operator',
	DLM: 'delimiter'
};

// todo
// 3 * -1 should be -3 and not 2
// ' and " in var names

const PARENS = {
	'(': {
		closing: ')',
		compute: (v, lookup) => Calc.compute(v, lookup),
	},
	'[': {
		closing: ']',
		compute: (v, lookup) => Calc.compute(v, lookup),
	},
	'{': {
		closing: '}',
		compute: (v, lookup) => Calc.compute(v, lookup),
	},
	'<': {
		closing: '>',
		compute: (v, lookup) => Calc.compute(v, lookup),
	},
	'|': {
		closing: '|',
		compute: (v, lookup) => Math.abs(Calc.compute(v, lookup)),
	},
};

const PAREN_CLOSINGS = Object.values(PARENS).map(paren => paren.closing);

const PRE_OPERATORS = {
	'`': {
		defaultOperand: 0,
		compute: (v, lookup) => {
			if (v.type !== TYPE_ENUM.VAR)
				return Calc.compute(v, lookup);
			return {
				'pi': Math.PI,
				'e': Math.E
			}[v.value.toLowerCase()] || 0;
		},
	},
};

const OPERATORS = {
	'=': {
		priority: 0,
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
		defaultOperand: 0,
		compute: (l, r, lookup) => Calc.compute(l, lookup) + Calc.compute(r, lookup),
	},
	'-': {
		priority: 1,
		defaultOperand: 0,
		compute: (l, r, lookup) => Calc.compute(l, lookup) - Calc.compute(r, lookup),
	},
	'*': {
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) * Calc.compute(r, lookup),
	},
	'/': {
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) / Calc.compute(r, lookup),
	},
	'\\': {
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(r, lookup) / Calc.compute(l, lookup),
	},
	'%': {
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) % Calc.compute(r, lookup),
	},
	'^': {
		priority: 3,
		defaultOperand: 2,
		compute: (l, r, lookup) => Calc.compute(l, lookup) ** Calc.compute(r, lookup),
	},
	'#': {
		priority: 3,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) * 10 ** Calc.compute(r, lookup),
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
	static do(stringExpression, prevResults = [], debug) {
		let tokens = Calc.lex(stringExpression);
		let {tree} = Calc.parse(tokens);
		let lookup = Calc.createLookupFromPrevResults(prevResults);
		let computed = Calc.compute(tree, lookup);

		if (debug) {
			console.log('debug on');
			console.log('INPUT:', stringExpression);
			console.log('TOKENS:', tokens);
			let treeDebug = Calc.flatStringTree(tree);
			console.log('TREE:', treeDebug);
			Calc.printParseTree(tree);
			console.log('=', computed);
		}

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
			.match(/_|\$\d*|[a-zA-Z]\w*|[\d.,]+|[+\-*\/^%@=#\\;`|()\[\]{}<>]/g) || []) // todo order
			.map(value => {
				if (value[0].match(/[_$a-zA-Z]/))
					return {type: TYPE_ENUM.VAR, value};
				if (value[0].match(/[\d.,]/))
					return numTok(Calc.parseNumber(value));
				if (value[0] in PARENS || PAREN_CLOSINGS.includes(value[0]))
					return {type: TYPE_ENUM.PAR, value};
				if (value[0] in PRE_OPERATORS)
					return {type: TYPE_ENUM.POP, value};
				if (value[0] in OPERATORS)
					return {type: TYPE_ENUM.OPR, value};
				if (value[0] in DELIMS)
					return {type: TYPE_ENUM.DLM, value};
			}).filter(a => a);
	}

	// return {operator, left, right}
	static parse(tokens, index = 0, operatorPriority = -1, closingParen) {
		let tree;
		while (index < tokens.length) { // todo replace with for loop?
			let token = tokens[index];

			if (token.type === TYPE_ENUM.VAR || token.type === TYPE_ENUM.NUM)
				tree = defaultOp(tree, token);

			else if (token.type === TYPE_ENUM.PAR) {
				let canOpen = token.value in PARENS;
				if (token.value === closingParen || !canOpen && (operatorPriority !== -1 || closingParen))
					return {tree: tree || numTok(0), lastIndex: index - 1};
				else if (token.value in PARENS) {
					let closing = PARENS[token.value].closing;
					let {tree: value = numTok(0), lastIndex} = Calc.parse(tokens, index + 1, undefined, closing);
					index = lastIndex;
					if (lastIndex + 1 < tokens.length && tokens[lastIndex + 1].value === closing)
						index++;
					tree = defaultOp(tree, {paren: token.value, value});
				}

			} else if (token.type === TYPE_ENUM.POP) {
				let operator = PRE_OPERATORS[token.value];
				let {tree: right = numTok(operator.defaultOperand), lastIndex} = Calc.parse(tokens, index + 1, Infinity);
				index = lastIndex;
				tree = defaultOp(tree, {preOperator: token.value, value: right});

			} else if (token.type === TYPE_ENUM.OPR) {
				let operator = OPERATORS[token.value];
				if (operator.priority <= operatorPriority)
					return {tree, lastIndex: index - 1};
				let {tree: right = numTok(operator.defaultOperand), lastIndex} = Calc.parse(tokens, index + 1, operator.priority, closingParen);
				index = lastIndex;
				tree = {operator: token.value, left: tree || numTok(operator.defaultOperand), right};

			} else if (token.type === TYPE_ENUM.DLM) {
				if (operatorPriority !== -1 || closingParen)
					return {tree, lastIndex: index - 1};
				let {tree: right = numTok(0), lastIndex} = Calc.parse(tokens, index + 1);
				index = lastIndex;
				tree = {delimiter: token.value, left: tree || numTok(0), right};
			}

			index++;
		}
		return {tree, lastIndex: tokens.length - 1};
	}

	static flatStringTree(tree) {
		if (tree === undefined)
			return;
		let headText = tree.paren || tree.preOperator || tree.operator || tree.delimiter;

		if (!headText)
			return tree.value;
		else if (tree.left && tree.right)
			return `(${Calc.flatStringTree(tree.left)}) ${headText} (${Calc.flatStringTree(tree.right)})`;
		else if (tree.value)
			return `${headText} (${Calc.flatStringTree(tree.value)})`;
	}

	static printParseTree(tree, indent = 0) {
		if (tree === undefined)
			return;
		let headText = tree.paren || tree.preOperator || tree.operator || tree.delimiter;
		console.log('  '.repeat(indent), headText || tree.value);
		if (headText)
			Calc.printParseTree(tree.value, indent + 1);
		if (tree.left)
			Calc.printParseTree(tree.left, indent + 1);
		if (tree.right)
			Calc.printParseTree(tree.right, indent + 1);
	}

	// return {varName: varValue, ...}
	static createLookupFromPrevResults(prevResults) {
		let lookup = {};
		lookup._ = lookup.$ = prevResults[0];
		prevResults.forEach((result, i) => lookup['$' + (i + 1)] = result);
		return lookup;
	}

	// return number
	static compute(tree, lookup) {
		if (tree.type === TYPE_ENUM.VAR)
			return lookup[tree.value] || 0;
		if (tree.type === TYPE_ENUM.NUM)
			return tree.value;
		if (tree.paren)
			return PARENS[tree.paren].compute(tree.value, lookup);
		if (tree.preOperator)
			return PRE_OPERATORS[tree.preOperator].compute(tree.value, lookup);
		if (tree.operator)
			return OPERATORS[tree.operator].compute(tree.left, tree.right, lookup);
		if (tree.delimiter)
			return DELIMS[tree.delimiter].compute(tree.left, tree.right, lookup);
	}
}

module.exports = Calc;
