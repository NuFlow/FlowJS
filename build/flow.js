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
  //if (typeof target !== 'function')
  //  throw new Error('Flow expected a function but received "' + typeof target + '" instead!')

  //if (isPrimitive(target))
  //  target = wrapTarget(target)

  const pipe = {
    direction,
    target,
    params,
  };

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vbGliL2NvcmUuanMiLCIuLi9saWIvbWV0aG9kcy5qcyIsIi4uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93TWV0aG9kc0ludGVyZmFjZSxcblxuICB0eXBlIEZsb3dEaXJlY3Rpb24sXG4gIHR5cGUgRmxvd1BpcGUsXG5cbiAgdHlwZSBGbG93SW5pdGlhbGl6ZXIsXG4gIHR5cGUgRmxvd1RhcmdldCxcblxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5mdW5jdGlvbiBydW5GbG93KCkge1xuICBjb25zdCBmbG93OiBGbG93SW50ZXJmYWNlID0gdGhpc1xuICBjb25zb2xlLmxvZygnU3RhcnRpbmcgZmxvdycpXG5cbiAgaWYgKGZsb3cuZmxvd1J1bm5pbmcpXG4gICAgcmV0dXJuXG5cbiAgZmxvdy5mbG93UnVubmluZyA9IHRydWVcblxuICAvLyBUT0RPOiBDYWxsIGFsbCBpbml0IHBpcGVzIGZpcnN0LCBzbyB0aGV5IGNhbiBwcm9wZXJseSBpbml0aWFsaXplLiAoTmVlZGVkIGZvciBjbGFzc2VzIGFuZCBvdGhlciBsYXJnZXIgbGlicy4pXG5cbiAgLy8gSWYgbm8gZXZlbnQgc291cmNlcywgdGhlbiBnbyBhaGVhZCBhbmQgcnVuIGZsb3cgdXNpbmcgdGhlIGZpcnN0IC50byBhcyBvdXIgZXZlbnQgc291cmNlLlxuICBpZiAoZmxvdy5waXBlcy5ldmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3QgdGFyZ2V0OiBGbG93UGlwZSA9IGZsb3cucGlwZXMudGFyZ2V0c1swXVxuICAgIGNhbGxOZXh0LmNhbGwoZmxvdywgMCwgdGFyZ2V0KVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gRm9yIGVhY2ggZXZlbnQgc291cmNlLCBnbyBhaGVhZCBhbmQgY2FsbCBpdCB0byBpbml0IHRoZSBldmVudHMuXG4gIGZvciAoY29uc3QgZXZlbnQ6IEZsb3dQaXBlIG9mIGZsb3cucGlwZXMuZXZlbnRzKSB7XG4gICAgY2FsbE5leHQuY2FsbChmbG93LCAtMSwgZXZlbnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbE5leHQoaW5kZXg6IG51bWJlciwgbmV4dDogRmxvd1BpcGUsIC4uLnBhcmFtcykge1xuICBjb25zb2xlLmxvZygnTmV4dCB0YXJnZXQ6JylcbiAgY29uc29sZS5sb2cobmV4dClcblxuICBjb25zdCBmbG93OiBGbG93SW50ZXJmYWNlID0gdGhpc1xuXG4gIGZ1bmN0aW9uIHBpcGVDYWxsYmFjaygpIHtcbiAgICBjb25zb2xlLmxvZyhuZXh0LnRhcmdldC5uYW1lLCAndXNlZCBjYWxsYmFjaycpXG4gICAgbmV4dFBpcGUuY2FsbChmbG93LCBpbmRleCArIDEsIC4uLkFycmF5LmZyb20oYXJndW1lbnRzKSlcbiAgfVxuXG4gIGNvbnN0IHByb3BzID0gWy4uLnBhcmFtcywgLi4ubmV4dC5wYXJhbXNdXG4gIHByb3BzLnB1c2gocGlwZUNhbGxiYWNrKVxuICBjb25zb2xlLmxvZyhuZXh0LnRhcmdldC5uYW1lLCAncHJvcHMnLCBwcm9wcylcblxuICAvLyBUT0RPOiBXcmFwIGluIHRyeSBjYXRjaCBleHByZXNzaW9uIHRvIGNhdGNoIGVycm9ycy5cbiAgY29uc3QgcmV0VmFsdWUgPSBuZXh0LnRhcmdldC5hcHBseSh7fSwgcHJvcHMpXG4gIGNvbnN0IHJldFR5cGUgPSB0eXBlb2YgcmV0VmFsdWVcblxuICBpZiAocmV0VHlwZSA9PT0gJ29iamVjdCcgJiYgcmV0VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgcmV0VmFsdWUudGhlbigoLi4uYXJncykgPT4gcGlwZUNhbGxiYWNrLmNhbGwobnVsbCwgLi4uQXJyYXkuZnJvbShhcmdzKSkpXG4gIH1cblxufVxuXG5mdW5jdGlvbiBuZXh0UGlwZShpbmRleDogbnVtYmVyLCAuLi5wcm9wcykge1xuICBjb25zb2xlLmxvZygnbmV4dDonLCBpbmRleClcbiAgY29uc29sZS5sb2coJ2FyZ3M6JywgYXJndW1lbnRzKVxuXG4gIGNvbnN0IHRhcmdldHMgPSB0aGlzLnBpcGVzLnRhcmdldHNcbiAgY29uc3QgbmV4dCA9IHRhcmdldHNbaW5kZXhdXG5cbiAgLy8gSWYgd2UncmUgYXQgdGhlIGVuZCBvZiB0aGUgZmxvd1xuICBpZiAoIW5leHQgfHwgIW5leHQudGFyZ2V0KSB7XG4gICAgdGhpcy5mbG93UnVubmluZyA9IGZhbHNlXG5cbiAgICBpZiAodGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkKSB7XG4gICAgICB0aGlzLnByb21pc2lmaWVkLnJlc29sdmUoLi4ucHJvcHMpXG4gICAgICB0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQgPSBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBjb25zb2xlLmxvZygnRW5kIG9mIGZsb3cgYXQnLCBpbmRleClcbiAgfVxuXG4gIGNhbGxOZXh0LmNhbGwodGhpcywgaW5kZXgsIG5leHQsIC4uLnByb3BzKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvcnMoKSB7XG4gIC8vIFNwZWNpYWwgdXNlIGNhc2VzXG4gIC8vIFlvdSBuZWVkIHNwZWNpYWwgZXJyb3IgaGFuZGxlciBldmVudHMgZm9yIG1vZHVsZXMgdGhhdCBleHBlY3QgdG8gdXNlIHRoZW1cbiAgLy8gWW91IGNhbiBwYXNzIHRoZXNlIGVycm9ycyB0byB0eXBpY2FsIGVycm9yIGhhbmRsZXJzIGxpa2UgdGhyb3cgdXNpbmcgdGhlIHN5bnRheDpcbiAgLy8gLm9uRXJyb3IoZXJyID0+IHRocm93IG5ldyBFcnJvcihlcnIpKVxuXG4gIC8vIE9uY2UgdGhpcyBpcyBmaW5pc2hlZCwgbG9vayBmb3IgYW55IC5vcigpIGJyYW5jaGVzIHRvIGNvbnRpbnVlIGNoYWluLlxuICAvLyAub3IoKSB3aWxsIHN0YXJ0IGEgbmV3IGZsb3cgYW5kIGxpbmsgdGhlc2UgdHdvIEZsb3dzIHRvZ2V0aGVyLlxufVxuXG5leHBvcnQgeyBydW5GbG93IH1cbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dNZXRob2RzSW50ZXJmYWNlLFxuXG4gIHR5cGUgRmxvd0RpcmVjdGlvbixcbiAgdHlwZSBGbG93UGlwZSxcblxuICB0eXBlIEZsb3dJbml0aWFsaXplcixcbiAgdHlwZSBGbG93VGFyZ2V0LFxuXG59IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCB7IHJ1bkZsb3cgfSBmcm9tICcuL2NvcmUnXG5cbmNvbnN0IEZsb3dNZXRob2RzOiBGbG93TWV0aG9kc0ludGVyZmFjZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gSWYgdGFyZ2V0IGlzIGEgY2xhc3Mgb3IgaW5pdGlhbGl6ZXIgb2Ygc29tZSBraW5kLlxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ2luaXQnLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICB0bzogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAndG8nLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBmcm9tOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyBTcGF3biBhIG5ldyBGbG93IChpZiBuZWVkZWQpLCBiZWNhdXNlIGl0cyBhIG5ldyBFdmVudCBTb3VyY2UuXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnZnJvbScsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHJ1bjogZnVuY3Rpb24oKTogdm9pZCB8IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZClcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgICAgdGhpcy5wcm9taXNpZmllZC5yZWplY3QgPSByZWplY3RcbiAgICAgICAgcnVuRmxvdy5jYWxsKHRoaXMpXG4gICAgICB9KVxuICAgIGVsc2VcbiAgICAgIHJ1bkZsb3cuY2FsbCh0aGlzKVxuICB9LFxuXG4gIHdhaXRGb3I6IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIHdhaXRGb3Igd2lsbCBhY2NlcHQgYSBjb25kaXRpb25hbCBhbmQgdmFsdWUgKHVzaW5nIGEgcHJveHkpIG9yIGZ1bmN0aW9uXG4gICAgLy8gd2FpdEZvciB3aWxsIGFsc28gYWNjZXB0IGEgZmxvdywgYW5kIGNoZWNrIGlmIHdhaXRpbmdGb3JFdmVudCA9IGZhbHNlXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnd2FpdEZvcicsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHByb21pc2lmeTogZnVuY3Rpb24oKTogRmxvd0ludGVyZmFjZSB7XG4gICAgdGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkID0gdHJ1ZVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgLypvcjogZnVuY3Rpb24oKSB7XG5cbiAgfSwqL1xuXG59XG5cbmZ1bmN0aW9uIGlzQ29uc3RydWN0b3IoZikge1xuICB0cnkge1xuICAgIFJlZmxlY3QuY29uc3RydWN0KFN0cmluZywgW10sIGYpO1xuICAgIHJldHVybiB0cnVlXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG4vLyBQaXBlIGNvbnRyb2xcbmZ1bmN0aW9uIGFkZFBpcGUoZGlyZWN0aW9uOiBGbG93RGlyZWN0aW9uLCB0YXJnZXQ6IEZsb3dUYXJnZXQsIHBhcmFtczogQXJyYXk8YW55Pik6IEZsb3dJbnRlcmZhY2Uge1xuICAvL2lmICh0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKVxuICAvLyAgdGhyb3cgbmV3IEVycm9yKCdGbG93IGV4cGVjdGVkIGEgZnVuY3Rpb24gYnV0IHJlY2VpdmVkIFwiJyArIHR5cGVvZiB0YXJnZXQgKyAnXCIgaW5zdGVhZCEnKVxuXG4gIC8vaWYgKGlzUHJpbWl0aXZlKHRhcmdldCkpXG4gIC8vICB0YXJnZXQgPSB3cmFwVGFyZ2V0KHRhcmdldClcblxuICBjb25zdCBwaXBlOiBGbG93UGlwZSA9IHtcbiAgICBkaXJlY3Rpb24sXG4gICAgdGFyZ2V0LFxuICAgIHBhcmFtcyxcbiAgfVxuXG4gIGNvbnN0IGZsb3cgPSB0aGlzXG4gIHN3aXRjaCAocGlwZS5kaXJlY3Rpb24pIHtcbiAgICBjYXNlICdpbml0JzpcbiAgICAgIGlmICghaXNDb25zdHJ1Y3Rvcih0YXJnZXQpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Zsb3cgdGFyZ2V0IGlzIG5vdCBhIGNvbnN0cnVjdG9yIScpXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2luaXQgYWRkZWQgZm9yOicsIHBpcGUpXG4gICAgICAvL2Zsb3cucGlwZXMuaW5pdC5wdXNoKHBpcGUpXG4gICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyB0YXJnZXQoLi4ucGFyYW1zKVxuICAgICAgZmxvdy5waXBlcy5pbml0LnB1c2goaW5zdGFuY2UpXG5cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdmcm9tJzpcbiAgICAgIGNvbnNvbGUubG9nKCdmcm9tIGFkZGVkIGZvcjonLCBwaXBlKVxuICAgICAgZmxvdy5waXBlcy5ldmVudHMucHVzaChwaXBlKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ3RvJzpcbiAgICAgIGZsb3cucGlwZXMudGFyZ2V0cy5wdXNoKHBpcGUpXG4gICAgICBicmVha1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIFNob3VsZG4ndCBiZSBoZXJlLlxuICAgICAgY29uc29sZS53YXJuKCdXQVJOSU5HOiBGbG93IGhhcyByZWNlaXZlZCBhbiB1bmtub3duIHBpcGUgZGlyZWN0aW9uLiBQbGVhc2UgcG9zdCBhIGJ1ZyB0byB0aGUgYXV0aG9yIGFib3V0IHRoaXMuJylcbiAgICAgIGJyZWFrXG4gIH1cblxuICBjb25zb2xlLmxvZyhgQWRkZWQgLiR7ZGlyZWN0aW9ufSgke3RhcmdldC5uYW1lIHx8ICdhbm9ueW1vdXMnfSlgKVxuICByZXR1cm4gdGhpc1xufVxuXG5leHBvcnQgZGVmYXVsdCBGbG93TWV0aG9kc1xuIiwiLy8gQGZsb3dcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQge1xuICB0eXBlIEZsb3dJbnRlcmZhY2UsXG4gIHR5cGUgRmxvd1BpcGVzLFxuICB0eXBlIEZsb3dQaXBlLFxuICB0eXBlIFBpcGVQcm9taXNlLFxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5pbXBvcnQgRmxvd01ldGhvZHMgZnJvbSAnLi9tZXRob2RzJ1xuXG5jbGFzcyBGbG93IGltcGxlbWVudHMgRmxvd0ludGVyZmFjZSB7XG4gIHBpcGVzOiBGbG93UGlwZXMgPSB7XG4gICAgaW5pdDogW10sXG4gICAgZXZlbnRzOiBbXSxcbiAgICB0YXJnZXRzOiBbXSxcbiAgfVxuXG4gIGZsb3dSdW5uaW5nOiBib29sZWFuID0gZmFsc2VcblxuICBwcm9taXNpZmllZDogUGlwZVByb21pc2UgPSB7XG4gICAgaXNQcm9taXNlZDogZmFsc2UsXG4gICAgcmVzb2x2ZTogKCkgPT4ge30sXG4gICAgcmVqZWN0OiAoKSA9PiB7fSxcbiAgfVxuXG4gIGluaXQ6IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMuaW5pdFxuICB0bzogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy50b1xuICBmcm9tOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLmZyb21cbiAgcnVuOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnJ1blxuICBwcm9taXNpZnk6IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMucHJvbWlzaWZ5XG5cbiAgc3RhdGljIG1vZHVsZXM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fVxuICBtb2R1bGVzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge31cblxuICB0aHJlYWQoKTogRmxvd0ludGVyZmFjZSB8IFByb3h5PGFueT4ge1xuICAgIHJldHVybiBuZXcgRmxvdygpXG4gIH1cblxuICBzdGF0aWMgdXNlKG5hbWU6IHN0cmluZywgbW9kdWxlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5tb2R1bGVzW25hbWVdKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKG5hbWUgKyAnIGNvbGxpZGVzIHdpdGggZXhpc3RpbmcgRmxvdyBtb2R1bGUgb3IgcHJvcGVydHkuJylcblxuICAgIHRoaXMubW9kdWxlc1tuYW1lXSA9IG1vZHVsZVxuICB9XG5cbiAgY29uc3RydWN0b3IoKTogUHJveHk8YW55PiB7XG4gICAgdGhpcy5tb2R1bGVzID0gdGhpcy5jb25zdHJ1Y3Rvci5tb2R1bGVzXG5cbiAgICByZXR1cm4gbmV3IFByb3h5KHRoaXMsIHtcbiAgICAgIGdldDogZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAoUmVmbGVjdC5oYXModGFyZ2V0LCBwcm9wZXJ0eSkpXG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcGVydHkpXG4gICAgICAgIGVsc2UgaWYgKFJlZmxlY3QuaGFzKHRhcmdldC5tb2R1bGVzLCBwcm9wZXJ0eSkpXG4gICAgICAgICAgcmV0dXJuIHRhcmdldC5tb2R1bGVzW3Byb3BlcnR5XVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRmxvd1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0VBVXNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkE2QlM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUJDckJJLENBQUM7Ozs7Ozs7Ozt3QkFTQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFrRHhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2pFUzs7Ozs7OzthQU9SOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBcUJZLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
