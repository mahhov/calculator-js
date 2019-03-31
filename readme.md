# Calculator JS

Windows and Linux calculator desktop app.

-Gif coming soon-

## Feature Overview

### Fault Tolerant

All valid inputs evaluate equivalently to a standard calculator. All invalid input evaluates to a number; i.e., do not cause an error or evaluate to NaN, ERR, or such.

Missing explicit operators are assumed to be multiplication. E.g., `x=5; 3x`, `(3)(5)`, and `3 5` all evaluate to `15`.

Missing explicit operands are assumed to be sensible default numbers according to the operator. E.g., `3 + + 5` evaluates to `8`, `/ 5` evaluates to `.2`, and `3^ + ^5` evaluates to `9 + 25`, `34`.

Unbalanced closing parentheses are assumed to begin at the start of the expresion or the most recent opening parentheses. Unbalanced opening parentheses are assumed to end at the end of the expression or the nearest closing parentheses. E.g. `3) / (5 * (3 + ] 5` evaluates to `[(3) / (5 * (3 + 0))] * 5`, `1`.

Undefined variables are assumed to be `0`. E.g., `3x + y` evaluates to `0`.

### Variables

`x=3; 5x` evaluates to `15`.

Variable identifiers are case sensitive, must begin with an alphabetic character or an underscore, and may only contain alphabetic characters, underscores, numbers, and quotations.

`x_y'"3yZ'` is a valid character name.

### Results History

Previous inputs and their results are displayed vertically from oldest to newest. They can be selected using the arrow keys, they can replace the current input using the \<enter> key, and their results can be used in future inputs using the `_` and `$n` operators.

## Operators

- `[]`, `()`, `<>`, `{}` are all valid parenthesis. Unbalanced parentheses are supported.

- `||` also acts as a parenthesis, but also takes the absolute value of its inner expression.

- `+`, `-`, `/`, `*` to add, subtract (or negate), divide and multiply. Missing operands and operators are supported.

- `\` is the inverse operator. E.g., `5\3` evaluates to `.6`. 

- `%` is the modulo operator. E.g., `5%3` evaluates to `2`.

- `^` is the exponent operator. E.g., `5^3` evaluates to `125`.

- `#` is the order of magnitude operator. E.g., `5#3` evaluates to `5000`.

- `\`` indicates constants; i.e., `\`pi` and ``\e`. The constant identifier is case insensitive.

- `=` is the assignment operator.

- `;` and `@` delimit multiple expressions. The `;` operator evaluates the expressions in order, while the `@` operator evaluates the expressions in reverse order. E.g., `x=5; 3x` and `3x @ x=5` both evaluate to `15`.

- `_` and `$` access previous results. `_`, `$`, and `$1` all evaluate to the previous result, and more generally, `$n` evaluates to the nth previous result. 

## Keyboard Shortcuts

- Press \<ctrl>+\<shift>+\<c> to activate the app. 

- Press \<enter> to evaluate the input.

- Use the \<up> and \<down> arrows to select previous and next results. Pressing \<enter> with a previous result selected replaces the current input.

- Press \<alt>+\<enter> to toggle 'always-on-top' mode.

- Press \<escape> to clear the current input, and \<shift>+\<escape> to clear the results history.
