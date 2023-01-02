/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Test/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/Test/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Containers/Test/Queue.mjs";
import * as Memory from "https://scotwatson.github.io/Memory/Test/Memory.mjs";
import * as Tasks from "https://scotwatson.github.io/Tasks/Test/Tasks.mjs";

export class Splitter {
  #inputCallbackController;
  #outputCallbackSet;
  #clone;
  #staticExecute;
  constructor(args) {
    try {
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController({
        invoke: this.#staticExecute,
      });
      this.#outputCallbackSet = new Set();
      this.#clone = args.clone;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Splitter.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#outputCallbackSet.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.connectOutput",
        error: e,
      });
    }
  }
  disconnectAllRevokedOutputs(args) {
    try {
      const newCallbackSet = new Set();
      for (const callback of this.#outputCallbackSet) {
        if (!(callback.isRevoked())) {
          newCallbackSet.add(callback);
        }
      }
      this.#outputCallbackSet = newCallbackSet;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.disconnectAllRevokedOutputs",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      for (const callback of this.#outputCallbackSet) {
        callback.invoke(this.#clone(item));
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Splitter.#execute",
        error: e,
      });
    }
  }
}

// From "PushSink" callback
export function createWritableStream(callback) {
  try {
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
      functionName: "createWritableStream",
      error: e,
    });
  }
}

// From "PullSource" callback
export function createReadableStream(callback) {
  try {
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
      functionName: "createReadableStream",
      error: e,
    });
  }
}

// passive
export class Pipe {
  #queue;
  #inputCallbackController;
  #outputCallbackController;
  #bufferFullController;
  #bufferEmptyController;
  constructor() {
    try {
      this.#queue = new Queue.Queue({
      });
      const staticInput = new Tasks.createStatic({
        function: this.#push,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController(staticInput);
      const staticOutput = new Tasks.createStatic({
        function: this.#pull,
        this: this,
      });
      this.#outputCallbackController = new Tasks.UniqueCallbackController(staticOutput);
      this.#bufferFullController = new Tasks.SignalController();
      this.#bufferEmptyController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.inputCallback",
        error: e,
      });
    }
  }
  #push(item) {
    try {
      if (this.#queue.unusedCapacity === 0) {
        this.#bufferFullController.dispatch();
      }
      this.#queue.enqueue(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe.#push",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.output;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.outputCallback",
        error: e,
      });
    }
  }
  #pull() {
    try {
      if (this.#queue.usedCapacity === 0) {
        this.#bufferEmptyController.dispatch();
      }
      return this.#queue.dequeue();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe.#pull",
        error: e,
      });
    }
  }
  get bufferEmpty() {
    try {
      return this.#bufferEmptyController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.bufferEmpty",
        error: e,
      });
    }
  }
  get bufferFull() {
    try {
      return this.#bufferFullController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get Pipe.bufferFull",
        error: e,
      });
    }
  }
};

// active
export class Pump {
  #inputCallback;
  #outputCallback;
  constructor() {
    try {
      this.#inputCallback = new Callback(null);
      this.#outputCallback = new Callback(null);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      this.#inputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      this.#outputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.connectOutput",
        error: e,
      });
    }
  }
  execute() {
    try {
      const item = this.#inputCallback.invoke();
      this.#outputCallback.invoke(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.execute",
        error: e,
      });
    }
  }
}

