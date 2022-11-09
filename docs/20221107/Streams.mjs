/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/20221107/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/20221107/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Containers/20221107/Queue.mjs";

function createStaticFunc(thisObj, func) {
  return (function (...args) {
    return func.apply(thisObj, args);
  });
}

function createStaticAsyncFunc(thisObj, asyncFunc) {
  return (async function (...args) {
    return await asyncFunc.apply(thisObj, args);
  });
}

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
  async push(item) {
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
  static async pushError() {
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
  async pull() {
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
  static async pullError() {
    ErrorLog.rethrow({
      functionName: "Puller.pull",
      error: "Puller has been disconnected from its source.",
    });
  }
};

// Passive, provides a pusher and a puller
export class Pipe extends self.EventTarget {
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
        callbackPush: createStaticAsyncFunc(this, this.#push),
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
        callbackPull: createStaticAsyncFunc(this, this.#pull),
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
  async #pull() {
    if (this.#queue.isEmpty()) {
      this.dispatchEvent("buffer-empty");
    }
    return this.#queue.dequeue();
  }
};

// Active, accepts a puller and pushers
export class Pump extends self.EventTarget {
  #puller;
  #pushers;
  constructor() {
    try {
      super();
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
  async execute() {
    try {
      if (this.#puller === null) {
        throw "Source must be non-null.";
      }
      const item = await this.#puller.pull();
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

// Active, accepts a pusher
export class PushSource extends self.EventTarget {
  #callbackPull;
  #pushers;
  constructor(args) {
    try {
      super();
      if (this.constructor === PushSource) {
        throw "PushSource is an abstract class.";
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
        functionName: "PushSource constructor",
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
        functionName: "PushSource.registerSink",
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
        functionName: "PushSource.unregisterSink",
        error: e,
      });
    }
  }
  async execute() {
    try {
      const item = await this.#callbackPull();
      for (const [ _, pusher ] of this.#pushers) {
        await pusher.push(item);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSource.execute",
        error: e,
      });
    }
  }
};

// Active, accepts a puller
export class PullSink extends self.EventTarget {
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
  async execute() {
    try {
      const item = await this.puller.pull();
      await this.callbackPush(item);
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

export class PushSink extends self.EventTarget {
  #pusher;
  #callbackPush;
  constructor(args) {
    try {
      super();
      if (this.constructor === PushSink) {
        throw "PushSink is an abstract class.";
      }
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
      super();
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
        const { done, value } = await createStaticAsyncFunc(reader, reader.read)(...args);
        return value;
      });
      reader.closed.then(
        createStaticAsyncFunc(this, this.#eventClosed),
        createStaticAsyncFunc(this, this.#eventCancelled)
      );
      this.#reader = reader;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableStreamSource constructor",
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

export class WritableStreamSink extends PushSink {
  #writer;
  constructor(args) {
    try {
      let writableStream;
      super();
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
      super(createStaticAsyncFunc(writer, writer.write));
      this.#writer = writer;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamSink constructor",
        error: e,
      });
    }
  }
};

class DataPusher {
  #callbackPush;
  constructor(args) {
    try {
      super();
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
        functionName: "DataPusher constructor",
        error: e,
      });
    }
  }
  async push(view) {
    try {
      return this.#callbackPush(view);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPusher.push",
        error: e,
      });
    }
  }
  release() {
    // This function only perfroms an assignment operation, so there is no possibility of throwing an error.
    this.#callbackPush = pushError;
  }
  static async pushError() {
    ErrorLog.rethrow({
      functionName: "DataPusher.push",
      error: "DataPusher has been disconnected from its sink.",
    });
  }
};

class DataPuller {
  #callbackPull;
  constructor(args) {
    try {
      super();
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
        functionName: "DataPuller constructor",
        error: e,
      });
    }
  }
  async pull() {
    try {
      return this.#callbackPull();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPuller.pull",
        error: e,
      });
    }
  }
  release() {
    // This function only perfroms an assignment operation, so there is no possibility of throwing an error.
    this.#callbackPull = pullError;
  }
  static async pullError() {
    ErrorLog.rethrow({
      functionName: "DataPuller.pull",
      error: "DataPuller has been disconnected from its source.",
    });
  }
};

// Passive, provides a pusher and a puller
export class DataPipe extends self.EventTarget {
  #queue;
  #pusher;
  #puller;
  constructor() {
    try {
      super();
      this.#queue = new Queue.DataQueue({
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPipe constructor",
        error: e,
      });
    }
  }
  getPusher() {
    try {
      const newPusher = new DataPusher({
        callbackPush: createStaticAsyncFunc(this, this.#push),
      });
      this.#pusher.release();
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPipe.getPusher",
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
      const newPuller = new DataPuller({
        callbackPull: createStaticAsyncFunc(this, this.#pull),
      });
      this.#puller.release();
      this.#puller = newPuller;
      return this.#puller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPipe.getPuller",
        error: e,
      });
    }
  }
  async #pull() {
    if (this.#queue.isEmpty()) {
      this.dispatchEvent("buffer-empty");
    }
    return this.#queue.dequeue();
  }
};

