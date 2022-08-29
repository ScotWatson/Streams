/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Sequence from "https://scotwatson.github.io/Sequence/Sequence.mjs";

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
    this.#queue = new Queue({
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

export class SpeechGenerator extends EventTarget {
  #phase;
  constructor() {
    for (let i = 0; i < 20; ++i) {
      Math.cos(i * this.#phase);
    }
    this.#phase += deltaPhase;
  }
};