export class AsyncByteReaderPushSource {
  #pushCallback;
  #asyncCallback;
  #taskCallback;
  #outputByteRate;
  #offset;
  #buffer;
  constructor(args) {
    try {
      if (!("callback" in args)) {
        throw "Argument \"callback\" must be provided.";
      }
      this.#asyncCallback = args.callback;
      if (!("outputByteRate" in args)) {
        throw "Argument \"outputByteRate\" must be provided.";
      }
      this.#outputByteRate = args.outputByteRate;
      const taskFunction = Tasks.createStatic({
        function: this.#task,
        this: this,
      });
      const taskCallbackController = new Tasks.CallbackController({
        invoke: taskFunction,
      });
      this.#taskCallback = taskCallbackController.callback;
      this.#pushCallback = null;
      this.#offset = 0;
      this.#buffer = new Memory.Block({
        byteLength: this.#outputByteRate,
      });
      this.#taskCallback.invoke();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteReaderPushSource constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.callback;
        } else {
          return args;
        }
      })();
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
      this.#pushCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteReaderPushSource.connectOutput",
        error: e,
      });
    }
  }
  peek() {
    try {
      const partialData = new Memory.View({
        memoryBlock: this.#buffer,
        byteOffset: 0,
        byteLength: this.#offset,
      });
      const block = new Memory.Block(this.#offset);
      const view = new Memory.View(block);
      view.set(partialData);
      return view;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteReaderPushSource.peek",
        error: e,
      });
    }
  }
  async #task() {
    try {
      const inputView = new Memory.View({
        memoryBlock: this.#buffer,
        byteOffset: this.#offset,
        byteLength: this.#outputByteRate - this.#offset,
      });
      const outputByteLength = await this.#asyncCallback.invoke(inputView);
      if (outputByteLength !== 0) {
        // 0 output length indicates that no more data is available, therefore stop queueing tasks.
        return;
      }
      this.#offset += outputByteLength;
      if (this.#offset >= this.#buffer.byteLength) {
        const returnView = new Memory.View({
          memoryBlock: this.#buffer,
        });
        this.#pushCallback.invoke(returnView);
        this.#offset = 0;
        this.#buffer = new Memory.Block({
          byteLength: this.#outputByteRate,
        });
      }
      Tasks.queueTask(this.#taskCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteReaderPushSource.#task",
        error: e,
      });
    }
  }
}

export class AsyncFunctionPushSource {
  #pushCallback;
  #callback;
  #taskCallback;
  constructor(args) {
    try {
      this.#callback = args.callback;
      this.#pushCallback = new Callback(null);
      const taskFunction = Tasks.createStatic({
        function: this.#task,
        this: this,
      });
      const taskCallbackController = new Tasks.CallbackController({
        invoke: taskFunction,
      });
      this.#taskCallback = taskCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncFunctionPushSource constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.callback;
        } else {
          return args;
        }
      })();
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
      this.#pushCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncFunctionPushSource.connectOutput",
        error: e,
      });
    }
  }
  async #task() {
    try {
      const item = await this.#callback();
      this.#pushCallback.invoke(item);
      Tasks.queueTask(this.#taskCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncFunctionPushSource.#task",
        error: e,
      });
    }
  }
}

