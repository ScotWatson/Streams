/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Test/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/Test/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Containers/Test/Queue.mjs";
import * as Memory from "https://scotwatson.github.io/Memory/Test/Memory.mjs";
import * as Tasks from "https://scotwatson.github.io/Tasks/Test/Tasks.mjs";

class Pusher {
  #callbackPush;
  constructor(args) {
    try {
      if (Types.isSimpleObject(args)) {
        this.#callbackPush = args.callbackPush;
      } else {
        this.#callbackPush = args;
      }
      if (!(Types.isInvocable(this.#callbackPush))) {
        throw "Argument \"callbackPush\" must be invocable.";
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pusher constructor",
        error: e,
      });
    }
  }
  push(item) {
    try {
      return this.#callbackPush(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pusher.push",
        error: e,
      });
    }
  }
  release() {
    // This function only perfroms an assignment operation, so there is no possibility of throwing an error.
    this.#callbackPush = pushError;
  }
  static pushError() {
    ErrorLog.rethrow({
      functionName: "Pusher.push",
      error: "Pusher has been disconnected from its sink.",
    });
  }
};

class Puller {
  #callbackPull;
  constructor(args) {
    try {
      if (Types.isSimpleObject(args)) {
        this.#callbackPull = args.callbackPull;
      } else {
        this.#callbackPull = args;
      }
      if (!(Types.isInvocable(this.#callbackPull))) {
        throw "Argument \"callbackPull\" must be invocable.";
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Puller constructor",
        error: e,
      });
    }
  }
  pull() {
    try {
      return this.#callbackPull();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Puller.pull",
        error: e,
      });
    }
  }
  release() {
    // This function only perfroms an assignment operation, so there is no possibility of throwing an error.
    this.#callbackPull = pullError;
  }
  static pullError() {
    ErrorLog.rethrow({
      functionName: "Puller.pull",
      error: "Puller has been disconnected from its source.",
    });
  }
};

export class PullSink {
  #puller;
  constructor(args) {
    try {
      this.#puller = null;
      args.execute = Types.createStaticFunction({
        function: this.#execute,
        thisArg: this,
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
      if (!("getPuller" in newSource)) {
        throw "Argument \"source\" must provide a getPuller function. (It must be a pull source.)";
      }
      if (!(Types.isInvocable(newSource.getPuller))) {
        throw "\"source.getPuller\" must be a function.";
      }
      const newPuller = newSource.getPuller();
      if (!(newPuller instanceof Puller)) {
        throw "\"source.getPuller()\" must return a Puller. Try using a source derived from the Streams library.";
      }
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.connect",
        error: e,
      });
    }
  }
  disconnect() {
    try {
      this.#puller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.connect",
        error: e,
      });
    }
  }
  #execute() {
    try {
      if (this.#puller === null) {
        throw "PullSource must be connected to execute.";
      }
      return this.#puller.pull();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.connect",
        error: e,
      });
    }
  }
}

export class PullSinkController {
  #sink;
  #execute;
  constructor(args) {
    const sinkArgs = {};
    this.#sink = new PullSink(sinkArgs);
    this.#execute = sinkArgs.execute;
  }
  get sink() {
    return this.#sink;
  }
  execute(item) {
    this.#push(item);
  }
}

export class PushSource {
  #pushers;
  constructor(args) {
    try {
      this.#pushers = new Map();
      args.execute = Types.createStaticFunction({
        function: this.#execute,
        thisArg: this,
      });
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
      if (!("getPusher" in newSink)) {
        throw "Argument \"sink\" must provide a getPusher function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getPusher))) {
        throw "\"sink.getPusher\" must be a function.";
      }
      const newPusher = newSink.getPusher();
      if (!(newPusher instanceof Pusher)) {
        throw "\"sink.getPusher()\" must return a Pusher. Try using a sink derived from the Streams library.";
      }
      this.#pushers.set(newSink, newPusher);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource.connect",
        error: e,
      });
    }
  }
  disconnect(args) {
    try {
      let sink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        sink = args.sink;
      } else {
        sink = args;
      }
      this.#pushers.delete(sink);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource.disconnect",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      for (const [ _, pusher ] of this.#pushers) {
        pusher.push(item);
      }
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
    return this.#source;
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

