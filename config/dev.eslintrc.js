module.exports = {
  'env': {
    'es6': true, // Use ES6 recommended
    'node': true, // We code in node
    'browser': true, // We also code for browser
  },
  'globals': [
  ],

  'extends': 'eslint:recommended', // Use the recommended ESlint rules

  'parserOptions': {
    'sourceType': 'module', // We also code for node modules?
    'ecmaVersion': 2018, //2018, // 8 : Set the ES version we would like to target.
    'ecmaFeatures': {
      'objectLiteralShorthandMethods': true,
      'objectLiteralShorthandProperties': true,
    },
  },

  'plugins': [
    'async-await', // Ensure space before and after async/await keywords
  ],

  'rules': {
    // Indent and line break
    'indent': ['warn', 2, { 'SwitchCase': 1 }], // Indentation checker (2 spaces; allow indent on switch cases)
    'linebreak-style': ['error', 'unix'], // Ensure line breaks are cross-platform compatible
    'brace-style': 'warn', // Ensure {} curly brackets are on the same line as if/else

    // String and template stuff
    'quotes': ['warn', 'single', { // Use single quotes for strings.
      'avoidEscape': true, // "a string containing 'single' quotes" or "a string containing `backtick` quotes"
      'allowTemplateLiterals': true, // Allow strings (string-only) to use backticks
    }],
    'no-template-curly-in-string': 'warn', // Do not allow templates in regular strings. Example: 'Hello ${name}!'
    'no-useless-concat': 'warn', // Disallow concatenation of strings. var foo = "a" + "b";
    'prefer-template': ['off'], // Use string concatenation, instead of templates for ES2015 compatibility. (no-useless-concat). "Hello, " + name + "!"
    'no-multi-str': 'error', // Disallow Multiline Strings. Use a template instead.
    'no-unused-vars': 'warn', // Let's unused vars exist, but warns

    // Syntax spacing stuff
    'block-spacing': 'warn', // Enforce consistent spacing inside single-line blocks. function foo() {return true}
    'array-bracket-spacing': 'warn', // Disallow spacing before or after array props; var arr = [ 'foo', 'bar' ];
    'func-call-spacing': 'warn', // Disallow spaces between the function name and the opening parenthesis that calls it. alert ('Hello')
    'no-multi-spaces': 'warn', // Disallow multiple whitespace around logical expressions, conditional expressions, declarations, array elements, object properties, sequences and function parameters.
    'comma-spacing': 'warn', // Enforce consistent spacing before and after commas in variable declarations, array literals, object literals, function parameters, and sequences.
    'object-curly-spacing': ['warn', 'always'], // Enforce consistent spacing inside braces. Ex: var obj = {'foo': 'bar' }
    'arrow-spacing': 'warn', // (a) => {} || a => a;

    // Spacing for Async/Await and other keywords
    'async-await/space-after-async': 2, // Ensure space before and after async keyword
    'async-await/space-after-await': 2, // Ensure space before and after await keyword
    'require-await': 'error', // Disallow async functions which have no await expression
    'keyword-spacing': 'error', // Enforce consistent spacing around keywords and keyword-like token
    'computed-property-spacing': 'warn',

    // This rule enforces consistent spacing between keys and values in object literal properties
    'key-spacing': ['warn', { // Enforce spacing around the colon in object literal properties.
      'beforeColon': false, // Disallow spaces between the key and the colon in object literals.
      'afterColon': true, // Require at least one space between the colon and the value in object literals.
      'mode': 'strict', // Enforce exactly one space before or after colons in object literals.
    }],

    // Ensure proper comma placement (for source control)
    'comma-dangle': ['warn', { // Enforce consistent use of trailing commas in object and array literals.
      // always-multiline - Requires trailing commas when the last element or property is in a different line than the
      // closing brackets and disallows trailing commas when the last element or property is on the same line as the closing
      'arrays': 'always-multiline',
      'objects': 'always-multiline',

      'imports': 'never', // Disallow trailing commas for import declarations of ES Modules
      'exports': 'never', // // Disallow trailing commas for export declarations of ES Modules
      'functions': 'never', // Disallow trailing commas in function declarations and function calls
    }],

    // Misc
    'no-dupe-keys': 'error', // Disallow duplicate keys in object literals
    'no-dupe-args': 'error', // Disallow duplicate arguments in function definitions
    'no-duplicate-case': 'error', // Disallow a duplicate case label
    'no-empty': 'warn', // Disallow empty block statements
    'no-ex-assign': 'warn', // Disallow reassigning exceptions in catch clauses
    'no-extra-parens': 'off', // Unnecessary parentheses. Sometimes it helps code readability.
    'no-inner-declarations': 'off', // Allow variable or function declarations in nested blocks. ES6+ supports it.
    'no-obj-calls': 'error', // Disallow calling the Math, JSON and Reflect objects as functions
    'no-sparse-arrays': 'warn', // Disallow sparse arrays. Ex: var items = [,,]
    'no-unexpected-multiline': 'warn', // Disallow confusing multiline expressions
    'no-unreachable': 'warn', // Disallow unreachable code after return, throw, continue, and break statements
    'no-unsafe-finally': 'error', // Disallow control flow statements in finally blocks
    'no-unsafe-negation': 'error', // Disallow negating the left operand of relational operators
    'valid-typeof': 'error', // Enforce comparing typeof expressions against valid strings
    // TODO: Typeof is not a function, it is an operator keyword.
    'array-callback-return': 'error', // Enforce return statements in callbacks of array???s methods
    'block-scoped-var': 'error', // Treat var as Block Scoped

    'semi': ['warn', 'never'], // Disallow the use of semicolons
    'no-extra-semi': 'off', // Use of semicolons is already disallowed
    'no-func-assign': 'warn', // Disallow reassigning function declarations
    'no-param-reassign': 'warn', // Disallow reassigning function paramaters (mutation)

    'no-console': 'warn', // Allow the use of console.log since we work in nodejs
    'camelcase': 'warn', // Disallow underscores in variable names except for example: _beforeString or SOME_ERROR
    'func-name-matching': 'off', // Require function names to match the name of the variable or property assignment
    'no-new': 'warn', // Disallow constructor calls using the new keyword that do not assign the resulting object. new Thing()
    'no-useless-return': 'warn', // Disallow redundant return statements
    'no-useless-escape': 'off', // Too many issues when developing with Regexes, like in Gun project.

    //"complexity": ["warn", 5], // https://eslint.org/docs/rules/complexity
    'constructor-super': 'error',
    'curly': 'off', // Allow block statements to omit curly braces, (For one line comparisons)
    'default-case': 'error', // Require default in switch cases.
    'dot-location': 'off', // Some projects like Frame allows cleaner code by using dot notations on new lines.
    'dot-notation': 'warn', // Require Dot Notation (dot-notation)
  },
}
