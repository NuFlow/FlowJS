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

## Installation:
`npm install https://github.com/NuFlow/FlowJS --save`

<br>

# Include into your project (CommonJS)
```
const Flow = require('flow')
const flow = new Flow()
```

<br>

## Tools used to create FlowJS:
- Rollup for building and bundling
- FlowType for static type-checking
- Jest for runtime tests
- WallabyJS for debugging and helping Jest along
