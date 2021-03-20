# FlowJS

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
