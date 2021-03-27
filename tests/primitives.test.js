const Flow = require('../build/flow')

// Modified from: https://cwestblog.com/2011/08/02/javascript-isprimitive-function/
function isPrimitive(arg) {
  const type = typeof arg
  if (arg && type === 'object' && arg.then && typeof arg.then === 'function')
    return false

  return arg == null || (type != "function")
}

test('Primitive checker', () => {
  expect( isPrimitive('string') ).toBe(true)
  expect( isPrimitive(`string`) ).toBe(true)

  expect( isPrimitive(100) ).toBe(true)
  expect( isPrimitive(3.14) ).toBe(true)
  expect( isPrimitive(-100) ).toBe(true)

  expect( isPrimitive(true) ).toBe(true)
  expect( isPrimitive(false) ).toBe(true)

  expect( isPrimitive(undefined) ).toBe(true)
  expect( isPrimitive(null) ).toBe(true)

  expect( isPrimitive(function (){}) ).toBe(false)
  expect( isPrimitive(() => {}) ).toBe(false)
  expect( isPrimitive(async () => {}) ).toBe(false)

  expect( isPrimitive({}) ).toBe(true)
  expect( isPrimitive({ obj: 'key' })).toBe(true)

  expect( isPrimitive([]) ).toBe(true)
  expect( isPrimitive(['some', 'array']) ).toBe(true)

  expect( isPrimitive( new Promise((res, rej) => {})) ).toBe(false)

  expect( isPrimitive( new Set() )).toBe(true)
  expect( isPrimitive( new Map() )).toBe(true)
})

test('Primitives with FlowJS', (done) => {
  // NOTE: Just testing one type of primtive here should be sufficient since it will output the same results as the tests above.
  const flow = new Flow()
  flow
    .from('string')
    .to((res, cb) => {
      expect( isPrimitive(res) ).toBe(true)
      cb()
    })
    .to(() => done())
    .run()
})
