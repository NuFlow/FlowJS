# FlowJS (Work in Progress)

## Hello, world! Example:
```js
// Setup code
async function hello() {
  return 'hello'
}

// More setup code
async function world(data) {
  return `${data}, world!`
}

// The good stuff
const result = await flow.promisify()
  .from(hello)
  .to(world)
  .run()
	
// result: hello, world!
```

<br>

# Features:
- Zero dependencies
- Tiny library size! 2.17 KB minified and under 1KB gzipped!
- Cross Platform - Runs everywhere Javascript does
- Declarative style (tell the library WHAT you want, not how you want it) - [1](https://codeburst.io/declarative-vs-imperative-programming-a8a7c93d9ad2) [2](http://latentflip.com/imperative-vs-declarative) [3](https://stackoverflow.com/a/39561818) [4](https://tylermcginnis.com/imperative-vs-declarative-programming/)
- Functions have a lot of freedom, use: return values, Promises, async/await, or the traditional callback. Flow gets out of your way!

<br>

## Installation:
`npm install https://github.com/NuFlow/FlowJS --save`

<br>

# Include into your project (CommonJS)
```js
const Flow = require('flow')
const flow = new Flow()
```

<br>

## Tools used to create FlowJS:
- Rollup for building and bundling
- FlowType for static type-checking
- Jest for runtime tests
- WallabyJS for debugging and helping Jest along
