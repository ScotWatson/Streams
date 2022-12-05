/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Test/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/Test/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Containers/Test/Queue.mjs";
import * as Memory from "https://scotwatson.github.io/Memory/Test/Memory.mjs";
import * as Tasks from "https://scotwatson.github.io/Tasks/Test/Tasks.mjs";

// Active Sink
export class PullSink {
  #callbackPull;
  constructor(args) {
    try {
      this.#callbackPull = null;
      args.execute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink constructor",
        error: e,
      });
    }
  }
  connect(args) {
    try {
      let newSource;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "source"))) {
          throw "Argument \"source\" must be provided.";
        }
        newSource = args.source;
      } else {
        newSource = args;
      }
      if (!("getCallback" in newSource)) {
        throw "Argument \"source\" must provide a getCallback function. (It must be a pull source.)";
      }
      if (Tasks.isInvocable(newSource.getCallback)) {
        throw "\"source.getCallback\" must be invocable.";
      }
      const newCallback = newSource.getCallback();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#signalController.signal.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.connect",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      this.#callbackPull = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.disconnect",
        error: e,
      });
    }
  }
  disconnectIfRevoked() {
    try {
      if (this.#callbackPull.isRevoked()) {
        this.#callbackPull = null;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.disconnectIfRevoked",
        error: e,
      });
    }
  }
  #execute() {
    try {
      if (this.#callbackPull === null) {
        throw "PullSource must be connected to execute.";
      }
      return this.#callbackPull.invoke();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.execute",
        error: e,
      });
    }
  }
}

export class PullSinkController {
  #sink;
  #execute;
  constructor(args) {
    try {
      const sinkArgs = {};
      this.#sink = new PullSink(sinkArgs);
      this.#execute = sinkArgs.execute;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSinkController constructor",
        error: e,
      });
    }
  }
  get sink() {
    try {
      return this.#sink;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSinkController.sink",
        error: e,
      });
    }
  }
  execute(item) {
    try {
      this.#execute(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSinkController.execute",
        error: e,
      });
    }
  }
}

// Active Source
export class PushSource {
  #callback;
  constructor(args) {
    try {
      args.execute = Tasks.createStatic({
        function: this.#execute,
        thisArg: this,
      });
      this.#callback = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource constructor",
        error: e,
      });
    }
  }
  connect(args) {
    try {
      let newSink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        newSink = args.sink;
      } else {
        newSink = args;
      }
      if (!("getCallback" in newSink)) {
        throw "Argument \"sink\" must provide a getCallback function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getCallback))) {
        throw "\"sink.getCallback\" must be a function.";
      }
      this.#callback = newSink.getCallback();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource.connect",
        error: e,
      });
    }
  }
  disconnectIfRevoked() {
    try {
      if (this.#callback.isRevoked()) {
        this.#callback = null;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource.disconnectIfRevoked",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      this.#callback.invoke(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource.execute",
        error: e,
      });
    }
  }
};

export class PushSourceController {
  #source;
  #execute;
  constructor(args) {
    try {
      const sourceArgs = {};
      this.#source = new PushSource(sourceArgs);
      this.#execute = sourceArgs.execute;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSourceController constructor",
        error: e,
      });
    }
  }
  get source() {
    try {
      return this.#source;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PushSourceController.source",
        error: e,
      });
    }
  }
  execute(item) {
    try {
      this.#execute(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSourceController.execute",
        error: e,
      });
    }
  }
}

