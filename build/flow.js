'use strict';

// 

function runFlow() {
  const flow = this;

  if (flow.flowRunning)
    return

  flow.flowRunning = true;

  // TODO: Call all init pipes first, so they can properly initialize. (Needed for classes and other larger libs.)

  // If no event sources, then go ahead and run flow using the first .to as our event source.
  if (flow.pipes.events.length === 0) {
    const target = flow.pipes.targets[0];
    callNext.call(flow, 0, target);
    return
  }

  // For each event source, go ahead and call it to init the events.
  for (const event of flow.pipes.events) {
    callNext.call(flow, -1, event);
  }
}

function callNext(index, next, ...params) {

  const flow = this;

  function pipeCallback() {
    nextPipe.call(flow, index + 1, ...Array.from(arguments));
  }

  const props = [...params, ...next.params];
  props.push(pipeCallback);

  // TODO: Wrap in try catch expression to catch errors.
  const retValue = next.target.apply({}, props);
  const retType = typeof retValue;

  if (retType === 'object' && retValue instanceof Promise) {
    retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)));
  }

}

function nextPipe(index, ...props) {

  const targets = this.pipes.targets;
  const next = targets[index];

  // If we're at the end of the flow
  if (!next || !next.target) {
    this.flowRunning = false;

    if (this.promisified.isPromised) {
      this.promisified.resolve(...props);
      this.promisified.isPromised = false;
    }

    return void 0
  }

  callNext.call(this, index, next, ...props);
}

// Modified from: https://cwestblog.com/2011/08/02/javascript-isprimitive-function/
function isPrimitive(arg) {
  const type = typeof arg;
  if (arg && type === 'object' && arg.then && typeof arg.then === 'function')
    return false

  return arg == null || (type != "function")
}

// 

const FlowMethods = {
  init: function(target) {
    // If target is a class or initializer of some kind.
    return addPipe.call(this, 'init', target, Array.from(arguments).slice(1))
  },

  to: function(target) {
    return addPipe.call(this, 'to', target, Array.from(arguments).slice(1))
  },

  from: function(target) {
    // Spawn a new Flow (if needed), because its a new Event Source.
    return addPipe.call(this, 'from', target, Array.from(arguments).slice(1))
  },

  run: function() {
    if (this.promisified.isPromised)
      return new Promise((resolve, reject) => {
        this.promisified.resolve = resolve;
        this.promisified.reject = reject;
        runFlow.call(this);
      })
    else
      runFlow.call(this);
  },

  waitFor: function(target) {
    // waitFor will accept a conditional and value (using a proxy) or function
    // waitFor will also accept a flow, and check if waitingForEvent = false
    return addPipe.call(this, 'waitFor', target, Array.from(arguments).slice(1))
  },

  promisify: function() {
    this.promisified.isPromised = true;
    return this
  },

  /*or: function() {

  },*/

};

function isConstructor(f) {
  try {
    Reflect.construct(String, [], f);
    return true
  } catch (e) {
    return false
  }
}

// Pipe control
function addPipe(direction, target, params) {
  const pipe = {
    direction,
    target,
    params,
  };

  // Wrap any targets that are primitives with arrow function
  if (typeof target !== 'function') // Because functions are also objects
    if (isPrimitive(target))
      pipe.target = async () => target; //wrapTarget(target)

  // Wrap any targets that are Promises with arrow function.
  if (typeof target === 'object' && typeof target.then === 'function') {
    pipe.target = (cb) => target.then(cb);
  }

  const flow = this;
  switch (pipe.direction) {
    case 'init':
      if (!isConstructor(target))
        throw new Error('Flow target is not a constructor!')

      //console.log('init added for:', pipe)
      //flow.pipes.init.push(pipe)
      const instance = new target(...params);
      flow.pipes.init.push(instance);

      break

    case 'from':
      flow.pipes.events.push(pipe);
      break

    case 'to':
      flow.pipes.targets.push(pipe);
      break

    default:
      // Shouldn't be here.
      console.warn('WARNING: Flow has received an unknown pipe direction. Please post a bug to the author about this.');
      break
  }
  return this
}

// 

class Flow {
  pipes = {
    init: [],
    events: [],
    targets: [],
  }

  flowRunning = false

  promisified = {
    isPromised: false,
    resolve: () => {},
    reject: () => {},
  }