export class ReadableByteStreamPushSource {
  #reader;
  #pushSourceController;
  #closedSignalController;
  #cancelledSignalController;
  constructor(args) {
    try {
      const { readableStream, chunkByteLength } = (function () {
        let ret = {};
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "readableStream"))) {
            throw "Argument \"readableStream\" must be provided.";
          }
          ret.readableStream = args.readableStream;
          if (!(Object.hasOwn(args, "chunkByteLength"))) {
            throw "Argument \"chunkByteLength\" must be provided.";
          }
          ret.chunkByteLength = args.chunkByteLength;
        } else {
          throw "Invalid Arguments";
        }
        return ret;
      })();
      if (!(readableStream instanceof self.ReadableStream)) {
        throw "Argument \"readableStream\" must be of type self.ReadableStream.";
      }
      if (readableStream.locked) {
        throw "Argument \"readableStream\" must be unlocked.";
      }
      const reader = readableStream.getReader({ mode: "byob" });
      this.#reader = reader;
      const callbackFunction = Tasks.createStatic({
        function: this.#process,
        this: this,
      });
      const callbackController = new Tasks.CallbackController({
        invoke: callbackFunction,
      });
      this.#pushSourceController = new AsyncByteReaderPushSource({
        callback: callbackController.callback,
        outputByteRate: outputByteRate,
      });
      this.#closedSignalController = new Tasks.SignalController();
      this.#cancelledSignalController = new Tasks.SignalController();
      const dispatchClose = Tasks.createStatic({
        function: this.#dispatchClose,
        this: this,
      });
      reader.closed.then(dispatchClose);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableByteStreamPushSource constructor",
        error: e,
      });
    }
  }
  #dispatchClose() {
    this.#closedSignalController.dispatch();
    this.#cancelledSignalController.dispatch();
  }
  connectOutput(args) {
    try {
      return this.#pushSourceController.connectOutput(args);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableByteStreamPushSource.connectOutput",
        error: e,
      });
    }
  }
  async #process(view) {
    try {
      const uint8Array = view.toUint8Array();
      const { value, done } = await this.#reader.read(uint8Array);
      if (done) {
        return null;
      }
      return value.byteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableByteStreamPushSource.process",
        error: e,
      });
    }
  }
  get closed() {
    try {
      return this.#closedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableByteStreamPushSource.closed",
        error: e,
      });
    }
  }
  get cancelled() {
    try {
      return this.#cancelledSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableByteStreamPushSource.cancelled",
        error: e,
      });
    }
  }
};

export class WritableStreamPushSink {
  #pushCallbackController;
  #writer;
  constructor(args) {
    try {
      let writableStream = (function () {
        if (Types.isSimpleObject(args)) {
          if (Object.hasOwn(args, "writableStream")) {
            throw "Argument \"writableStream\" must be provided.";
          }
          writableStream = args.writableStream;
        } else {
          writableStream = args;
        }
      })();
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
      this.#pushCallbackController = new Tasks.CallbackController({
        invoke: pushSinkCallbackFunction,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#pushCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get WritableStreamPushSink.callback",
        error: e,
      });
    }
  }
  disconnectInput() {
    try {
      this.#pushCallbackController.replace(null);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink.disconnectInput",
        error: e,
      });
    }
  }
};

export class ByteSplitter {
  #inputCallbackController;
  #outputCallbackSet;
  #staticAllocate;
  #staticExecute;
  #block;
  constructor(args) {
    try {
      this.#staticAllocate = Tasks.createStatic({
        function: this.#allocate,
        this: this,
      });
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        allocate: this.#staticAllocate,
        invoke: this.#staticExecute,
      });
      this.#outputCallbackSet = new Set();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitter constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ByteSplitter.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
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
      this.#outputCallbackSet.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitter.connectOutput",
        error: e,
      });
    }
  }
  disconnectAllRevokedOutputs(args) {
    try {
      const newCallbackSet = new Set();
      for (const callback of this.#outputCallbackSet) {
        if (!(callback.isRevoked())) {
          newCallbackSet.add(callback);
        }
      }
      this.#outputCallbackSet = newCallbackSet;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitter.disconnectAllRevokedOutputs",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      this.#block = new Memory.Block({
        byteLength: byteLength,
      });
      return new Memory.View(this.#block);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitter.#allocate",
        error: e,
      });
    }
  }
  #execute(byteLength) {
    try {
      const inputView = new Memory.View(this.#block);
      for (const callback of this.#outputCallbackSet) {
        const view = callback.allocate(byteLength);
        view.set(inputView);
        callback.invoke(byteLength);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitter.#execute",
        error: e,
      });
    }
  }
}

// From "PushSink" byte callback
export function createWritableByteStream(callback) {
  try {
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        const view = callback.allocate(chunk.byteLength);
        view.set(chunk);
        callback.invoke(chunk.byteLength);
      },
      close: function (controller) {
      },
      abort: function (reason) {
      },
      mode: "bytes",
    };
    const writeQueuingStrategy = {
      highWaterMark: 1,
    }
    return new self.WritableStream(underlyingSink, writeQueuingStrategy);
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createWritableByteStream",
      error: e,
    });
  }
}

