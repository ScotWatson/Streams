/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Queue from "https://scotwatson.github.io/Queue/Queue.mjs";

export class PushSinkSpeaker extends EventTarget {
  #ac;
  #timeInterval;
  #lastStartTime;
  #minQueueSize;
  #maxQueueSize;
  #queue;
  constructor(args) {
    if (!args.hasOwnProperty("timeInterval")) {
      throw new Error("timeInterval is required.");
    }
    this.#ac = new window.AudioContext();
    this.#timeInterval = args.timeInterval;
    this.#lastStartTime = this.#ac.currentTime;
    this.#queue = new Queue.Queue({
      class: window.AudioBuffer,
      length: 10,
    });
    self.setInterval(function (evt) {
      const bufferSourceNode = this.#ac.createBufferSource();
      try {
        bufferSourceNode.buffer = this.#queue.dequeue();
      } catch (e) {
        this.dispatchEvent(new Event("buffering"));
      }
      bufferSourceNode.connect(this.#ac.destination);
      this.#lastStartTime += args.timeInterval;
      bufferSourceNode.start(this.#lastStartTime);
    });
  }
  enqueue(args) {
    const frameCount = this.#timeInterval * this.#ac.sampleRate;
    const myAudioBuffer = this.#ac.createBuffer(2, frameCount, this.#ac.sampleRate);
    const leftFloat32View = myAudioBuffer.getChannelData(0);
    const rightFloat32View = myAudioBuffer.getChannelData(1);
    this.#queue.enqueue(myAudioBuffer);
    return {
      leftChannel: leftFloat32View,
      rightChannel: rightFloat32View,
    };
  }
};

export class LowPassWhiteNoise extends EventTarget {
  #samplesPerIteration;
  #bufferQueue;
  #x1 = 0;
  #x2 = 0;
  #y1 = 0;
  #y2 = 0;
  constructor(args) {
    function sendSamples() {
      for (let i = 0; i < this.#samplesPerIteration; ++i) {
        const x0 = (2 * Math.random()) - 1;
        const y0 = 1.08 * x0 + 1.65 * this.#x1 + 0.86 * this.#x2 - 1.70 * this.#y1 - 0.72 * this.#y2;
        this.#bufferQueue.addElement(y0);
        this.#x2 = this.#x1;
        this.#x1 = x0;
        this.#y2 = this.#y1;
        this.#y1 = y0;
      }
    }
    self.setInterval(sendSamples, 100);
  }
  new Event();
  this.dispatchEvent();
};

export class BufferQueue {
  #getBufferFunction;
  #thisBuffer;
  #index;
  constructor(args) {
    this.#getBufferFunction = args.getBufferFunction;
    this.#thisBuffer = this.#getBufferFunction();
    this.#index = 0;
  }
  addElement(args) {
    this.#thisBuffer[this.#index] = args;
    ++this.#index;
    if (this.#index === this.#thisBuffer.length) {
      this.#thisBuffer = this.#getBufferFunction();
      this.#index = 0;
    }
  }
};