export class PushSink {
  #pusher;
  constructor(args) {
  }
  getPusher() {
    try {
      const callback = Types.createStaticFunction({
        function: this.#push,
        thisObj: this,
      });
      const newPusher = new Pusher({
        callbackPush: callback,
      });
      this.#pusher.release();
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe.getPusher",
        error: e,
      });
    }
  }
}





// Passive, provides a pusher and a puller
export class Pipe {
  #queue;
  #pusher;
  #puller;
  constructor() {
    try {
      super();
      this.#queue = new Queue.Queue({
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe constructor",
        error: e,
      });
    }
  }
  getPusher() {
    try {
      const newPusher = new Pusher({
        callbackPush: Types.createStaticAsyncFunc(this, this.#push),
      });
      this.#pusher.release();
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe.getPusher",
        error: e,
      });
    }
  }
  async #push(item) {
    if (this.#queue.isFull()) {
      this.dispatchEvent("buffer-full");
    }
    this.#queue.enqueue(item);
  }
  getPuller() {
    try {
      const newPuller = new Puller({
        callbackPull: Types.createStaticFunc(this, this.#pull),
      });
      this.#puller.release();
      this.#puller = newPuller;
      return this.#puller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pipe.getPuller",
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
};

// Active, accepts a puller and pushers
export class Pump {
  #puller;
  #pushers;
  constructor() {
    try {
      this.#puller = null;
      this.#pushers = new Map();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump constructor",
        error: e,
      });
    }
  }
  setSource(args) {
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
      if (!("getPuller" in newSource)) {
        throw "Argument \"source\" must provide a getPuller function. (It must be a pull source.)";
      }
      if (!(Types.isInvocable(newSource.getPuller))) {
        throw "\"source.getPuller\" must be a function.";
      }
      const newPuller = newSource.getPuller();
      if (!(newPuller instanceof Puller)) {
        throw "\"source.getPuller()\" must return a Puller. Try using a source derived from the Streams library.";
      }
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.setSource",
        error: e,
      });
    }
  }
  registerSink(args) {
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
      if (!("getPusher" in newSink)) {
        throw "Argument \"sink\" must provide a getPusher function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getPusher))) {
        throw "\"sink.getPusher\" must be a function.";
      }
      const newPusher = newSink.getPusher();
      if (!(newPusher instanceof Pusher)) {
        throw "\"sink.getPusher()\" must return a Pusher. Try using a sink derived from the Streams library.";
      }
      this.#pushers.set(newSink, newPusher);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.registerSink",
        error: e,
      });
    }
  }
  unregisterSink(args) {
    try {
      let sink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        sink = args.sink;
      } else {
        sink = args;
      }
      if (this.#pushers.has(sink)) {
        this.#pushers.get(sink).release();
      }
      this.#pushers.delete(sink);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.unregisterSink",
        error: e,
      });
    }
  }
  execute() {
    try {
      if (this.#puller === null) {
        throw "Source must be non-null.";
      }
      const item = this.#puller.pull();
      for (const [ _, pusher] of this.#pushers) {
        pusher.push(item);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Pump.execute",
        error: e,
      });
    }
  }
}

async function get(view) {
  const {value, done} = await reader.read(view);
  return value;
}

