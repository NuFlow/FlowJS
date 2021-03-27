const Flow = require('../build/flow')

// Setup code
async function hello() {
	return 'hello'
}

// More setup code
async function world(data) {
	return `${data}, world!`
}


test('Hello world', async () => {
  // The good stuff
  const flow = new Flow()
  const result = await flow.promisify()
    .from(hello)
    .to(world)
    .run()

  expect(result).toBe('hello, world!')
})