// Push-type
export class Splitter {
  #inputCallbackController;
  #outputCallbackSet;
  #clone;
  #staticExecute;
  constructor(args) {
    try {
      this.#inputCallbackController = null;
      this.#outputCallbackSet = new Set();
      this.#clone = args.clone;
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      if (this.#inputCallbackController !== null) {
        this.#inputCallbackController.replace(null);
      }
      this.#inputCallbackController = new CallbackController({
        function: this.#staticExecute,
      });
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.getCallback",
        error: e,
      });
    }
  }
  connect(args) {
    try {
      let newSink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        newSink = args.sink;
      } else {
        newSink = args;
      }
      if (!("getCallback" in newSink)) {
        throw "Argument \"sink\" must provide a getCallback function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getCallback))) {
        throw "\"sink.getCallback\" must be a function.";
      }
      this.#callbackSet.add(newSink.getCallback());
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.connect",
        error: e,
      });
    }
  }
  disconnectAllRevoked(args) {
    const newCallbackSet = new Set();
    for (const callback of outputCallbackSet) {
      if (!(callback.isRevoked())) {
        newCallbackSet.add(callback);
      }
    }
    outputCallbackSet = newCallbackSet;
  }
  #execute(item) {
    for (const callback of outputCallbackSet) {
      callback.invoke(item);
    }
  }
}

// Passive Sink
export class PushSink {
  #controller;
  #callbackFunction;
  constructor(args) {
    try {
      this.#controller = null;
      this.#callbackFunction = args.callback.invoke;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSink constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = new Tasks.CallbackController({
        callback: this.#callbackFunction,
      });
      return this.#controller.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSink.getCallback",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSink.disconnect",
        error: e,
      });
    }
  }
  createWritableStream() {
    try {
      const callback = this.getCallback();
      const underlyingSink = {
        start: function (controller) {
        },
        write: function (chunk, controller) {
          callback.invoke(chunk);
        },
        close: function (controller) {
        },
        abort: function (reason) {
        },
      };
      const writeQueuingStrategy = {
        highWaterMark: 1,
      }
      return new self.WritableStream(underlyingSink, writeQueuingStrategy);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSink.createWritableStream",
        error: e,
      });
    }
  }
}

// Passive Source
export class PullSource {
  #controller;
  #callbackFunction;
  constructor(args) {
    try {
      this.#controller = null;
      this.#callbackFunction = args.callback.invoke;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSource constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = new Tasks.CallbackController({
        callback: this.#callbackFunction,
      });
      return this.#controller.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSource.getCallback",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSource.disconnect",
        error: e,
      });
    }
  }
  createReadableStream() {
    try {
      const callback = this.getCallback();
      const underlyingSource = {
        start: function (controller) {
          return;
        },
        pull: function (controller) {
          const item = callback.invoke();
          controller.enqueue(item);
        },
        cancel: function (reason) {
          return;
        },
      };
      const readQueuingStrategy = {
        highWaterMark: 1,
        size: function (chunk) {
          return 1;
        }
      };
      return new self.ReadableStream(underlyingSource, readQueuingStrategy);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSource.createReadableStream",
        error: e,
      });
    }
  }
}

export function createPushConnection(pushSource, pushSink) {
  try {
    pushSource.connect(pushSink);
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createPushConnection",
      error: e,
    });
  }
}

export function createPullConnection(pullSource, pullSink) {
  try {
    pullSink.connect(pullSource);
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createPullConnection",
      error: e,
    });
  }
}

// Passive, provides a pusher and a puller
export class Pipe {
  #queue;
  #input;
  #output;
  #bufferFullController;
  #bufferEmptyController;
  constructor() {
    try {
      this.#queue = new Queue.Queue({
      });
      const inputCallback = new Tasks.Callback({
        function: this.#push,
        this: this,
      });
      this.#input = new PushSink({
        callback: inputCallback,
      });
      const outputCallback = new Tasks.Callback({
        function: this.#pull,
        this: this,
      });
      this.#output = new PullSource({
        callback: outputCallback,
      });
      this.#bufferFullController = new SignalController();
      this.#bufferEmptyController = new SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe constructor",
        error: e,
      });
    }
  }
  get input() {
    try {
      return this.#inputController;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.input",
        error: e,
      });
    }
  }
  #push(item) {
    try {
      if (this.#queue.isFull()) {
        this.dispatchEvent("buffer-full");
      }
      this.#queue.enqueue(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe.#push",
        error: e,
      });
    }
  }
  get output() {
    try {
      return this.#outputController;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.output",
        error: e,
      });
    }
  }
  #pull() {
    if (this.#queue.isEmpty()) {
      this.dispatchEvent("buffer-empty");
    }
    return this.#queue.dequeue();
  }
  get bufferFull() {
    try {
      this.#bufferFullController = new SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.bufferFull",
        error: e,
      });
    }
  }
  get bufferEmpty() {
    return this.#bufferEmptyController.signal;
  }
  get bufferFull() {
    return this.#bufferFullController.signal;
  }
};

