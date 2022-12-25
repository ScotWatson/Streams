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
        functionName: "Splitter.connect",
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
        functionName: "Splitter.connect",
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
        functionName: "Splitter.connect",
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
      this.#bufferFullController = new SignalController();
      this.#bufferEmptyController = new SignalController();
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
  #callback;
  #taskCallback;
  #chunkByteLength;
  #offset;
  #buffer;
  constructor(args) {
    try {
      this.#callback = args.callback;
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
      this.#buffer = Memory.Block({
        byteLength: this.#chunkByteLength,
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
        byteLength: this.#chunkByteLength - this.#offset,
      });
      const outputView = await this.#callback(inputView);
      if (!("byteLength" in outputView)) {
        throw "callback must return a view.";
      }
      this.#offset += outputView.byteLength;
      if (this.#offset >= this.#buffer.byteLength) {
        this.#pushCallback.invoke(this.#buffer);
        this.#offset = 0;
        this.#buffer = Memory.Block({
          byteLength: this.#chunkByteLength,
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
        functionName: "AsyncFunctionPushSource.connect",
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
      const readableStream = (function () {
        if (Types.isSimpleObject(args)) {
          if (Object.hasOwn(args, "readableStream")) {
            throw "Argument \"readableStream\" must be provided.";
          }
          return args.readableStream;
        } else {
          return args;
        }
      })();
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
        invoke: callbackFunction,
      });
      this.#pushSourceController = new AsyncByteReaderPushSource({
        callback: callbackController.callback,
      });
      this.#closedSignalController = new SignalController();
      this.#cancelledSignalController = new SignalController();
      reader.closed.then(function () {
        this.#closedSignalController.dispatch();
        this.#cancelledSignalController.dispatch();
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableStreamPushSource constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      return this.#pushSourceController.connectOutput(args);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableStreamPushSource.connect",
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
        functionName: "ReadableStreamPushSource.process",
        error: e,
      });
    }
  }
  get closed() {
    try {
      return this.#closedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableStreamPushSource.closed",
        error: e,
      });
    }
  }
  get cancelled() {
    try {
      return this.#cancelledSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableStreamPushSource.cancelled",
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
        functionName: "WritableStreamPushSink.disconnect",
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
        functionName: "ByteSplitter.connect",
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
export function createByteWritableStream(callback) {
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
      functionName: "createByteWritableStream",
      error: e,
    });
  }
}

// From "PullSource" callback (not byte callback)
export function createByteReadableStream(callback) {
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
      functionName: "createByteReadableStream",
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
      this.#bufferFullController = new SignalController();
      this.#bufferEmptyController = new SignalController();
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
      this.#queue.reserve(byteLength);
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
      this.#inputCallback = new Callback(null);
      this.#outputCallback = new ByteCallback(null);
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

export class PassiveTransform {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
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
      this.#state = args.state;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransform constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransform.inputCallback",
        error: e,
      });
    }
  }
  connect(args) {
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
      let output = this.#transform({
        input: null,
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransform.connect",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      let output = this.#transform({
        input: item,
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransform.#execute",
        error: e,
      });
    }
  }
}

export class PassiveByteTransform {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
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
      this.#state = args.state;
      this.#outputByteRate = args.outputByteRate;
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransform constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveByteTransform.inputCallback",
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
      let outputByteLength = this.#transform({
        input: null,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransform.connect",
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
        functionName: "PassiveByteTransform.#allocate",
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
      let outputByteLength = this.#transform({
        input: inputView,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransform.#execute",
        error: e,
      });
    }
  }
}

export class PassiveTransformToByte {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
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
      this.#state = args.state;
      this.#outputByteRate = args.outputByteRate;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformToByte constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformToByte.inputCallback",
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
      let outputByteLength = this.#transform({
        input: null,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformToByte.connect",
        error: e,
      });
    }
  }
  #execute(inputItem) {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform({
        input: inputItem,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformToByte.#execute",
        error: e,
      });
    }
  }
}

