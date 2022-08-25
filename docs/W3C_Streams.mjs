/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Sequence from "https://scotwatson.github.io/Sequence/Sequence.mjs";

export class RandomReadableStream extends ReadableStream {
  constructor() {
    const underlyingSource = {
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        controller.enqueue(Math.random());
        return;
      },
      cancel: function (reason) {
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: 1,
      size: function (chunk) {
        return 1;
      }
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class RandomReadableByteStream extends ReadableStream {
  constructor() {
    const underlyingSource = {
      type: "bytes",
      autoAllocateChunkSize: 1,
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        const view = new Uint8Array(1);
        crypto.getRandomValues(view);
        controller.enqueue(view);
        return;
      },
      cancel: function (reason) {
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: 1,
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class Sequencer extends WritableStream {
  output;
  constructor() {
    output = new Sequence.Sequence();
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        output.push(chunk);
      },
      close: function (controller) {
      },
      abort: function (reason) {
      },
    };
    const queuingStrategy = {
      highWaterMark: 1,
    }
    super(underlyingSink, queuingStrategy);
  }
};

export class AnnotatedReadableStream extends ReadableStream {
  constructor(objArgs) {
    if (typeof objArgs.log !== "function") {
      throw new Error("log function must be provided.");
    }
    const underlyingSource = {
      start: function (controller) {
        objArgs.log("ReadableStream start called");
        if (typeof objArgs.start === "function") {
          objArgs.start(controller);
        }
        return;
      },
      pull: function (controller) {
        objArgs.log("ReadableStream pull called");
        if (typeof objArgs.pull === "function") {
          objArgs.pull(controller);
        }
        return;
      },
      cancel: function (reason) {
        objArgs.log("ReadableStream cancel called");
        if (typeof objArgs.cancel === "function") {
          objArgs.cancel(reason);
        }
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: objArgs.highWaterMark,
      size: function (chunk) {
        objArgs.log("ReadableStream chunkSize called");
        if (typeof objArgs.chunkSize === "function") {
          return objArgs.chunkSize(chunk);
        }
        return 1;
      }
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class AnnotatedReadableByteStream extends ReadableStream {
  constructor(objArgs) {
    if (typeof objArgs.log !== "function") {
      throw new Error("log function must be provided.");
    }
    const underlyingSource = {
      type: "bytes",
      autoAllocateChunkSize: 1,
      start: function (controller) {
        objArgs.log("ReadableByteStream start called");
        if (typeof objArgs.start === "function") {
          objArgs.start(controller);
        }
        return;
      },
      pull: function (controller) {
        objArgs.log("ReadableByteStream pull called");
        if (typeof objArgs.pull === "function") {
          objArgs.pull(controller);
        }
        return;
      },
      cancel: function (reason) {
        objArgs.log("ReadableByteStream cancel called");
        if (typeof objArgs.cancel === "function") {
          objArgs.cancel(reason);
        }
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: objArgs.highWaterMark,
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class AnnotatedWritableStream extends WritableStream {
  constructor(objArgs) {
    if (typeof objArgs.log !== "function") {
      throw new Error("log function must be provided.");
    }
    const underlyingSink = {
      start: function (controller) {
        objArgs.log("WritableStream start called");
        if (typeof objArgs.start === "function") {
          objArgs.start(controller);
        }
        return;
      },
      write: function (chunk, controller) {
        objArgs.log("WritableStream write called");
        if (typeof objArgs.write === "function") {
          objArgs.write(chunk, controller);
        }
        return;
      },
      close: function (controller) {
        objArgs.log("WritableStream close called");
        if (typeof objArgs.close === "function") {
          objArgs.close(controller);
        }
        return;
      },
      abort: function (reason) {
        objArgs.log("WritableStream abort called");
        if (typeof objArgs.abort === "function") {
          objArgs.abort(reason);
        }
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: objArgs.highWaterMark,
      size: function (chunk) {
        objArgs.log("WritableStream chunkSize called");
        if (typeof objArgs.chunkSize === "function") {
          return objArgs.chunkSize(chunk);
        }
        return 1;
      }
    };
    super(underlyingSink, queuingStrategy);
  }
};