// Active, accepts a puller and pushers
export class Pump {
  #inputController;
  #outputController;
  constructor() {
    try {
      this.#inputController = new PullSinkController();
      this.#outputController = new PushSourceController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump constructor",
        error: e,
      });
    }
  }
  get input() {
    try {
      return this.#inputController.sink;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pump.input",
        error: e,
      });
    }
  }
  get output() {
    try {
      return this.#outputController.source;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pump.output",
        error: e,
      });
    }
  }
  execute() {
    try {
      const item = this.#inputController.execute();
      this.#outputController.execute(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.execute",
        error: e,
      });
    }
  }
}

export class AsyncByteReaderPushSourceController {
  #pushSourceController;
  #callback;
  #taskCallback;
  #chunkByteLength;
  #offset;
  #buffer;
  constructor(args) {
    this.#callback = args.callback;
    const taskFunction = Tasks.createStatic({
      function: this.#task,
      this: this,
    });
    const taskCallbackController = new Tasks.CallbackController({
      callback: taskFunction,
    });
    this.#taskCallback = taskCallbackController.callback;
    this.#pushSourceController = new PushSourceController();
    this.#offset = 0;
    this.#buffer = Memory.Block({
      byteLength: this.#chunkByteLength,
    });
    this.#taskCallback.invoke();
  }
  get source() {
    return this.#pushSourceController.source;
  }
  peek() {
    const partialData = new Memory.View({
      memoryBlock: this.#block,
      byteOffset: 0,
      byteLength: this.#offset,
    });
    const block = new Memory.Block(this.#offset);
    const view = new Memory.View(block);
    view.set(partialData);
    return view;
  }
  async #task() {
    const inputView = new Memory.View({
      memoryBlock: this.#buffer,
      byteOffset: this.#offset,
      byteLength: this.#chunkByteLength - this.#offset,
    });
    const outputView = await this.#callback(inputView);
    if (!("byteLength" in outputView)) {
      throw "callback must return a view.";
    }
    this.#offset += outputView.byteLength;
    if (this.#offset >= this.#buffer.byteLength) {
      this.#pushSourceController.execute(this.#buffer);
      this.#offset = 0;
      this.#buffer = Memory.Block({
        byteLength: this.#chunkByteLength,
      });
    }
    Tasks.queueTask(this.#taskCallback);
  }
}

export class AsyncFunctionPushSource {
  #pushSourceController;
  #callback;
  #taskCallback;
  constructor(args) {
    try {
      this.#callback = args.callback;
      this.#pushSourceController = new PushSourceController();
      const taskFunction = Tasks.createStatic({
        function: this.#task,
        this: this,
      });
      const taskCallbackController = new Tasks.CallbackController({
        function: taskFunction,
      });
      this.#taskCallback = taskCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncFunctionPushSource constructor",
        error: e,
      });
    }
  }
  get source() {
    return this.#pushSourceController.source;
  }
  async #task() {
    const inputView = new Memory.View({
      memoryBlock: this.#buffer,
      byteOffset: this.#offset,
      byteLength: this.#chunkByteLength - this.#offset,
    });
    const item = await this.#callback();
    this.#pushSourceController.execute(item);
    Tasks.queueTask(this.#taskCallback);
  }
}

