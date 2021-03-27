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
    callNext.call(flow, 0, target)
    return
  }

  // For each event source, go ahead and call it to init the events.
  for (const event: FlowPipe of flow.pipes.events) {
    callNext.call(flow, -1, event)
  }
}

function callNext(index: number, next: FlowPipe, ...params) {
  console.log('Next target:')
  console.log(next)

  const flow: FlowInterface = this

  function pipeCallback() {
    console.log(next.target.name, 'used callback')
    nextPipe.call(flow, index + 1, ...Array.from(arguments))
  }

  const props = [...params, ...next.params]
  props.push(pipeCallback)
  console.log(next.target.name, 'props', props)

  // TODO: Wrap in try catch expression to catch errors.
  const retValue = next.target.apply({}, props)
  const retType = typeof retValue

  if (retType === 'object' && retValue instanceof Promise) {
    retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)))
  }

}

function nextPipe(index: number, ...props) {
  console.log('next:', index)
  console.log('args:', arguments)

  const targets = this.pipes.targets
  const next = targets[index]

  // If we're at the end of the flow
  if (!next || !next.target) {
    this.flowRunning = false

    if (this.promisified.isPromised) {
      this.promisified.resolve(...props)
      this.promisified.isPromised = false
    }

    return console.log('End of flow at', index)
  }

  callNext.call(this, index, next, ...props)
}

function handleErrors() {
  // Special use cases
  // You need special error handler events for modules that expect to use them
  // You can pass these errors to typical error handlers like throw using the syntax:
  // .onError(err => throw new Error(err))

  // Once this is finished, look for any .or() branches to continue chain.
  // .or() will start a new flow and link these two Flows together.
}

export { runFlow }
