/*
(c) 2023 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Test/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/Test/ErrorLog.mjs";
import * as Sequence from "https://scotwatson.github.io/Containers/Test/Sequence.mjs";

export class Source {
  constructor() {
  }
  init() {
    return {};
  }
  execute(args) {
    return null;
  }
  syncExecute(args) {
    const state = this.init();
    const output = new Sequence.Sequence();
    let outputItem = this.execute({
      state: state,
    });
    while (outputItem !== null) {
      outputItem = this.execute({
        state: state,
      });
      output.extend(outputItem);
    }
    return output;
  }
}

export class ByteSource {
  constructor() {
  }
  init() {
    return {};
  }
  execute(args) {
    return 0;
  }
  syncExecute(args) {
    const state = this.init();
    const output = new Sequence.ByteSequence();
    let outputView = output.reserve(args.outputByteRate);
    let outputBytes = this.execute({
      output: outputView,
      state: state,
    });
    output.extend(outputBytes);
    while (outputBytes !== 0) {
      outputView = output.reserve(args.outputByteRate);
      outputBytes = this.execute({
        output: outputView,
        state: state,
      });
      output.extend(outputBytes);
    }
    return output.createView();
  }
  syncExecuteInto(args) {
    const state = this.init();
    const output = new Sequence.ByteSequence();
    let outputView = output.reserve(args.outputByteRate);
    let outputBytes = this.execute({
      output: outputView,
      state: state,
    });
    output.extend(outputBytes);
    while (outputBytes !== 0) {
      outputView = output.reserve(args.outputByteRate);
      outputBytes = this.execute({
        output: outputView,
        state: state,
      });
      output.extend(outputBytes);
    }
    return output;
  }
}

export class AsyncSource {
  constructor() {
  }
  async init() {
    return {};
  }
  async execute(args) {
    return null;
  }
  async asyncExecute(args) {
    const state = await this.init();
    const output = new Sequence.Sequence();
    let outputItem = await this.execute({
      state: state,
    });
    while (outputItem !== null) {
      outputItem = await this.execute({
        state: state,
      });
      output.extend(outputItem);
    }
    return output;
  }
}

export class AsyncByteSource {
  constructor() {
  }
  async init() {
    return {};
  }
  async execute(args) {
    return 0;
  }
  async asyncExecute(args) {
    const state = await this.init();
    const output = new Sequence.ByteSequence();
    let outputView = output.reserve(args.outputByteRate);
    let outputBytes = await this.execute({
      output: outputView,
      state: state,
    });
    output.extend(outputBytes);
    while (outputBytes !== 0) {
      outputView = output.reserve(args.outputByteRate);
      outputBytes = await this.execute({
        output: outputView,
        state: state,
      });
      output.extend(outputBytes);
    }
    return output;
  }
}

export class Transform {
  constructor() {
  }
  init() {
    return {};
  }
  execute(args) {
    return null;
  }
  flush(args) {
    return null;
  }
  syncExecute(args) {
    const { input } = (function () {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!("input" in args)) {
        throw "Argument \"input\" must be provided.";
      }
      return {
        input: args.input,
      };
    })();
    const state = this.init();
    const output = new Sequence.Sequence();
    let outputItem = this.execute({
      input: null,
      state: state,
    });
    while (outputItem !== null) {
      output.extend(outputItem);
      outputItem = this.execute({
        input: null,
        state: state,
      });
    }
    for (const inputItem of input) {
      outputItem = this.execute({
        input: inputItem,
        state: state,
      });
      while (outputItem !== null) {
        output.extend(outputItem);
        outputItem = this.execute({
          input: null,
          state: state,
        });
      }
    }
    outputItem = this.flush({
      state: state,
    });
    while (outputItem !== null) {
      output.extend(outputItem);
      outputItem = this.flush({
        state: state,
      });
    }
    return output;
  }
}

export class TransformToByte {
  constructor() {
  }
  init() {
    return {};
  }
  execute(args) {
    return 0;
  }
  flush(args) {
    return 0;
  }
  syncExecute(args) {
    const { inputView, outputByteRate } = (function () {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!("input" in args)) {
        throw "Argument \"input\" must be provided.";
      }
      if (!("outputByteRate" in args)) {
        throw "Argument \"outputByteRate\" must be provided.";
      }
      return {
        input: args.input,
        outputByteRate: args.outputByteRate,
      };
    })();
    const state = this.init();
    const output = new Sequence.ByteSequence();
    let outputView = output.reserve(outputByteRate);
    let outputBytes = this.execute({
      input: null,
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      output.extend(outputBytes);
      output.reserve(outputByteRate);
      outputBytes = this.execute({
        input: null,
        output: outputView,
        state: state,
      });
    }
    outputBytes = this.execute({
      input: inputView,
      output: outputView,
      state: state,
    });
    while (outputBytes !== null) {
      output.extend(outputBytes);
      output.reserve(outputByteRate);
      outputBytes = this.execute({
        input: null,
        output: outputView,
        state: state,
      });
    }
    outputBytes = this.flush({
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      output.extend(outputBytes);
      output.reserve(outputByteRate);
      outputBytes = this.flush({
        state: state,
      });
    }
    output.extend(0);
    return output.createView();
  }
  syncExecuteInto(args) {
    const { input, output } = (function () {
      if (!(Types.isSimpleObject(args))) {
        throw "Argument must be a simple object.";
      }
      if (!("input" in args)) {
        throw "Argument \"input\" must be provided.";
      }
      if (!("output" in args)) {
        throw "Argument \"output\" must be provided.";
      }
      return {
        input: args.input,
        output: args.output,
      };
    })();
    const state = this.init();
    let outputIndex = 0;
    let outputView = output.slice({
      byteOffset: outputIndex,
    });
    let outputBytes = this.execute({
      input: null,
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      outputIndex += outputBytes;
      outputView = output.slice({
        byteOffset: outputIndex,
      });
      outputBytes = this.execute({
        input: null,
        output: outputView,
        state: state,
      });
    }
    for (const inputView of input) {
      outputBytes = this.execute({
        input: inputView,
        output: outputView,
        state: state,
      });
      while (outputBytes !== 0) {
        outputIndex += outputBytes;
        outputView = output.slice({
          byteOffset: outputIndex,
        });
        outputBytes = this.execute({
          input: null,
          output: outputView,
          state: state,
        });
      }
    }
    outputBytes = this.flush({
      output: outputView,
      state: state,
    });
    while (outputBytes !== 0) {
      outputIndex += outputBytes;
      outputView = output.slice({
        byteOffset: outputIndex,
      });
      outputBytes = this.flush({
        state: state,
      });
    }
    return outputIndex;
  }
}

export function createBlobChunkSource(args) {
  const { blob, outputByteRate } = (function () {
    let ret = {};
    if (!("blob" in args)) {
      throw "Argument \"blob\" must be provided.";
    }
    ret.blob = args.blob;
    if (!("outputByteRate" in args)) {
      throw "Argument \"outputByteRate\" must be provided.";
    }
    ret.outputByteRate = args.outputByteRate;
    return ret;
  })();
  const blobChunk = new AsyncSource();
  blobChunk.init = async function () {
    try {
      return {
        blob: blob,
        blobIndex: 0,
        outputByteRate: outputByteRate,
      };
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkSource.#execute",
        error: e,
      });
    }
  }
  blobChunk.execute = async function (args) {
    try {
      const { state } = (function () {
        let ret = {};
        if (!("state" in args)) {
          throw "Argument \"state\" must be provided.";
        }
        ret.state = args.state;
        return ret;
      })();
      if (state.blobIndex >= state.blob.size) {
        return null;
      }
      const thisSlice = (function () {
        if (state.blobIndex + state.outputByteRate > state.blob.size) {
          return state.blob.slice(state.blobIndex);
        } else {
          return state.blob.slice(state.blobIndex, state.blobIndex + state.outputByteRate);
        }
      })();
      state.blobIndex += thisSlice.size;
      const arrayBuffer = await thisSlice.arrayBuffer();
      const block = new Memory.Block({
        arrayBuffer: arrayBuffer,
      });
      const view = new Memory.View(block);
      return view;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BlobChunkSource.#execute",
        error: e,
      });
    }
  }
  return blobChunk;
}