export class ReadableByteStreamPushSourceController {
  #reader;
  #pushSourceController;
  #closedSignalController;
  #cancelledSignalController;
  constructor(args) {
    try {
      let readableStream;
      if (Types.isSimpleObject(args)) {
        if (Object.hasOwn(args, "readableStream")) {
          throw "Argument \"readableStream\" must be provided.";
        }
        readableStream = args.readableStream;
      } else {
        readableStream = args;
      }
      if (!(readableStream instanceof self.ReadableStream)) {
        throw "Argument \"readableStream\" must be of type self.ReadableStream.";
      }
      if (readableStream.locked) {
        throw "Argument \"readableStream\" must be unlocked.";
      }
      const reader = readableStream.getReader();
      this.#reader = reader;
      const callbackFunction = Tasks.createStatic({
        function: this.#process,
        this: this,
      });
      const callbackController = new Tasks.CallbackController({
        function: callbackFunction;
      });
      this.#pushSourceController = new AsyncByteReaderPushSourceController({
        callback: callbackController.callback;
      });
      this.#closedSignalController = new SignalController();
      this.#cancelledSignalController = new SignalController();
      reader.closed.then(function () {
        this.#closedSignalController.dispatch();
        this.#cancelledSignalController.dispatch();
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableStreamPushSourceController constructor",
        error: e,
      });
    }
  }
  get source() {
    try {
      return this.#pushSourceController.source;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableStreamPushSourceController.source",
        error: e,
      });
    }
  }
  async #process(view) {
    try {
      const uint8Array = view.toUint8Array();
      const { value, done } = await this.#reader.read(uint8Array);
      if (!(value instanceof Uint8Array)) {
        return null;
      }
      const block = new Memory.Block(value.buffer);
      return new Memory.View({
        memoryBlock: block,
        byteOffset: value.byteOffset,
        byteLength: value.byteLength,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableStreamPushSourceController.process",
        error: e,
      });
    }
  }
  get closed() {
    try {
      return this.#closedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableStreamPushSourceController.closed",
        error: e,
      });
    }
  }
  get cancelled() {
    try {
      return this.#cancelledSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableStreamPushSourceController.cancelled",
        error: e,
      });
    }
  }
};

export class WritableStreamPushSink {
  #pushSink;
  #writer;
  constructor(args) {
    try {
      let writableStream;
      if (Types.isSimpleObject(args)) {
        if (Object.hasOwn(args, "writableStream")) {
          throw "Argument \"writableStream\" must be provided.";
        }
        writableStream = args.writableStream;
      } else {
        writableStream = args;
      }
      if (!(writableStream instanceof self.WritableStream)) {
        throw "Argument \"writableStream\" must be of type self.WritableStream.";
      }
      if (writableStream.locked) {
        throw "Argument \"writableStream\" must be unlocked.";
      }
      this.#writer = writableStream.getWriter();
      const pushSinkCallbackFunction = Tasks.createStatic({
        function: this.#writer.write,
        this: this.#writer,
      });
      const pushSinkCallbackController = new Tasks.CallbackController({
        function: pushSinkCallbackFunction,
      });
      this.#pushSink = new PushSink({
        callback: pushSinkCallbackController.callback,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      return this.#pushSink.getCallback();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink.getCallback",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      return this.#pushSink.disconnect();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink.disconnect",
        error: e,
      });
    }
  }
};


// Active Sink
export class BytePullSink {
  #callbackPull;
  #chunkSize;
  constructor(args) {
    try {
      this.#callbackPull = null;
      args.execute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.chunkSize = args.chunkSize;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink constructor",
        error: e,
      });
    }
  }
  connect(args) {
    try {
      let newSource;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "source"))) {
          throw "Argument \"source\" must be provided.";
        }
        newSource = args.source;
      } else {
        newSource = args;
      }
      if (!("getCallback" in newSource)) {
        throw "Argument \"source\" must provide a getCallback function. (It must be a pull source.)";
      }
      if (Tasks.isInvocable(newSource.getCallback)) {
        throw "\"source.getCallback\" must be invocable.";
      }
      const newCallback = newSource.getCallback();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#signalController.signal.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink.connect",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      this.#callbackPull = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink.disconnect",
        error: e,
      });
    }
  }
  disconnectIfRevoked() {
    try {
      if (this.#callbackPull.isRevoked()) {
        this.#callbackPull = null;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink.disconnectIfRevoked",
        error: e,
      });
    }
  }
  #execute(args) {
    try {
      if (this.#callbackPull === null) {
        throw "PullSource must be connected to execute.";
      }
      const view = args.view;
      this.#callbackPull.invoke({
        memoryView: view,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink.execute",
        error: e,
      });
    }
  }
}