  init = FlowMethods.init
  to = FlowMethods.to
  from = FlowMethods.from
  run = FlowMethods.run
  promisify = FlowMethods.promisify

  static modules = {}
  modules = {}

  thread() {
    return new Flow()
  }

  static use(name, module) {
    if (this.modules[name])
      throw new Error(name + ' collides with existing Flow module or property.')

    this.modules[name] = module;
  }

  constructor() {
    this.modules = this.constructor.modules;

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

module.exports = Flow;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vbGliL2NvcmUuanMiLCIuLi9saWIvbWV0aG9kcy5qcyIsIi4uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93TWV0aG9kc0ludGVyZmFjZSxcblxuICB0eXBlIEZsb3dEaXJlY3Rpb24sXG4gIHR5cGUgRmxvd1BpcGUsXG5cbiAgdHlwZSBGbG93SW5pdGlhbGl6ZXIsXG4gIHR5cGUgRmxvd1RhcmdldCxcblxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5mdW5jdGlvbiBydW5GbG93KCkge1xuICBjb25zdCBmbG93OiBGbG93SW50ZXJmYWNlID0gdGhpc1xuICBjb25zb2xlLmxvZygnU3RhcnRpbmcgZmxvdycpXG5cbiAgaWYgKGZsb3cuZmxvd1J1bm5pbmcpXG4gICAgcmV0dXJuXG5cbiAgZmxvdy5mbG93UnVubmluZyA9IHRydWVcblxuICAvLyBUT0RPOiBDYWxsIGFsbCBpbml0IHBpcGVzIGZpcnN0LCBzbyB0aGV5IGNhbiBwcm9wZXJseSBpbml0aWFsaXplLiAoTmVlZGVkIGZvciBjbGFzc2VzIGFuZCBvdGhlciBsYXJnZXIgbGlicy4pXG5cbiAgLy8gSWYgbm8gZXZlbnQgc291cmNlcywgdGhlbiBnbyBhaGVhZCBhbmQgcnVuIGZsb3cgdXNpbmcgdGhlIGZpcnN0IC50byBhcyBvdXIgZXZlbnQgc291cmNlLlxuICBpZiAoZmxvdy5waXBlcy5ldmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3QgdGFyZ2V0OiBGbG93UGlwZSA9IGZsb3cucGlwZXMudGFyZ2V0c1swXVxuICAgIGNhbGxOZXh0LmNhbGwoZmxvdywgMCwgdGFyZ2V0KVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gRm9yIGVhY2ggZXZlbnQgc291cmNlLCBnbyBhaGVhZCBhbmQgY2FsbCBpdCB0byBpbml0IHRoZSBldmVudHMuXG4gIGZvciAoY29uc3QgZXZlbnQ6IEZsb3dQaXBlIG9mIGZsb3cucGlwZXMuZXZlbnRzKSB7XG4gICAgY2FsbE5leHQuY2FsbChmbG93LCAtMSwgZXZlbnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbE5leHQoaW5kZXg6IG51bWJlciwgbmV4dDogRmxvd1BpcGUsIC4uLnBhcmFtcykge1xuICBjb25zb2xlLmxvZygnTmV4dCB0YXJnZXQ6JylcbiAgY29uc29sZS5sb2cobmV4dClcblxuICBjb25zdCBmbG93OiBGbG93SW50ZXJmYWNlID0gdGhpc1xuXG4gIGZ1bmN0aW9uIHBpcGVDYWxsYmFjaygpIHtcbiAgICBjb25zb2xlLmxvZyhuZXh0LnRhcmdldC5uYW1lLCAndXNlZCBjYWxsYmFjaycpXG4gICAgbmV4dFBpcGUuY2FsbChmbG93LCBpbmRleCArIDEsIC4uLkFycmF5LmZyb20oYXJndW1lbnRzKSlcbiAgfVxuXG4gIGNvbnN0IHByb3BzID0gWy4uLnBhcmFtcywgLi4ubmV4dC5wYXJhbXNdXG4gIHByb3BzLnB1c2gocGlwZUNhbGxiYWNrKVxuICBjb25zb2xlLmxvZyhuZXh0LnRhcmdldC5uYW1lLCAncHJvcHMnLCBwcm9wcylcblxuICAvLyBUT0RPOiBXcmFwIGluIHRyeSBjYXRjaCBleHByZXNzaW9uIHRvIGNhdGNoIGVycm9ycy5cbiAgY29uc3QgcmV0VmFsdWUgPSBuZXh0LnRhcmdldC5hcHBseSh7fSwgcHJvcHMpXG4gIGNvbnN0IHJldFR5cGUgPSB0eXBlb2YgcmV0VmFsdWVcblxuICBpZiAocmV0VHlwZSA9PT0gJ29iamVjdCcgJiYgcmV0VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgcmV0VmFsdWUudGhlbigoLi4uYXJncykgPT4gcGlwZUNhbGxiYWNrLmNhbGwobnVsbCwgLi4uQXJyYXkuZnJvbShhcmdzKSkpXG4gIH1cblxufVxuXG5mdW5jdGlvbiBuZXh0UGlwZShpbmRleDogbnVtYmVyLCAuLi5wcm9wcykge1xuICBjb25zb2xlLmxvZygnbmV4dDonLCBpbmRleClcbiAgY29uc29sZS5sb2coJ2FyZ3M6JywgYXJndW1lbnRzKVxuXG4gIGNvbnN0IHRhcmdldHMgPSB0aGlzLnBpcGVzLnRhcmdldHNcbiAgY29uc3QgbmV4dCA9IHRhcmdldHNbaW5kZXhdXG5cbiAgLy8gSWYgd2UncmUgYXQgdGhlIGVuZCBvZiB0aGUgZmxvd1xuICBpZiAoIW5leHQgfHwgIW5leHQudGFyZ2V0KSB7XG4gICAgdGhpcy5mbG93UnVubmluZyA9IGZhbHNlXG5cbiAgICBpZiAodGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkKSB7XG4gICAgICB0aGlzLnByb21pc2lmaWVkLnJlc29sdmUoLi4ucHJvcHMpXG4gICAgICB0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQgPSBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBjb25zb2xlLmxvZygnRW5kIG9mIGZsb3cgYXQnLCBpbmRleClcbiAgfVxuXG4gIGNhbGxOZXh0LmNhbGwodGhpcywgaW5kZXgsIG5leHQsIC4uLnByb3BzKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvcnMoKSB7XG4gIC8vIFNwZWNpYWwgdXNlIGNhc2VzXG4gIC8vIFlvdSBuZWVkIHNwZWNpYWwgZXJyb3IgaGFuZGxlciBldmVudHMgZm9yIG1vZHVsZXMgdGhhdCBleHBlY3QgdG8gdXNlIHRoZW1cbiAgLy8gWW91IGNhbiBwYXNzIHRoZXNlIGVycm9ycyB0byB0eXBpY2FsIGVycm9yIGhhbmRsZXJzIGxpa2UgdGhyb3cgdXNpbmcgdGhlIHN5bnRheDpcbiAgLy8gLm9uRXJyb3IoZXJyID0+IHRocm93IG5ldyBFcnJvcihlcnIpKVxuXG4gIC8vIE9uY2UgdGhpcyBpcyBmaW5pc2hlZCwgbG9vayBmb3IgYW55IC5vcigpIGJyYW5jaGVzIHRvIGNvbnRpbnVlIGNoYWluLlxuICAvLyAub3IoKSB3aWxsIHN0YXJ0IGEgbmV3IGZsb3cgYW5kIGxpbmsgdGhlc2UgdHdvIEZsb3dzIHRvZ2V0aGVyLlxufVxuXG5leHBvcnQgeyBydW5GbG93IH1cbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dNZXRob2RzSW50ZXJmYWNlLFxuXG4gIHR5cGUgRmxvd0RpcmVjdGlvbixcbiAgdHlwZSBGbG93UGlwZSxcblxuICB0eXBlIEZsb3dJbml0aWFsaXplcixcbiAgdHlwZSBGbG93VGFyZ2V0LFxuXG59IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCB7IHJ1bkZsb3cgfSBmcm9tICcuL2NvcmUnXG5pbXBvcnQgeyBpc1ByaW1pdGl2ZSB9IGZyb20gJy4vaGVscGVycydcblxuY29uc3QgRmxvd01ldGhvZHM6IEZsb3dNZXRob2RzSW50ZXJmYWNlID0ge1xuICBpbml0OiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyBJZiB0YXJnZXQgaXMgYSBjbGFzcyBvciBpbml0aWFsaXplciBvZiBzb21lIGtpbmQuXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnaW5pdCcsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHRvOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICd0bycsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIGZyb206IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIFNwYXduIGEgbmV3IEZsb3cgKGlmIG5lZWRlZCksIGJlY2F1c2UgaXRzIGEgbmV3IEV2ZW50IFNvdXJjZS5cbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICdmcm9tJywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgcnVuOiBmdW5jdGlvbigpOiB2b2lkIHwgUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkKVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5wcm9taXNpZmllZC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgICAgICB0aGlzLnByb21pc2lmaWVkLnJlamVjdCA9IHJlamVjdFxuICAgICAgICBydW5GbG93LmNhbGwodGhpcylcbiAgICAgIH0pXG4gICAgZWxzZVxuICAgICAgcnVuRmxvdy5jYWxsKHRoaXMpXG4gIH0sXG5cbiAgd2FpdEZvcjogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gd2FpdEZvciB3aWxsIGFjY2VwdCBhIGNvbmRpdGlvbmFsIGFuZCB2YWx1ZSAodXNpbmcgYSBwcm94eSkgb3IgZnVuY3Rpb25cbiAgICAvLyB3YWl0Rm9yIHdpbGwgYWxzbyBhY2NlcHQgYSBmbG93LCBhbmQgY2hlY2sgaWYgd2FpdGluZ0ZvckV2ZW50ID0gZmFsc2VcbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICd3YWl0Rm9yJywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgcHJvbWlzaWZ5OiBmdW5jdGlvbigpOiBGbG93SW50ZXJmYWNlIHtcbiAgICB0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQgPSB0cnVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICAvKm9yOiBmdW5jdGlvbigpIHtcblxuICB9LCovXG5cbn1cblxuZnVuY3Rpb24gaXNDb25zdHJ1Y3RvcihmKSB7XG4gIHRyeSB7XG4gICAgUmVmbGVjdC5jb25zdHJ1Y3QoU3RyaW5nLCBbXSwgZik7XG4gICAgcmV0dXJuIHRydWVcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbi8vIFBpcGUgY29udHJvbFxuZnVuY3Rpb24gYWRkUGlwZShkaXJlY3Rpb246IEZsb3dEaXJlY3Rpb24sIHRhcmdldDogRmxvd1RhcmdldCwgcGFyYW1zOiBBcnJheTxhbnk+KTogRmxvd0ludGVyZmFjZSB7XG4gIGNvbnN0IHBpcGU6IEZsb3dQaXBlID0ge1xuICAgIGRpcmVjdGlvbixcbiAgICB0YXJnZXQsXG4gICAgcGFyYW1zLFxuICB9XG5cbiAgLy8gV3JhcCBhbnkgdGFyZ2V0cyB0aGF0IGFyZSBwcmltaXRpdmVzIHdpdGggYXJyb3cgZnVuY3Rpb25cbiAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpIC8vIEJlY2F1c2UgZnVuY3Rpb25zIGFyZSBhbHNvIG9iamVjdHNcbiAgICBpZiAoaXNQcmltaXRpdmUodGFyZ2V0KSlcbiAgICAgIHBpcGUudGFyZ2V0ID0gYXN5bmMgKCkgPT4gdGFyZ2V0IC8vd3JhcFRhcmdldCh0YXJnZXQpXG5cbiAgLy8gV3JhcCBhbnkgdGFyZ2V0cyB0aGF0IGFyZSBQcm9taXNlcyB3aXRoIGFycm93IGZ1bmN0aW9uLlxuICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGlwZS50YXJnZXQgPSAoY2IpID0+IHRhcmdldC50aGVuKGNiKVxuICB9XG5cbiAgY29uc3QgZmxvdyA9IHRoaXNcbiAgc3dpdGNoIChwaXBlLmRpcmVjdGlvbikge1xuICAgIGNhc2UgJ2luaXQnOlxuICAgICAgaWYgKCFpc0NvbnN0cnVjdG9yKHRhcmdldCkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmxvdyB0YXJnZXQgaXMgbm90IGEgY29uc3RydWN0b3IhJylcblxuICAgICAgLy9jb25zb2xlLmxvZygnaW5pdCBhZGRlZCBmb3I6JywgcGlwZSlcbiAgICAgIC8vZmxvdy5waXBlcy5pbml0LnB1c2gocGlwZSlcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHRhcmdldCguLi5wYXJhbXMpXG4gICAgICBmbG93LnBpcGVzLmluaXQucHVzaChpbnN0YW5jZSlcblxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ2Zyb20nOlxuICAgICAgY29uc29sZS5sb2coJ2Zyb20gYWRkZWQgZm9yOicsIHBpcGUpXG4gICAgICBmbG93LnBpcGVzLmV2ZW50cy5wdXNoKHBpcGUpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAndG8nOlxuICAgICAgZmxvdy5waXBlcy50YXJnZXRzLnB1c2gocGlwZSlcbiAgICAgIGJyZWFrXG5cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gU2hvdWxkbid0IGJlIGhlcmUuXG4gICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IEZsb3cgaGFzIHJlY2VpdmVkIGFuIHVua25vd24gcGlwZSBkaXJlY3Rpb24uIFBsZWFzZSBwb3N0IGEgYnVnIHRvIHRoZSBhdXRob3IgYWJvdXQgdGhpcy4nKVxuICAgICAgYnJlYWtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBBZGRlZCAuJHtkaXJlY3Rpb259KCR7dGFyZ2V0Lm5hbWUgfHwgJ2Fub255bW91cyd9KWApXG4gIHJldHVybiB0aGlzXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZsb3dNZXRob2RzXG4iLCIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93UGlwZXMsXG4gIHR5cGUgRmxvd1BpcGUsXG4gIHR5cGUgUGlwZVByb21pc2UsXG59IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCBGbG93TWV0aG9kcyBmcm9tICcuL21ldGhvZHMnXG5cbmNsYXNzIEZsb3cgaW1wbGVtZW50cyBGbG93SW50ZXJmYWNlIHtcbiAgcGlwZXM6IEZsb3dQaXBlcyA9IHtcbiAgICBpbml0OiBbXSxcbiAgICBldmVudHM6IFtdLFxuICAgIHRhcmdldHM6IFtdLFxuICB9XG5cbiAgZmxvd1J1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuXG4gIHByb21pc2lmaWVkOiBQaXBlUHJvbWlzZSA9IHtcbiAgICBpc1Byb21pc2VkOiBmYWxzZSxcbiAgICByZXNvbHZlOiAoKSA9PiB7fSxcbiAgICByZWplY3Q6ICgpID0+IHt9LFxuICB9XG5cbiAgaW5pdDogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5pbml0XG4gIHRvOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnRvXG4gIGZyb206IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMuZnJvbVxuICBydW46IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMucnVuXG4gIHByb21pc2lmeTogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5wcm9taXNpZnlcblxuICBzdGF0aWMgbW9kdWxlczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9XG4gIG1vZHVsZXM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fVxuXG4gIHRocmVhZCgpOiBGbG93SW50ZXJmYWNlIHwgUHJveHk8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBGbG93KClcbiAgfVxuXG4gIHN0YXRpYyB1c2UobmFtZTogc3RyaW5nLCBtb2R1bGU6IGFueSkge1xuICAgIGlmICh0aGlzLm1vZHVsZXNbbmFtZV0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobmFtZSArICcgY29sbGlkZXMgd2l0aCBleGlzdGluZyBGbG93IG1vZHVsZSBvciBwcm9wZXJ0eS4nKVxuXG4gICAgdGhpcy5tb2R1bGVzW25hbWVdID0gbW9kdWxlXG4gIH1cblxuICBjb25zdHJ1Y3RvcigpOiBQcm94eTxhbnk+IHtcbiAgICB0aGlzLm1vZHVsZXMgPSB0aGlzLmNvbnN0cnVjdG9yLm1vZHVsZXNcblxuICAgIHJldHVybiBuZXcgUHJveHkodGhpcywge1xuICAgICAgZ2V0OiBmdW5jdGlvbih0YXJnZXQsIHByb3BlcnR5KSB7XG4gICAgICAgIGlmIChSZWZsZWN0Lmhhcyh0YXJnZXQsIHByb3BlcnR5KSlcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5nZXQodGFyZ2V0LCBwcm9wZXJ0eSlcbiAgICAgICAgZWxzZSBpZiAoUmVmbGVjdC5oYXModGFyZ2V0Lm1vZHVsZXMsIHByb3BlcnR5KSlcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0Lm1vZHVsZXNbcHJvcGVydHldXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBGbG93XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7RUFVc0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQTZCUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkNwQkksQ0FBQzs7Ozs7Ozs7O3dCQVNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2hCZjs7Ozs7OzthQU9SOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBcUJZLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
