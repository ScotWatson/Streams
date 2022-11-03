/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Queue/Queue.mjs";

// Push Source
export class PushSource {
  constructor() {
  }
  get recommendedTime() {
  }
  get bufferFull() {
  }
}

export class PullSink {
  constructor() {
  }
  get recommendedTime() {
  }
  get bufferEmpty() {
  }
}

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