export class BytePullSinkController {
  #sink;
  #execute;
  constructor(args) {
    const sinkArgs = {};
    this.#sink = new BytePullSink(sinkArgs);
    this.#execute = sinkArgs.execute;
  }
  get sink() {
    return this.#sink;
  }
  execute(args) {
    return this.#execute(args);
  }
}

// Active Source
export class BytePushSource {
  #signalController;
  constructor(args) {
    try {
      args.execute = Tasks.createStatic({
        function: this.#execute,
        thisArg: this,
      });
      this.#signalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource constructor",
        error: e,
      });
    }
  }
  connect(args) {
    try {
      let newSink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        newSink = args.sink;
      } else {
        newSink = args;
      }
      if (!("getCallback" in newSink)) {
        throw "Argument \"sink\" must provide a getCallback function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getCallback))) {
        throw "\"sink.getCallback\" must be a function.";
      }
      const newCallback = newSink.getCallback();
      this.#signalController.signal.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource.connect",
        error: e,
      });
    }
  }
  disconnectIfRevoked() {
    try {
      this.#signalController.signal.removeIfRevoked();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource.disconnectIfRevoked",
        error: e,
      });
    }
  }
  #execute(args) {
    try {
      this.#signalController.dispatch(args.view);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource.execute",
        error: e,
      });
    }
  }
};

export class BytePushSourceController {
  #source;
  #execute;
  constructor(args) {
    try {
      const sourceArgs = {};
      this.#source = new BytePushSource(sourceArgs);
      this.#execute = sourceArgs.execute;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSourceController constructor",
        error: e,
      });
    }
  }
  get source() {
    return this.#source;
  }
  execute(args) {
    try {
      this.#execute(args);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSourceController.execute",
        error: e,
      });
    }
  }
}

// Push-type
export class ByteSplitter {
  #inputCallbackController;
  #outputCallbackSet;
  #clone;
  #staticExecute;
  constructor(args) {
    try {
      this.#inputCallbackController = null;
      this.#outputCallbackSet = new Set();
      this.#clone = args.clone;
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      if (this.#inputCallbackController !== null) {
        this.#inputCallbackController.replace(null);
      }
      this.#inputCallbackController = new CallbackController({
        function: this.#staticExecute,
      });
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.getCallback",
        error: e,
      });
    }
  }
  connect(args) {
    try {
      let newSink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        newSink = args.sink;
      } else {
        newSink = args;
      }
      if (!("getCallback" in newSink)) {
        throw "Argument \"sink\" must provide a getCallback function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getCallback))) {
        throw "\"sink.getCallback\" must be a function.";
      }
      this.#callbackSet.add(newSink.getCallback());
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.connect",
        error: e,
      });
    }
  }
  disconnectAllRevoked(args) {
    const newCallbackSet = new Set();
    for (const callback of outputCallbackSet) {
      if (!(callback.isRevoked())) {
        newCallbackSet.add(callback);
      }
    }
    outputCallbackSet = newCallbackSet;
  }
  #execute(item) {
    for (const callback of outputCallbackSet) {
      callback.invoke(item);
    }
  }
}