// From "PullSource" callback (not byte callback)
export function createReadableByteStream(callback) {
  try {
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
      mode: "bytes",
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
      functionName: "createReadableByteStream",
      error: e,
    });
  }
}

// passive
export class BytePipe {
  #queue;
  #inputCallbackController;
  #outputCallbackController;
  #bufferFullController;
  #bufferEmptyController;
  constructor() {
    try {
      this.#queue = new Queue.Queue({
      });
      const staticAllocate = new Tasks.createStatic({
        function: this.#allocate,
        this: this,
      });
      const staticInput = new Tasks.createStatic({
        function: this.#push,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        allocate: staticAllocate,
        invoke: staticInput,
      });
      const staticOutput = new Tasks.createStatic({
        function: this.#pull,
        this: this,
      });
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticOutput,
      });
      this.#bufferFullController = new Tasks.SignalController();
      this.#bufferEmptyController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.inputCallback",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      return this.#queue.reserve(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.#allocate",
        error: e,
      });
    }
  }
  #push(byteLength) {
    try {
      if (this.#queue.unusedCapacity === 0) {
        this.#bufferFullController.dispatch();
      }
      this.#queue.enqueue(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.#push",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.output;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.outputCallback",
        error: e,
      });
    }
  }
  #pull(byteLength) {
    try {
      if (this.#queue.usedCapacity === 0) {
        this.#bufferEmptyController.dispatch();
      }
      return this.#queue.dequeue(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.#pull",
        error: e,
      });
    }
  }
  get bufferEmpty() {
    try {
      return this.#bufferEmptyController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.bufferEmpty",
        error: e,
      });
    }
  }
  get bufferFull() {
    try {
      return this.#bufferFullController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipe.bufferFull",
        error: e,
      });
    }
  }
};

// active
export class BytePump {
  #inputCallback;
  #outputCallback;
  constructor() {
    try {
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.ByteCallback(null);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      this.#inputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      this.#outputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.connectOutput",
        error: e,
      });
    }
  }
  execute(byteLength) {
    try {
      const outputView = this.#outputCallback.allocate(byteLength);
      const inputView = this.#inputCallback.invoke(byteLength);
      outputView.set(inputView);
      this.#outputCallback.invoke(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.execute",
        error: e,
      });
    }
  }
}

export class Transform {
  constructor() {
  }
  init() {
    return {};
  }
  execute(args) {
    return null;
  }
  flush(args) {
    return null;
  }
  syncExecute(args) {
    const { input } = (function () {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!("input" in args)) {
        throw "Argument \"input\" must be provided.";
      }
      return {
        input: args.input,
      };
    })();
    const state = this.init();
    const output = new Sequence.Sequence();
    let outputItem = this.execute({
      input: null,
      state: state,
    });
    while (outputItem !== null) {
      output.extend(outputItem);
      outputItem = this.execute({
        input: null,
        state: state,
      });
    }
    for (const inputItem of input) {
      outputItem = this.execute({
        input: inputItem,
        state: state,
      });
      while (outputItem !== null) {
        output.extend(outputItem);
        outputItem = this.execute({
          input: null,
          state: state,
        });
      }
    }
    outputItem = this.flush({
      state: state,
    });
    while (outputItem !== null) {
      output.extend(outputItem);
      outputItem = this.flush({
        state: state,
      });
    }
    return output;
  }
}

