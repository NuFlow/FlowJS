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
    callTarget.call(flow, target);
    return
  }

  // For each event source, go ahead and call it to init the events.
  for (const event of flow.pipes.events) {
    callTarget.call(this, event);
  }
}

function callTarget(eventPipe) {
  const eventTarget = eventPipe.target;
  //const eventType = eventPipe.type
  const props = eventPipe.params; //destructure(target, event.params)

  if (typeof eventTarget === 'function') {

    const flow = this;

    function pipeCallback() {
      nextPipe.call(flow, 0, ...Array.from(arguments));
      // TODO: if from an event source, then index is 0, otherwise it needs to go to 1
    }

    props.push(pipeCallback);

    const retValue = eventTarget.apply({}, props);
    const retType = typeof retValue;

    if (retType === 'object' && retValue instanceof Promise) {
      //retValue.then((...args) => pipeCallback.call(null, ...Array.from(args)))
      retValue.then((...args) =>  pipeCallback.apply(null, [null, ...Array.from(args)]));
    }

    //callNext.call(this, event)
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

    if (this.promisified.isPromised && !this.promisified.resolved) {
      this.promisified.resolve(data);
      this.promisified.resolved = true; // FIXME: Probably don't need this anymore, since any time we resolve or reject, we can just turn the promise off.
      this.promisified.isPromised = false;
    }

    return void 0
  }

  callNext.call(this, index, next, data);
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

  thread() {
    return new Flow()
  }
}