// Active, accepts a puller and pushers
export class DataPump extends self.EventTarget {
  #puller;
  #pushers;
  constructor() {
    try {
      super();
      this.#puller = null;
      this.#pushers = new Map();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPump constructor",
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
      if (!(newPuller instanceof DataPuller)) {
        throw "\"source.getPuller()\" must return a DataPuller. Try using a source derived from the Streams library.";
      }
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPump.setSource",
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
      if (!(newPusher instanceof DataPusher)) {
        throw "\"sink.getPusher()\" must return a DataPusher. Try using a sink derived from the Streams library.";
      }
      this.#pushers.set(newSink, newPusher);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPump.registerSink",
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
        functionName: "DataPump.unregisterSink",
        error: e,
      });
    }
  }
  async execute() {
    try {
      if (this.#puller === null) {
        throw "Source must be non-null.";
      }
      const item = await this.#puller.pull();
      for (const [ _, pusher] of this.#pushers) {
        pusher.push(item);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPump.execute",
        error: e,
      });
    }
  }
}

// Active, accepts a pusher
export class DataPushSource extends self.EventTarget {
  #callbackPull;
  #pushers;
  constructor(args) {
    try {
      super();
      if (this.constructor === DataPushSource) {
        throw "DataPushSource is an abstract class.";
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
        functionName: "DataPushSource constructor",
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
      if (!(newPusher instanceof DataPusher)) {
        throw "\"sink.getPusher()\" must return a DataPusher. Try using a sink derived from the Streams library.";
      }
      this.#pushers.set(newSink, newPusher);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPushSource.registerSink",
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
        functionName: "DataPushSource.unregisterSink",
        error: e,
      });
    }
  }
  async execute() {
    try {
      const item = await this.#callbackPull();
      for (const [ _, pusher ] of this.#pushers) {
        await pusher.push(item);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPushSource.execute",
        error: e,
      });
    }
  }
};

// Active, accepts a puller
export class DataPullSink extends self.EventTarget {
  #callbackPush;
  #puller;
  constructor(args) {
    try {
      super();
      if (this.constructor === DataPullSink) {
        throw "DataPullSink is an abstract class.";
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
        functionName: "DataPullSink constructor",
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
      if (!(newPuller instanceof DataPuller)) {
        throw "\"source.getPuller()\" must return a DataPuller. Try using a source derived from the Streams library.";
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPullSink.setSource",
        error: e,
      });
    }
  }
  async execute() {
    try {
      const item = await this.puller.pull();
      await this.callbackPush(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPullSink.execute",
        error: e,
      });
    }
  }
};

export class DataPullSource extends self.EventTarget {
  #puller;
  #callbackPull;
  constructor(args) {
    try {
      super();
      if (this.constructor === PullSource) {
        throw "DataPullSource is an abstract class.";
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
        functionName: "DataPullSource constructor",
        error: e,
      });
    }
  }
  getPuller() {
    try {
      const newPuller = new DataPuller({
        callbackPull: this.#callbackPull,
      });
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
      return this.#puller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPullSource.getPuller",
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

export class DataPushSink extends self.EventTarget {
  #pusher;
  #callbackPush;
  constructor(args) {
    try {
      super();
      if (this.constructor === DataPushSink) {
        throw "DataPushSink is an abstract class.";
      }
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
        functionName: "DataPushSink constructor",
        error: e,
      });
    }
  }
  getPusher() {
    try {
      const newPusher = new DataPusher({
        callbackPush: this.#callbackPush,
      });
      if (this.#pusher !== null) {
        this.#pusher.release();
      }
      this.#pusher = newPusher;
      return this.#pusher;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataPushSink.getPusher",
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

export class DataReadableStreamSource extends PullSource {
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
      const reader = readableStream.getReader({
        mode: "byob",
      });
      reader.closed.then(
        createStaticAsyncFunc(this, this.#eventClosed),
        createStaticAsyncFunc(this, this.#eventCancelled)
      );
      super(async function (...args) {
        const { done, value } = await createStaticAsyncFunc(reader, reader.read)(...args);
        return value;
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

export class DataWritableStreamSink extends PushSink {
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
      super(createStaticAsyncFunc(writer, writer.write));
      this.#writer = writer;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "DataWritableStreamSink constructor",
        error: e,
      });
    }
  }
};