export class AsyncByteReaderPushSource {
  #callback;
  #chunkByteLength;
  constructor(args) {
    let view;
    let offset = 0;
    let buffer = Memory.Block({
      byteLength: this.#chunkByteLength,
    });
    view = new Memory.View({
      memoryBlock: buffer,
      byteOffset: offset,
      byteLength: this.#chunkByteLength,
    });
    this.#callback(view).then(process);
    async function process(returnedView) {
      if (!(returnedView instanceof Memory.View)) {
        throw "callback must return a view.";
      }
      offset += returnedView.byteLength;
      if (offset < buffer.byteLength) {
        view = new Memory.View({
          memoryBlock: buffer,
          byteOffset: offset,
          byteLength: this.#chunkByteLength - offset,
        });
      } else {
        offset = 0;
        buffer = Memory.Block({
          byteLength: this.#chunkByteLength,
        });
      }
      Tasks.queueTask(function () {
        this.#callback(view).then(process);
      });
    }
  }
}

export class AsyncFunctionPushSource {
  #callback;
  #sinks;
  constructor(args) {
    try {
      this.#callback = args.callback;
      this.#sinks = new Sinks();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncFunctionPushSource constructor",
        error: e,
      });
    }
  }
  get sinks() {
    return this.#sinks;
  }
  async execute() {
    try {
      const item = await this.#callback();
      for (const [ _, pusher ] of this.#pushers) {
        pusher.push(item);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncFunctionPushSource.execute",
        error: e,
      });
    }
  }
}

export class SignalPushSource {
  #callback;
  #sinks;
  constructor(args) {
    try {
      this.#callback = args.callback;
      args.signal.add(Types.createStaticFunction(this.#execute, this));
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "SignalPushSource constructor",
        error: e,
      });
    }
  }
  #execute(evt) {
    try {
      const item = this.#callback(evt);
      for (const [ _, pusher ] of this.#pushers) {
        pusher.push(item);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "SignalPushSource.execute",
        error: e,
      });
    }
  }
}

// Active, accepts a puller
export class PullSink {
  #callbackPush;
  #puller;
  constructor(args) {
    try {
      super();
      if (this.constructor === PullSink) {
        throw "PullSink is an abstract class.";
      }
      let push;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "push"))) {
          throw "Argument \"push\" must be provided.";
        }
        push = args.pull;
      } else {
        push = args;
      }
      if (!(Types.isInvocable(push))) {
        throw "Argument \"push\" must be invocable.";
      }
      this.#callbackPush = push;
      this.#puller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink constructor",
        error: e,
      });
    }
  }
  setSource(args) {
    try {
      let newSource;
      if (Types.isSimpleObject(args)) {
        newSource = args.source;
      } else {
        newSource = args;
      }
      if (!("getPuller" in newSource)) {
        throw "Argument \"source\" must provide a getPuller function.";
      }
      if (!(Types.isInvocable(newSource.getPuller))) {
        throw "\"source.getPuller\" must be a function.";
      }
      const newPuller = newSource.getPuller();
      if (!(newPuller instanceof Puller)) {
        throw "\"source.getPuller()\" must return a Puller. Try using a source derived from the Streams library.";
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.setSource",
        error: e,
      });
    }
  }
  execute() {
    try {
      const item = this.puller.pull();
      this.callbackPush(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.execute",
        error: e,
      });
    }
  }
};

export class PullSource extends self.EventTarget {
  #puller;
  #callbackPull;
  constructor(args) {
    try {
      super();
      if (this.constructor === PullSource) {
        throw "PullSource is an abstract class.";
      }
      this.#puller = null;
      let pull;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "pull"))) {
          throw "Argument \"pull\" must be provided.";
        }
        pull = args.pull;
      } else {
        pull = args;
      }
      if (!(Types.isInvocable(pull))) {
        throw "Argument \"pull\" must be invocable.";
      }
      this.#callbackPull = pull;
      this.#puller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSource constructor",
        error: e,
      });
    }
  }
  getPuller() {
    try {
      const newPuller = new Puller({
        callbackPull: this.#callbackPull,
      });
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
      return this.#puller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSource.getPuller",
        error: e,
      });
    }
  }
  createReadableStream() {
    const puller = this.getPuller();
    const underlyingSource = {
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        const item = puller.pull();
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
  }
};

