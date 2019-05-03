const TYPE_ENUM = {
	VAR: 'variable',
	NUM: 'number',
	PAR: 'paren',
	OPR: 'operator',
	DLM: 'delimiter'
};

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

const OPERATORS = {
	'=': {
		binary: true,
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
		binary: true,
		priority: 1,
		defaultOperand: 0,
		compute: (l, r, lookup) => Calc.compute(l, lookup) + Calc.compute(r, lookup),
	},
	'-': {
		prefix: true,
		binary: true,
		priority: 1,
		defaultOperand: 0,
		compute: (l, r, lookup) => (l ? Calc.compute(l, lookup) : 0) - Calc.compute(r, lookup),
	},
	'*': {
		binary: true,
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) * Calc.compute(r, lookup),
	},
	'/': {
		binary: true,
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) / Calc.compute(r, lookup),
	},
	'\\': {
		binary: true,
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(r, lookup) / Calc.compute(l, lookup),
	},
	'%': {
		binary: true,
		priority: 2,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) % Calc.compute(r, lookup),
	},
	'^': {
		binary: true,
		priority: 3,
		defaultOperand: 2,
		compute: (l, r, lookup) => Calc.compute(l, lookup) ** Calc.compute(r, lookup),
	},
	'#': {
		binary: true,
		priority: 3,
		defaultOperand: 1,
		compute: (l, r, lookup) => Calc.compute(l, lookup) * 10 ** Calc.compute(r, lookup),
	},
	'`': {
		prefix: true,
		defaultOperand: 0,
		compute: (l, r, lookup) => {
			if (r.type !== TYPE_ENUM.VAR)
				return Calc.compute(r, lookup);
			return {
				'pi': Math.PI,
				'e': Math.E
			}[r.value.toLowerCase()] || 0;
		},
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

const defaultOp = right =>
	right.preOperator === '-' ? '+' : '*';

const defaultOpTree = (left, right) => {
	if (!left)
		return right;
	let operator = defaultOp(right);
	return {operator, left, right};
};

const numTok = value => ({type: TYPE_ENUM.NUM, value});

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
			.match(/\$\d*|[a-zA-Z][\w'"]*|[\d.,]+|./g) || [])
			.map(value => {
				if (value[0].match(/[_$a-zA-Z]/))
					return {type: TYPE_ENUM.VAR, value};
				if (value[0].match(/[\d.,]/))
					return numTok(Calc.parseNumber(value));
				if (value[0] in PARENS || PAREN_CLOSINGS.includes(value[0]))
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
		for (; index < tokens.length; index++) {
			let token = tokens[index];
			let varOrNumToken = token.type === TYPE_ENUM.VAR || token.type === TYPE_ENUM.NUM;

			if (varOrNumToken && !tree)
				tree = token;

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
					tree = defaultOpTree(tree, {paren: token.value, value});
				}

			} else if (token.type === TYPE_ENUM.OPR || varOrNumToken) {
				let operator = varOrNumToken ? defaultOp(token) : token.value;
				let nextIndex = varOrNumToken ? index : index + 1;

				let operatorObj = OPERATORS[operator];
				if (operatorObj.prefix && (!operatorObj.binary || !tree)) {
					let {tree: right = numTok(operatorObj.defaultOperand), lastIndex} = Calc.parse(tokens, nextIndex, Infinity, closingParen);
					index = lastIndex;
					tree = defaultOpTree(tree, {operator, right});

				} else if (operatorObj.priority <= operatorPriority)
					return {tree, lastIndex: index - 1};

				else {
					let {tree: right = numTok(operatorObj.defaultOperand), lastIndex}
						= Calc.parse(tokens, nextIndex, operatorObj.priority, closingParen);
					index = lastIndex;
					tree = {operator, left: tree || numTok(operatorObj.defaultOperand), right};
				}

			} else if (token.type === TYPE_ENUM.DLM) {
				if (operatorPriority !== -1 || closingParen)
					return {tree, lastIndex: index - 1};
				let {tree: right = numTok(0), lastIndex} = Calc.parse(tokens, index + 1);
				index = lastIndex;
				tree = {delimiter: token.value, left: tree || numTok(0), right};
			}
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
		if (tree.operator)
			return OPERATORS[tree.operator].compute(tree.left, tree.right, lookup);
		if (tree.delimiter)
			return DELIMS[tree.delimiter].compute(tree.left, tree.right, lookup);
	}
}

module.exports = Calc;