module.exports = Flow;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vbGliL2NvcmUuanMiLCIuLi9saWIvbWV0aG9kcy5qcyIsIi4uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB7XG4gIHR5cGUgRmxvd0ludGVyZmFjZSxcbiAgdHlwZSBGbG93TWV0aG9kc0ludGVyZmFjZSxcblxuICB0eXBlIEZsb3dEaXJlY3Rpb24sXG4gIHR5cGUgRmxvd1BpcGUsXG5cbiAgdHlwZSBGbG93SW5pdGlhbGl6ZXIsXG4gIHR5cGUgRmxvd1RhcmdldCxcblxufSBmcm9tICcuL2RlZmluaXRpb25zJ1xuXG5mdW5jdGlvbiBydW5GbG93KCkge1xuICBjb25zdCBmbG93OiBGbG93SW50ZXJmYWNlID0gdGhpc1xuICBjb25zb2xlLmxvZygnU3RhcnRpbmcgZmxvdycpXG5cbiAgaWYgKGZsb3cuZmxvd1J1bm5pbmcpXG4gICAgcmV0dXJuXG5cbiAgZmxvdy5mbG93UnVubmluZyA9IHRydWVcblxuICAvLyBUT0RPOiBDYWxsIGFsbCBpbml0IHBpcGVzIGZpcnN0LCBzbyB0aGV5IGNhbiBwcm9wZXJseSBpbml0aWFsaXplLiAoTmVlZGVkIGZvciBjbGFzc2VzIGFuZCBvdGhlciBsYXJnZXIgbGlicy4pXG5cbiAgLy8gSWYgbm8gZXZlbnQgc291cmNlcywgdGhlbiBnbyBhaGVhZCBhbmQgcnVuIGZsb3cgdXNpbmcgdGhlIGZpcnN0IC50byBhcyBvdXIgZXZlbnQgc291cmNlLlxuICBpZiAoZmxvdy5waXBlcy5ldmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3QgdGFyZ2V0OiBGbG93UGlwZSA9IGZsb3cucGlwZXMudGFyZ2V0c1swXVxuICAgIGNhbGxUYXJnZXQuY2FsbChmbG93LCB0YXJnZXQpXG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBGb3IgZWFjaCBldmVudCBzb3VyY2UsIGdvIGFoZWFkIGFuZCBjYWxsIGl0IHRvIGluaXQgdGhlIGV2ZW50cy5cbiAgZm9yIChjb25zdCBldmVudCBvZiBmbG93LnBpcGVzLmV2ZW50cykge1xuICAgIGNhbGxUYXJnZXQuY2FsbCh0aGlzLCBldmVudClcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsVGFyZ2V0KGV2ZW50UGlwZSkge1xuICBjb25zdCBldmVudFRhcmdldCA9IGV2ZW50UGlwZS50YXJnZXRcbiAgLy9jb25zdCBldmVudFR5cGUgPSBldmVudFBpcGUudHlwZVxuICBjb25zdCBwcm9wcyA9IGV2ZW50UGlwZS5wYXJhbXMgLy9kZXN0cnVjdHVyZSh0YXJnZXQsIGV2ZW50LnBhcmFtcylcblxuICBpZiAodHlwZW9mIGV2ZW50VGFyZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG5cbiAgICBjb25zdCBmbG93ID0gdGhpc1xuXG4gICAgZnVuY3Rpb24gcGlwZUNhbGxiYWNrKCkge1xuICAgICAgY29uc29sZS5sb2coZXZlbnRUYXJnZXQubmFtZSwgJ3VzZWQgY2FsbGJhY2snKVxuICAgICAgY29uc29sZS5sb2coYXJndW1lbnRzKVxuICAgICAgbmV4dFBpcGUuY2FsbChmbG93LCAwLCAuLi5BcnJheS5mcm9tKGFyZ3VtZW50cykpXG4gICAgICAvLyBUT0RPOiBpZiBmcm9tIGFuIGV2ZW50IHNvdXJjZSwgdGhlbiBpbmRleCBpcyAwLCBvdGhlcndpc2UgaXQgbmVlZHMgdG8gZ28gdG8gMVxuICAgIH1cblxuICAgIHByb3BzLnB1c2gocGlwZUNhbGxiYWNrKVxuXG4gICAgY29uc3QgcmV0VmFsdWUgPSBldmVudFRhcmdldC5hcHBseSh7fSwgcHJvcHMpXG4gICAgY29uc3QgcmV0VHlwZSA9IHR5cGVvZiByZXRWYWx1ZVxuXG4gICAgaWYgKHJldFR5cGUgPT09ICdvYmplY3QnICYmIHJldFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgLy9yZXRWYWx1ZS50aGVuKCguLi5hcmdzKSA9PiBwaXBlQ2FsbGJhY2suY2FsbChudWxsLCAuLi5BcnJheS5mcm9tKGFyZ3MpKSlcbiAgICAgIHJldFZhbHVlLnRoZW4oKC4uLmFyZ3MpID0+ICBwaXBlQ2FsbGJhY2suYXBwbHkobnVsbCwgW251bGwsIC4uLkFycmF5LmZyb20oYXJncyldKSlcbiAgICB9XG5cbiAgICAvL2NhbGxOZXh0LmNhbGwodGhpcywgZXZlbnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gbmV4dFBpcGUoaW5kZXgsIGVyciwgZGF0YSkge1xuICAvL2NvbnNvbGUubG9nKCduZXh0OicsIGluZGV4KVxuICAvL2NvbnNvbGUubG9nKCdlcnI6JywgZXJyKVxuICAvL2NvbnNvbGUubG9nKCdkYXRhOicsIGRhdGEpXG5cbiAgY29uc3QgdGFyZ2V0cyA9IHRoaXMucGlwZXMudGFyZ2V0c1xuICBjb25zdCBuZXh0ID0gdGFyZ2V0c1tpbmRleF1cblxuICBpZiAoZXJyKSB7XG4gICAgLy90aGlzLmhhc0Vycm9yID0gdHJ1ZVxuICAgIC8vdGhpcy5lcnJvckRhdGEgPSBlcnJcbiAgICAvL2hhbmRsZUVycm9ycy5jYWxsKHRoaXMpXG5cbiAgICAvLyBUT0RPOiBJZiB3ZSBoYXZlIGEgcHJvbWlzZSwgdGhlbiBpdHMgYSBnb29kIHRpbWUgdG8gcmVqZWN0IGl0LlxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gSWYgd2UncmUgYXQgdGhlIGVuZCBvZiB0aGUgZmxvd1xuICBpZiAoIW5leHQgfHwgIW5leHQudGFyZ2V0KSB7XG4gICAgdGhpcy5mbG93UnVubmluZyA9IGZhbHNlXG5cbiAgICBpZiAodGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkICYmICF0aGlzLnByb21pc2lmaWVkLnJlc29sdmVkKSB7XG4gICAgICB0aGlzLnByb21pc2lmaWVkLnJlc29sdmUoZGF0YSlcbiAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZWQgPSB0cnVlIC8vIEZJWE1FOiBQcm9iYWJseSBkb24ndCBuZWVkIHRoaXMgYW55bW9yZSwgc2luY2UgYW55IHRpbWUgd2UgcmVzb2x2ZSBvciByZWplY3QsIHdlIGNhbiBqdXN0IHR1cm4gdGhlIHByb21pc2Ugb2ZmLlxuICAgICAgdGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkID0gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gY29uc29sZS5sb2coJ0VuZCBvZiBmbG93IGF0JywgaW5kZXgpXG4gIH1cblxuICBjYWxsTmV4dC5jYWxsKHRoaXMsIGluZGV4LCBuZXh0LCBkYXRhKVxufVxuXG5mdW5jdGlvbiBjYWxsTmV4dChpbmRleCwgbmV4dCwgZGF0YSkge1xuICBjb25zb2xlLmxvZygnTmV4dCB0YXJnZXQ6JylcbiAgY29uc29sZS5sb2cobmV4dClcblxuICBjb25zdCBwcm9wcyA9IG5leHQucGFyYW1zIC8vZGVzdHJ1Y3R1cmUodGFyZ2V0LCBldmVudC5wYXJhbXMpXG4gIGNvbnNvbGUubG9nKG5leHQudGFyZ2V0Lm5hbWUsICdwcm9wcycsIHByb3BzKVxuXG4gIGlmIChkYXRhKVxuICAgIHByb3BzLnB1c2goZGF0YSlcblxuICBjb25zdCBmbG93ID0gdGhpc1xuXG4gIGZ1bmN0aW9uIHBpcGVDYWxsYmFjaygpIHtcbiAgICBjb25zb2xlLmxvZyhuZXh0LnRhcmdldC5uYW1lLCAndXNlZCBjYWxsYmFjaycpXG4gICAgbmV4dFBpcGUuY2FsbChmbG93LCBpbmRleCArIDEsIC4uLkFycmF5LmZyb20oYXJndW1lbnRzKSlcbiAgfVxuXG4gIHByb3BzLnB1c2gocGlwZUNhbGxiYWNrKVxuXG4gIGNvbnN0IHJldFZhbHVlID0gbmV4dC50YXJnZXQuYXBwbHkoe30sIHByb3BzKVxuICBjb25zdCByZXRUeXBlID0gdHlwZW9mIHJldFZhbHVlXG5cbiAgaWYgKHJldFR5cGUgPT09ICdvYmplY3QnICYmIHJldFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIC8vcmV0VmFsdWUudGhlbigoLi4uYXJncykgPT4gcGlwZUNhbGxiYWNrLmNhbGwobnVsbCwgLi4uQXJyYXkuZnJvbShhcmdzKSkpXG4gICAgcmV0VmFsdWUudGhlbigoLi4uYXJncykgPT4gIHBpcGVDYWxsYmFjay5hcHBseShudWxsLCBbbnVsbCwgLi4uQXJyYXkuZnJvbShhcmdzKV0pKVxuICB9XG5cbn1cblxuZnVuY3Rpb24gaGFuZGxlRXJyb3JzKCkge1xuICAvLyBTcGVjaWFsIHVzZSBjYXNlc1xuICAvLyBZb3UgbmVlZCBzcGVjaWFsIGVycm9yIGhhbmRsZXIgZXZlbnRzIGZvciBtb2R1bGVzIHRoYXQgZXhwZWN0IHRvIHVzZSB0aGVtXG4gIC8vIFlvdSBjYW4gcGFzcyB0aGVzZSBlcnJvcnMgdG8gdHlwaWNhbCBlcnJvciBoYW5kbGVycyBsaWtlIHRocm93IHVzaW5nIHRoZSBzeW50YXg6XG4gIC8vIC5vbkVycm9yKGVyciA9PiB0aHJvdyBuZXcgRXJyb3IoZXJyKSlcblxuICAvLyBPbmNlIHRoaXMgaXMgZmluaXNoZWQsIGxvb2sgZm9yIGFueSAub3IoKSBicmFuY2hlcyB0byBjb250aW51ZSBjaGFpbi5cbiAgLy8gLm9yKCkgd2lsbCBzdGFydCBhIG5ldyBmbG93IGFuZCBsaW5rIHRoZXNlIHR3byBGbG93cyB0b2dldGhlci5cbn1cblxuLypcbmZ1bmN0aW9uIGNhbGxOZXh0T2xkKG5leHQsIGRhdGEpIHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmV4dC50YXJnZXRcbiAgLy9jb25zdCBwcm9wcyA9IGRlc3RydWN0dXJlKGJsdWVwcmludC5GcmFtZS5kZXNjcmliZS5pbiwgbmV4dC5wYXJhbXMpXG4gIGNvbnN0IGNvbnRleHQgPSBuZXh0LmNvbnRleHRcblxuICBsZXQgcmV0VmFsdWVcbiAgbGV0IHJldFR5cGVcbiAgdHJ5IHtcbiAgICByZXRWYWx1ZSA9IGJsdWVwcmludC5pbi5jYWxsKGNvbnRleHQsIGRhdGEsIHByb3BzLCBuZXcgZmFjdG9yeShwaXBlQ2FsbGJhY2spLmJpbmQoY29udGV4dCkpXG4gICAgcmV0VHlwZSA9IHR5cGVvZiByZXRWYWx1ZVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXRWYWx1ZSA9IGVyclxuICAgIHJldFR5cGUgPSAnZXJyb3InXG4gIH1cblxuICAvLyBCbHVlcHJpbnQuaW4gZG9lcyBub3QgcmV0dXJuIGFueXRoaW5nXG4gIGlmICghcmV0VmFsdWUgfHwgcmV0VHlwZSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHJldFR5cGUgPT09ICdvYmplY3QnICYmIHJldFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIC8vIEhhbmRsZSBwcm9taXNlc1xuICAgIHJldFZhbHVlLnRoZW4oY29udGV4dC5vdXQpLmNhdGNoKGNvbnRleHQuZXJyb3IpXG4gIH0gZWxzZSBpZiAocmV0VHlwZSA9PT0gJ2Vycm9yJyB8fFxuICAgICAgICAgICAgIHJldFR5cGUgPT09ICdvYmplY3QnICYmIHJldFZhbHVlIGluc3RhbmNlb2YgRXJyb3IgfHxcbiAgICAgICAgICAgICByZXRUeXBlID09PSAnb2JqZWN0JyAmJiByZXRWYWx1ZS5jb25zdHJ1Y3Rvci5uYW1lID09PSAnRXJyb3InKSB7XG4gICAgLy8gSGFuZGxlIGVycm9yc1xuICAgIGNvbnRleHQuZXJyb3IocmV0VmFsdWUpXG4gIH0gZWxzZSB7XG4gICAgLy8gSGFuZGxlIHJlZ3VsYXIgcHJpbWl0aXZlcyBhbmQgb2JqZWN0c1xuICAgIGNvbnRleHQub3V0KHJldFZhbHVlKVxuICB9XG59XG4qL1xuXG5leHBvcnQgeyBydW5GbG93IH1cbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dNZXRob2RzSW50ZXJmYWNlLFxuXG4gIHR5cGUgRmxvd0RpcmVjdGlvbixcbiAgdHlwZSBGbG93UGlwZSxcblxuICB0eXBlIEZsb3dJbml0aWFsaXplcixcbiAgdHlwZSBGbG93VGFyZ2V0LFxuXG59IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCB7IHJ1bkZsb3cgfSBmcm9tICcuL2NvcmUnXG5cbmNvbnN0IEZsb3dNZXRob2RzOiBGbG93TWV0aG9kc0ludGVyZmFjZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgLy8gSWYgdGFyZ2V0IGlzIGEgY2xhc3Mgb3IgaW5pdGlhbGl6ZXIgb2Ygc29tZSBraW5kLlxuICAgIHJldHVybiBhZGRQaXBlLmNhbGwodGhpcywgJ2luaXQnLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICB0bzogZnVuY3Rpb24odGFyZ2V0OiBGbG93VGFyZ2V0KTogRmxvd0ludGVyZmFjZSB7XG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAndG8nLCB0YXJnZXQsIEFycmF5LmZyb20oYXJndW1lbnRzKS5zbGljZSgxKSlcbiAgfSxcblxuICBmcm9tOiBmdW5jdGlvbih0YXJnZXQ6IEZsb3dUYXJnZXQpOiBGbG93SW50ZXJmYWNlIHtcbiAgICAvLyBTcGF3biBhIG5ldyBGbG93IChpZiBuZWVkZWQpLCBiZWNhdXNlIGl0cyBhIG5ldyBFdmVudCBTb3VyY2UuXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnZnJvbScsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHJ1bjogZnVuY3Rpb24oKTogdm9pZCB8IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMucHJvbWlzaWZpZWQuaXNQcm9taXNlZClcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMucHJvbWlzaWZpZWQucmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgICAgdGhpcy5wcm9taXNpZmllZC5yZWplY3QgPSByZWplY3RcbiAgICAgICAgcnVuRmxvdy5jYWxsKHRoaXMpXG4gICAgICB9KVxuICAgIGVsc2VcbiAgICAgIHJ1bkZsb3cuY2FsbCh0aGlzKVxuICB9LFxuXG4gIHdhaXRGb3I6IGZ1bmN0aW9uKHRhcmdldDogRmxvd1RhcmdldCk6IEZsb3dJbnRlcmZhY2Uge1xuICAgIC8vIHdhaXRGb3Igd2lsbCBhY2NlcHQgYSBjb25kaXRpb25hbCBhbmQgdmFsdWUgKHVzaW5nIGEgcHJveHkpIG9yIGZ1bmN0aW9uXG4gICAgLy8gd2FpdEZvciB3aWxsIGFsc28gYWNjZXB0IGEgZmxvdywgYW5kIGNoZWNrIGlmIHdhaXRpbmdGb3JFdmVudCA9IGZhbHNlXG4gICAgcmV0dXJuIGFkZFBpcGUuY2FsbCh0aGlzLCAnd2FpdEZvcicsIHRhcmdldCwgQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKDEpKVxuICB9LFxuXG4gIHByb21pc2lmeTogZnVuY3Rpb24oKTogRmxvd0ludGVyZmFjZSB7XG4gICAgdGhpcy5wcm9taXNpZmllZC5pc1Byb21pc2VkID0gdHJ1ZVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgLypvcjogZnVuY3Rpb24oKSB7XG5cbiAgfSwqL1xuXG59XG5cbmZ1bmN0aW9uIGlzQ29uc3RydWN0b3IoZikge1xuICB0cnkge1xuICAgIFJlZmxlY3QuY29uc3RydWN0KFN0cmluZywgW10sIGYpO1xuICAgIHJldHVybiB0cnVlXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG4vLyBQaXBlIGNvbnRyb2xcbmZ1bmN0aW9uIGFkZFBpcGUoZGlyZWN0aW9uOiBGbG93RGlyZWN0aW9uLCB0YXJnZXQ6IEZsb3dUYXJnZXQsIHBhcmFtczogQXJyYXk8YW55Pik6IEZsb3dJbnRlcmZhY2Uge1xuICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJylcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Zsb3cgZXhwZWN0ZWQgYSBmdW5jdGlvbiBidXQgcmVjZWl2ZWQgXCInICsgdHlwZW9mIHRhcmdldCArICdcIiBpbnN0ZWFkIScpXG5cbiAgLy8gSWYgd2UgaGF2ZSBhIHBpcGUgZGlyZWN0aW9uIGJ1dCBub3QgaW5pdCwgYW5kIHdlIGhhdmUgYSBjb25zdHJ1Y3RvciwgdGhlbiBpbml0IGl0IGZpcnN0LlxuICAvL2lmIChkaXJlY3Rpb24gIT09ICdpbml0JyAmJiB0eXBlb2YgdGFyZ2V0ID09PSAnZnVuY3Rpb24nICYmIGlzQ29uc3RydWN0b3IodGFyZ2V0KSlcbiAgLy8gIGFkZFBpcGUuY2FsbCh0aGlzLCAnaW5pdCcsIHRhcmdldCwgWy4uLnBhcmFtc10pXG5cbiAgY29uc3QgcGlwZTogRmxvd1BpcGUgPSB7XG4gICAgZGlyZWN0aW9uLFxuICAgIHRhcmdldCxcbiAgICBwYXJhbXMsXG4gIH1cblxuICBjb25zdCBmbG93ID0gdGhpc1xuICBzd2l0Y2ggKHBpcGUuZGlyZWN0aW9uKSB7XG4gICAgY2FzZSAnaW5pdCc6XG4gICAgICBpZiAoIWlzQ29uc3RydWN0b3IodGFyZ2V0KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGbG93IHRhcmdldCBpcyBub3QgYSBjb25zdHJ1Y3RvciEnKVxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdpbml0IGFkZGVkIGZvcjonLCBwaXBlKVxuICAgICAgLy9mbG93LnBpcGVzLmluaXQucHVzaChwaXBlKVxuICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdGFyZ2V0KC4uLnBhcmFtcylcbiAgICAgIGZsb3cucGlwZXMuaW5pdC5wdXNoKGluc3RhbmNlKVxuXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZnJvbSc6XG4gICAgICBjb25zb2xlLmxvZygnZnJvbSBhZGRlZCBmb3I6JywgcGlwZSlcbiAgICAgIGZsb3cucGlwZXMuZXZlbnRzLnB1c2gocGlwZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICd0byc6XG4gICAgICBmbG93LnBpcGVzLnRhcmdldHMucHVzaChwaXBlKVxuICAgICAgYnJlYWtcblxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBTaG91bGRuJ3QgYmUgaGVyZS5cbiAgICAgIGNvbnNvbGUud2FybignV0FSTklORzogRmxvdyBoYXMgcmVjZWl2ZWQgYW4gdW5rbm93biBwaXBlIGRpcmVjdGlvbi4gUGxlYXNlIHBvc3QgYSBidWcgdG8gdGhlIGF1dGhvciBhYm91dCB0aGlzLicpXG4gICAgICBicmVha1xuICB9XG5cbiAgY29uc29sZS5sb2coJ0FkZGVkOicsIHRhcmdldC5uYW1lICsgJy4nICsgZGlyZWN0aW9uICsgJygpJylcbiAgcmV0dXJuIHRoaXNcbn1cblxuZXhwb3J0IGRlZmF1bHQgRmxvd01ldGhvZHNcbiIsIi8vIEBmbG93XG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IHtcbiAgdHlwZSBGbG93SW50ZXJmYWNlLFxuICB0eXBlIEZsb3dQaXBlcyxcbiAgdHlwZSBGbG93UGlwZSxcbiAgdHlwZSBQaXBlUHJvbWlzZSxcbn0gZnJvbSAnLi9kZWZpbml0aW9ucydcblxuaW1wb3J0IEZsb3dNZXRob2RzIGZyb20gJy4vbWV0aG9kcydcblxuY2xhc3MgRmxvdyBpbXBsZW1lbnRzIEZsb3dJbnRlcmZhY2Uge1xuICBwaXBlczogRmxvd1BpcGVzID0ge1xuICAgIGluaXQ6IFtdLFxuICAgIGV2ZW50czogW10sXG4gICAgdGFyZ2V0czogW10sXG4gIH1cblxuICBmbG93UnVubmluZzogYm9vbGVhbiA9IGZhbHNlXG5cbiAgcHJvbWlzaWZpZWQ6IFBpcGVQcm9taXNlID0ge1xuICAgIGlzUHJvbWlzZWQ6IGZhbHNlLFxuICAgIHJlc29sdmVkOiBmYWxzZSxcbiAgICByZXNvbHZlOiAoKSA9PiB7fSxcbiAgICByZWplY3Q6ICgpID0+IHt9LFxuICB9XG5cbiAgaW5pdDogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5pbml0XG4gIHRvOiBGdW5jdGlvbiA9IEZsb3dNZXRob2RzLnRvXG4gIGZyb206IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMuZnJvbVxuICBydW46IEZ1bmN0aW9uID0gRmxvd01ldGhvZHMucnVuXG4gIHByb21pc2lmeTogRnVuY3Rpb24gPSBGbG93TWV0aG9kcy5wcm9taXNpZnlcblxuICB0aHJlYWQoKTogRmxvd0ludGVyZmFjZSB7XG4gICAgcmV0dXJuIG5ldyBGbG93KClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBGbG93XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7RUFVc0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkNRYSxDQUFDOzs7Ozs7Ozs7d0JBU0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztZQW1EeEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dDbEVTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