export class PushSink {
  #pusher;
  #callbackPush;
  constructor(args) {
    try {
      let push;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "push"))) {
          throw "Argument \"push\" must be provided.";
        }
        push = args.push;
      } else {
        push = args;
      }
      if (!(Types.isInvocable(push))) {
        throw "Argument \"push\" must be invocable.";
      }
      this.#callbackPush = push;
      this.#pusher = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSink constructor",
        error: e,
      });
    }
  }
  getPusher() {
    try {
      const newPusher = new Pusher({
        callbackPush: this.#callbackPush,
      });
      if (this.#pusher !== null) {
        this.#pusher.release();
      }
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSink.getPusher",
        error: e,
      });
    }
  }
  createWritableStream() {
    const pusher = this.getPusher();
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        pusher.push(chunk);
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
  }
};

export class ReadableStreamSource extends PullSource {
  #reader;
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
      super(async function (...args) {
        const { done, value } = await Types.createStaticAsyncFunc(reader, reader.read)(...args);
        return value;
      });
      /*
      reader.closed.then(
        Types.createStaticAsyncFunc(this, this.#eventClosed),
        Types.createStaticAsyncFunc(this, this.#eventCancelled)
      );
      */
      this.#reader = reader;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableStreamSource constructor",
        error: e,
      });
    }
  }
  /*
  async #eventClosed() {
    this.dispatchEvent("closed");
  }
  async #eventCancelled() {
    this.dispatchEvent("cancelled");
  }
  */
};

export class WritableStreamSink extends PushSink {
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
      const writer = writableStream.getWriter();
      super(Types.createStaticAsyncFunc(writer, writer.write));
      this.#writer = writer;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamSink constructor",
        error: e,
      });
    }
  }
};

class BytePusher {
  #callbackPush;
  constructor(args) {
    try {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      this.#callbackPush = args.callbackPush;
      this.#callbackReserve = args.callbackReserve;
      if (!(Types.isInvocable(this.#callbackPush))) {
        throw "Argument \"callbackPush\" must be invocable.";
      }
      if (!(Types.isInvocable(this.#callbackReserve))) {
        throw "Argument \"callbackReserve\" must be invocable.";
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePusher constructor",
        error: e,
      });
    }
  }
  reserve() {
    try {
      return this.#callbackReserve(view);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePusher.reserve",
        error: e,
      });
    }
  }
  push(view) {
    try {
      return this.#callbackPush(view);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePusher.push",
        error: e,
      });
    }
  }
  release() {
    // This function only perfroms an assignment operation, so there is no possibility of throwing an error.
    this.#callbackPush = pushError;
    this.#callbackReserve = reserveError;
  }
  static pushError() {
    ErrorLog.rethrow({
      functionName: "BytePusher.push",
      error: "BytePusher has been disconnected from its sink.",
    });
  }
  static reserveError() {
    ErrorLog.rethrow({
      functionName: "BytePusher.reserve",
      error: "BytePusher has been disconnected from its sink.",
    });
  }
};

class BytePuller {
  #callbackPull;
  constructor(args) {
    try {
      if (Types.isSimpleObject(args)) {
        this.#callbackPull = args.callbackPull;
      } else {
        this.#callbackPull = args;
      }
      if (!(Types.isInvocable(this.#callbackPull))) {
        throw "Argument \"callbackPull\" must be invocable.";
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePuller constructor",
        error: e,
      });
    }
  }
  pull() {
    try {
      return this.#callbackPull();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePuller.pull",
        error: e,
      });
    }
  }
  release() {
    // This function only perfroms an assignment operation, so there is no possibility of throwing an error.
    this.#callbackPull = pullError;
  }
  static pullError() {
    ErrorLog.rethrow({
      functionName: "BytePuller.pull",
      error: "BytePuller has been disconnected from its source.",
    });
  }
};

