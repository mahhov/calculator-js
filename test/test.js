const Calc = require('../src/Calc');

let assert = (a, b) => {
	if (a !== b) {
		console.error(`expected ${a} to equal ${b}`);
		console.trace();
	}
};

// binary operators
assert(Calc.do('0 4'), 0);
assert(Calc.do('3 + 4'), 7);
assert(Calc.do('-4'), -4);
assert(Calc.do('3 4'), 12);
assert(Calc.do('3 + 4 * 3'), 15); // 3 + (4 * 3)
assert(Calc.do('4 / 2 * 3'), 6);
assert(Calc.do('/5'), 1 / 5);
assert(Calc.do('3*0 + 4'), 4);
assert(Calc.do('3 * + 4'), 7); // (3 * (0 + 0)) + 4
assert(Calc.do('3*0 * 4'), 0);
assert(Calc.do('3 * * 4'), 12); // (3 * (1 * 1)) * 4

// balanced parens
assert(Calc.do('3(4+1)'), 15);
assert(Calc.do('0(4)'), 0);
assert(Calc.do('3 + ()'), 3);
assert(Calc.do('()4'), 0);
assert(Calc.do('(4)(2 + 3)'), 20);
assert(Calc.do('(4 2 + 3)'), 11);
assert(Calc.do('(4 2) + 3)'), 11);
assert(Calc.do('(4 (2 + 3)'), 20);

// unbalanced parens
assert(Calc.do('4 + 2 3 + 1'), 11);
assert(Calc.do(')4 + 2) (3 + 1'), 24);
assert(Calc.do('()4 + 2) (3 + 1'), 8);
assert(Calc.do('(2+)3'), 6);
assert(Calc.do('2+3)*4'), 20);
assert(Calc.do(' 3(', 0), 0);

// number parsing
assert(Calc.do('33.22.11.99'), 33.221199);
assert(Calc.do('33..22,,11..99,,88'), 33.22119988);
assert(Calc.do('3,500,10.3,22,.3.51'), 350010.322351);
assert(Calc.do('.3.4'), 0.34);
assert(Calc.do(',3.4'), 3.4);

// variables
assert(Calc.do('x=3 ; x'), 3); // (x = 3) ; x
assert(Calc.do('x=3 ; x; 2x'), 6);
assert(Calc.do('x=3 ; ; 2x'), 6);
assert(Calc.do('x=3 ; 2x;'), 0);
assert(Calc.do('x=3;;x;;'), 0);
assert(Calc.do('x=3; y=2; 4x+y'), 14); // (x = 3) ; ((y = 2) ; (4 * x) + y)
assert(Calc.do('4x+y @ x=3; y=2'), 14);
assert(Calc.do('4x @ x=3; y=2'), 12);
assert(Calc.do('4x4_10 @ x=3; y=2; x4_10=5'), 20);
assert(Calc.do('4xy @ x=3; y=2'), 0);
assert(Calc.do('4x @ x=3'), 12);
assert(Calc.do('4x*y+z+w+v3 @ x=3; y=9 @ z=2 ;w =1 ;v3 = 50'), 161);

// (re)define variables with variables
assert(Calc.do('4x + 5y @ x=3; y=2x'), 42);
assert(Calc.do('y @ x=3; y=2x ;y=y/3'), 2);

// variables and unbalanced parens & operators
assert(Calc.do(' (3; 5'), 5);
assert(Calc.do(' )3; 5'), 5);
assert(Calc.do(' 3; 5)'), 5);
assert(Calc.do(' 3(; 5'), 5);
assert(Calc.do(' 3); 5'), 5);
assert(Calc.do(' 3; )5'), 5);
assert(Calc.do(' 3; (5'), 5);
assert(Calc.do(' 3; 5)'), 5);
assert(Calc.do(' 3; 5('), 0);
