'use strict';

// 

function runFlow() {
  const flow = this;
  console.log('Starting flow');

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

function callNext(index, next, data) {
  console.log('Next target:');
  console.log(next);

  const props = next.params; //destructure(target, event.params)
  console.log(next.target.name, 'props', props);

  if (data)
    props.push(data);

  const flow = this;

  function pipeCallback() {
    console.log(next.target.name, 'used callback');
    nextPipe.call(flow, index + 1, ...Array.from(arguments));
  }

  props.push(pipeCallback);

  const retValue = next.target.apply({}, props);
  const retType = typeof retValue;

  if (retType === 'object' && retValue instanceof Promise) {
    //retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)))
    retValue.then((...args) =>  pipeCallback.apply(null, [null, ...Array.from(args)]));
  }

}

function nextPipe(index, err, data) {
  //console.log('next:', index)
  //console.log('err:', err)
  //console.log('data:', data)

  const targets = this.pipes.targets;
  const next = targets[index];

  if (err) {
    //this.hasError = true
    //this.errorData = err
    //handleErrors.call(this)

    // TODO: If we have a promise, then its a good time to reject it.
    return
  }

  // If we're at the end of the flow
  if (!next || !next.target) {
    this.flowRunning = false;

    if (this.promisified.isPromised) {
      this.promisified.resolve(data);
      this.promisified.isPromised = false;
    }

    return console.log('End of flow at', index)
  }

  callNext.call(this, index, next, data);
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
  if (typeof target !== 'function')
    throw new Error('Flow expected a function but received "' + typeof target + '" instead!')

  // If we have a pipe direction but not init, and we have a constructor, then init it first.
  //if (direction !== 'init' && typeof target === 'function' && isConstructor(target))
  //  addPipe.call(this, 'init', target, [...params])

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
      console.log('from added for:', pipe);
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

  console.log(`Added .${direction}(${target.name || 'anonymous'})`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5kZXYuanMiLCJzb3VyY2VzIjpbIi4uL2xpYi9jb3JlLmpzIiwiLi4vbGliL21ldGhvZHMuanMiLCIuLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQge1xuICB0eXBlIEZsb3dJbnRlcmZhY2UsXG4gIHR5cGUgRmxvd01ldGhvZHNJbnRlcmZhY2UsXG5cbiAgdHlwZSBGbG93RGlyZWN0aW9uLFxuICB0eXBlIEZsb3dQaXBlLFxuXG4gIHR5cGUgRmxvd0luaXRpYWxpemVyLFxuICB0eXBlIEZsb3dUYXJnZXQsXG5cbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuZnVuY3Rpb24gcnVuRmxvdygpIHtcbiAgY29uc3QgZmxvdzogRmxvd0ludGVyZmFjZSA9IHRoaXNcbiAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGZsb3cnKVxuXG4gIGlmIChmbG93LmZsb3dSdW5uaW5nKVxuICAgIHJldHVyblxuXG4gIGZsb3cuZmxvd1J1bm5pbmcgPSB0cnVlXG5cbiAgLy8gVE9ETzogQ2FsbCBhbGwgaW5pdCBwaXBlcyBmaXJzdCwgc28gdGhleSBjYW4gcHJvcGVybHkgaW5pdGlhbGl6ZS4gKE5lZWRlZCBmb3IgY2xhc3NlcyBhbmQgb3RoZXIgbGFyZ2VyIGxpYnMuKVxuXG4gIC8vIElmIG5vIGV2ZW50IHNvdXJjZXMsIHRoZW4gZ28gYWhlYWQgYW5kIHJ1biBmbG93IHVzaW5nIHRoZSBmaXJzdCAudG8gYXMgb3VyIGV2ZW50IHNvdXJjZS5cbiAgaWYgKGZsb3cucGlwZXMuZXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IHRhcmdldDogRmxvd1BpcGUgPSBmbG93LnBpcGVzLnRhcmdldHNbMF1cbiAgICBjYWxsTmV4dC5jYWxsKGZsb3csIDAsIHRhcmdldClcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIEZvciBlYWNoIGV2ZW50IHNvdXJjZSwgZ28gYWhlYWQgYW5kIGNhbGwgaXQgdG8gaW5pdCB0aGUgZXZlbnRzLlxuICBmb3IgKGNvbnN0IGV2ZW50OiBGbG93UGlwZSBvZiBmbG93LnBpcGVzLmV2ZW50cykge1xuICAgIGNhbGxOZXh0LmNhbGwoZmxvdywgLTEsIGV2ZW50KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxOZXh0KGluZGV4LCBuZXh0LCBkYXRhKSB7XG4gIGNvbnNvbGUubG9nKCdOZXh0IHRhcmdldDonKVxuICBjb25zb2xlLmxvZyhuZXh0KVxuXG4gIGNvbnN0IHByb3BzID0gbmV4dC5wYXJhbXMgLy9kZXN0cnVjdHVyZSh0YXJnZXQsIGV2ZW50LnBhcmFtcylcbiAgY29uc29sZS5sb2cobmV4dC50YXJnZXQubmFtZSwgJ3Byb3BzJywgcHJvcHMpXG5cbiAgaWYgKGRhdGEpXG4gICAgcHJvcHMucHVzaChkYXRhKVxuXG4gIGNvbnN0IGZsb3cgPSB0aGlzXG5cbiAgZnVuY3Rpb24gcGlwZUNhbGxiYWNrKCkge1xuICAgIGNvbnNvbGUubG9nKG5leHQudGFyZ2V0Lm5hbWUsICd1c2VkIGNhbGxiYWNrJylcbiAgICBuZXh0UGlwZS5jYWxsKGZsb3csIGluZGV4ICsgMSwgLi4uQXJyYXkuZnJvbShhcmd1bWVudHMpKVxuICB9XG5cbiAgcHJvcHMucHVzaChwaXBlQ2FsbGJhY2spXG5cbiAgY29uc3QgcmV0VmFsdWUgPSBuZXh0LnRhcmdldC5hcHBseSh7fSwgcHJvcHMpXG4gIGNvbnN0IHJldFR5cGUgPSB0eXBlb2YgcmV0VmFsdWVcblxuICBpZiAocmV0VHlwZSA9PT0gJ29iamVjdCcgJiYgcmV0VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgLy9yZXRWYWx1ZS50aGVuKCguLi5hcmdzKSA9PiBwaXBlQ2FsbGJhY2suY2FsbChudWxsLCAuLi5BcnJheS5mcm9tKGFyZ3MpKSlcbiAgICByZXRWYWx1ZS50aGVuKCguLi5hcmdzKSA9PiAgcGlwZUNhbGxiYWNrLmFwcGx5KG51bGwsIFtudWxsLCAuLi5BcnJheS5mcm9tKGFyZ3MpXSkpXG4gIH1cblxufVxuXG5mdW5jdGlvbiBuZXh0UGlwZShpbmRleCwgZXJyLCBkYXRhKSB7XG4gIC8vY29uc29sZS5sb2coJ25leHQ6JywgaW5kZXgpXG4gIC8vY29uc29sZS5sb2coJ2VycjonLCBlcnIpXG4gIC8vY29uc29sZS5sb2coJ2RhdGE6JywgZGF0YSlcblxuICBjb25zdCB0YXJnZXRzID0gdGhpcy5waXBlcy50YXJnZXRzXG4gIGNvbnN0IG5leHQgPSB0YXJnZXRzW2luZGV4XVxuXG4gIGlmIChlcnIpIHtcbiAgICAvL3RoaXMuaGFzRXJyb3IgPSB0cnVlXG4gICAgLy90aGlzLmVycm9yRGF0YSA9IGVyclxuICAgIC8vaGFuZGxlRXJyb3JzLmNhbGwodGhpcylcblxuICAgIC8vIFRPRE86IElmIHdlIGhhdmUgYSBwcm9taXNlLCB0aGVuIGl0cyBhIGdvb2QgdGltZSB0byByZWplY3QgaXQuXG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBJZiB3ZSdyZSBhdCB0aGUgZW5kIG9mIHRoZSBmbG93XG4gIGlmICghbmV4dCB8fCAhbmV4dC50YXJnZXQpIHtcbiAgICB0aGlzLmZsb3dSdW5uaW5nID0gZmFsc2VcblxuICAgIGlmICh0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQpIHtcbiAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZShkYXRhKVxuICAgICAgdGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkID0gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gY29uc29sZS5sb2coJ0VuZCBvZiBmbG93IGF0JywgaW5kZXgpXG4gIH1cblxuICBjYWxsTmV4dC5jYWxsKHRoaXMsIGluZGV4LCBuZXh0LCBkYXRhKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvcnMoKSB7XG4gIC8vIFNwZWNpYWwgdXNlIGNhc2VzXG4gIC8vIFlvdSBuZWVkIHNwZWNpYWwgZXJyb3IgaGFuZGxlciBldmVudHMgZm9yIG1vZHVsZXMgdGhhdCBleHBlY3QgdG8gdXNlIHRoZW1cbiAgLy8gWW91IGNhbiBwYXNzIHRoZXNlIGVycm9ycyB0byB0eXBpY2FsIGVycm9yIGhhbmRsZXJzIGxpa2UgdGhyb3cgdXNpbmcgdGhlIHN5bnRheDpcbiAgLy8gLm9uRXJyb3IoZXJyID0+IHRocm93IG5ldyBFcnJvcihlcnIpKVxuXG4gIC8vIE9uY2UgdGhpcyBpcyBmaW5pc2hlZCwgbG9vayBmb3IgYW55IC5vcigpIGJyYW5jaGVzIHRvIGNvbnRpbnVlIGNoYWluLlxuICAvLyAub3IoKSB3aWxsIHN0YXJ0IGEgbmV3IGZsb3cgYW5kIGxpbmsgdGhlc2UgdHdvIEZsb3dzIHRvZ2V0aGVyLlxufVxuXG5leHBvcnQgeyBydW5GbG93IH1cbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dNZXRob2RzSW50ZXJmYWNlLFxuXG4gIHR5cGUgRmxvd0RpcmVjdGlvbixcbiAgdHlwZSBGbG93UGlwZSxcblxuICB0eXBlIEZsb3dJbml0aWFsaXplcixcbiAgdHlwZSBGbG93VGFyZ2V0LFxuXG59IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCB7IHJ1bkZsb3cgfSBmcm9tICcuL2NvcmUnXG5cbmNvbnN0IEZsb3dNZXRob2RzOiBGbG93TWV0aG9kc0ludGVyZmFjZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gSWYgdGFyZ2V0IGlzIGEgY2xhc3Mgb3IgaW5pdGlhbGl6ZXIgb2Ygc29tZSBraW5kLlxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ2luaXQnLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICB0bzogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAndG8nLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBmcm9tOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyBTcGF3biBhIG5ldyBGbG93IChpZiBuZWVkZWQpLCBiZWNhdXNlIGl0cyBhIG5ldyBFdmVudCBTb3VyY2UuXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnZnJvbScsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHJ1bjogZnVuY3Rpb24oKTogdm9pZCB8IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZClcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgICAgdGhpcy5wcm9taXNpZmllZC5yZWplY3QgPSByZWplY3RcbiAgICAgICAgcnVuRmxvdy5jYWxsKHRoaXMpXG4gICAgICB9KVxuICAgIGVsc2VcbiAgICAgIHJ1bkZsb3cuY2FsbCh0aGlzKVxuICB9LFxuXG4gIHdhaXRGb3I6IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIHdhaXRGb3Igd2lsbCBhY2NlcHQgYSBjb25kaXRpb25hbCBhbmQgdmFsdWUgKHVzaW5nIGEgcHJveHkpIG9yIGZ1bmN0aW9uXG4gICAgLy8gd2FpdEZvciB3aWxsIGFsc28gYWNjZXB0IGEgZmxvdywgYW5kIGNoZWNrIGlmIHdhaXRpbmdGb3JFdmVudCA9IGZhbHNlXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnd2FpdEZvcicsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHByb21pc2lmeTogZnVuY3Rpb24oKTogRmxvd0ludGVyZmFjZSB7XG4gICAgdGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkID0gdHJ1ZVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgLypvcjogZnVuY3Rpb24oKSB7XG5cbiAgfSwqL1xuXG59XG5cbmZ1bmN0aW9uIGlzQ29uc3RydWN0b3IoZikge1xuICB0cnkge1xuICAgIFJlZmxlY3QuY29uc3RydWN0KFN0cmluZywgW10sIGYpO1xuICAgIHJldHVybiB0cnVlXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG4vLyBQaXBlIGNvbnRyb2xcbmZ1bmN0aW9uIGFkZFBpcGUoZGlyZWN0aW9uOiBGbG93RGlyZWN0aW9uLCB0YXJnZXQ6IEZsb3dUYXJnZXQsIHBhcmFtczogQXJyYXk8YW55Pik6IEZsb3dJbnRlcmZhY2Uge1xuICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJylcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Zsb3cgZXhwZWN0ZWQgYSBmdW5jdGlvbiBidXQgcmVjZWl2ZWQgXCInICsgdHlwZW9mIHRhcmdldCArICdcIiBpbnN0ZWFkIScpXG5cbiAgLy8gSWYgd2UgaGF2ZSBhIHBpcGUgZGlyZWN0aW9uIGJ1dCBub3QgaW5pdCwgYW5kIHdlIGhhdmUgYSBjb25zdHJ1Y3RvciwgdGhlbiBpbml0IGl0IGZpcnN0LlxuICAvL2lmIChkaXJlY3Rpb24gIT09ICdpbml0JyAmJiB0eXBlb2YgdGFyZ2V0ID09PSAnZnVuY3Rpb24nICYmIGlzQ29uc3RydWN0b3IodGFyZ2V0KSlcbiAgLy8gIGFkZFBpcGUuY2FsbCh0aGlzLCAnaW5pdCcsIHRhcmdldCwgWy4uLnBhcmFtc10pXG5cbiAgY29uc3QgcGlwZTogRmxvd1BpcGUgPSB7XG4gICAgZGlyZWN0aW9uLFxuICAgIHRhcmdldCxcbiAgICBwYXJhbXMsXG4gIH1cblxuICBjb25zdCBmbG93ID0gdGhpc1xuICBzd2l0Y2ggKHBpcGUuZGlyZWN0aW9uKSB7XG4gICAgY2FzZSAnaW5pdCc6XG4gICAgICBpZiAoIWlzQ29uc3RydWN0b3IodGFyZ2V0KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGbG93IHRhcmdldCBpcyBub3QgYSBjb25zdHJ1Y3RvciEnKVxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdpbml0IGFkZGVkIGZvcjonLCBwaXBlKVxuICAgICAgLy9mbG93LnBpcGVzLmluaXQucHVzaChwaXBlKVxuICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdGFyZ2V0KC4uLnBhcmFtcylcbiAgICAgIGZsb3cucGlwZXMuaW5pdC5wdXNoKGluc3RhbmNlKVxuXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZnJvbSc6XG4gICAgICBjb25zb2xlLmxvZygnZnJvbSBhZGRlZCBmb3I6JywgcGlwZSlcbiAgICAgIGZsb3cucGlwZXMuZXZlbnRzLnB1c2gocGlwZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICd0byc6XG4gICAgICBmbG93LnBpcGVzLnRhcmdldHMucHVzaChwaXBlKVxuICAgICAgYnJlYWtcblxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBTaG91bGRuJ3QgYmUgaGVyZS5cbiAgICAgIGNvbnNvbGUud2FybignV0FSTklORzogRmxvdyBoYXMgcmVjZWl2ZWQgYW4gdW5rbm93biBwaXBlIGRpcmVjdGlvbi4gUGxlYXNlIHBvc3QgYSBidWcgdG8gdGhlIGF1dGhvciBhYm91dCB0aGlzLicpXG4gICAgICBicmVha1xuICB9XG5cbiAgY29uc29sZS5sb2coYEFkZGVkIC4ke2RpcmVjdGlvbn0oJHt0YXJnZXQubmFtZSB8fCAnYW5vbnltb3VzJ30pYClcbiAgcmV0dXJuIHRoaXNcbn1cblxuZXhwb3J0IGRlZmF1bHQgRmxvd01ldGhvZHNcbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dQaXBlcyxcbiAgdHlwZSBGbG93UGlwZSxcbiAgdHlwZSBQaXBlUHJvbWlzZSxcbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuaW1wb3J0IEZsb3dNZXRob2RzIGZyb20gJy4vbWV0aG9kcydcblxuY2xhc3MgRmxvdyBpbXBsZW1lbnRzIEZsb3dJbnRlcmZhY2Uge1xuICBwaXBlczogRmxvd1BpcGVzID0ge1xuICAgIGluaXQ6IFtdLFxuICAgIGV2ZW50czogW10sXG4gICAgdGFyZ2V0czogW10sXG4gIH1cblxuICBmbG93UnVubmluZzogYm9vbGVhbiA9IGZhbHNlXG5cbiAgcHJvbWlzaWZpZWQ6IFBpcGVQcm9taXNlID0ge1xuICAgIGlzUHJvbWlzZWQ6IGZhbHNlLFxuICAgIHJlc29sdmU6ICgpID0+IHt9LFxuICAgIHJlamVjdDogKCkgPT4ge30sXG4gIH1cblxuICBpbml0OiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLmluaXRcbiAgdG86IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMudG9cbiAgZnJvbTogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5mcm9tXG4gIHJ1bjogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5ydW5cbiAgcHJvbWlzaWZ5OiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnByb21pc2lmeVxuXG4gIHN0YXRpYyBtb2R1bGVzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge31cbiAgbW9kdWxlczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9XG5cbiAgdGhyZWFkKCk6IEZsb3dJbnRlcmZhY2UgfCBQcm94eTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IEZsb3coKVxuICB9XG5cbiAgc3RhdGljIHVzZShuYW1lOiBzdHJpbmcsIG1vZHVsZTogYW55KSB7XG4gICAgaWYgKHRoaXMubW9kdWxlc1tuYW1lXSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihuYW1lICsgJyBjb2xsaWRlcyB3aXRoIGV4aXN0aW5nIEZsb3cgbW9kdWxlIG9yIHByb3BlcnR5LicpXG5cbiAgICB0aGlzLm1vZHVsZXNbbmFtZV0gPSBtb2R1bGVcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCk6IFByb3h5PGFueT4ge1xuICAgIHRoaXMubW9kdWxlcyA9IHRoaXMuY29uc3RydWN0b3IubW9kdWxlc1xuXG4gICAgcmV0dXJuIG5ldyBQcm94eSh0aGlzLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKHRhcmdldCwgcHJvcGVydHkpIHtcbiAgICAgICAgaWYgKFJlZmxlY3QuaGFzKHRhcmdldCwgcHJvcGVydHkpKVxuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3BlcnR5KVxuICAgICAgICBlbHNlIGlmIChSZWZsZWN0Lmhhcyh0YXJnZXQubW9kdWxlcywgcHJvcGVydHkpKVxuICAgICAgICAgIHJldHVybiB0YXJnZXQubW9kdWxlc1twcm9wZXJ0eV1cbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEZsb3dcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztFQVVzQjtFQUNMOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkNPa0IsQ0FBQzs7Ozs7Ozs7O3dCQVNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFtRHhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2xFUzs7Ozs7OzthQU9SOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBcUJZLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
