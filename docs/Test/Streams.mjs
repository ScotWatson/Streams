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
      this.#inputCallbackController = new UniqueCallbackController({
        function: this.#staticExecute,
      });
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
        functionName: "Splitter.connect",
        error: e,
      });
    }
  }
  disconnectAllRevoked(args) {
    const newCallbackSet = new Set();
    for (const callback of this.#outputCallbackSet) {
      if (!(callback.isRevoked())) {
        newCallbackSet.add(callback);
      }
    }
    this.#outputCallbackSet = newCallbackSet;
  }
  #execute(item) {
    for (const callback of this.#outputCallbackSet) {
      callback.invoke(item);
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
export function createReadableStream() {
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
      this.#inputCallbackController = new Tasks.CallbackController(staticInput);
      const staticOutput = new Tasks.createStatic({
        function: this.#pull,
        this: this,
      });
      this.#outputCallbackController = new Tasks.CallbackController(staticOutput);
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
      function: taskFunction,
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


