// @flow
'use strict'

import {
  type FlowInterface,
  type FlowPipes,
  type FlowPipe,
  type PipePromise,
} from './definitions'

import FlowMethods from './methods'

class Flow implements FlowInterface {
  pipes: FlowPipes = {
    init: [],
    events: [],
    targets: [],
  }

  flowRunning: boolean = false

  promisified: PipePromise = {
    isPromised: false,
    resolved: false,
    resolve: () => {},
    reject: () => {},
  }

  init: Function = FlowMethods.init
  to: Function = FlowMethods.to
  from: Function = FlowMethods.from
  run: Function = FlowMethods.run
  promisify: Function = FlowMethods.promisify

  thread(): FlowInterface {
    return new Flow()
  }
}

export default Flow
