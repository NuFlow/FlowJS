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
    resolve: () => {},
    reject: () => {},
  }

  init: Function = FlowMethods.init
  to: Function = FlowMethods.to
  from: Function = FlowMethods.from
  run: Function = FlowMethods.run
  promisify: Function = FlowMethods.promisify

  static modules: { [key: string]: any } = {}
  modules: { [key: string]: any } = {}

  thread(): FlowInterface | Proxy<any> {
    return new Flow()
  }

  static use(name: string, module: any) {
    if (this.modules[name])
      throw new Error(name + ' collides with existing Flow module or property.')

    this.modules[name] = module
  }

  constructor(): Proxy<any> {
    this.modules = this.constructor.modules

    return new Proxy(this, {
      get: function(target, property) {
        if (Reflect.has(target, property))
          return Reflect.get(target, property)
        else if (Reflect.has(target.modules, property))
          return target.modules[property]
      }
    })
  }
}

export default Flow
