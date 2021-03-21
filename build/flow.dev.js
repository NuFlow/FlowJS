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

function callNext(index, next, ...params) {
  console.log('Next target:');
  console.log(next);

  const flow = this;

  function pipeCallback() {
    console.log(next.target.name, 'used callback');
    nextPipe.call(flow, index + 1, ...Array.from(arguments));
  }

  const props = [...params, ...next.params];
  props.push(pipeCallback);
  console.log(next.target.name, 'props', props);

  // TODO: Wrap in try catch expression to catch errors.
  const retValue = next.target.apply({}, props);
  const retType = typeof retValue;

  if (retType === 'object' && retValue instanceof Promise) {
    retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)));
  }

}

function nextPipe(index, ...props) {
  console.log('next:', index);
  console.log('args:', arguments);

  const targets = this.pipes.targets;
  const next = targets[index];

  // If we're at the end of the flow
  if (!next || !next.target) {
    this.flowRunning = false;

    if (this.promisified.isPromised) {
      this.promisified.resolve(...props);
      this.promisified.isPromised = false;
    }

    return console.log('End of flow at', index)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5kZXYuanMiLCJzb3VyY2VzIjpbIi4uL2xpYi9jb3JlLmpzIiwiLi4vbGliL21ldGhvZHMuanMiLCIuLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQge1xuICB0eXBlIEZsb3dJbnRlcmZhY2UsXG4gIHR5cGUgRmxvd01ldGhvZHNJbnRlcmZhY2UsXG5cbiAgdHlwZSBGbG93RGlyZWN0aW9uLFxuICB0eXBlIEZsb3dQaXBlLFxuXG4gIHR5cGUgRmxvd0luaXRpYWxpemVyLFxuICB0eXBlIEZsb3dUYXJnZXQsXG5cbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuZnVuY3Rpb24gcnVuRmxvdygpIHtcbiAgY29uc3QgZmxvdzogRmxvd0ludGVyZmFjZSA9IHRoaXNcbiAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGZsb3cnKVxuXG4gIGlmIChmbG93LmZsb3dSdW5uaW5nKVxuICAgIHJldHVyblxuXG4gIGZsb3cuZmxvd1J1bm5pbmcgPSB0cnVlXG5cbiAgLy8gVE9ETzogQ2FsbCBhbGwgaW5pdCBwaXBlcyBmaXJzdCwgc28gdGhleSBjYW4gcHJvcGVybHkgaW5pdGlhbGl6ZS4gKE5lZWRlZCBmb3IgY2xhc3NlcyBhbmQgb3RoZXIgbGFyZ2VyIGxpYnMuKVxuXG4gIC8vIElmIG5vIGV2ZW50IHNvdXJjZXMsIHRoZW4gZ28gYWhlYWQgYW5kIHJ1biBmbG93IHVzaW5nIHRoZSBmaXJzdCAudG8gYXMgb3VyIGV2ZW50IHNvdXJjZS5cbiAgaWYgKGZsb3cucGlwZXMuZXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IHRhcmdldDogRmxvd1BpcGUgPSBmbG93LnBpcGVzLnRhcmdldHNbMF1cbiAgICBjYWxsTmV4dC5jYWxsKGZsb3csIDAsIHRhcmdldClcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIEZvciBlYWNoIGV2ZW50IHNvdXJjZSwgZ28gYWhlYWQgYW5kIGNhbGwgaXQgdG8gaW5pdCB0aGUgZXZlbnRzLlxuICBmb3IgKGNvbnN0IGV2ZW50OiBGbG93UGlwZSBvZiBmbG93LnBpcGVzLmV2ZW50cykge1xuICAgIGNhbGxOZXh0LmNhbGwoZmxvdywgLTEsIGV2ZW50KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxOZXh0KGluZGV4LCBuZXh0LCAuLi5wYXJhbXMpIHtcbiAgY29uc29sZS5sb2coJ05leHQgdGFyZ2V0OicpXG4gIGNvbnNvbGUubG9nKG5leHQpXG5cbiAgY29uc3QgZmxvdzogRmxvd0ludGVyZmFjZSA9IHRoaXNcblxuICBmdW5jdGlvbiBwaXBlQ2FsbGJhY2soKSB7XG4gICAgY29uc29sZS5sb2cobmV4dC50YXJnZXQubmFtZSwgJ3VzZWQgY2FsbGJhY2snKVxuICAgIG5leHRQaXBlLmNhbGwoZmxvdywgaW5kZXggKyAxLCAuLi5BcnJheS5mcm9tKGFyZ3VtZW50cykpXG4gIH1cblxuICBjb25zdCBwcm9wcyA9IFsuLi5wYXJhbXMsIC4uLm5leHQucGFyYW1zXVxuICBwcm9wcy5wdXNoKHBpcGVDYWxsYmFjaylcbiAgY29uc29sZS5sb2cobmV4dC50YXJnZXQubmFtZSwgJ3Byb3BzJywgcHJvcHMpXG5cbiAgLy8gVE9ETzogV3JhcCBpbiB0cnkgY2F0Y2ggZXhwcmVzc2lvbiB0byBjYXRjaCBlcnJvcnMuXG4gIGNvbnN0IHJldFZhbHVlID0gbmV4dC50YXJnZXQuYXBwbHkoe30sIHByb3BzKVxuICBjb25zdCByZXRUeXBlID0gdHlwZW9mIHJldFZhbHVlXG5cbiAgaWYgKHJldFR5cGUgPT09ICdvYmplY3QnICYmIHJldFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIHJldFZhbHVlLnRoZW4oKC4uLmFyZ3MpID0+IHBpcGVDYWxsYmFjay5jYWxsKG51bGwsIC4uLkFycmF5LmZyb20oYXJncykpKVxuICB9XG5cbn1cblxuZnVuY3Rpb24gbmV4dFBpcGUoaW5kZXgsIC4uLnByb3BzKSB7XG4gIGNvbnNvbGUubG9nKCduZXh0OicsIGluZGV4KVxuICBjb25zb2xlLmxvZygnYXJnczonLCBhcmd1bWVudHMpXG5cbiAgY29uc3QgdGFyZ2V0cyA9IHRoaXMucGlwZXMudGFyZ2V0c1xuICBjb25zdCBuZXh0ID0gdGFyZ2V0c1tpbmRleF1cblxuICAvLyBJZiB3ZSdyZSBhdCB0aGUgZW5kIG9mIHRoZSBmbG93XG4gIGlmICghbmV4dCB8fCAhbmV4dC50YXJnZXQpIHtcbiAgICB0aGlzLmZsb3dSdW5uaW5nID0gZmFsc2VcblxuICAgIGlmICh0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQpIHtcbiAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZSguLi5wcm9wcylcbiAgICAgIHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZCA9IGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnNvbGUubG9nKCdFbmQgb2YgZmxvdyBhdCcsIGluZGV4KVxuICB9XG5cbiAgY2FsbE5leHQuY2FsbCh0aGlzLCBpbmRleCwgbmV4dCwgLi4ucHJvcHMpXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9ycygpIHtcbiAgLy8gU3BlY2lhbCB1c2UgY2FzZXNcbiAgLy8gWW91IG5lZWQgc3BlY2lhbCBlcnJvciBoYW5kbGVyIGV2ZW50cyBmb3IgbW9kdWxlcyB0aGF0IGV4cGVjdCB0byB1c2UgdGhlbVxuICAvLyBZb3UgY2FuIHBhc3MgdGhlc2UgZXJyb3JzIHRvIHR5cGljYWwgZXJyb3IgaGFuZGxlcnMgbGlrZSB0aHJvdyB1c2luZyB0aGUgc3ludGF4OlxuICAvLyAub25FcnJvcihlcnIgPT4gdGhyb3cgbmV3IEVycm9yKGVycikpXG5cbiAgLy8gT25jZSB0aGlzIGlzIGZpbmlzaGVkLCBsb29rIGZvciBhbnkgLm9yKCkgYnJhbmNoZXMgdG8gY29udGludWUgY2hhaW4uXG4gIC8vIC5vcigpIHdpbGwgc3RhcnQgYSBuZXcgZmxvdyBhbmQgbGluayB0aGVzZSB0d28gRmxvd3MgdG9nZXRoZXIuXG59XG5cbmV4cG9ydCB7IHJ1bkZsb3cgfVxuIiwiLy8gQGZsb3dcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQge1xuICB0eXBlIEZsb3dJbnRlcmZhY2UsXG4gIHR5cGUgRmxvd01ldGhvZHNJbnRlcmZhY2UsXG5cbiAgdHlwZSBGbG93RGlyZWN0aW9uLFxuICB0eXBlIEZsb3dQaXBlLFxuXG4gIHR5cGUgRmxvd0luaXRpYWxpemVyLFxuICB0eXBlIEZsb3dUYXJnZXQsXG5cbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuaW1wb3J0IHsgcnVuRmxvdyB9IGZyb20gJy4vY29yZSdcblxuY29uc3QgRmxvd01ldGhvZHM6IEZsb3dNZXRob2RzSW50ZXJmYWNlID0ge1xuICBpbml0OiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyBJZiB0YXJnZXQgaXMgYSBjbGFzcyBvciBpbml0aWFsaXplciBvZiBzb21lIGtpbmQuXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnaW5pdCcsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHRvOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICd0bycsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIGZyb206IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIFNwYXduIGEgbmV3IEZsb3cgKGlmIG5lZWRlZCksIGJlY2F1c2UgaXRzIGEgbmV3IEV2ZW50IFNvdXJjZS5cbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICdmcm9tJywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgcnVuOiBmdW5jdGlvbigpOiB2b2lkIHwgUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkKVxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5wcm9taXNpZmllZC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgICAgICB0aGlzLnByb21pc2lmaWVkLnJlamVjdCA9IHJlamVjdFxuICAgICAgICBydW5GbG93LmNhbGwodGhpcylcbiAgICAgIH0pXG4gICAgZWxzZVxuICAgICAgcnVuRmxvdy5jYWxsKHRoaXMpXG4gIH0sXG5cbiAgd2FpdEZvcjogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gd2FpdEZvciB3aWxsIGFjY2VwdCBhIGNvbmRpdGlvbmFsIGFuZCB2YWx1ZSAodXNpbmcgYSBwcm94eSkgb3IgZnVuY3Rpb25cbiAgICAvLyB3YWl0Rm9yIHdpbGwgYWxzbyBhY2NlcHQgYSBmbG93LCBhbmQgY2hlY2sgaWYgd2FpdGluZ0ZvckV2ZW50ID0gZmFsc2VcbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICd3YWl0Rm9yJywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgcHJvbWlzaWZ5OiBmdW5jdGlvbigpOiBGbG93SW50ZXJmYWNlIHtcbiAgICB0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQgPSB0cnVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcblxuICAvKm9yOiBmdW5jdGlvbigpIHtcblxuICB9LCovXG5cbn1cblxuZnVuY3Rpb24gaXNDb25zdHJ1Y3RvcihmKSB7XG4gIHRyeSB7XG4gICAgUmVmbGVjdC5jb25zdHJ1Y3QoU3RyaW5nLCBbXSwgZik7XG4gICAgcmV0dXJuIHRydWVcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbi8vIFBpcGUgY29udHJvbFxuZnVuY3Rpb24gYWRkUGlwZShkaXJlY3Rpb246IEZsb3dEaXJlY3Rpb24sIHRhcmdldDogRmxvd1RhcmdldCwgcGFyYW1zOiBBcnJheTxhbnk+KTogRmxvd0ludGVyZmFjZSB7XG4gIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBFcnJvcignRmxvdyBleHBlY3RlZCBhIGZ1bmN0aW9uIGJ1dCByZWNlaXZlZCBcIicgKyB0eXBlb2YgdGFyZ2V0ICsgJ1wiIGluc3RlYWQhJylcblxuICAvLyBJZiB3ZSBoYXZlIGEgcGlwZSBkaXJlY3Rpb24gYnV0IG5vdCBpbml0LCBhbmQgd2UgaGF2ZSBhIGNvbnN0cnVjdG9yLCB0aGVuIGluaXQgaXQgZmlyc3QuXG4gIC8vaWYgKGRpcmVjdGlvbiAhPT0gJ2luaXQnICYmIHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicgJiYgaXNDb25zdHJ1Y3Rvcih0YXJnZXQpKVxuICAvLyAgYWRkUGlwZS5jYWxsKHRoaXMsICdpbml0JywgdGFyZ2V0LCBbLi4ucGFyYW1zXSlcblxuICBjb25zdCBwaXBlOiBGbG93UGlwZSA9IHtcbiAgICBkaXJlY3Rpb24sXG4gICAgdGFyZ2V0LFxuICAgIHBhcmFtcyxcbiAgfVxuXG4gIGNvbnN0IGZsb3cgPSB0aGlzXG4gIHN3aXRjaCAocGlwZS5kaXJlY3Rpb24pIHtcbiAgICBjYXNlICdpbml0JzpcbiAgICAgIGlmICghaXNDb25zdHJ1Y3Rvcih0YXJnZXQpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Zsb3cgdGFyZ2V0IGlzIG5vdCBhIGNvbnN0cnVjdG9yIScpXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2luaXQgYWRkZWQgZm9yOicsIHBpcGUpXG4gICAgICAvL2Zsb3cucGlwZXMuaW5pdC5wdXNoKHBpcGUpXG4gICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyB0YXJnZXQoLi4ucGFyYW1zKVxuICAgICAgZmxvdy5waXBlcy5pbml0LnB1c2goaW5zdGFuY2UpXG5cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdmcm9tJzpcbiAgICAgIGNvbnNvbGUubG9nKCdmcm9tIGFkZGVkIGZvcjonLCBwaXBlKVxuICAgICAgZmxvdy5waXBlcy5ldmVudHMucHVzaChwaXBlKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ3RvJzpcbiAgICAgIGZsb3cucGlwZXMudGFyZ2V0cy5wdXNoKHBpcGUpXG4gICAgICBicmVha1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIFNob3VsZG4ndCBiZSBoZXJlLlxuICAgICAgY29uc29sZS53YXJuKCdXQVJOSU5HOiBGbG93IGhhcyByZWNlaXZlZCBhbiB1bmtub3duIHBpcGUgZGlyZWN0aW9uLiBQbGVhc2UgcG9zdCBhIGJ1ZyB0byB0aGUgYXV0aG9yIGFib3V0IHRoaXMuJylcbiAgICAgIGJyZWFrXG4gIH1cblxuICBjb25zb2xlLmxvZyhgQWRkZWQgLiR7ZGlyZWN0aW9ufSgke3RhcmdldC5uYW1lIHx8ICdhbm9ueW1vdXMnfSlgKVxuICByZXR1cm4gdGhpc1xufVxuXG5leHBvcnQgZGVmYXVsdCBGbG93TWV0aG9kc1xuIiwiLy8gQGZsb3dcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQge1xuICB0eXBlIEZsb3dJbnRlcmZhY2UsXG4gIHR5cGUgRmxvd1BpcGVzLFxuICB0eXBlIEZsb3dQaXBlLFxuICB0eXBlIFBpcGVQcm9taXNlLFxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5pbXBvcnQgRmxvd01ldGhvZHMgZnJvbSAnLi9tZXRob2RzJ1xuXG5jbGFzcyBGbG93IGltcGxlbWVudHMgRmxvd0ludGVyZmFjZSB7XG4gIHBpcGVzOiBGbG93UGlwZXMgPSB7XG4gICAgaW5pdDogW10sXG4gICAgZXZlbnRzOiBbXSxcbiAgICB0YXJnZXRzOiBbXSxcbiAgfVxuXG4gIGZsb3dSdW5uaW5nOiBib29sZWFuID0gZmFsc2VcblxuICBwcm9taXNpZmllZDogUGlwZVByb21pc2UgPSB7XG4gICAgaXNQcm9taXNlZDogZmFsc2UsXG4gICAgcmVzb2x2ZTogKCkgPT4ge30sXG4gICAgcmVqZWN0OiAoKSA9PiB7fSxcbiAgfVxuXG4gIGluaXQ6IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMuaW5pdFxuICB0bzogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy50b1xuICBmcm9tOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLmZyb21cbiAgcnVuOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnJ1blxuICBwcm9taXNpZnk6IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMucHJvbWlzaWZ5XG5cbiAgc3RhdGljIG1vZHVsZXM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fVxuICBtb2R1bGVzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge31cblxuICB0aHJlYWQoKTogRmxvd0ludGVyZmFjZSB8IFByb3h5PGFueT4ge1xuICAgIHJldHVybiBuZXcgRmxvdygpXG4gIH1cblxuICBzdGF0aWMgdXNlKG5hbWU6IHN0cmluZywgbW9kdWxlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5tb2R1bGVzW25hbWVdKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKG5hbWUgKyAnIGNvbGxpZGVzIHdpdGggZXhpc3RpbmcgRmxvdyBtb2R1bGUgb3IgcHJvcGVydHkuJylcblxuICAgIHRoaXMubW9kdWxlc1tuYW1lXSA9IG1vZHVsZVxuICB9XG5cbiAgY29uc3RydWN0b3IoKTogUHJveHk8YW55PiB7XG4gICAgdGhpcy5tb2R1bGVzID0gdGhpcy5jb25zdHJ1Y3Rvci5tb2R1bGVzXG5cbiAgICByZXR1cm4gbmV3IFByb3h5KHRoaXMsIHtcbiAgICAgIGdldDogZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAoUmVmbGVjdC5oYXModGFyZ2V0LCBwcm9wZXJ0eSkpXG4gICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcGVydHkpXG4gICAgICAgIGVsc2UgaWYgKFJlZmxlY3QuaGFzKHRhcmdldC5tb2R1bGVzLCBwcm9wZXJ0eSkpXG4gICAgICAgICAgcmV0dXJuIHRhcmdldC5tb2R1bGVzW3Byb3BlcnR5XVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRmxvd1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0VBVXNCO0VBQ0w7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkNPa0IsQ0FBQzs7Ozs7Ozs7O3dCQVNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFtRHhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2xFUzs7Ozs7OzthQU9SOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBcUJZLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
