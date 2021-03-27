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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5kZXYuanMiLCJzb3VyY2VzIjpbIi4uL2xpYi9jb3JlLmpzIiwiLi4vbGliL21ldGhvZHMuanMiLCIuLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQge1xuICB0eXBlIEZsb3dJbnRlcmZhY2UsXG4gIHR5cGUgRmxvd01ldGhvZHNJbnRlcmZhY2UsXG5cbiAgdHlwZSBGbG93RGlyZWN0aW9uLFxuICB0eXBlIEZsb3dQaXBlLFxuXG4gIHR5cGUgRmxvd0luaXRpYWxpemVyLFxuICB0eXBlIEZsb3dUYXJnZXQsXG5cbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuZnVuY3Rpb24gcnVuRmxvdygpIHtcbiAgY29uc3QgZmxvdzogRmxvd0ludGVyZmFjZSA9IHRoaXNcbiAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGZsb3cnKVxuXG4gIGlmIChmbG93LmZsb3dSdW5uaW5nKVxuICAgIHJldHVyblxuXG4gIGZsb3cuZmxvd1J1bm5pbmcgPSB0cnVlXG5cbiAgLy8gVE9ETzogQ2FsbCBhbGwgaW5pdCBwaXBlcyBmaXJzdCwgc28gdGhleSBjYW4gcHJvcGVybHkgaW5pdGlhbGl6ZS4gKE5lZWRlZCBmb3IgY2xhc3NlcyBhbmQgb3RoZXIgbGFyZ2VyIGxpYnMuKVxuXG4gIC8vIElmIG5vIGV2ZW50IHNvdXJjZXMsIHRoZW4gZ28gYWhlYWQgYW5kIHJ1biBmbG93IHVzaW5nIHRoZSBmaXJzdCAudG8gYXMgb3VyIGV2ZW50IHNvdXJjZS5cbiAgaWYgKGZsb3cucGlwZXMuZXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IHRhcmdldDogRmxvd1BpcGUgPSBmbG93LnBpcGVzLnRhcmdldHNbMF1cbiAgICBjYWxsTmV4dC5jYWxsKGZsb3csIDAsIHRhcmdldClcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIEZvciBlYWNoIGV2ZW50IHNvdXJjZSwgZ28gYWhlYWQgYW5kIGNhbGwgaXQgdG8gaW5pdCB0aGUgZXZlbnRzLlxuICBmb3IgKGNvbnN0IGV2ZW50OiBGbG93UGlwZSBvZiBmbG93LnBpcGVzLmV2ZW50cykge1xuICAgIGNhbGxOZXh0LmNhbGwoZmxvdywgLTEsIGV2ZW50KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxOZXh0KGluZGV4OiBudW1iZXIsIG5leHQ6IEZsb3dQaXBlLCAuLi5wYXJhbXMpIHtcbiAgY29uc29sZS5sb2coJ05leHQgdGFyZ2V0OicpXG4gIGNvbnNvbGUubG9nKG5leHQpXG5cbiAgY29uc3QgZmxvdzogRmxvd0ludGVyZmFjZSA9IHRoaXNcblxuICBmdW5jdGlvbiBwaXBlQ2FsbGJhY2soKSB7XG4gICAgY29uc29sZS5sb2cobmV4dC50YXJnZXQubmFtZSwgJ3VzZWQgY2FsbGJhY2snKVxuICAgIG5leHRQaXBlLmNhbGwoZmxvdywgaW5kZXggKyAxLCAuLi5BcnJheS5mcm9tKGFyZ3VtZW50cykpXG4gIH1cblxuICBjb25zdCBwcm9wcyA9IFsuLi5wYXJhbXMsIC4uLm5leHQucGFyYW1zXVxuICBwcm9wcy5wdXNoKHBpcGVDYWxsYmFjaylcbiAgY29uc29sZS5sb2cobmV4dC50YXJnZXQubmFtZSwgJ3Byb3BzJywgcHJvcHMpXG5cbiAgLy8gVE9ETzogV3JhcCBpbiB0cnkgY2F0Y2ggZXhwcmVzc2lvbiB0byBjYXRjaCBlcnJvcnMuXG4gIGNvbnN0IHJldFZhbHVlID0gbmV4dC50YXJnZXQuYXBwbHkoe30sIHByb3BzKVxuICBjb25zdCByZXRUeXBlID0gdHlwZW9mIHJldFZhbHVlXG5cbiAgaWYgKHJldFR5cGUgPT09ICdvYmplY3QnICYmIHJldFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIHJldFZhbHVlLnRoZW4oKC4uLmFyZ3MpID0+IHBpcGVDYWxsYmFjay5jYWxsKG51bGwsIC4uLkFycmF5LmZyb20oYXJncykpKVxuICB9XG5cbn1cblxuZnVuY3Rpb24gbmV4dFBpcGUoaW5kZXg6IG51bWJlciwgLi4ucHJvcHMpIHtcbiAgY29uc29sZS5sb2coJ25leHQ6JywgaW5kZXgpXG4gIGNvbnNvbGUubG9nKCdhcmdzOicsIGFyZ3VtZW50cylcblxuICBjb25zdCB0YXJnZXRzID0gdGhpcy5waXBlcy50YXJnZXRzXG4gIGNvbnN0IG5leHQgPSB0YXJnZXRzW2luZGV4XVxuXG4gIC8vIElmIHdlJ3JlIGF0IHRoZSBlbmQgb2YgdGhlIGZsb3dcbiAgaWYgKCFuZXh0IHx8ICFuZXh0LnRhcmdldCkge1xuICAgIHRoaXMuZmxvd1J1bm5pbmcgPSBmYWxzZVxuXG4gICAgaWYgKHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZCkge1xuICAgICAgdGhpcy5wcm9taXNpZmllZC5yZXNvbHZlKC4uLnByb3BzKVxuICAgICAgdGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkID0gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gY29uc29sZS5sb2coJ0VuZCBvZiBmbG93IGF0JywgaW5kZXgpXG4gIH1cblxuICBjYWxsTmV4dC5jYWxsKHRoaXMsIGluZGV4LCBuZXh0LCAuLi5wcm9wcylcbn1cblxuZnVuY3Rpb24gaGFuZGxlRXJyb3JzKCkge1xuICAvLyBTcGVjaWFsIHVzZSBjYXNlc1xuICAvLyBZb3UgbmVlZCBzcGVjaWFsIGVycm9yIGhhbmRsZXIgZXZlbnRzIGZvciBtb2R1bGVzIHRoYXQgZXhwZWN0IHRvIHVzZSB0aGVtXG4gIC8vIFlvdSBjYW4gcGFzcyB0aGVzZSBlcnJvcnMgdG8gdHlwaWNhbCBlcnJvciBoYW5kbGVycyBsaWtlIHRocm93IHVzaW5nIHRoZSBzeW50YXg6XG4gIC8vIC5vbkVycm9yKGVyciA9PiB0aHJvdyBuZXcgRXJyb3IoZXJyKSlcblxuICAvLyBPbmNlIHRoaXMgaXMgZmluaXNoZWQsIGxvb2sgZm9yIGFueSAub3IoKSBicmFuY2hlcyB0byBjb250aW51ZSBjaGFpbi5cbiAgLy8gLm9yKCkgd2lsbCBzdGFydCBhIG5ldyBmbG93IGFuZCBsaW5rIHRoZXNlIHR3byBGbG93cyB0b2dldGhlci5cbn1cblxuZXhwb3J0IHsgcnVuRmxvdyB9XG4iLCIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93TWV0aG9kc0ludGVyZmFjZSxcblxuICB0eXBlIEZsb3dEaXJlY3Rpb24sXG4gIHR5cGUgRmxvd1BpcGUsXG5cbiAgdHlwZSBGbG93SW5pdGlhbGl6ZXIsXG4gIHR5cGUgRmxvd1RhcmdldCxcblxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5pbXBvcnQgeyBydW5GbG93IH0gZnJvbSAnLi9jb3JlJ1xuXG5jb25zdCBGbG93TWV0aG9kczogRmxvd01ldGhvZHNJbnRlcmZhY2UgPSB7XG4gIGluaXQ6IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIElmIHRhcmdldCBpcyBhIGNsYXNzIG9yIGluaXRpYWxpemVyIG9mIHNvbWUga2luZC5cbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICdpbml0JywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgdG86IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ3RvJywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgZnJvbTogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gU3Bhd24gYSBuZXcgRmxvdyAoaWYgbmVlZGVkKSwgYmVjYXVzZSBpdHMgYSBuZXcgRXZlbnQgU291cmNlLlxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ2Zyb20nLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBydW46IGZ1bmN0aW9uKCk6IHZvaWQgfCBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQpXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLnByb21pc2lmaWVkLnJlc29sdmUgPSByZXNvbHZlXG4gICAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVqZWN0ID0gcmVqZWN0XG4gICAgICAgIHJ1bkZsb3cuY2FsbCh0aGlzKVxuICAgICAgfSlcbiAgICBlbHNlXG4gICAgICBydW5GbG93LmNhbGwodGhpcylcbiAgfSxcblxuICB3YWl0Rm9yOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyB3YWl0Rm9yIHdpbGwgYWNjZXB0IGEgY29uZGl0aW9uYWwgYW5kIHZhbHVlICh1c2luZyBhIHByb3h5KSBvciBmdW5jdGlvblxuICAgIC8vIHdhaXRGb3Igd2lsbCBhbHNvIGFjY2VwdCBhIGZsb3csIGFuZCBjaGVjayBpZiB3YWl0aW5nRm9yRXZlbnQgPSBmYWxzZVxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ3dhaXRGb3InLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBwcm9taXNpZnk6IGZ1bmN0aW9uKCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZCA9IHRydWVcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIC8qb3I6IGZ1bmN0aW9uKCkge1xuXG4gIH0sKi9cblxufVxuXG5mdW5jdGlvbiBpc0NvbnN0cnVjdG9yKGYpIHtcbiAgdHJ5IHtcbiAgICBSZWZsZWN0LmNvbnN0cnVjdChTdHJpbmcsIFtdLCBmKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLy8gUGlwZSBjb250cm9sXG5mdW5jdGlvbiBhZGRQaXBlKGRpcmVjdGlvbjogRmxvd0RpcmVjdGlvbiwgdGFyZ2V0OiBGbG93VGFyZ2V0LCBwYXJhbXM6IEFycmF5PGFueT4pOiBGbG93SW50ZXJmYWNlIHtcbiAgLy9pZiAodHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJylcbiAgLy8gIHRocm93IG5ldyBFcnJvcignRmxvdyBleHBlY3RlZCBhIGZ1bmN0aW9uIGJ1dCByZWNlaXZlZCBcIicgKyB0eXBlb2YgdGFyZ2V0ICsgJ1wiIGluc3RlYWQhJylcblxuICAvL2lmIChpc1ByaW1pdGl2ZSh0YXJnZXQpKVxuICAvLyAgdGFyZ2V0ID0gd3JhcFRhcmdldCh0YXJnZXQpXG5cbiAgY29uc3QgcGlwZTogRmxvd1BpcGUgPSB7XG4gICAgZGlyZWN0aW9uLFxuICAgIHRhcmdldCxcbiAgICBwYXJhbXMsXG4gIH1cblxuICBjb25zdCBmbG93ID0gdGhpc1xuICBzd2l0Y2ggKHBpcGUuZGlyZWN0aW9uKSB7XG4gICAgY2FzZSAnaW5pdCc6XG4gICAgICBpZiAoIWlzQ29uc3RydWN0b3IodGFyZ2V0KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGbG93IHRhcmdldCBpcyBub3QgYSBjb25zdHJ1Y3RvciEnKVxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdpbml0IGFkZGVkIGZvcjonLCBwaXBlKVxuICAgICAgLy9mbG93LnBpcGVzLmluaXQucHVzaChwaXBlKVxuICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdGFyZ2V0KC4uLnBhcmFtcylcbiAgICAgIGZsb3cucGlwZXMuaW5pdC5wdXNoKGluc3RhbmNlKVxuXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZnJvbSc6XG4gICAgICBjb25zb2xlLmxvZygnZnJvbSBhZGRlZCBmb3I6JywgcGlwZSlcbiAgICAgIGZsb3cucGlwZXMuZXZlbnRzLnB1c2gocGlwZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICd0byc6XG4gICAgICBmbG93LnBpcGVzLnRhcmdldHMucHVzaChwaXBlKVxuICAgICAgYnJlYWtcblxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBTaG91bGRuJ3QgYmUgaGVyZS5cbiAgICAgIGNvbnNvbGUud2FybignV0FSTklORzogRmxvdyBoYXMgcmVjZWl2ZWQgYW4gdW5rbm93biBwaXBlIGRpcmVjdGlvbi4gUGxlYXNlIHBvc3QgYSBidWcgdG8gdGhlIGF1dGhvciBhYm91dCB0aGlzLicpXG4gICAgICBicmVha1xuICB9XG5cbiAgY29uc29sZS5sb2coYEFkZGVkIC4ke2RpcmVjdGlvbn0oJHt0YXJnZXQubmFtZSB8fCAnYW5vbnltb3VzJ30pYClcbiAgcmV0dXJuIHRoaXNcbn1cblxuZXhwb3J0IGRlZmF1bHQgRmxvd01ldGhvZHNcbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dQaXBlcyxcbiAgdHlwZSBGbG93UGlwZSxcbiAgdHlwZSBQaXBlUHJvbWlzZSxcbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuaW1wb3J0IEZsb3dNZXRob2RzIGZyb20gJy4vbWV0aG9kcydcblxuY2xhc3MgRmxvdyBpbXBsZW1lbnRzIEZsb3dJbnRlcmZhY2Uge1xuICBwaXBlczogRmxvd1BpcGVzID0ge1xuICAgIGluaXQ6IFtdLFxuICAgIGV2ZW50czogW10sXG4gICAgdGFyZ2V0czogW10sXG4gIH1cblxuICBmbG93UnVubmluZzogYm9vbGVhbiA9IGZhbHNlXG5cbiAgcHJvbWlzaWZpZWQ6IFBpcGVQcm9taXNlID0ge1xuICAgIGlzUHJvbWlzZWQ6IGZhbHNlLFxuICAgIHJlc29sdmU6ICgpID0+IHt9LFxuICAgIHJlamVjdDogKCkgPT4ge30sXG4gIH1cblxuICBpbml0OiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLmluaXRcbiAgdG86IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMudG9cbiAgZnJvbTogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5mcm9tXG4gIHJ1bjogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5ydW5cbiAgcHJvbWlzaWZ5OiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnByb21pc2lmeVxuXG4gIHN0YXRpYyBtb2R1bGVzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge31cbiAgbW9kdWxlczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9XG5cbiAgdGhyZWFkKCk6IEZsb3dJbnRlcmZhY2UgfCBQcm94eTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IEZsb3coKVxuICB9XG5cbiAgc3RhdGljIHVzZShuYW1lOiBzdHJpbmcsIG1vZHVsZTogYW55KSB7XG4gICAgaWYgKHRoaXMubW9kdWxlc1tuYW1lXSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihuYW1lICsgJyBjb2xsaWRlcyB3aXRoIGV4aXN0aW5nIEZsb3cgbW9kdWxlIG9yIHByb3BlcnR5LicpXG5cbiAgICB0aGlzLm1vZHVsZXNbbmFtZV0gPSBtb2R1bGVcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCk6IFByb3h5PGFueT4ge1xuICAgIHRoaXMubW9kdWxlcyA9IHRoaXMuY29uc3RydWN0b3IubW9kdWxlc1xuXG4gICAgcmV0dXJuIG5ldyBQcm94eSh0aGlzLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKHRhcmdldCwgcHJvcGVydHkpIHtcbiAgICAgICAgaWYgKFJlZmxlY3QuaGFzKHRhcmdldCwgcHJvcGVydHkpKVxuICAgICAgICAgIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3BlcnR5KVxuICAgICAgICBlbHNlIGlmIChSZWZsZWN0Lmhhcyh0YXJnZXQubW9kdWxlcywgcHJvcGVydHkpKVxuICAgICAgICAgIHJldHVybiB0YXJnZXQubW9kdWxlc1twcm9wZXJ0eV1cbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEZsb3dcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztFQVVzQjtFQUNMOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQTRCYzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUJDckJJLENBQUM7Ozs7Ozs7Ozt3QkFTQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFrRHhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2pFUzs7Ozs7OzthQU9SOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBcUJZLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
