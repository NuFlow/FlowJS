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

import { runFlow } from './core'
import { isPrimitive } from './helpers'

const FlowMethods: FlowMethodsInterface = {
  init: function(target: FlowTarget): FlowInterface {
    // If target is a class or initializer of some kind.
    return addPipe.call(this, 'init', target, Array.from(arguments).slice(1))
  },

  to: function(target: FlowTarget): FlowInterface {
    return addPipe.call(this, 'to', target, Array.from(arguments).slice(1))
  },

  from: function(target: FlowTarget): FlowInterface {
    // Spawn a new Flow (if needed), because its a new Event Source.
    return addPipe.call(this, 'from', target, Array.from(arguments).slice(1))
  },

  run: function(): void | Promise<any> {
    if (this.promisified.isPromised)
      return new Promise((resolve, reject) => {
        this.promisified.resolve = resolve
        this.promisified.reject = reject
        runFlow.call(this)
      })
    else
      runFlow.call(this)
  },

  waitFor: function(target: FlowTarget): FlowInterface {
    // waitFor will accept a conditional and value (using a proxy) or function
    // waitFor will also accept a flow, and check if waitingForEvent = false
    return addPipe.call(this, 'waitFor', target, Array.from(arguments).slice(1))
  },

  promisify: function(): FlowInterface {
    this.promisified.isPromised = true
    return this
  },

  /*or: function() {

  },*/

}

function isConstructor(f) {
  try {
    Reflect.construct(String, [], f);
    return true
  } catch (e) {
    return false
  }
}

// Pipe control
function addPipe(direction: FlowDirection, target: FlowTarget, params: Array<any>): FlowInterface {
  const pipe: FlowPipe = {
    direction,
    target,
    params,
  }

  // Wrap any targets that are primitives with arrow function
  if (typeof target !== 'function') // Because functions are also objects
    if (isPrimitive(target))
      pipe.target = async () => target

  // Wrap any targets that are Promises with arrow function.
  if (typeof target === 'object' && typeof target.then === 'function') {
    pipe.target = (cb) => target.then(cb)
  }

  const flow = this
  switch (pipe.direction) {
    case 'init':
      if (!isConstructor(target))
        throw new Error('Flow target is not a constructor!')

      //console.log('init added for:', pipe)
      //flow.pipes.init.push(pipe)
      const instance = new target(...params)
      flow.pipes.init.push(instance)

      break

    case 'from':
      console.log('from added for:', pipe)
      flow.pipes.events.push(pipe)
      break

    case 'to':
      flow.pipes.targets.push(pipe)
      break

    default:
      // Shouldn't be here.
      console.warn('WARNING: Flow has received an unknown pipe direction. Please post a bug to the author about this.')
      break
  }

  console.log(`Added .${direction}(${target.name || 'anonymous'})`)
  return this
}

export default FlowMethods