// Passive, provides a pusher and a puller
export class BytePipe {
  #queue;
  #pusher;
  #puller;
  constructor(args) {
    try {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!(Object.hasOwn(args, "byteCapacity"))) {
        throw "Argument \"byteCapacity\" must be provided.";
      }
      this.#queue = new Queue.ByteQueue({
        byteCapacity: args.byteCapacity,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe constructor",
        error: e,
      });
    }
  }
  getPusher() {
    try {
      const newPusher = new BytePusher({
        callbackPush: Types.createStaticFunc(this, this.#push),
        callbackReserve: Types.createStaticFunc(this, this.#reserve),
      });
      this.#pusher.release();
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.getPusher",
        error: e,
      });
    }
  }
  #push() {
    try {
      this.#queue.enqueue();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.#enqueue",
        error: e,
      });
    }
  }
  #reserve() {
    try {
      return this.#queue.reserve();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.#reserve",
        error: e,
      });
    }
  }
  getPuller() {
    try {
      const newPuller = new BytePuller({
        callbackPull: Types.createStaticFunc(this, this.#pull),
      });
      this.#puller.release();
      this.#puller = newPuller;
      return this.#puller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipe.getPuller",
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
};

// Active, accepts a puller and pushers
export class BytePump extends self.EventTarget {
  #puller;
  #pushers;
  constructor() {
    try {
      super();
      this.#puller = null;
      this.#pushers = new Map();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump constructor",
        error: e,
      });
    }
  }
  setSource(args) {
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
      if (!("getPuller" in newSource)) {
        throw "Argument \"source\" must provide a getPuller function. (It must be a pull source.)";
      }
      if (!(Types.isInvocable(newSource.getPuller))) {
        throw "\"source.getPuller\" must be a function.";
      }
      const newPuller = newSource.getPuller();
      if (!(newPuller instanceof BytePuller)) {
        throw "\"source.getPuller()\" must return a BytePuller. Try using a source derived from the Streams library.";
      }
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.setSource",
        error: e,
      });
    }
  }
  registerSink(args) {
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
      if (!("getPusher" in newSink)) {
        throw "Argument \"sink\" must provide a getPusher function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getPusher))) {
        throw "\"sink.getPusher\" must be a function.";
      }
      const newPusher = newSink.getPusher();
      if (!(newPusher instanceof BytePusher)) {
        throw "\"sink.getPusher()\" must return a BytePusher. Try using a sink derived from the Streams library.";
      }
      this.#pushers.set(newSink, newPusher);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.registerSink",
        error: e,
      });
    }
  }
  unregisterSink(args) {
    try {
      let sink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        sink = args.sink;
      } else {
        sink = args;
      }
      if (this.#pushers.has(sink)) {
        this.#pushers.get(sink).release();
      }
      this.#pushers.delete(sink);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.unregisterSink",
        error: e,
      });
    }
  }
  execute() {
    try {
      if (this.#puller === null) {
        throw "Source must be non-null.";
      }
      let fromView = null;
      let toView = null;
      for (const [ _, pusher] of this.#pushers) {
        toView = pusher.reserve();
        if (fromView === null) {
          this.#puller.pull(toView);
        } else {
          toView.set(fromView);
        }
        pusher.push();
        fromView = toView;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePump.execute",
        error: e,
      });
    }
  }
}

