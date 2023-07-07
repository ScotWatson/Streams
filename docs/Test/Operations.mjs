/*
(c) 2023 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/20230705/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/20230705/ErrorLog.mjs";
import * as Sequence from "https://scotwatson.github.io/Containers/20230705/Sequence.mjs";

export const state = {
  ready: Symbol("Ready"),
  closed: Symbol("Closed"),
};
Object.freeze(state);

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
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Source.syncExecute",
        error: e,
      });
    }
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
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSource.syncExecute",
        error: e,
      });
    }
  }
  syncExecuteInto(args) {
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSource.syncExecuteInto",
        error: e,
      });
    }
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
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncSource.asyncExecute",
        error: e,
      });
    }
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
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteSource.asyncExecute",
        error: e,
      });
    }
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
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Transform.syncExecute",
        error: e,
      });
    }
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
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "TransformToByte.syncExecute",
        error: e,
      });
    }
  }
  syncExecuteInto(args) {
    try {
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
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "TransformToByte.syncExecuteInto",
        error: e,
      });
    }
  }
}

export class AsyncTransform {
  constructor() {
  }
  async init() {
    return {};
  }
  async execute(args) {
    return null;
  }
  async flush(args) {
    return null;
  }
  async asyncExecute(args) {
    try {
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
      const state = await this.init();
      const output = new Sequence.Sequence();
      let outputItem = await this.execute({
        input: null,
        state: state,
      });
      while (outputItem !== null) {
        output.extend(outputItem);
        outputItem = await this.execute({
          input: null,
          state: state,
        });
      }
      for (const inputItem of input) {
        outputItem = await this.execute({
          input: inputItem,
          state: state,
        });
        while (outputItem !== null) {
          output.extend(outputItem);
          outputItem = await this.execute({
            input: null,
            state: state,
          });
        }
      }
      outputItem = await this.flush({
        state: state,
      });
      while (outputItem !== null) {
        output.extend(outputItem);
        outputItem = await this.flush({
          state: state,
        });
      }
      return output;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransform.asyncExecute",
        error: e,
      });
    }
  }
}

export class AsyncTransformToByte {
  constructor() {
  }
  async init() {
    return {};
  }
  async execute(args) {
    return 0;
  }
  async flush(args) {
    return 0;
  }
  async syncExecute(args) {
    try {
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
      const state = await this.init();
      const output = new Sequence.ByteSequence();
      let outputView = output.reserve(outputByteRate);
      let outputBytes = await this.execute({
        input: null,
        output: outputView,
        state: state,
      });
      while (outputBytes !== 0) {
        output.extend(outputBytes);
        output.reserve(outputByteRate);
        outputBytes = await this.execute({
          input: null,
          output: outputView,
          state: state,
        });
      }
      outputBytes = await this.execute({
        input: inputView,
        output: outputView,
        state: state,
      });
      while (outputBytes !== null) {
        output.extend(outputBytes);
        output.reserve(outputByteRate);
        outputBytes = await this.execute({
          input: null,
          output: outputView,
          state: state,
        });
      }
      outputBytes = await this.flush({
        output: outputView,
        state: state,
      });
      while (outputBytes !== 0) {
        output.extend(outputBytes);
        output.reserve(outputByteRate);
        outputBytes = await this.flush({
          state: state,
        });
      }
      output.extend(0);
      return output.createView();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformToByte.asyncExecute",
        error: e,
      });
    }
  }
  async asyncExecuteInto(args) {
    try {
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
      const state = await this.init();
      let outputIndex = 0;
      let outputView = output.slice({
        byteOffset: outputIndex,
      });
      let outputBytes = await this.execute({
        input: null,
        output: outputView,
        state: state,
      });
      while (outputBytes !== 0) {
        outputIndex += outputBytes;
        outputView = output.slice({
          byteOffset: outputIndex,
        });
        outputBytes = await this.execute({
          input: null,
          output: outputView,
          state: state,
        });
      }
      for (const inputView of input) {
        outputBytes = await this.execute({
          input: inputView,
          output: outputView,
          state: state,
        });
        while (outputBytes !== 0) {
          outputIndex += outputBytes;
          outputView = output.slice({
            byteOffset: outputIndex,
          });
          outputBytes = await this.execute({
            input: null,
            output: outputView,
            state: state,
          });
        }
      }
      outputBytes = await this.flush({
        output: outputView,
        state: state,
      });
      while (outputBytes !== 0) {
        outputIndex += outputBytes;
        outputView = output.slice({
          byteOffset: outputIndex,
        });
        outputBytes = await this.flush({
          state: state,
        });
      }
      return outputIndex;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformToByte.asyncExecuteInto",
        error: e,
      });
    }
  }
}

export class Sink {
  constructor() {
  }
  init() {
  }
  execute(args) {
  }
  flush(args) {
  }
  syncExecute(args) {
    try {
      const { input } = (function () {
        let ret = {};
        if (!("input" in args)) {
          throw "Argument \"input\" must be provided.";
        }
        ret.input = args.input;
        return ret;
      })();
      const state = this.init();
      for (const item of input) {
        this.execute({
          input: item,
          state: state,
        });
      }
      this.flush({
        state: state,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "Sink.syncExecute",
        error: e,
      });
    }
  }
}

export class AsyncSink {
  constructor() {
  }
  async init() {
  }
  async execute(args) {
  }
  async flush(args) {
  }
  async asyncExecute(args) {
    try {
      const { input } = (function () {
        let ret = {};
        if (!("input" in args)) {
          throw "Argument \"input\" must be provided.";
        }
        ret.input = args.input;
        return ret;
      })();
      const state = await this.init();
      for (const item of input) {
        await this.execute({
          input: item,
          state: state,
        });
      }
      await this.flush({
        state: state,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncSink.asyncExecute",
        error: e,
      });
    }
  }
}