export class TransformToByte {
  constructor() {
  }
  init() {
    return {};
  }
  execute(args) {
    return 0;
  }
  flush(args) {
    return 0;
  }
  syncExecute(args) {
    const { inputView, outputByteRate } = (function () {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!("input" in args)) {
        throw "Argument \"input\" must be provided.";
      }
      if (!("outputByteRate" in args)) {
        throw "Argument \"outputByteRate\" must be provided.";
      }
      return {
        input: args.input,
        outputByteRate: args.outputByteRate,
      };
    })();
    const state = this.init();
    const output = new Sequence.ByteSequence();
    let outputView = output.reserve(outputByteRate);
    let outputBytes = this.execute({
      input: null,
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      output.extend(outputBytes);
      output.reserve(outputByteRate);
      outputBytes = this.execute({
        input: null,
        output: outputView,
        state: state,
      });
    }
    outputBytes = this.execute({
      input: inputView,
      output: outputView,
      state: state,
    });
    while (outputBytes !== null) {
      output.extend(outputBytes);
      output.reserve(outputByteRate);
      outputBytes = this.execute({
        input: null,
        output: outputView,
        state: state,
      });
    }
    outputBytes = this.flush({
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      output.extend(outputBytes);
      output.reserve(outputByteRate);
      outputBytes = this.flush({
        state: state,
      });
    }
    output.extend(0);
    return output.createView();
  }
  syncExecuteInto(args) {
    const { input, output } = (function () {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!("input" in args)) {
        throw "Argument \"input\" must be provided.";
      }
      if (!("output" in args)) {
        throw "Argument \"output\" must be provided.";
      }
      return {
        input: args.input,
        output: args.output,
      };
    })();
    const state = this.init();
    let outputIndex = 0;
    let outputView = output.slice({
      byteOffset: outputIndex,
    });
    let outputBytes = this.execute({
      input: null,
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      outputIndex += outputBytes;
      outputView = output.slice({
        byteOffset: outputIndex,
      });
      outputBytes = this.execute({
        input: null,
        output: outputView,
        state: state,
      });
    }
    for (const inputView of input) {
      outputBytes = this.execute({
        input: inputView,
        output: outputView,
        state: state,
      });
      while (outputBytes !== 0) {
        outputIndex += outputBytes;
        outputView = output.slice({
          byteOffset: outputIndex,
        });
        outputBytes = this.execute({
          input: null,
          output: outputView,
          state: state,
        });
      }
    }
    outputBytes = this.flush({
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      outputIndex += outputBytes;
      outputView = output.slice({
        byteOffset: outputIndex,
      });
      outputBytes = this.flush({
        state: state,
      });
    }
    return outputIndex;
  }
}

export class PassiveNode {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.Callback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNode.inputCallback",
        error: e,
      });
    }
  }
  disconnectInput() {
    try {
      this.#inputCallbackController.revokeCallback();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNode.disconnectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#outputCallback = newCallback;
      let output = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNode.connectOutput",
        error: e,
      });
    }
  }
  flush() {
    try {
      let output = this.#transform.flush({
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.flush({
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      let output = this.#transform.execute({
        input: item,
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNode.#execute",
        error: e,
      });
    }
  }
}

export class PassiveByteNode {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  #outputByteRate;
  #block;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.ByteCallback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#outputByteRate = args.outputByteRate;
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveByteNode.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
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
      this.#outputCallback = newCallback;
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteNode.connectOutput",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      this.#block = new Memory.Block({
        byteLength: byteLength,
      });
      return new Memory.View(this.#block);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteNode.#allocate",
        error: e,
      });
    }
  }
  flush() {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.flush({
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength !== 0) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.flush({
          output: outputView,
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveByteNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute(byteLength) {
    try {
      const inputView = (function () {
        if (this.#block === null) {
          return null;
        }
        return new Memory.View({
          memoryBlock: this.#block,
          byteLength: byteLength,
        });
      })();
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: inputView,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteNode.#execute",
        error: e,
      });
    }
  }
}

export class PassiveNodeToByte {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  #outputByteRate;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.Callback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#outputByteRate = args.outputByteRate;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeToByte constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNodeToByte.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
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
      this.#outputCallback = newCallback;
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeToByte.connectOutput",
        error: e,
      });
    }
  }
  flush() {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.flush({
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength !== 0) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.flush({
          output: outputView,
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeToByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNodeToByte.flushedSignal",
        error: e,
      });
    }
  }
  #execute(inputItem) {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: inputItem,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeToByte.#execute",
        error: e,
      });
    }
  }
}