// Active, accepts a pusher
export class BytePushSource extends self.EventTarget {
  #callbackPull;
  #pushers;
  constructor(args) {
    try {
      super();
      if (this.constructor === BytePushSource) {
        throw "BytePushSource is an abstract class.";
      }
      this.#pushers = new Map();
      let pull;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "pull"))) {
          throw "Argument \"pull\" must be provided.";
        }
        pull = args.pull;
      } else {
        pull = args;
      }
      if (!(Types.isInvocable(pull))) {
        throw "Argument \"pull\" must be invocable.";
      }
      this.#callbackPull = pull;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource constructor",
        error: e,
      });
    }
  }
  registerSink(args) {
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
      if (!("getPusher" in newSink)) {
        throw "Argument \"sink\" must provide a getPusher function. (It must be a push sink.)";
      }
      if (!(Types.isInvocable(newSink.getPusher))) {
        throw "\"sink.getPusher\" must be a function.";
      }
      const newPusher = newSink.getPusher();
      if (!(newPusher instanceof BytePusher)) {
        throw "\"sink.getPusher()\" must return a BytePusher. Try using a sink derived from the Streams library.";
      }
      this.#pushers.set(newSink, newPusher);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource.registerSink",
        error: e,
      });
    }
  }
  unregisterSink(args) {
    try {
      let sink;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "sink"))) {
          throw "Argument \"sink\" must be provided.";
        }
        sink = args.sink;
      } else {
        sink = args;
      }
      this.#pushers.delete(sink);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource.unregisterSink",
        error: e,
      });
    }
  }
  execute() {
    try {
      if (this.#puller === null) {
        throw "Source must be non-null.";
      }
      let fromView = null;
      let toView = null;
      for (const [ _, pusher] of this.#pushers) {
        toView = pusher.reserve();
        if (fromView === null) {
          this.#callbackPull(toView);
        } else {
          toView.set(fromView);
        }
        pusher.push();
        fromView = toView;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSource.execute",
        error: e,
      });
    }
  }
};

// Active, accepts a puller
export class BytePullSink {
  #callbackPush;
  #callbackReserve;
  #puller;
  constructor(args) {
    try {
      if (this.constructor === BytePullSink) {
        throw "BytePullSink is an abstract class.";
      }
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!(Object.hasOwn(args, "push"))) {
        throw "Argument \"push\" must be provided.";
      }
      if (!(Types.isInvocable(args.push))) {
        throw "Argument \"push\" must be invocable.";
      }
      this.#callbackPush = args.push;
      if (!(Object.hasOwn(args, "reserve"))) {
        throw "Argument \"reserve\" must be provided.";
      }
      if (!(Types.isInvocable(args.reserve))) {
        throw "Argument \"reserve\" must be invocable.";
      }
      this.#callbackReserve = args.reserve;
      this.#puller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink constructor",
        error: e,
      });
    }
  }
  setSource(args) {
    try {
      let newSource;
      if (Types.isSimpleObject(args)) {
        newSource = args.source;
      } else {
        newSource = args;
      }
      if (!("getPuller" in newSource)) {
        throw "Argument \"source\" must provide a getPuller function.";
      }
      if (!(Types.isInvocable(newSource.getPuller))) {
        throw "\"source.getPuller\" must be a function.";
      }
      const newPuller = newSource.getPuller();
      if (!(newPuller instanceof BytePuller)) {
        throw "\"source.getPuller()\" must return a BytePuller. Try using a source derived from the Streams library.";
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink.setSource",
        error: e,
      });
    }
  }
  execute() {
    try {
      const view = this.#callbackReserve();
      this.#puller.pull(view);
      this.#callbackPush();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSink.execute",
        error: e,
      });
    }
  }
};

export class BytePullSource {
  #puller;
  #callbackPull;
  constructor(args) {
    try {
      if (this.constructor === BytePullSource) {
        throw "BytePullSource is an abstract class.";
      }
      let pull;
      if (Types.isSimpleObject(args)) {
        if (!(Object.hasOwn(args, "pull"))) {
          throw "Argument \"pull\" must be provided.";
        }
        pull = args.pull;
      } else {
        pull = args;
      }
      if (!(Types.isInvocable(pull))) {
        throw "Argument \"pull\" must be invocable.";
      }
      this.#callbackPull = pull;
      this.#puller = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSource constructor",
        error: e,
      });
    }
  }
  getPuller() {
    try {
      const newPuller = new BytePuller({
        callbackPull: this.#callbackPull,
      });
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
      return this.#puller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSource.getPuller",
        error: e,
      });
    }
  }
  createReadableStream() {
    const puller = this.getPuller();
    const underlyingSource = {
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        const item = puller.pull();
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
  }
};

