/**
 * Eval Math
 * JavaScript Port of php EvalMath by Miles Kaufman.
 * Supports basic math only.
 *
 * Based ON WC_Eval_Math, which is based on EvalMath by Miles Kaufman Copyright (C) 2005 Miles Kaufmann http://www.twmagic.com/.
 *
 * @link https://github.com/dbojdo/eval-math
 * @link https://github.com/woocommerce/woocommerce/blob/trunk/includes/libraries/class-wc-eval-math.php
 */

(function(window) {

	/**
	 * Checks if a value exists in an array
	 *
	 * @param needle
	 * @param haystack
	 * @param strict
	 * @return {boolean}
	 */
	const inArray = (needle, haystack, strict = false ) => {
		const length = haystack.length;
		for( let i = 0; i < length; i++) {
			if ( strict && haystack[i] === needle ) {
				return true;
			} else {
				// noinspection EqualityComparisonWithCoercionJS
				if(haystack[i] == needle) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Checks if the given key or index exists in the array
	 *
	 * @param {number|string} key
	 * @param {Object|Array} arr_obj
	 * @return {boolean}
	 */
	const arrayKeyExists = ( key, arr_obj ) => arr_obj.hasOwnProperty( key );

	/**
	 * Gets a substring beginning at the specified location and having the
	 * specified length.
	 *
	 * @param {string} string
	 * @param {number} start
	 * @param {number} end
	 * @return {string}
	 */
	const substr = ( string, start, end ) => ( '' + string ).substr( start, end );

	/**
	 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#:~:text=The%20following%20table%20shows%20the%20state%20of%20result%20after%20running%20this%20script%3A
	 */
	const regexMatch = ( regex, string ) => regex.exec( string ) || false;

	/**
	 * Checks if input/variable is null object.
	 *
	 * @param {*} input
	 * @return {boolean}
	 */
	const isNull = input => null === input

	/**
	 * Checks if input/variable is a valid number.
	 *
	 * @param {*} input
	 * @return {boolean}
	 */
	const isNumeric = input => ! isNaN( input );

	/**
	 * Find the position of the first occurrence of a substring in a string
	 *
	 * @param {string} haystack
	 * @param {string} needle
	 * @return {boolean|number}
	 */
	const strpos = ( haystack, needle ) => {
		const pos = (''+haystack).indexOf(needle);
		return -1 === pos ? false : pos;
	}

	/**
	 * Parse string into number.
	 *
	 * @param {*|number} input
	 * @return {null|number}
	 */
	const parseNumber = input => isNull( input ) ? null : ( ! isNumeric( input ) ? null : ( strpos( input, '.' ) ? parseFloat( input ) : parseInt( input ) ) )


	/**
	 * Class WC_Eval_Math.# Supports basic math only (removed eval function).
	 *
	 * Based on EvalMath by Miles Kaufman Copyright (C) 2005 Miles Kaufmann
	 * http://www.twmagic.com/.
	 */
	class EvalMath {

		/**
		 * Last error.
		 *
		 * @const string
		 */
		static #last_error = null;

		/**
		 * constiables (and constants).
		 *
		 * @const array
		 */
		static #v = {e: 2.71, pi: 3.14};

		/**
		 * User-defined functions.
		 *
		 * @const array
		 */
		static #f = [];

		/**
		 * Constants.
		 *
		 * @const array
		 */
		static #vb = ['e', 'pi'];

		/**
		 * Built-in functions.
		 *
		 * @const array
		 */
		static #fb = [];

		/**
		 * Evaluate maths string.
		 *
		 * @param {string} expression
		 * @return {Number|Boolean}
		 */
		static evaluate( expression ) {
			let fnn;
			EvalMath.#last_error = null;
			expression = ('' + expression).trim();
			if ( substr( expression, -1, 1 ) == ';' ) {
				expression = substr( expression, 0, expression.length -1 ); // strip semicolons at the end
			}

			// ===============
			// is it a constiable assignment?
			const matches = regexMatch( /^\s*([a-z]\w*)\s*=\s*(.+)$/g, expression );
			const m2 = regexMatch( /^\s*([a-z]\w*)\s*\(\s*([a-z]\w*(?:\s*,\s*[a-z]\w*)*)\s*\)\s*=\s*(.+)$/g, expression )
			if ( matches ) {
				if ( inArray( matches[1], EvalMath.#vb ) ) { // make sure we're not assigning to a constant
					return EvalMath.#trigger( "cannot assign to constant '" + matches[1] + "'" );
				}

				const $tmp = EvalMath.#pfx( EvalMath.#nfx( matches[2] ) );

				if ( $tmp === false ) {
					return false; // get the result and make sure it's good
				}

				EvalMath.#v[ matches[1] ] = $tmp; // if so, stick it in the constiable array

				return EvalMath.#v[ matches[1] ]; // and return the resulting value
				// ===============
				// is it a function assignment?
			} else if ( m2 ) {
				fnn = m2[1]; // get the function name
				if ( inArray( m2[1], EvalMath.#fb ) ) { // make sure it isn't built in
					return EvalMath.#trigger( "cannot redefine built-in function '" + m2[1] + "()'");
				}

				const $args = m2[2].replace( /s+/g, '' ).split( "," ); // get the arguments
				const $stack = EvalMath.#nfx( m2[3] );

				if ( $stack === false ) {
					return false; // see if it can be converted to postfix
				}

				const $stack_size = $stack.length;

				for ( let $i = 0; $i < $stack_size; $i++ ) { // freeze the state of the non-argument constiables
					const $token = $stack[ $i ];
					if ( regexMatch( /^[a-z]\w*$/, $token ) && ! inArray( $token, $args ) ) {
						if ( arrayKeyExists( $token, EvalMath.#v ) ) {
							$stack[ $i ] = EvalMath.#v[ $token ];
						} else {
							return EvalMath.#trigger( "undefined constiable '" + $token + "' in function definition" );
						}
					}
				}

				EvalMath.#f[ fnn ] = { 'args': $args, 'func': $stack };

				return true;
				// ===============
			} else {
				return EvalMath.#pfx( EvalMath.#nfx( expression ) ); // straight up evaluation, woo
			}
		}

		/**
		 * Convert infix to postfix notation.
		 *
		 * @param  {string} expression
		 *
		 * @return {Array|string|Boolean}
		 */
		static #nfx( expression ) {

			let $index = 0;
			let matches;
			let $o2;
			let $op;
			let fnn;
			const $stack = new EvalMathStack;
			const $output = []; // postfix form of expression, to be passed to pfx()
			expression = ('' + expression).trim();

			const $ops   = ['+', '-', '*', '/', '^', '_'];
			const $ops_r = { '+': 0, '-': 0, '*': 0, '/': 0, '^': 1 }; // right-associative operator?
			const $ops_p = { '+': 0, '-': 0, '*': 1, '/': 1, '_': 1, '^': 2 }; // operator precedence

			let $expecting_op = false; // we use this in syntax-checking the expression
			// and determining when a - is a negation

			matches = regexMatch( /[^\w\s+*^\/()\.,-]/g, expression );

			if ( matches ) { // make sure the characters are all good
				return EvalMath.#trigger( "illegal character '" + matches[0] + "'" );
			}

			while ( 1 ) { // 1 Infinite Loop ;)
				$op = substr( expression, $index, 1 ); // get the first character at the current index
				// find out if we're currently at the beginning of a number/constiable/function/parenthesis/operand
				const m1 = regexMatch( /^([A-Za-z]\w*\(?|\d+(?:\.\d*)?|\.\d+|\()/g, substr( expression, $index ) );
				const $ex = ! ! m1;
				// ===============
				if ( '-' === $op && ! $expecting_op ) { // is it a negation instead of a minus?
					$stack.push( '_' ); // put a negation on the stack
					$index++;
				} else if ( '_' === $op ) { // we have to explicitly deny this, because it's legal on the stack
					return EvalMath.#trigger( "illegal character '_'" ); // but not in the input expression
					// ===============
				} else if ( ( inArray( $op, $ops ) || $ex ) && $expecting_op ) { // are we putting an operator on the stack?
					if ( $ex ) { // are we expecting an operator but have a number/constiable/function/opening parenthesis?
						$op = '*';
						$index--; // it's an implicit multiplication
					}
					// heart of the algorithm:
					while ( $stack.count > 0 && ( $o2 = $stack.last() ) && inArray( $o2, $ops ) && ( $ops_r[ $op ] ? $ops_p[ $op ] < $ops_p[ $o2 ] : $ops_p[ $op ] <= $ops_p[ $o2 ] ) ) {
						$output.push( $stack.pop() ); // pop stuff off the stack into the output
					}
					// many thanks: https://en.wikipedia.org/wiki/Reverse_Polish_notation#The_algorithm_in_detail
					$stack.push( $op ); // finally put OUR operator onto the stack
					$index++;
					$expecting_op = false;
					// ===============
				} else if ( ')' === $op && $expecting_op ) { // ready to close a parenthesis?
					while ( ( $o2 = $stack.pop() ) != '(' ) { // pop off the stack back to the last (
						if ( isNull( $o2 ) ) {
							return EvalMath.#trigger( "unexpected ')'" );
						} else {
							$output.push( $o2 );
						}
					}
					matches = regexMatch( /^([A-Za-z]\w*)\($/g, $stack.last( 2 )  );
					if ( matches ) { // did we just close a function?
						fnn = matches[1]; // get the function name
						const $arg_count = $stack.pop(); // see how many arguments there were (cleverly stored on the stack, thank you)
						$output.push( $stack.pop() ); // pop the function and push onto the output
						if ( inArray( fnn, EvalMath.#fb ) ) { // check the argument count
							if ( $arg_count > 1 ) {
								return EvalMath.#trigger( "too many arguments (" + $arg_count + " given, 1 expected)" );
							}
						} else if ( arrayKeyExists( fnn, EvalMath.#f ) ) {
							if ( EvalMath.#f[ fnn ]['args'].length !== $arg_count ) {
								return EvalMath.#trigger( "wrong number of arguments ($arg_count given, " + EvalMath.#f[ fnn ]['args'].length + " expected)" );
							}
						} else { // did we somehow push a non-function on the stack? this should never happen
							return EvalMath.#trigger( "internal error" );
						}
					}
					$index++;
					// ===============
				} else if ( ',' === $op && $expecting_op ) { // did we just finish a function argument?
					while ( ( $o2 = $stack.pop() ) !== '(' ) {
						if ( isNull( $o2 ) ) {
							return EvalMath.#trigger( "unexpected ','" ); // oops, never had a (
						} else {
							$output.push( $o2 ); // pop the argument expression stuff and push onto the output
						}
					}
					// make sure there was a function
					matches = regexMatch( /^([A-Za-z]\w*)\($/g, $stack.last( 2 ) )
					if ( ! matches ) {
						return EvalMath.#trigger( "unexpected ','" );
					}
					$stack.push( $stack.pop() + 1 ); // increment the argument count
					$stack.push( '(' ); // put the ( back on, we'll need to pop back to it again
					$index++;
					$expecting_op = false;
					// ===============
				} else if ( '(' === $op && ! $expecting_op ) {
					$stack.push( '(' ); // that was easy
					$index++;
					// ===============
				} else if ( $ex && ! $expecting_op ) { // do we now have a function/constiable/number?
					$expecting_op = true;
					let val = m1[1];
					matches = regexMatch( /^([A-Za-z]\w*)\($/g, val )
					if ( matches ) { // may be func, or constiable w/ implicit multiplication against parentheses...
						if ( inArray( matches[1], EvalMath.#fb ) || arrayKeyExists( matches[1], EvalMath.#f ) ) { // it's a func
							$stack.push( val );
							$stack.push( 1 );
							$stack.push( '(' );
							$expecting_op = false;
						} else { // it's a const w/ implicit multiplication
							val = matches[1];
							$output.push( val );
						}
					} else { // it's a plain old const or num
						$output.push( val );
					}
					$index += val.length;
					// ===============
				} else if ( ')' === $op ) { // miscellaneous error checking
					return EvalMath.#trigger( "unexpected ')'" );
				} else if ( inArray( $op, $ops ) && ! $expecting_op ) {
					return EvalMath.#trigger( "unexpected operator '"+$op+"'" );
				} else { // I don't even want to know what you did to get here
					return EvalMath.#trigger( "an unexpected error occurred" );
				}
				if ( expression.length === $index ) {
					if ( inArray( $op, $ops ) ) { // did we end with an operator? bad.
						return EvalMath.#trigger( "operator '"+$op+"' lacks operand" );
					} else {
						break;
					}
				}
				while ( substr( expression, $index, 1 ) == ' ' ) { // step the index past whitespace (pretty much turns whitespace
					$index++;                             // into implicit multiplication if no operator is there)
				}
			}
			while ( ! isNull( $op = $stack.pop() ) ) { // pop everything off the stack and push onto output
				if ( '(' === $op ) {
					return EvalMath.#trigger( "expecting ')'" ); // if there are (s on the stack, ()s were unbalanced
				}
				$output.push( $op );
			}
			return $output;
		}

		/**
		 * Evaluate postfix notation.
		 *
		 * @param  {*} $tokens
		 * @param  {Array} consts
		 *
		 * @return {*}
		 */
		static #pfx( $tokens, consts = [] ) {
			if ( false === $tokens ) {
				return false;
			}

			const $stack = new EvalMathStack;

			for ( let $token of $tokens ) { // nice and easy
				// if the token is a binary operator, pop two values off the stack, do the operation, and push the result back on
				if ( inArray( $token, [ '+', '-', '*', '/', '^' ] ) ) {
					let $op2 = $stack.pop()
					if ( isNull( $op2 ) ) {
						return EvalMath.#trigger( "internal error" );
					}
					let $op1 = $stack.pop();
					if ( isNull( $op1 ) ) {
						return EvalMath.#trigger( "internal error" );
					}

					// Parse into correct type, else js will just concatenate while addition.
					$op2 = parseNumber( $op2 );
					$op1 = parseNumber( $op1 );

					switch ( $token ) {
						case '+':
							$stack.push( $op1 + $op2 );
							break;
						case '-':
							$stack.push( $op1 - $op2 );
							break;
						case '*':
							$stack.push( $op1 * $op2 );
							break;
						case '/':
							if ( 0 === $op2 ) {
								return EvalMath.#trigger( 'division by zero' );
							}
							$stack.push( $op1 / $op2 );
							break;
						case '^':
							$stack.push( pow( $op1, $op2 ) );
							break;
					}
					// if the token is a unary operator, pop one value off the stack, do the operation, and push it back on
				} else if ( '_' === $token ) {
					$stack.push( -1 * $stack.pop() );
					// if the token is a function, pop arguments off the stack, hand them to the function, and push the result back on
				} else {
					let matches = regexMatch( /^([a-z]\w*)\($/g, $token );
					if ( ! matches ) {
						if ( isNumeric( $token ) ) {
							$stack.push( $token );
						} else if ( arrayKeyExists( $token, EvalMath.#v ) ) {
							$stack.push( EvalMath.#v[ $token ] );
						} else if ( arrayKeyExists( $token, consts ) ) {
							$stack.push( consts[ $token ] );
						} else {
							return EvalMath.#trigger( "undefined constiable '"+$token+"'" );
						}
					}
				}
			}
			// when we're out of tokens, the stack should have a single element, the final result
			if ( 1 !== $stack.count ) {
				return EvalMath.#trigger( "internal error" );
			}
			return $stack.pop();
		}

		/**
		 * Trigger an error, but nicely, if need be.
		 *
		 * @param  {string} $msg
		 *
		 * @return {Boolean}
		 */
		static #trigger( $msg ) {
			EvalMath.#last_error = $msg;
			console.warn( $msg );
			return false;
		}
	}


	/**
	 * Class WC_Eval_Math_Stack.
	 */
	class EvalMathStack {

		/**
		 * Stack array.
		 *
		 * @type {Array}
		 */
		stack = [];

		/**
		 * Stack counter.
		 *
		 * @type {Integer}
		 */
		count = 0;

		/**
		 * Push value into stack.
		 *
		 * @param  {*} val
		 */
		push( val ) {
			this.stack[ this.count ] = val;
			this.count++;
		}

		/**
		 * Pop value from stack.
		 *
		 * @return {*}
		 */
		pop() {
			if ( this.count > 0 ) {
				this.count--;
				return this.stack[ this.count ];
			}
			return null;
		}

		/**
		 * Get last value from stack.
		 *
		 * @param  {Integer} [$n]
		 *
		 * @return {*}
		 */
		last( $n = 1 ) {
			const key = this.count - $n;
			return arrayKeyExists( key, this.stack ) ? this.stack[ key ] : null;
		}
	}

	// Expose to global scope.
	window.EvalMath = EvalMath;

} )(window);
