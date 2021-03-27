const Flow = require('../build/flow')
Flow.use('filter', require('../libs/filter'))

const animals = [
  { species: 'cat', name: 'fluffy' },
  { species: 'dog', name: 'woofie' },
  { species: 'cow', name: 'barney' },
  { species: 'zebra', name: 'spot' },
  { species: 'zebra', name: 'dot' },
]

function arrayMatches(arr1, arr2) {
  if (typeof arr1 !== 'object' && !Array.isArray(arr1))
    return false

  if (typeof arr2 !== 'object' && !Array.isArray(arr2))
    return false

  return JSON.stringify(arr1) === JSON.stringify(arr2)
}

test('Array matches function', () => {
  // First array non-object and not an array
  expect(arrayMatches(undefined, [])).toBe(false)

  // Second array non-object and not an array
  expect(arrayMatches([], undefined)).toBe(false)

  // Array matches
  expect(arrayMatches([{ test: true }], [{ test: true }])).toBe(true)

  // Array with different value for key
  expect(arrayMatches([{ test: true }], [{ test: false }])).toBe(false)

  // Array with missing value for key
  expect(arrayMatches([{ test: true }], [{ test: undefined }])).toBe(false)

  // Array with different key
  expect(arrayMatches([{ test1: true }], [{ test2: false }])).toBe(false)

  // Array that partially matches
  expect(arrayMatches([{ test: true, matching: false }], [{ test: true, matches: false }])).toBe(false)
})

test('Should find woolfie from single key/value', async () => {
  // Find dog named woolfie
  const flow = new Flow()
  const result = await flow.promisify()
    .from(async () => animals)
    .to(flow.filter, 'name', 'woofie' ) // Filter using a single key/value
    .run()

  expect(result.length).toBe(1)
  expect(arrayMatches(result, [{ species: 'dog', name: 'woofie' }])).toBe(true)
})

test('Should find all zebras', async () => {
  // Find all zebras
  const flow = new Flow()
  const result = await flow.promisify()
    .from(async () => animals)
    .to(flow.filter, { species: 'zebra' }) // Filter more complex objects
    .run()

  expect(result.length).toBe(2)
  expect(arrayMatches(result, [
    { species: 'zebra', name: 'spot' },
    { species: 'zebra', name: 'dot' }
  ])).toBe(true)
})

test('Should find spot the zebras', async () => {
  // spot the zebra
  const flow = new Flow()
  const result = await flow.promisify()
    .from(async () => animals)
    .to(flow.filter, { species: 'zebra', name: 'spot' }) // Filter more complex objects (more specifically; narrowing our results)
    .run()

  expect(result.length).toBe(1)
  expect(arrayMatches(result, [{ species: 'zebra', name: 'spot' }])).toBe(true)
})
