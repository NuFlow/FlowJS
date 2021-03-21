const Flow = require('../build/flow')
Flow.use('filter', require('../libs/filter'))

const animals = [
  { species: 'cat', name: 'fluffy' },
  { species: 'dog', name: 'woofie' },
  { species: 'cow', name: 'barney' },
  { species: 'zebra', name: 'spot' },
  { species: 'zebra', name: 'dot' },
]

function logResult(result, description) {
  console.log(description)
  console.log(result)
  console.log()
}

let flow

// Find dog named woolfie
flow = new Flow()
flow
  .from(async () => animals)
  .to(flow.filter, 'name', 'woofie' ) // Filter using a single key/value
  .to(logResult, 'Find dog named woolfie')
  .run()
  /*
    Result:
    Find dog named woolfie
    [ { species: 'dog', name: 'woofie' } ]
  */

// Find all zebras
flow = new Flow()
flow
  .from(async () => animals)
  .to(flow.filter, { species: 'zebra' }) // Filter more complex objects
  .to(logResult, 'Find all zebras')
  .run()
  /*
    Result:
    Find all zebras
    [
      { species: 'zebra', name: 'spot' },
      { species: 'zebra', name: 'dot' }
    ]
  */


// spot the zebra
flow = new Flow()
flow
  .from(async () => animals)
  .to(flow.filter, { species: 'zebra', name: 'spot' }) // Filter more complex objects (more specifically; narrowing our results)
  .to(logResult, 'spot the zebra')
  .run()
  /*
    Result:
    spot the zebra
    [ { species: 'zebra', name: 'spot' } ]
  */
