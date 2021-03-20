// @flow
'use strict'

import {
  type FlowInterface,
  type FlowMethodsInterface,

  type FlowDirection,
  type FlowPipe,

  type FlowInitializer,
  type FlowTarget,

} from './definitions'

function runFlow() {
  const flow: FlowInterface = this
  console.log('Starting flow')

  if (flow.flowRunning)
    return

  flow.flowRunning = true

  // TODO: Call all init pipes first, so they can properly initialize. (Needed for classes and other larger libs.)

  // If no event sources, then go ahead and run flow using the first .to as our event source.
  if (flow.pipes.events.length === 0) {
    const target: FlowPipe = flow.pipes.targets[0]
    callTarget.call(flow, target)
    return
  }

  // For each event source, go ahead and call it to init the events.
  for (const event of flow.pipes.events) {
    callTarget.call(this, event)
  }
}

function callTarget(eventPipe) {
  const eventTarget = eventPipe.target
  //const eventType = eventPipe.type
  const props = eventPipe.params //destructure(target, event.params)

  if (typeof eventTarget === 'function') {

    const flow = this

    function pipeCallback() {
      console.log(eventTarget.name, 'used callback')
      console.log(arguments)
      nextPipe.call(flow, 0, ...Array.from(arguments))
      // TODO: if from an event source, then index is 0, otherwise it needs to go to 1
    }

    props.push(pipeCallback)

    const retValue = eventTarget.apply({}, props)
    const retType = typeof retValue

    if (retType === 'object' && retValue instanceof Promise) {
      //retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)))
      retValue.then((...args) =>  pipeCallback.apply(null, [null, ...Array.from(args)]))
    }

    //callNext.call(this, event)
  }
}

function nextPipe(index, err, data) {
  //console.log('next:', index)
  //console.log('err:', err)
  //console.log('data:', data)

  const targets = this.pipes.targets
  const next = targets[index]

  if (err) {
    //this.hasError = true
    //this.errorData = err
    //handleErrors.call(this)

    // TODO: If we have a promise, then its a good time to reject it.
    return
  }

  // If we're at the end of the flow
  if (!next || !next.target) {
    this.flowRunning = false

    if (this.promisified.isPromised && !this.promisified.resolved) {
      this.promisified.resolve(data)
      this.promisified.resolved = true // FIXME: Probably don't need this anymore, since any time we resolve or reject, we can just turn the promise off.
      this.promisified.isPromised = false
    }

    return console.log('End of flow at', index)
  }

  callNext.call(this, index, next, data)
}

function callNext(index, next, data) {
  console.log('Next target:')
  console.log(next)

  const props = next.params //destructure(target, event.params)
  console.log(next.target.name, 'props', props)

  if (data)
    props.push(data)

  const flow = this

  function pipeCallback() {
    console.log(next.target.name, 'used callback')
    nextPipe.call(flow, index + 1, ...Array.from(arguments))
  }

  props.push(pipeCallback)

  const retValue = next.target.apply({}, props)
  const retType = typeof retValue

  if (retType === 'object' && retValue instanceof Promise) {
    //retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)))
    retValue.then((...args) =>  pipeCallback.apply(null, [null, ...Array.from(args)]))
  }

}

function handleErrors() {
  // Special use cases
  // You need special error handler events for modules that expect to use them
  // You can pass these errors to typical error handlers like throw using the syntax:
  // .onError(err => throw new Error(err))

  // Once this is finished, look for any .or() branches to continue chain.
  // .or() will start a new flow and link these two Flows together.
}

/*
function callNextOld(next, data) {
  const blueprint = next.target
  //const props = destructure(blueprint.Frame.describe.in, next.params)
  const context = next.context

  let retValue
  let retType
  try {
    retValue = blueprint.in.call(context, data, props, new factory(pipeCallback).bind(context))
    retType = typeof retValue
  } catch (err) {
    retValue = err
    retType = 'error'
  }

  // Blueprint.in does not return anything
  if (!retValue || retType === 'undefined')
    return

  if (retType === 'object' && retValue instanceof Promise) {
    // Handle promises
    retValue.then(context.out).catch(context.error)
  } else if (retType === 'error' ||
             retType === 'object' && retValue instanceof Error ||
             retType === 'object' && retValue.constructor.name === 'Error') {
    // Handle errors
    context.error(retValue)
  } else {
    // Handle regular primitives and objects
    context.out(retValue)
  }
}
*/

export { runFlow }