// Passive Sink
export class BytePushSink {
  #controller;
  #callbackFunction;
  constructor(args) {
    try {
      this.#controller = null;
      this.#callbackFunction = Tasks.createStatic({
        function: args.callback.invoke,
        this: args.callback,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSink constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = new Tasks.CallbackController({
        callback: this.#callbackFunction,
      });
      return this.#controller.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSink.getCallback",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSink.disconnect",
        error: e,
      });
    }
  }
  createWritableStream() {
    try {
      const callback = this.getCallback();
      const underlyingSink = {
        start: function (controller) {
        },
        write: function (chunk, controller) {
          callback.invoke(chunk);
        },
        close: function (controller) {
        },
        abort: function (reason) {
        },
      };
      const writeQueuingStrategy = {
        highWaterMark: 1,
      }
      return new self.WritableStream(underlyingSink, writeQueuingStrategy);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSink.createWritableStream",
        error: e,
      });
    }
  }
}

// Passive Source
export class BytePullSource {
  #controller;
  #callbackFunction;
  constructor(args) {
    try {
      this.#controller = null;
      this.#callbackFunction = Tasks.createStatic({
        function: args.callback.invoke,
        this: args.callback,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSource constructor",
        error: e,
      });
    }
  }
  getCallback() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = new Tasks.CallbackController({
        callback: this.#callbackFunction,
      });
      return this.#controller.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSource.getCallback",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      if (this.#controller !== null) {
        this.#controller.replace(null);
      }
      this.#controller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSource.disconnect",
        error: e,
      });
    }
  }
  createReadableStream() {
    try {
      const callback = this.getCallback();
      const underlyingSource = {
        start: function (controller) {
          return;
        },
        pull: function (controller) {
          const item = callback.invoke();
          controller.enqueue(item);
        },
        cancel: function (reason) {
          return;
        },
      };
      const readQueuingStrategy = {
        highWaterMark: 1,
        size: function (chunk) {
          return 1;
        }
      };
      return new self.ReadableStream(underlyingSource, readQueuingStrategy);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSource.createReadableStream",
        error: e,
      });
    }
  }
}

export function createPushConnection(pushSource, pushSink) {
  pushSource.connect(pushSink);
}

export function createPullConnection(pullSource, pullSink) {
  pullSink.connect(pullSource);
}

// Passive, provides a pusher and a puller
export class BytePipe {
  #queue;
  #input;
  #output;
  constructor() {
    try {
      this.#queue = new Queue.ByteQueue({
      });
      const inputCallback = new Tasks.Callback({
        function: this.#push,
        this: this,
      });
      this.#input = new BytePushSink({
        callback: inputCallback,
      });
      const outputCallback = new Tasks.Callback({
        function: this.#pull,
        this: this,
      });
      this.#output = new BytePullSource({
        callback: outputCallback,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe constructor",
        error: e,
      });
    }
  }
  get input() {
    try {
      return this.#inputController;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.input",
        error: e,
      });
    }
  }
  async #push(args) {
    try {
      if (this.#queue.isFull()) {
        this.dispatchEvent("buffer-full");
      }
      const queueView = this.#queue.reserve(args.view.byteLength);
      queueView.set(args.view);
      this.#queue.enqueue();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.push",
        error: e,
      });
    }
  }
  get output() {
    try {
      return this.#outputController;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.output",
        error: e,
      });
    }
  }
  #pull(args) {
    try {
      if (this.#queue.isEmpty()) {
        this.dispatchEvent("buffer-empty");
      }
      this.#queue.dequeue(args.view);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.pull",
        error: e,
      });
    }
  }
};

// Active, accepts a puller and pushers
export class BytePump {
  #inputController;
  #outputController;
  constructor() {
    try {
      this.#inputController = new BytePullSinkController();
      this.#outputController = new BytePushSourceController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump constructor",
        error: e,
      });
    }
  }
  get input() {
    try {
      return this.#inputController.sink;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePump.input",
        error: e,
      });
    }
  }
  get output() {
    try {
      return this.#outputController.source;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePump.output",
        error: e,
      });
    }
  }
  execute(args) {
    try {
      const view = new Memory.View({
        byteLength: args.byteLength,
      });
      const item = this.#inputController.execute({
        view: view;
      });
      this.#outputController.execute({
        view: view,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.execute",
        error: e,
      });
    }
  }
}
