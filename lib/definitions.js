// @flow

export interface FlowInterface {
  pipes: FlowPipes,

  flowRunning: boolean,

  promisified: PipePromise,
}

export type FlowPipes = {
  init: Array<FlowPipe>,
  events: Array<FlowPipe>,
  targets: Array<FlowPipe>,
}

export interface FlowPipe {
  direction: FlowDirection,
  target: FlowTarget,
  params: Array<any>,
}

export type FlowDirection = "init" | "to" | "from" | "waitFor"

export type FlowInitializer = Function //ClassDeclaration | Function //| Event //| InstanceType<any>
export type FlowTarget = Function //ClassDeclaration | Function //| TypedEventEmitter<any>

export interface FlowMethodsInterface {
  init: (target: FlowInitializer) => FlowInterface, // => FlowMethods<Object>
  to: (target: FlowTarget) => FlowInterface,
  from: (target: FlowTarget) => FlowInterface,
  waitFor: (target: FlowTarget) => FlowInterface,
  promisify: () => FlowInterface,
  run: () => void | Promise<any>,
}

export type addPipe = (direction: FlowDirection, target: FlowTarget, params: Array<any>) => FlowInterface

export type PipePromise = {
  isPromised: boolean,
  resolved: boolean,
  resolve: Function,
  reject: Function,
}
