const Flow = require('../build/flow')


test('Target as named function', (done) => {
  const flow = new Flow()
  flow
    .from(function namedFunction(cb) {
      cb()
    })
    .to(() => done())
    .run()
})

test('Target as anonymous arrow function', (done) => {
  const flow = new Flow()
  flow
    .from((cb) => {
      cb()
    })
    .to(() => done())
    .run()
})

test('Target as Promise', async (done) => {
  const promisedTarget = new Promise((resolve, reject) => {
    resolve()
  })

  const flow = new Flow()
  flow
    .from(promisedTarget)
    .to(() => done())
    .run()
})

test('Target as async/await', async (done) => {
  const flow = new Flow()
  flow
    .from(async () => { return })
    .to(() => done())
    .run()
})

test('Callbacks for targets', (done) => {
  function testCallback(cb) {
    cb()
  }

  const flow = new Flow()
  flow
    .from(testCallback)
    .to(testCallback)
    .to(() => done())
    .run()
})

test('Callbacks for targets with arguments', (done) => {
  function testCallbackWithParams(param1, param2, param3, cb) {
    expect(param1).toBe('param1')
    expect(param2).toBe('param2')
    expect(param3).toBe('param3')

    cb(param1, param2, param3)
  }

  const flow = new Flow()
  flow
    .from(testCallbackWithParams, 'param1', 'param2', 'param3')
    .to(() => done())
    .run()
})

test('Callbacks for target with results', (done) => {
  function testParamResults(param1, param2, param3, cb) {
    expect(param1).toBe('param1')
    expect(param2).toBe('param2')
    expect(param3).toBe('param3')

    cb()
  }

  const flow = new Flow()
  flow
    .from(cb => cb('param1', 'param2', 'param3'))
    .to(testParamResults)
    .to(() => done())
    .run()
})