export class PassiveNodeFromByte {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  #block;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.ByteCallback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeFromByte constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNodeFromByte.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#outputCallback = newCallback;
      let outputItem = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      while (outputItem !== null) {
        this.#outputCallback.invoke(outputItem);
        outputItem = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeFromByte.connectOutput",
        error: e,
      });
    }
  }
  flush() {
    try {
      let output = this.#transform.flush({
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.flush({
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeFromByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveNodeFromByte.flushedSignal",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      this.#block = new Memory.Block({
        byteLength: byteLength,
      });
      return new Memory.View(this.#block);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeFromByte.#allocate",
        error: e,
      });
    }
  }
  #execute(byteLength) {
    try {
      const inputView = (function () {
        if (this.#block === null) {
          return null;
        }
        return new Memory.View({
          memoryBlock: this.#block,
          byteLength: byteLength,
        });
      })();
      let outputItem = this.#transform.execute({
        input: inputView,
        state: this.#state,
      });
      while (outputItem !== null) {
        this.#outputCallback.invoke(outputItem);
        outputItem = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveNodeFromByte.#execute",
        error: e,
      });
    }
  }
}

export class LazyNode {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNode constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyNode.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNode.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      // input: pass nothing, returns object
      // transform: returns object as output
      if (this.#flushing) {
        let outputItem = this.#transform.flush({
          state: this.#state,
        });
        if (outputItem !== null) {
          return outputItem;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return null;
      }
      let outputItem = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      if (outputItem !== null) {
        return outputItem;
      }
      let inputItem = this.#inputCallback.invoke();
      outputItem = this.#transform.execute({
        input: inputItem,
        state: this.#state,
      });
      // This has the possibility of entering an infinite loop
      while (outputItem === null) {
        inputItem = this.#inputCallback.invoke();
        outputItem = this.#transform.execute({
          input: inputItem,
          state: this.#state,
        });
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNode.#execute",
        error: e,
      });
    }
  }
}

export class LazyByteNode {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #inputDataRate;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#inputDataRate = args.#inputDataRate;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteNode constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyByteNode.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteNode.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyByteNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      // input: create and pass Memory.View
      // transform: writes data to outputView
      if (this.#flushing) {
        let outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
        if (outputByteLength !== 0) {
          return outputByteLength;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return 0;
      }
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      if (outputByteLength !== 0) {
        return outputByteLength;
      }
      let inputView = this.#inputCallback.invoke(this.#inputDataRate);
      outputByteLength = this.#transform.execute({
        input: inputView,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === 0) {
        inputView = this.#inputCallback.invoke(this.#inputDataRate);
        outputByteLength = this.#transform.execute({
          input: inputView,
          output: outputView,
          state: this.#state,
        });
      }
      return outputByteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteNode.#execute",
        error: e,
      });
    }
  }
}

export class LazyNodeToByte {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeToByte constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyNodeToByte.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeToByte.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeToByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyNodeToByte.flushedSignal",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      // input: pass nothing, returns object
      // transform: returns object as output
      if (this.#flushing) {
        let outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
        if (outputByteLength !== 0) {
          return outputByteLength;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return 0;
      }
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      if (outputByteLength !== 0) {
        return outputByteLength;
      }
      let inputItem = this.#inputCallback.invoke();
      outputByteLength = this.#transform.execute({
        input: inputItem,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === 0) {
        inputItem = this.#inputCallback.invoke();
        outputByteLength = this.#transform.execute({
          input: inputItem,
          output: outputView,
          state: this.#state,
        });
      }
      return outputByteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeToByte.#execute",
        error: e,
      });
    }
  }
}

