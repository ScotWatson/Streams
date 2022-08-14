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
      }
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class RandomReadableByteStream extends ReadableStream {
  constructor() {
    const underlyingSource = {
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
      type: "bytes",
      autoAllocateChunkSize: 1,
    };
    const queuingStrategy = {
      highWaterMark: 1,
      size: function (chunk) {
      }
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
      size: function (chunk) {
      },
    }
    super(underlyingSink, queuingStrategy);
  }
};

export class AnnotatedReadableStream extends ReadableStream {
  constructor(objArgs) {
    const underlyingSource = {
      type: "bytes",
      autoAllocateChunkSize: 1,
      start: function (controller) {
        console.log("ReadableStream start called");
        if (typeof objArgs.start === "function") {
          objArgs.start(controller);
        }
        return;
      },
      pull: function (controller) {
        console.log("ReadableStream pull called");
        if (typeof objArgs.pull === "function") {
          objArgs.pull(controller);
        }
        return;
      },
      cancel: function (reason) {
        console.log("ReadableStream cancel called");
        if (typeof objArgs.cancel === "function") {
          objArgs.cancel(reason);
        }
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: objArgs.highWaterMark,
      size: function (chunk) {
        console.log("ReadableStream chunkSize called");
        if (typeof objArgs.chunkSize === "function") {
          objArgs.chunkSize(chunk);
        }
        return;
      }
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class AnnotatedReadableByteStream extends ReadableStream {
  constructor(objArgs) {
    const underlyingSource = {
      start: function (controller) {
        console.log("ReadableByteStream start called");
        if (typeof objArgs.start === "function") {
          objArgs.start(controller);
        }
        return;
      },
      pull: function (controller) {
        console.log("ReadableByteStream pull called");
        if (typeof objArgs.pull === "function") {
          objArgs.pull(controller);
        }
        return;
      },
      cancel: function (reason) {
        console.log("ReadableByteStream cancel called");
        if (typeof objArgs.cancel === "function") {
          objArgs.cancel(reason);
        }
        return;
      },
      type: "bytes",
      autoAllocateChunkSize: 1,
    };
    const queuingStrategy = {
      highWaterMark: objArgs.highWaterMark,
      size: function (chunk) {
        console.log("ReadableByteStream chunkSize called");
        if (typeof objArgs.chunkSize === "function") {
          objArgs.chunkSize(chunk);
        }
        return;
      }
    };
    super(underlyingSource, queuingStrategy);
  }
};

export class AnnotatedWritableStream extends WritableStream {
  constructor(objArgs) {
    const underlyingSink = {
      start: function (controller) {
        console.log("WritableStream start called");
        if (typeof objArgs.start === "function") {
          objArgs.start(controller);
        }
        return;
      },
      write: function (chunk, controller) {
        console.log("WritableStream write called");
        if (typeof objArgs.write === "function") {
          objArgs.write(chunk, controller);
        }
        return;
      },
      close: function (controller) {
        console.log("WritableStream close called");
        if (typeof objArgs.close === "function") {
          objArgs.close(controller);
        }
        return;
      },
      abort: function (reason) {
        console.log("WritableStream abort called");
        if (typeof objArgs.abort === "function") {
          objArgs.abort(reason);
        }
        return;
      },
    };
    const queuingStrategy = {
      highWaterMark: objArgs.highWaterMark,
      size: function (chunk) {
        console.log("WritableStream chunkSize called");
        if (typeof objArgs.chunkSize === "function") {
          objArgs.chunkSize(chunk);
        }
        return;
      }
    };
    super(underlyingSink, queuingStrategy);
  }
};
