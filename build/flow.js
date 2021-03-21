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
    callNext.call(flow, 1, target);
    return
  }

  // For each event source, go ahead and call it to init the events.
  for (const event of flow.pipes.events) {
    callNext.call(flow, -1, event);
  }
}

function callNext(index, next, data) {

  const props = next.params; //destructure(target, event.params)

  if (data)
    props.push(data);

  const flow = this;

  function pipeCallback() {
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

    if (this.promisified.isPromised && !this.promisified.resolved) {
      this.promisified.resolve(data);
      this.promisified.resolved = true; // FIXME: Probably don't need this anymore, since any time we resolve or reject, we can just turn the promise off.
      this.promisified.isPromised = false;
    }

    return void 0
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
    resolved: false,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vbGliL2NvcmUuanMiLCIuLi9saWIvbWV0aG9kcy5qcyIsIi4uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93TWV0aG9kc0ludGVyZmFjZSxcblxuICB0eXBlIEZsb3dEaXJlY3Rpb24sXG4gIHR5cGUgRmxvd1BpcGUsXG5cbiAgdHlwZSBGbG93SW5pdGlhbGl6ZXIsXG4gIHR5cGUgRmxvd1RhcmdldCxcblxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5mdW5jdGlvbiBydW5GbG93KCkge1xuICBjb25zdCBmbG93OiBGbG93SW50ZXJmYWNlID0gdGhpc1xuICBjb25zb2xlLmxvZygnU3RhcnRpbmcgZmxvdycpXG5cbiAgaWYgKGZsb3cuZmxvd1J1bm5pbmcpXG4gICAgcmV0dXJuXG5cbiAgZmxvdy5mbG93UnVubmluZyA9IHRydWVcblxuICAvLyBUT0RPOiBDYWxsIGFsbCBpbml0IHBpcGVzIGZpcnN0LCBzbyB0aGV5IGNhbiBwcm9wZXJseSBpbml0aWFsaXplLiAoTmVlZGVkIGZvciBjbGFzc2VzIGFuZCBvdGhlciBsYXJnZXIgbGlicy4pXG5cbiAgLy8gSWYgbm8gZXZlbnQgc291cmNlcywgdGhlbiBnbyBhaGVhZCBhbmQgcnVuIGZsb3cgdXNpbmcgdGhlIGZpcnN0IC50byBhcyBvdXIgZXZlbnQgc291cmNlLlxuICBpZiAoZmxvdy5waXBlcy5ldmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3QgdGFyZ2V0OiBGbG93UGlwZSA9IGZsb3cucGlwZXMudGFyZ2V0c1swXVxuICAgIGNhbGxOZXh0LmNhbGwoZmxvdywgMSwgdGFyZ2V0KVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gRm9yIGVhY2ggZXZlbnQgc291cmNlLCBnbyBhaGVhZCBhbmQgY2FsbCBpdCB0byBpbml0IHRoZSBldmVudHMuXG4gIGZvciAoY29uc3QgZXZlbnQ6IEZsb3dQaXBlIG9mIGZsb3cucGlwZXMuZXZlbnRzKSB7XG4gICAgY2FsbE5leHQuY2FsbChmbG93LCAtMSwgZXZlbnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbE5leHQoaW5kZXgsIG5leHQsIGRhdGEpIHtcbiAgY29uc29sZS5sb2coJ05leHQgdGFyZ2V0OicpXG4gIGNvbnNvbGUubG9nKG5leHQpXG5cbiAgY29uc3QgcHJvcHMgPSBuZXh0LnBhcmFtcyAvL2Rlc3RydWN0dXJlKHRhcmdldCwgZXZlbnQucGFyYW1zKVxuICBjb25zb2xlLmxvZyhuZXh0LnRhcmdldC5uYW1lLCAncHJvcHMnLCBwcm9wcylcblxuICBpZiAoZGF0YSlcbiAgICBwcm9wcy5wdXNoKGRhdGEpXG5cbiAgY29uc3QgZmxvdyA9IHRoaXNcblxuICBmdW5jdGlvbiBwaXBlQ2FsbGJhY2soKSB7XG4gICAgY29uc29sZS5sb2cobmV4dC50YXJnZXQubmFtZSwgJ3VzZWQgY2FsbGJhY2snKVxuICAgIG5leHRQaXBlLmNhbGwoZmxvdywgaW5kZXggKyAxLCAuLi5BcnJheS5mcm9tKGFyZ3VtZW50cykpXG4gIH1cblxuICBwcm9wcy5wdXNoKHBpcGVDYWxsYmFjaylcblxuICBjb25zdCByZXRWYWx1ZSA9IG5leHQudGFyZ2V0LmFwcGx5KHt9LCBwcm9wcylcbiAgY29uc3QgcmV0VHlwZSA9IHR5cGVvZiByZXRWYWx1ZVxuXG4gIGlmIChyZXRUeXBlID09PSAnb2JqZWN0JyAmJiByZXRWYWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAvL3JldFZhbHVlLnRoZW4oKC4uLmFyZ3MpID0+IHBpcGVDYWxsYmFjay5jYWxsKG51bGwsIC4uLkFycmF5LmZyb20oYXJncykpKVxuICAgIHJldFZhbHVlLnRoZW4oKC4uLmFyZ3MpID0+ICBwaXBlQ2FsbGJhY2suYXBwbHkobnVsbCwgW251bGwsIC4uLkFycmF5LmZyb20oYXJncyldKSlcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIG5leHRQaXBlKGluZGV4LCBlcnIsIGRhdGEpIHtcbiAgY29uc29sZS5sb2coJ25leHQ6JywgaW5kZXgpXG4gIC8vY29uc29sZS5sb2coJ2VycjonLCBlcnIpXG4gIC8vY29uc29sZS5sb2coJ2RhdGE6JywgZGF0YSlcblxuICBjb25zdCB0YXJnZXRzID0gdGhpcy5waXBlcy50YXJnZXRzXG4gIGNvbnN0IG5leHQgPSB0YXJnZXRzW2luZGV4XVxuXG4gIGlmIChlcnIpIHtcbiAgICAvL3RoaXMuaGFzRXJyb3IgPSB0cnVlXG4gICAgLy90aGlzLmVycm9yRGF0YSA9IGVyclxuICAgIC8vaGFuZGxlRXJyb3JzLmNhbGwodGhpcylcblxuICAgIC8vIFRPRE86IElmIHdlIGhhdmUgYSBwcm9taXNlLCB0aGVuIGl0cyBhIGdvb2QgdGltZSB0byByZWplY3QgaXQuXG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBJZiB3ZSdyZSBhdCB0aGUgZW5kIG9mIHRoZSBmbG93XG4gIGlmICghbmV4dCB8fCAhbmV4dC50YXJnZXQpIHtcbiAgICB0aGlzLmZsb3dSdW5uaW5nID0gZmFsc2VcblxuICAgIGlmICh0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQgJiYgIXRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZWQpIHtcbiAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZShkYXRhKVxuICAgICAgdGhpcy5wcm9taXNpZmllZC5yZXNvbHZlZCA9IHRydWUgLy8gRklYTUU6IFByb2JhYmx5IGRvbid0IG5lZWQgdGhpcyBhbnltb3JlLCBzaW5jZSBhbnkgdGltZSB3ZSByZXNvbHZlIG9yIHJlamVjdCwgd2UgY2FuIGp1c3QgdHVybiB0aGUgcHJvbWlzZSBvZmYuXG4gICAgICB0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQgPSBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBjb25zb2xlLmxvZygnRW5kIG9mIGZsb3cgYXQnLCBpbmRleClcbiAgfVxuXG4gIGNhbGxOZXh0LmNhbGwodGhpcywgaW5kZXgsIG5leHQsIGRhdGEpXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9ycygpIHtcbiAgLy8gU3BlY2lhbCB1c2UgY2FzZXNcbiAgLy8gWW91IG5lZWQgc3BlY2lhbCBlcnJvciBoYW5kbGVyIGV2ZW50cyBmb3IgbW9kdWxlcyB0aGF0IGV4cGVjdCB0byB1c2UgdGhlbVxuICAvLyBZb3UgY2FuIHBhc3MgdGhlc2UgZXJyb3JzIHRvIHR5cGljYWwgZXJyb3IgaGFuZGxlcnMgbGlrZSB0aHJvdyB1c2luZyB0aGUgc3ludGF4OlxuICAvLyAub25FcnJvcihlcnIgPT4gdGhyb3cgbmV3IEVycm9yKGVycikpXG5cbiAgLy8gT25jZSB0aGlzIGlzIGZpbmlzaGVkLCBsb29rIGZvciBhbnkgLm9yKCkgYnJhbmNoZXMgdG8gY29udGludWUgY2hhaW4uXG4gIC8vIC5vcigpIHdpbGwgc3RhcnQgYSBuZXcgZmxvdyBhbmQgbGluayB0aGVzZSB0d28gRmxvd3MgdG9nZXRoZXIuXG59XG5cbi8qXG5mdW5jdGlvbiBjYWxsTmV4dE9sZChuZXh0LCBkYXRhKSB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5leHQudGFyZ2V0XG4gIC8vY29uc3QgcHJvcHMgPSBkZXN0cnVjdHVyZShibHVlcHJpbnQuRnJhbWUuZGVzY3JpYmUuaW4sIG5leHQucGFyYW1zKVxuICBjb25zdCBjb250ZXh0ID0gbmV4dC5jb250ZXh0XG5cbiAgbGV0IHJldFZhbHVlXG4gIGxldCByZXRUeXBlXG4gIHRyeSB7XG4gICAgcmV0VmFsdWUgPSBibHVlcHJpbnQuaW4uY2FsbChjb250ZXh0LCBkYXRhLCBwcm9wcywgbmV3IGZhY3RvcnkocGlwZUNhbGxiYWNrKS5iaW5kKGNvbnRleHQpKVxuICAgIHJldFR5cGUgPSB0eXBlb2YgcmV0VmFsdWVcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0VmFsdWUgPSBlcnJcbiAgICByZXRUeXBlID0gJ2Vycm9yJ1xuICB9XG5cbiAgLy8gQmx1ZXByaW50LmluIGRvZXMgbm90IHJldHVybiBhbnl0aGluZ1xuICBpZiAoIXJldFZhbHVlIHx8IHJldFR5cGUgPT09ICd1bmRlZmluZWQnKVxuICAgIHJldHVyblxuXG4gIGlmIChyZXRUeXBlID09PSAnb2JqZWN0JyAmJiByZXRWYWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAvLyBIYW5kbGUgcHJvbWlzZXNcbiAgICByZXRWYWx1ZS50aGVuKGNvbnRleHQub3V0KS5jYXRjaChjb250ZXh0LmVycm9yKVxuICB9IGVsc2UgaWYgKHJldFR5cGUgPT09ICdlcnJvcicgfHxcbiAgICAgICAgICAgICByZXRUeXBlID09PSAnb2JqZWN0JyAmJiByZXRWYWx1ZSBpbnN0YW5jZW9mIEVycm9yIHx8XG4gICAgICAgICAgICAgcmV0VHlwZSA9PT0gJ29iamVjdCcgJiYgcmV0VmFsdWUuY29uc3RydWN0b3IubmFtZSA9PT0gJ0Vycm9yJykge1xuICAgIC8vIEhhbmRsZSBlcnJvcnNcbiAgICBjb250ZXh0LmVycm9yKHJldFZhbHVlKVxuICB9IGVsc2Uge1xuICAgIC8vIEhhbmRsZSByZWd1bGFyIHByaW1pdGl2ZXMgYW5kIG9iamVjdHNcbiAgICBjb250ZXh0Lm91dChyZXRWYWx1ZSlcbiAgfVxufVxuKi9cblxuZXhwb3J0IHsgcnVuRmxvdyB9XG4iLCIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93TWV0aG9kc0ludGVyZmFjZSxcblxuICB0eXBlIEZsb3dEaXJlY3Rpb24sXG4gIHR5cGUgRmxvd1BpcGUsXG5cbiAgdHlwZSBGbG93SW5pdGlhbGl6ZXIsXG4gIHR5cGUgRmxvd1RhcmdldCxcblxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5pbXBvcnQgeyBydW5GbG93IH0gZnJvbSAnLi9jb3JlJ1xuXG5jb25zdCBGbG93TWV0aG9kczogRmxvd01ldGhvZHNJbnRlcmZhY2UgPSB7XG4gIGluaXQ6IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIElmIHRhcmdldCBpcyBhIGNsYXNzIG9yIGluaXRpYWxpemVyIG9mIHNvbWUga2luZC5cbiAgICByZXR1cm4gYWRkUGlwZS5jYWxsKHRoaXMsICdpbml0JywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgdG86IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ3RvJywgdGFyZ2V0LCBBcnJheS5mcm9tKGFyZ3VtZW50cykuc2xpY2UoMSkpXG4gIH0sXG5cbiAgZnJvbTogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gU3Bhd24gYSBuZXcgRmxvdyAoaWYgbmVlZGVkKSwgYmVjYXVzZSBpdHMgYSBuZXcgRXZlbnQgU291cmNlLlxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ2Zyb20nLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBydW46IGZ1bmN0aW9uKCk6IHZvaWQgfCBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLnByb21pc2lmaWVkLmlzUHJvbWlzZWQpXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLnByb21pc2lmaWVkLnJlc29sdmUgPSByZXNvbHZlXG4gICAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVqZWN0ID0gcmVqZWN0XG4gICAgICAgIHJ1bkZsb3cuY2FsbCh0aGlzKVxuICAgICAgfSlcbiAgICBlbHNlXG4gICAgICBydW5GbG93LmNhbGwodGhpcylcbiAgfSxcblxuICB3YWl0Rm9yOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyB3YWl0Rm9yIHdpbGwgYWNjZXB0IGEgY29uZGl0aW9uYWwgYW5kIHZhbHVlICh1c2luZyBhIHByb3h5KSBvciBmdW5jdGlvblxuICAgIC8vIHdhaXRGb3Igd2lsbCBhbHNvIGFjY2VwdCBhIGZsb3csIGFuZCBjaGVjayBpZiB3YWl0aW5nRm9yRXZlbnQgPSBmYWxzZVxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ3dhaXRGb3InLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBwcm9taXNpZnk6IGZ1bmN0aW9uKCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZCA9IHRydWVcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuXG4gIC8qb3I6IGZ1bmN0aW9uKCkge1xuXG4gIH0sKi9cblxufVxuXG5mdW5jdGlvbiBpc0NvbnN0cnVjdG9yKGYpIHtcbiAgdHJ5IHtcbiAgICBSZWZsZWN0LmNvbnN0cnVjdChTdHJpbmcsIFtdLCBmKTtcbiAgICByZXR1cm4gdHJ1ZVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLy8gUGlwZSBjb250cm9sXG5mdW5jdGlvbiBhZGRQaXBlKGRpcmVjdGlvbjogRmxvd0RpcmVjdGlvbiwgdGFyZ2V0OiBGbG93VGFyZ2V0LCBwYXJhbXM6IEFycmF5PGFueT4pOiBGbG93SW50ZXJmYWNlIHtcbiAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdGbG93IGV4cGVjdGVkIGEgZnVuY3Rpb24gYnV0IHJlY2VpdmVkIFwiJyArIHR5cGVvZiB0YXJnZXQgKyAnXCIgaW5zdGVhZCEnKVxuXG4gIC8vIElmIHdlIGhhdmUgYSBwaXBlIGRpcmVjdGlvbiBidXQgbm90IGluaXQsIGFuZCB3ZSBoYXZlIGEgY29uc3RydWN0b3IsIHRoZW4gaW5pdCBpdCBmaXJzdC5cbiAgLy9pZiAoZGlyZWN0aW9uICE9PSAnaW5pdCcgJiYgdHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJyAmJiBpc0NvbnN0cnVjdG9yKHRhcmdldCkpXG4gIC8vICBhZGRQaXBlLmNhbGwodGhpcywgJ2luaXQnLCB0YXJnZXQsIFsuLi5wYXJhbXNdKVxuXG4gIGNvbnN0IHBpcGU6IEZsb3dQaXBlID0ge1xuICAgIGRpcmVjdGlvbixcbiAgICB0YXJnZXQsXG4gICAgcGFyYW1zLFxuICB9XG5cbiAgY29uc3QgZmxvdyA9IHRoaXNcbiAgc3dpdGNoIChwaXBlLmRpcmVjdGlvbikge1xuICAgIGNhc2UgJ2luaXQnOlxuICAgICAgaWYgKCFpc0NvbnN0cnVjdG9yKHRhcmdldCkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmxvdyB0YXJnZXQgaXMgbm90IGEgY29uc3RydWN0b3IhJylcblxuICAgICAgLy9jb25zb2xlLmxvZygnaW5pdCBhZGRlZCBmb3I6JywgcGlwZSlcbiAgICAgIC8vZmxvdy5waXBlcy5pbml0LnB1c2gocGlwZSlcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHRhcmdldCguLi5wYXJhbXMpXG4gICAgICBmbG93LnBpcGVzLmluaXQucHVzaChpbnN0YW5jZSlcblxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ2Zyb20nOlxuICAgICAgY29uc29sZS5sb2coJ2Zyb20gYWRkZWQgZm9yOicsIHBpcGUpXG4gICAgICBmbG93LnBpcGVzLmV2ZW50cy5wdXNoKHBpcGUpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAndG8nOlxuICAgICAgZmxvdy5waXBlcy50YXJnZXRzLnB1c2gocGlwZSlcbiAgICAgIGJyZWFrXG5cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gU2hvdWxkbid0IGJlIGhlcmUuXG4gICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IEZsb3cgaGFzIHJlY2VpdmVkIGFuIHVua25vd24gcGlwZSBkaXJlY3Rpb24uIFBsZWFzZSBwb3N0IGEgYnVnIHRvIHRoZSBhdXRob3IgYWJvdXQgdGhpcy4nKVxuICAgICAgYnJlYWtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBBZGRlZCAuJHtkaXJlY3Rpb259KCR7dGFyZ2V0Lm5hbWUgfHwgJ2Fub255bW91cyd9KWApXG4gIHJldHVybiB0aGlzXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZsb3dNZXRob2RzXG4iLCIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93UGlwZXMsXG4gIHR5cGUgRmxvd1BpcGUsXG4gIHR5cGUgUGlwZVByb21pc2UsXG59IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCBGbG93TWV0aG9kcyBmcm9tICcuL21ldGhvZHMnXG5cbmNsYXNzIEZsb3cgaW1wbGVtZW50cyBGbG93SW50ZXJmYWNlIHtcbiAgcGlwZXM6IEZsb3dQaXBlcyA9IHtcbiAgICBpbml0OiBbXSxcbiAgICBldmVudHM6IFtdLFxuICAgIHRhcmdldHM6IFtdLFxuICB9XG5cbiAgZmxvd1J1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuXG4gIHByb21pc2lmaWVkOiBQaXBlUHJvbWlzZSA9IHtcbiAgICBpc1Byb21pc2VkOiBmYWxzZSxcbiAgICByZXNvbHZlZDogZmFsc2UsXG4gICAgcmVzb2x2ZTogKCkgPT4ge30sXG4gICAgcmVqZWN0OiAoKSA9PiB7fSxcbiAgfVxuXG4gIGluaXQ6IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMuaW5pdFxuICB0bzogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy50b1xuICBmcm9tOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLmZyb21cbiAgcnVuOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnJ1blxuICBwcm9taXNpZnk6IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMucHJvbWlzaWZ5XG5cbiAgc3RhdGljIG1vZHVsZXM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fVxuICBtb2R1bGVzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge31cblxuICB0aHJlYWQoKTogRmxvd0ludGVyZmFjZSB7XG4gICAgcmV0dXJuIG5ldyBGbG93KClcbiAgfVxuXG4gIHN0YXRpYyB1c2UobmFtZTogc3RyaW5nLCBtb2R1bGU6IGFueSkge1xuICAgIGlmICh0aGlzLm1vZHVsZXNbbmFtZV0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobmFtZSArICcgY29sbGlkZXMgd2l0aCBleGlzdGluZyBGbG93IG1vZHVsZSBvciBwcm9wZXJ0eS4nKVxuXG4gICAgdGhpcy5tb2R1bGVzW25hbWVdID0gbW9kdWxlXG4gIH1cblxuICBjb25zdHJ1Y3RvcigpOiBQcm94eTxhbnk+IHtcbiAgICB0aGlzLm1vZHVsZXMgPSB0aGlzLmNvbnN0cnVjdG9yLm1vZHVsZXNcblxuICAgIHJldHVybiBuZXcgUHJveHkodGhpcywge1xuICAgICAgZ2V0OiBmdW5jdGlvbih0YXJnZXQsIHByb3BlcnR5KSB7XG4gICAgICAgIGlmIChSZWZsZWN0Lmhhcyh0YXJnZXQsIHByb3BlcnR5KSlcbiAgICAgICAgICByZXR1cm4gUmVmbGVjdC5nZXQodGFyZ2V0LCBwcm9wZXJ0eSlcbiAgICAgICAgZWxzZSBpZiAoUmVmbGVjdC5oYXModGFyZ2V0Lm1vZHVsZXMsIHByb3BlcnR5KSlcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0Lm1vZHVsZXNbcHJvcGVydHldXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBGbG93XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7RUFVc0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUJDUWEsQ0FBQzs7Ozs7Ozs7O3dCQVNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFtRHhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2xFUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBNkJJLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