export class LazyNodeFromByte {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #inputDataRate;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#inputDataRate = args.#inputDataRate;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeFromByte constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyNodeFromByte.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
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
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeFromByte.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeFromByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyNodeFromByte.flushedSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      // input: create and pass Memory.View
      // transform: writes data to outputView
      if (this.#flushing) {
        let outputItem = this.#transform.execute({
          input: null,
          state: this.#state,
        });
        if (outputItem !== null) {
          return outputItem;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return null;
      }
      let outputItem = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      if (outputItem !== null) {
        return outputItem;
      }
      let inputView = this.#inputCallback.invoke();
      outputItem = this.#transform.execute({
        input: inputView,
        state: this.#state,
      });
      while (outputItem === null) {
        inputView = this.#inputCallback.invoke();
        outputItem = this.#transform.execute({
          input: inputView,
          state: this.#state,
        });
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyNodeFromByte.#execute",
        error: e,
      });
    }
  }
}

export class BlobChunkPushSource {
  #blob;
  #outputByteRate;
  #taskCallback;
  #outputCallback;
  #blobIndex;
  #eofSignalController;
  constructor(args) {
    try {
      this.#blob = args.blob;
      this.#outputByteRate = args.outputByteRate;
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#taskCallback = new Tasks.Callback({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.Callback(null);
      this.#blobIndex = 0;
      this.#eofSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkPushSource constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          return args.callback;
        } else {
          return args;
        }
      })();
      this.#outputCallback = newCallback;
      if (this.#blobIndex < this.#blob.size) {
        Tasks.queueTask(this.#taskCallback);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkPushSource.connectOutput",
        error: e,
      });
    }
  }
  get eofSignal() {
    try {
      return this.#eofSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkPushSource.eofSignal",
        error: e,
      });
    }
  }
  async #execute() {
    try {
      const index = this.#blobIndex;
      const byteRate = this.#outputByteRate;
      const blob = this.#blob;
      const thisSlice = (function () {
        if (index + byteRate > blob.length) {
          return blob.slice(index);
        } else {
          return blob.slice(index, index + byteRate);
        }
      })();
      const thisBuffer = await thisSlice.arrayBuffer();
      const thisBlock = new Memory.Block(thisBuffer);
      const thisView = new Memory.View(thisBlock);
      this.#blobIndex += thisSlice.size;
      this.#outputCallback.invoke(thisView);
      if (this.#blobIndex < this.#blob.size) {
        Tasks.queueTask(this.#taskCallback);
      } else {
        this.#eofSignalController.dispatch();
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkPushSource.#execute",
        error: e,
      });
    }
  }
}

export class AsyncBytePushSource {
  #asyncFunction;
  #outputDataRate;
  #interval;
  #smoothingFactor;
  #staticExecute;
  #outputCallback;
  #endedSignalController;
  // Statistics
  #avgRunTime;
  #avgInterval;
  #lastStartTime;
  #outputByteRate;
  constructor(args) {
    try {
      this.#asyncFunction = args.asyncFunction;
      this.#outputDataRate = args.outputDataRate;
      this.#interval = args.interval;
      this.#smoothingFactor = args.smoothingFactor;
      // Initialize
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.outputCallback = new Tasks.ByteCallback(null);
      this.#endedSignalController = new Tasks.SignalController();
      const view = this.#outputCallback.allocate(this.#outputByteRate);
      this.#asyncFunction(view).then(this.#execute);
      // Statistics
      this.#avgRunTime = 0;
      this.#avgInterval = this.#interval;
      this.#lastStartTime = performance.now();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePushSource constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
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
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePushSource.connectOutput",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSource.endedSignal",
        error: e,
      });
    }
  }
  get avgInterval() {
    try {
      return this.#avgInterval;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSource.avgInterval",
        error: e,
      });
    }
  }
  get avgRunTime() {
    try {
      return this.#avgRunTime;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSource.avgRunTime",
        error: e,
      });
    }
  }
  async #execute(byteLength) {
    try {
      const start = self.performance.now();
      let promise;
      self.setTimeout(function () {
        promise.then(this.#staticExecute);
      }, this.#interval);
      this.#outputCallback.invoke(byteLength);
      if (byteLength !== this.#outputByteRate) {
        this.#endedSignalController.dispatch();
        return;
      }
      const view = this.#outputCallback.allocate(this.#outputByteRate);
      promise = this.#asyncFunction(view);
      const end = self.performance.now();
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePushSource.#execute",
        error: e,
      });
    }
  }
}

