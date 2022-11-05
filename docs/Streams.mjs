/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Queue/Queue.mjs";

class Puller {
  #callbackPull;
  #callbackRelease;
  constructor(args) {
  }
  pull() {
    return this.#callbackPull();
  }
  release() {
    this.#callbackRelease();
    this.#callbackPull = null;
    this.#callbackRelease = null;
  }
};

class Pusher {
  #callbackPull;
  #callbackRelease;
  constructor(args) {
  }
  pull() {
    return this.#callbackPull();
  }
  release() {
    this.#callbackRelease();
    this.#callbackPull = null;
    this.#callbackRelease = null;
  }
};

// Passive, provides a pusher and a puller
export class Pipe extends self.EventTarget {
  #queue;
  #pusher;
  #puller;
  constructor() {
    this.#queue = new Queue.Queue({
    });
  }
  getPusher() {
    const thisObj = this;
    this.#pusher = new Pusher({
      callbackPush: function (item) {
        if (thisObj.#queue.isFull()) {
          thisObj.dispatchEvent("buffer-full");
        }
        thisObj.#queue.enqueue(item);
      },
      callbackRelease: function () {
        this.#pusher = null;
      },
    });
    return this.#pusher;
  }
  getPuller() {
    const thisObj = this;
    this.#puller = new Pusher({
      callbackPull: function () {
        if (thisObj.#queue.isEmpty()) {
          thisObj.dispatchEvent("buffer-empty");
        }
        return thisObj.#queue.dequeue();
      },
      callbackRelease: function () {
        this.#puller = null;
      },
    });
    return this.#puller;
  }
};

// Active, accepts a pusher and a puller
export class Pump {
  #pusher;
  #puller;
  constructor() {
    this.#puller = null;
    this.#pusher = null;
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
        throw "Argument \"source\" must provide a getPuller function. (It must be a pull source.)";
      }
      if (!(Types.isInvokable(newSource.getPuller))) {
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
        functionName: "PullSink.setSource",
        error: e,
      });
    }
  }
  registerSink(args) {
    try {
      let newSource;
      if (Types.isSimpleObject(args)) {
        newSource = args.source;
      } else {
        newSource = args;
      }
      if (!("getPusher" in newSource)) {
        throw "Argument \"source\" must provide a getPusher function. (It must be a push sink.)";
      }
      if (!(Types.isInvokable(newSource.getPusher))) {
        throw "\"source.getPusher\" must be a function.";
      }
      const newPusher = newSource.getPusher();
      if (!(newPusher instanceof Pusher)) {
        throw "\"source.getPusher()\" must return a Pusher. Try using a sink derived from the Streams library.";
      }
      if (this.#puller !== null) {
        this.#puller.release();
      }
      this.#puller = newPuller;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSink.setSource",
        error: e,
      });
    }
  }
  unregisterSink(args) {
  }
  executeEventListener() {
    
    function execute() {
      if (Types.isInvokable(this.#puller) && Types.isInvokable(this.#pusher)) {
        const item = this.#puller.pull();
        this.#pusher.push(item);
      } else {
        ErrorLog.rethrow({
          functionName: "execute (Pump)",
          error: "Both source and sink must be non-null.",
        });
      }
    }
  }
}

// Active, accepts a pusher
export class PushSource extends self.EventTarget {
  #pushers;
  constructor() {
    if (this.constructor === PushSource) {
      ErrorLog.rethrow({
        functionName: "PushSource constructor",
        error: "PushSource is an abstract class.",
      });
    }
    this.#pushers = [];
  }
  registerSink(args) {
    this.#pushers.push(args);
  }
  #execute() {
    const item = this.#pull();
    for (const pusher of pushers) {
      pusher.push(item);
    }
  }
  #pull() {
    // if queue is empty, dispatch event buffer-empty
    ErrorLog.rethrow({
      functionName: "PushSource.pull",
      error: "PushSource.pull must be implemented.",
    });
  }
};

// Active, accepts a puller
export class PullSink extends self.EventTarget {
  #puller;
  constructor() {
    if (this.constructor === PullSink) {
      ErrorLog.rethrow({
        functionName: "PullSink constructor",
        error: "PullSink is an abstract class.",
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
      if (!(Types.isInvokable(newSource.getPuller))) {
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
        functionName: "PullSink.setSource",
        error: e,
      });
    }
  }
  execute() {
    const item = this.puller.pull();
    this.#push(item);
  }
  #push() {
    // if queue is full, dispatch event buffer-full
    ErrorLog.rethrow({
      functionName: "PullSink.push",
      error: "PullSink.push must be implemented.",
    });
  }
};

// Passive
export class PullSource {
  constructor() {
    if (this.constructor === PullSource) {
      ErrorLog.rethrow({
        functionName: "PullSource constructor",
        error: "PullSource is an abstract class.",
      });
    }
  }
  pull() {
    ErrorLog.rethrow({
      functionName: "PullSource.pull",
      error: "PullSource.pull must be implemented.",
    });
  }
};

// Passive
export class PushSink {
  constructor() {
    if (this.constructor === PushSink) {
      ErrorLog.rethrow({
        functionName: "PushSink constructor",
        error: "PushSink is an abstract class.",
      });
    }
  }
  push() {
    ErrorLog.rethrow({
      functionName: "PushSink.push",
      error: "PushSink.push must be implemented.",
    });
  }
};

// Pull Source
export class ReadableStreamSource extends self.EventTarget {
  #readableStream;
  constructor(args) {
    try {
      if (!(Types.isSimpleObject(args))) {
        throw "Arguments must be a simple object.";
      }
      if (!(args.readableStream instanceof self.ReadableStream)) {
        throw "readableStream must be of type self.ReadableStream.";
      }
      this.#readableStream = args.readableStream;
      if (this.#readableStream.locked) {
        throw "readableStream must be unlocked.";
      }
      this.#reader = this.#readableStream.getReader();
    } catch (e) {
    }
  }
  async pull(queue) {
    let result;
    try {
      result = await this.#reader.read();
    } catch (e) {
      const evtError = new Event("error");
      evtError.data = e;
      this.dispatchEvent(evtError);
      return;
    }
    if (result.done) {
      this.#reader.releaseLock();
      this.#reader = null;
    }
    queue.enqueue(result.value);
  }
};

export class Sink {
  constructor(args) {
  }
};

export class Pipe extends self.EventTarget {
  #queue;
  #source;
  #destination;
  constructor(args) {
    
    this.#queue = new Queue.Queue();
    this.#source = args.source;
    this.#source.addEventListener("data-available", enqueuer);
  }
  dequeue() {
    
  }
  function enqueuer(evt) {
    this.#queue.enqueue(evt.data);
  }
};

export class DataPipe extends self.EventTarget {
  #queue;
  #source;
  constructor(args) {
    this.#queue = new Queue.DataQueue();
    this.#source = args.source;
    this.#source.addEventListener("data-available", enqueuer);
  }
  dequeue() {
    
  }
  function enqueuer(evt) {
    const reserveView = this.#queue.reserve(evt.data.length);
    reserveView.set(evt.data);
  }
};
