const Calc = require('./Calc');

let assert = (a, b) => {
	if (a !== b) {
		console.error(`expected ${a} to equal ${b}`);
		console.trace();
	}
};

assert(Calc.do('3 + 4'), 7);
assert(Calc.do('-4'), -4);
assert(Calc.do('3 4'), 12);
assert(Calc.do('3 + 4 * 3'), 15);
assert(Calc.do('4 / 2 * 3'), 6);
assert(Calc.do('/5'), 1 / 5);

assert(Calc.do('3(4+1)'), 15);
assert(Calc.do('3 + ()'), 3);
assert(Calc.do('(4)(2 + 3)'), 20);
assert(Calc.do('(4 2 + 3)'), 11);
assert(Calc.do('(4 2) + 3)'), 11);
assert(Calc.do('(4 (2 + 3)'), 20);

// 1 * 2 + 3 * 1
// 1    1
// *    * [1, getTree()]
// 2    * [1, getTree(2)]
// +    * [1, 2]
// +    + [* [1, 2], getTree()]
// 3    + [* [1, 2], getTree(3)]
// *    + [* [1, 2], getTree(* [3, getTree()])]
// 1    + [* [1, 2], getTree(* [3, getTree(1)])]
//      + [* [1, 2], * [3, 1]]

// 1 * (2 + 3 * 1)
// 1    1
// *    * [1, getTree()]
// (    * [1, getTree]