export class PassiveTransformFromByte {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
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
      this.#state = args.state;
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformFromByte constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformFromByte.inputCallback",
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
      let outputItem = this.#transform({
        input: null,
        state: this.#state,
      });
      while (outputItem !== null) {
        this.#outputCallback.invoke(outputItem);
        outputItem = this.#transform({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformFromByte.connect",
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
        functionName: "PassiveTransformFromByte.#allocate",
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
          memoryBlock: this.#block;
          byteLength: byteLength,
        });
      })();
      let outputItem = this.#transform({
        input: inputView,
        state: this.#state,
      });
      while (outputItem !== null) {
        this.#outputCallback.invoke(outputItem);
        outputItem = this.#transform({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformFromByte.#execute",
        error: e,
      });
    }
  }
}

export class LazyTransform {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransform constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransform.outputCallback",
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
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransform.connectInput",
        error: e,
      });
    }
  }
  #execute() {
    try {
      // input: pass nothing, returns object
      // transform: returns object as output
      let outputItem = this.#transform({
        input: null,
        state: this.#state,
      });
      if (outputItem !== null) {
        return outputItem;
      }
      let inputItem = this.#inputCallback.invoke();
      outputItem = this.#transform({
        input: inputItem,
        state: this.#state,
      });
      while (outputItem === null) {
        inputItem = this.#inputCallback.invoke();
        outputItem = this.#transform({
          input: inputItem,
          state: this.#state,
        });
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransform.#execute",
        error: e,
      });
    }
  }
}

export class LazyByteTransform {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #inputDataRate;
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransform constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyByteTransform.outputCallback",
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
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransform.connectInput",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      // input: create and pass Memory.View
      // transform: writes data to outputView
      let outputByteLength = this.#transform({
        input: null,
        output: outputView,
        state: this.#state,
      });
      if (outputByteLength !== 0) {
        return outputByteLength;
      }
      let inputView = this.#inputCallback.invoke(this.#inputDataRate);
      outputByteLength = this.#transform({
        input: inputView,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === 0) {
        inputView = this.#inputCallback.invoke(this.#inputDataRate);
        outputByteLength = this.#transform({
          input: inputView,
          output: outputView,
          state: this.#state,
        });
      }
      return outputByteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransform.#execute",
        error: e,
      });
    }
  }
}

export class LazyTransformToByte {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformToByte constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformToByte.outputCallback",
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
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformToByte.connectInput",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      // input: pass nothing, returns object
      // transform: returns object as output
      let outputByteLength = this.#transform({
        input: null,
        output: outputView,
        state: this.#state,
      });
      if (outputByteLength !== 0) {
        return outputByteLength;
      }
      let inputItem = this.#inputCallback.invoke();
      outputByteLength = this.#transform({
        input: inputItem,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === 0) {
        inputItem = this.#inputCallback.invoke();
        outputByteLength = this.#transform({
          input: inputItem,
          output: outputView,
          state: this.#state,
        });
      }
      return outputByteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformToByte.#execute",
        error: e,
      });
    }
  }
}

export class LazyTransformFromByte {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #inputDataRate;
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformFromByte constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformFromByte.outputCallback",
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
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformFromByte.connectInput",
        error: e,
      });
    }
  }
  #execute() {
    try {
      // input: create and pass Memory.View
      // transform: writes data to outputView
      let outputItem = this.#transform({
        input: null,
        state: this.#state,
      });
      if (outputItem !== null) {
        return outputItem;
      }
      let inputView = this.#inputCallback.invoke();
      outputItem = this.#transform({
        input: inputView,
        state: this.#state,
      });
      while (outputItem === null) {
        inputView = this.#inputCallback.invoke();
        outputItem = this.#transform({
          input: inputView,
          state: this.#state,
        });
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformFromByte.#execute",
        error: e,
      });
    }
  }
}
