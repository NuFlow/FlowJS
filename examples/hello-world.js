const Flow = require('../build/flow')

// Setup code
async function hello() {
	return 'hello'
}

// More setup code
async function world(data) {
	return `${data}, world!`
}

(async main => { // Until top-level await becomes a thing.

  // The good stuff
  const flow = new Flow()
  const result = await flow.promisify()
    .from(hello)
    .to(world)
    .run()

  console.log(result)

})()