export class BytePushSink extends self.EventTarget {
  #pusher;
  #callbackPush;
  #callbackReserve;
  constructor(args) {
    try {
      super();
      if (this.constructor === BytePushSink) {
        throw "BytePushSink is an abstract class.";
      }
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!(Object.hasOwn(args, "push"))) {
        throw "Argument \"push\" must be provided.";
      }
      if (!(Types.isInvocable(push))) {
        throw "Argument \"push\" must be invocable.";
      }
      this.#callbackPush = args.push;
      if (!(Object.hasOwn(args, "reserve"))) {
        throw "Argument \"reserve\" must be provided.";
      }
      if (!(Types.isInvocable(args.reserve))) {
        throw "Argument \"reserve\" must be invocable.";
      }
      this.#callbackReserve = args.reserve;
      this.#pusher = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSink constructor",
        error: e,
      });
    }
  }
  getPusher() {
    try {
      const newPusher = new BytePusher({
        callbackPush: this.#callbackPush,
        callbackReserve: this.#callbackReserve,
      });
      if (this.#pusher !== null) {
        this.#pusher.release();
      }
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSink.getPusher",
        error: e,
      });
    }
  }
  createWritableStream() {
    const pusher = this.getPusher();
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        pusher.push(chunk);
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
  }
};

export class ByteReadableStreamSource extends PullSource {
  #reader;
  #chunkLength;
  constructor(args) {
    try {
      let readableStream;
      if (Types.isSimpleObject(args)) {
        if (Object.hasOwn(args, "readableStream")) {
          throw "Argument \"readableStream\" must be provided.";
        }
        readableStream = args.readableStream;
        if (Object.hasOwn(args, "chunkLength")) {
          throw "Argument \"chunkLength\" must be provided.";
        }
        this.#chunkLength = args.chunkLength;
      } else {
        readableStream = args;
        this.#chunkLength = 1;
      }
      if (!(readableStream instanceof self.ReadableStream)) {
        throw "Argument \"readableStream\" must be of type self.ReadableStream.";
      }
      if (readableStream.locked) {
        throw "Argument \"readableStream\" must be unlocked.";
      }
      const reader = readableStream.getReader({
        mode: "byob",
      });
      /*
      reader.closed.then(
        Types.createStaticAsyncFunc(this, this.#eventClosed),
        Types.createStaticAsyncFunc(this, this.#eventCancelled)
      );
      */

      const dataPipe = new BytePipe();
      const dataPusher = dataPipe.getPusher();
      async function pull() {
        const view = dataPusher.push();
        const { done, value } = await Types.createStaticFunc(reader, reader.read)(view);
      }
      

      super(function () {
      });
      this.#reader = reader;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataReadableStreamSource constructor",
        error: e,
      });
    }
  }
  async #eventClosed() {
    this.dispatchEvent("closed");
  }
  async #eventCancelled() {
    this.dispatchEvent("cancelled");
  }
};

export class ByteWritableStreamSink extends PushSink {
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
      const writer = writableStream.getWriter();
      super(Types.createStaticFunc(writer, writer.write));
      this.#writer = writer;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteWritableStreamSink constructor",
        error: e,
      });
    }
  }
};

class ByteChunkPushSource {
  #chunkByteLength;
  constructor(args) {
    if (!(Types.isSimpleObject(args))) {
      throw "Argument must be a simple object.";
    }
    if (!(Object.hasOwn(args, "chunkByteLength"))) {
      throw "Argument \"chunkByteLength\" must be provided.";
    }
    this.#chunkByteLength = args.chunkByteLength;
  }
  registerSink(args) {
    if (!(Types.isSimpleObject(args))) {
      throw "Argument must be a simple object.";
    }
    if (!(Object.hasOwn(args, ""))) {
      throw "Argument \"chunkByteLength\" must be provided.";
    }
  }
  unregisterSink(args) {
  }
  execute() {
    new Memory.View({
      byteLength: this.#chunkByteLength,
    });
  }
};