export class AsyncPushSourceNode {
  #asyncSource;
  #state;
  #interval;
  #staticExecute;
  #outputCallback;
  #endedSignalController;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#asyncSource = args.asyncSource;
      this.#interval = args.interval;
      // Initialize
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.outputCallback = new Tasks.Callback(null);
      this.#endedSignalController = new Tasks.SignalController();
      // Statistics
      this.#smoothingFactor = args.smoothingFactor;
      this.#lastStartTime = performance.now();
      this.#avgRunTime = 0;
      this.#avgInterval = this.#interval;
      // Initialize
      this.#asyncSource.init().then(function (initState) {
        this.#state = initState;
        this.#execute();
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPushSourceNode constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
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
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPushSourceNode.connectOutput",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get avgInterval() {
    try {
      return this.#avgInterval;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.avgInterval",
        error: e,
      });
    }
  }
  get avgRunTime() {
    try {
      return this.#avgRunTime;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.avgRunTime",
        error: e,
      });
    }
  }
  async #execute(outputItem) {
    try {
      const start = self.performance.now();
      let promise;
      self.setTimeout(function () {
        promise.then(this.#staticExecute);
      }, this.#interval);
      this.#outputCallback.invoke(outputItem);
      if (outputItem === null) {
        this.#endedSignalController.dispatch();
        return;
      }
      promise = this.#asyncSource.execute({
        state: this.#state,
      });
      const end = self.performance.now();
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPushSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncSource {
  constructor() {
  }
  async init() {
    return {};
  }
  async execute(args) {
    return null;
  }
  async asyncExecute(args) {
    const state = await this.init();
    const output = new Sequence.Sequence();
    let outputItem = await this.execute({
      state: state,
    });
    while (outputItem !== null) {
      outputItem = await this.execute({
        state: state,
      });
      output.extend(outputItem);
    }
    return output;
  }
}

export function createBlobChunkSource(args) {
  const { blob, outputByteRate } = (function () {
    let ret = {};
    if (!("blob" in args)) {
      throw "Argument \"blob\" must be provided.";
    }
    ret.blob = args.blob;
    if (!("outputByteRate" in args)) {
      throw "Argument \"outputByteRate\" must be provided.";
    }
    ret.outputByteRate = args.outputByteRate;
    return ret;
  })();
  const blobChunk = new AsyncSource();
  blobChunk.init = async function () {
    try {
      return {
        blob: blob,
        blobIndex: 0,
        outputByteRate: outputByteRate,
      };
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkSource.#execute",
        error: e,
      });
    }
  }
  blobChunk.execute = async function (args) {
    try {
      const { state } = (function () {
        let ret = {};
        if (!("state" in args)) {
          throw "Argument \"state\" must be provided.";
        }
        ret.state = args.state;
        return ret;
      })();
      const thisSlice = (function () {
        if (state.blobIndex + state.outputByteRate > state.blob.length) {
          return state.blob.slice(state.blobIndex);
        } else {
          return state.blob.slice(state.blobIndex, state.blobIndex + state.outputByteRate);
        }
      })();
      state.blobIndex += thisSlice.size;
      return await thisSlice.arrayBuffer();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkSource.#execute",
        error: e,
      });
    }
  }
  return blobChunk;
}
