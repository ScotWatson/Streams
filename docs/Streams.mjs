/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Queue from "https://scotwatson.github.io/Queue/Queue.mjs";

export class Pipe extends self.EventTarget {
  #queue;
  #source;
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
