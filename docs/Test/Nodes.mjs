/*
(c) 2023 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Types from "https://scotwatson.github.io/Debug/Test/Types.mjs";
import * as ErrorLog from "https://scotwatson.github.io/Debug/Test/ErrorLog.mjs";
import * as Queue from "https://scotwatson.github.io/Containers/Test/Queue.mjs";
import * as Memory from "https://scotwatson.github.io/Memory/Test/Memory.mjs";
import * as Tasks from "https://scotwatson.github.io/Tasks/Test/Tasks.mjs";

export class PushSourceNode {
  #source;
  #state;
  #outputCallback;
  #endedSignalController;
  #progressSignalController;
  #progressCounter;
  #progressThreshold;
  #targetUsage;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      const { source, smoothingFactor, targetUsage, progressThreshold } = (function () {
        let ret;
        if (!(Types.isSimpleObject(args))) {
          throw "Argument must be a simple object.";
        }
        if (!("source" in args)) {
          throw "Argument \"source\" must be provided.";
        }
        ret.source = args.source;
        if (!("smoothingFactor" in args)) {
          throw "Argument \"smoothingFactor\" must be provided.";
        }
        ret.smoothingFactor = args.smoothingFactor;
        if (!("targetUsage" in args)) {
          throw "Argument \"targetUsage\" must be provided.";
        }
        ret.targetUsage = args.targetUsage;
        if ("progressThreshold" in args) {
          ret.progressThreshold = args.progressThreshold;
        } else {
          ret.progressThreshold = 1;
        }
        return ret;
      })();
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#source = source;
      this.#state = this.#source.init();
      this.#targetUsage = targetUsage;
      this.#smoothingFactor = smoothingFactor;
      this.#outputCallback = new Tasks.Callback(null);
      this.#endedSignalController = new Tasks.SignalController();
      this.#progressSignalController = new Tasks.SignalController();
      this.#progressCounter = 0;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSourceNode constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.callback;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSourceNode.connectOutput",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PushSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get progressSignal() {
    try {
      return this.#progressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PushSourceNode.progressSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const start = performance.now();
      const outputItem = this.#source.execute({
        state: this.#state,
      });
      if (outputItem === null) {
        // The end of the stream has been reached, return before calling setTimeout
        return;
      }
      self.setTimeout(this.#staticExecute, this.#setTimeoutValue);
      this.#outputCallback.invoke(outputItem);
      const end = performance.now();
      // Statistics
      ++this.#progressCounter;
      while (this.#progressCounter >= this.#progressThreshold) {
        this.#progressSignalController.dispatch();
        this.#progressCounter -= this.#progressThreshold;
      }
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class PullSourceNode {
  #source;
  #state;
  #outputCallbackController;
  #endedSignalController;
  #progressSignalController;
  #progressCounter;
  #progressThreshold;
  #staticExecute;
  constructor(args) {
    try {
      const { source, progressThreshold } = (function () {
        let ret;
        if (!(Types.isSimpleObject(args))) {
          throw "Argument must be a simple object.";
        }
        if (!("source" in args)) {
          throw "Argument \"source\" must be provided.";
        }
        ret.source = args.source;
        if ("progressThreshold" in args) {
          ret.progressThreshold = args.progressThreshold;
        } else {
          ret.progressThreshold = 1;
        }
        return ret;
      })();
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#source = source;
      this.#state = this.#source.init();
      this.#outputCallbackController = new Tasks.UniqueCallbackController(this.#staticExecute);
      this.#endedSignalController = new Tasks.SignalController();
      this.#progressSignalController = new Tasks.SignalController();
      this.#progressCounter = 0;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSourceNode constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSourceNode.outputCallback",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get progressSignal() {
    try {
      return this.#progressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSourceNode.progressSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const outputItem = this.#source.execute({
        state: this.#state,
      });
      if (outputItem === null) {
        this.#endedSignalController.dispatch();
      }
      // Statistics
      ++this.#progressCounter;
      while (this.#progressCounter >= this.#progressThreshold) {
        this.#progressSignalController.dispatch();
        this.#progressCounter -= this.#progressThreshold;
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class BytePushSourceNode {
  #source;
  #state;
  #outputCallback;
  #endedSignalController;
  #progressSignalController;
  #progressCounter;
  #progressThreshold;
  #targetUsage;
  #staticExecute;
  #setTimeoutValue;
  #outputByteLength;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      const { source, smoothingFactor, targetUsage, progressThreshold, outputByteLength } = (function () {
        let ret;
        if (!(Types.isSimpleObject(args))) {
          throw "Argument must be a simple object.";
        }
        if (!("source" in args)) {
          throw "Argument \"source\" must be provided.";
        }
        ret.source = args.source;
        if (!("smoothingFactor" in args)) {
          throw "Argument \"smoothingFactor\" must be provided.";
        }
        ret.smoothingFactor = args.smoothingFactor;
        if (!("targetUsage" in args)) {
          throw "Argument \"targetUsage\" must be provided.";
        }
        ret.targetUsage = args.targetUsage;
        if ("progressThreshold" in args) {
          ret.progressThreshold = args.progressThreshold;
        } else {
          ret.progressThreshold = 1;
        }
        if (!("outputByteLength" in args)) {
          throw "Argument \"outputByteLength\" must be provided.";
        }
        ret.outputByteLength = args.outputByteLength;
        return ret;
      })();
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#source = source;
      this.#state = this.#source.init();
      this.#targetUsage = targetUsage;
      this.#smoothingFactor = smoothingFactor;
      this.#outputByteLength = outputByteLength;
      this.#outputCallback = new Tasks.ByteCallback(null);
      this.#endedSignalController = new Tasks.SignalController();
      this.#progressSignalController = new Tasks.SignalController();
      this.#progressCounter = 0;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSourceNode constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.callback;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSourceNode.connectOutput",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePushSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get progressSignal() {
    try {
      return this.#progressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePushSourceNode.progressSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const start = performance.now();
      const outputView = this.#outputCallback.allocate(this.#outputByteLength);
      const byteLength = this.#source.execute({
        output: outputView,
        state: this.#state,
      });
      if (byteLength === 0) {
        // The end of the stream has been reached, return before calling setTimeout
        this.#outputCallback.invoke(0);
        return;
      }
      self.setTimeout(this.#staticExecute, this.#setTimeoutValue);
      this.#outputCallback.invoke(byteLength);
      const end = performance.now();
      // Statistics
      ++this.#progressCounter;
      while (this.#progressCounter >= this.#progressThreshold) {
        this.#progressSignalController.dispatch();
        this.#progressCounter -= this.#progressThreshold;
      }
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class BytePullSourceNode {
  #source;
  #state;
  #outputCallbackController;
  #endedSignalController;
  #progressSignalController;
  #progressCounter;
  #progressThreshold;
  #staticExecute;
  constructor(args) {
    try {
      const { source, progressThreshold } = (function () {
        let ret;
        if (!(Types.isSimpleObject(args))) {
          throw "Argument must be a simple object.";
        }
        if (!("source" in args)) {
          throw "Argument \"source\" must be provided.";
        }
        ret.source = args.source;
        if ("progressThreshold" in args) {
          ret.progressThreshold = args.progressThreshold;
        } else {
          ret.progressThreshold = 1;
        }
        return ret;
      })();
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#source = source;
      this.#state = this.#source.init();
      this.#outputCallbackController = new Tasks.UniqueCallbackController(this.#staticExecute);
      this.#endedSignalController = new Tasks.SignalController();
      this.#progressSignalController = new Tasks.SignalController();
      this.#progressCounter = 0;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSourceNode constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePullSourceNode.outputCallback",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePullSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get progressSignal() {
    try {
      return this.#progressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePullSourceNode.progressSignal",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      const byteLength = this.#source.execute({
        output: outputView,
        state: this.#state,
      });
      if (byteLength === 0) {
        this.#endedSignalController.dispatch();
      }
      // Statistics
      ++this.#progressCounter;
      while (this.#progressCounter >= this.#progressThreshold) {
        this.#progressSignalController.dispatch();
        this.#progressCounter -= this.#progressThreshold;
      }
      return byteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePullSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncPushSourceNode {
  #source;
  #state;
  #setTimeoutValue;
  #targetUsage;
  #staticExecute;
  #promise;
  #outputCallback;
  #endedSignalController;
  #progressSignalController;
  #progressCounter;
  #progressThreshold;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#source = args.source;
      this.#setTimeoutValue = 4;
      this.#targetUsage = args.targetUsage;
      this.#progressCounter = 0;
      this.#progressThreshold = args.progressThreshold;
      // Initialize
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#outputCallback = new Tasks.Callback(null);
      this.#endedSignalController = new Tasks.SignalController();
      this.#progressSignalController = new Tasks.SignalController();
      // Statistics
      this.#smoothingFactor = args.smoothingFactor;
      this.#lastStartTime = performance.now();
      this.#avgRunTime = 0;
      this.#avgInterval = 4;
      // Initialize
      (async function (that) {
        that.#state = await that.#source.init();
        const firstOutput = await that.#source.execute({
          state: that.#state,
        });
        that.#execute(firstOutput);
      })(this);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPushSourceNode constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPushSourceNode.connectOutput",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get progressSignal() {
    try {
      return this.#progressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.progressSignal",
        error: e,
      });
    }
  }
  get avgInterval() {
    try {
      return this.#avgInterval;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.avgInterval",
        error: e,
      });
    }
  }
  get avgRunTime() {
    try {
      return this.#avgRunTime;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPushSourceNode.avgRunTime",
        error: e,
      });
    }
  }
  async #execute(outputItem) {
    try {
      if (outputItem === null) {
        this.#endedSignalController.dispatch();
        return;
      }
      const start = self.performance.now();
      const that = this;
      this.#promise = this.#source.execute({
        state: this.#state,
      });
      self.setTimeout(function () {
        that.#promise.then(that.#staticExecute);
      }, this.#setTimeoutValue);
      this.#outputCallback.invoke(outputItem);
      const end = self.performance.now();
      // Statistics
      ++this.#progressCounter;
      while (this.#progressCounter >= this.#progressThreshold) {
        this.#progressSignalController.dispatch();
        this.#progressCounter -= this.#progressThreshold;
      }
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPushSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncBytePushSourceNode {
  #source;
  #state;
  #outputByteRate;
  #setTimeoutValue;
  #targetUsage;
  #smoothingFactor;
  #staticExecute;
  #outputCallback;
  #endedSignalController;
  #progressSignalController;
  #progressCounter;
  #progressThreshold;
  // Statistics
  #avgRunTime;
  #avgInterval;
  #lastStartTime;
  constructor(args) {
    try {
      this.#source = args.source;
      this.#outputByteRate = args.outputByteRate;
      this.#setTimeoutValue = 4;
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#progressCounter = 0;
      this.#progressThreshold = args.progressThreshold;
      // Initialize
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#outputCallback = new Tasks.ByteCallback(null);
      this.#endedSignalController = new Tasks.SignalController();
      this.#progressSignalController = new Tasks.SignalController();
      // Statistics
      this.#avgRunTime = 0;
      this.#avgInterval = 4;
      this.#lastStartTime = performance.now();
      // Initialize
      (async function (that) {
        that.#state = await that.#source.init();
        const view = this.#outputCallback.allocate(this.#outputByteRate);
        const firstOutput = await that.#source.execute({
          state: that.#state,
        });
        that.#execute(firstOutput);
      })(this);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePushSourceNode constructor",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePushSourceNode.connectOutput",
        error: e,
      });
    }
  }
  get endedSignal() {
    try {
      return this.#endedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSourceNode.endedSignal",
        error: e,
      });
    }
  }
  get progressSignal() {
    try {
      return this.#progressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSourceNode.progressSignal",
        error: e,
      });
    }
  }
  get avgInterval() {
    try {
      return this.#avgInterval;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSourceNode.avgInterval",
        error: e,
      });
    }
  }
  get avgRunTime() {
    try {
      return this.#avgRunTime;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePushSourceNode.avgRunTime",
        error: e,
      });
    }
  }
  async #execute(byteLength) {
    try {
      const start = self.performance.now();
      this.#outputCallback.invoke(byteLength);
      if (byteLength === 0) {
        this.#endedSignalController.dispatch();
        return;
      }
      let promise;
      self.setTimeout(function () {
        promise.then(this.#staticExecute);
      }, this.#setTimeoutValue);
      const view = this.#outputCallback.allocate(this.#outputByteRate);
      promise = this.#source.execute({
        output: view,
        state: this.state,
      });
      const end = self.performance.now();
      // Statistics
      ++this.#progressCounter;
      while (this.#progressCounter >= this.#progressThreshold) {
        this.#progressSignalController.dispatch();
        this.#progressCounter -= this.#progressThreshold;
      }
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePushSourceNode.#execute",
        error: e,
      });
    }
  }
}

export class SplitterNode {
  #inputCallbackController;
  #outputCallbackSet;
  #clone;
  #staticExecute;
  constructor(args) {
    try {
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController({
        invoke: this.#staticExecute,
      });
      this.#outputCallbackSet = new Set();
      this.#clone = args.clone;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "SplitterNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get SplitterNode.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallbackSet.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "SplitterNode.connectOutput",
        error: e,
      });
    }
  }
  disconnectAllRevokedOutputs(args) {
    try {
      const newCallbackSet = new Set();
      for (const callback of this.#outputCallbackSet) {
        if (!(callback.isRevoked())) {
          newCallbackSet.add(callback);
        }
      }
      this.#outputCallbackSet = newCallbackSet;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "SplitterNode.disconnectAllRevokedOutputs",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      for (const callback of this.#outputCallbackSet) {
        callback.invoke(this.#clone(item));
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "SplitterNode.#execute",
        error: e,
      });
    }
  }
}

export class ByteSplitterNode {
  #inputCallbackController;
  #outputCallbackSet;
  #staticAllocate;
  #staticExecute;
  #block;
  constructor(args) {
    try {
      this.#staticAllocate = Tasks.createStatic({
        function: this.#allocate,
        this: this,
      });
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        allocate: this.#staticAllocate,
        invoke: this.#staticExecute,
      });
      this.#outputCallbackSet = new Set();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitterNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ByteSplitterNode.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallbackSet.add(newCallback);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitterNode.connectOutput",
        error: e,
      });
    }
  }
  disconnectAllRevokedOutputs(args) {
    try {
      const newCallbackSet = new Set();
      for (const callback of this.#outputCallbackSet) {
        if (!(callback.isRevoked())) {
          newCallbackSet.add(callback);
        }
      }
      this.#outputCallbackSet = newCallbackSet;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitterNode.disconnectAllRevokedOutputs",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      this.#block = new Memory.Block({
        byteLength: byteLength,
      });
      return new Memory.View(this.#block);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitterNode.#allocate",
        error: e,
      });
    }
  }
  #execute(byteLength) {
    try {
      const inputView = new Memory.View(this.#block);
      for (const callback of this.#outputCallbackSet) {
        const view = callback.allocate(byteLength);
        view.set(inputView);
        callback.invoke(byteLength);
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ByteSplitterNode.#execute",
        error: e,
      });
    }
  }
}

export class PipeNode {
  #queue;
  #inputCallbackController;
  #outputCallbackController;
  #bufferFullController;
  #bufferEmptyController;
  constructor() {
    try {
      this.#queue = new Queue.Queue({
      });
      const staticInput = new Tasks.createStatic({
        function: this.#push,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController(staticInput);
      const staticOutput = new Tasks.createStatic({
        function: this.#pull,
        this: this,
      });
      this.#outputCallbackController = new Tasks.UniqueCallbackController(staticOutput);
      this.#bufferFullController = new Tasks.SignalController();
      this.#bufferEmptyController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PipeNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PipeNode.inputCallback",
        error: e,
      });
    }
  }
  #push(item) {
    try {
      if (this.#queue.unusedCapacity === 0) {
        this.#bufferFullController.dispatch();
      }
      this.#queue.enqueue(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PipeNode.#push",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.output;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PipeNode.outputCallback",
        error: e,
      });
    }
  }
  #pull() {
    try {
      if (this.#queue.usedCapacity === 0) {
        this.#bufferEmptyController.dispatch();
      }
      return this.#queue.dequeue();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PipeNode.#pull",
        error: e,
      });
    }
  }
  get bufferEmpty() {
    try {
      return this.#bufferEmptyController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PipeNode.bufferEmpty",
        error: e,
      });
    }
  }
  get bufferFull() {
    try {
      return this.#bufferFullController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PipeNode.bufferFull",
        error: e,
      });
    }
  }
};

export class BytePipeNode {
  #queue;
  #inputCallbackController;
  #outputCallbackController;
  #bufferFullController;
  #bufferEmptyController;
  constructor() {
    try {
      this.#queue = new Queue.Queue({
      });
      const staticAllocate = new Tasks.createStatic({
        function: this.#allocate,
        this: this,
      });
      const staticInput = new Tasks.createStatic({
        function: this.#push,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        allocate: staticAllocate,
        invoke: staticInput,
      });
      const staticOutput = new Tasks.createStatic({
        function: this.#pull,
        this: this,
      });
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticOutput,
      });
      this.#bufferFullController = new Tasks.SignalController();
      this.#bufferEmptyController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipeNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipeNode.inputCallback",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      return this.#queue.reserve(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipeNode.#allocate",
        error: e,
      });
    }
  }
  #push(byteLength) {
    try {
      if (this.#queue.unusedCapacity === 0) {
        this.#bufferFullController.dispatch();
      }
      this.#queue.enqueue(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipeNode.#push",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.output;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipeNode.outputCallback",
        error: e,
      });
    }
  }
  #pull(byteLength) {
    try {
      if (this.#queue.usedCapacity === 0) {
        this.#bufferEmptyController.dispatch();
      }
      return this.#queue.dequeue(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePipeNode.#pull",
        error: e,
      });
    }
  }
  get bufferEmpty() {
    try {
      return this.#bufferEmptyController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipeNode.bufferEmpty",
        error: e,
      });
    }
  }
  get bufferFull() {
    try {
      return this.#bufferFullController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePipeNode.bufferFull",
        error: e,
      });
    }
  }
};

export class PumpNode {
  #inputCallback;
  #outputCallback;
  constructor() {
    try {
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.Callback(null);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PumpNode constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      this.#inputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PumpNode.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      this.#outputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PumpNode.connectOutput",
        error: e,
      });
    }
  }
  execute() {
    try {
      const item = this.#inputCallback.invoke();
      this.#outputCallback.invoke(item);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PumpNode.execute",
        error: e,
      });
    }
  }
}

export class BytePumpNode {
  #inputCallback;
  #outputCallback;
  constructor() {
    try {
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.ByteCallback(null);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePumpNode constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      this.#inputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePumpNode.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      this.#outputCallback = args;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePumpNode.connectOutput",
        error: e,
      });
    }
  }
  execute(byteLength) {
    try {
      const outputView = this.#outputCallback.allocate(byteLength);
      const inputView = this.#inputCallback.invoke(byteLength);
      outputView.set(inputView);
      this.#outputCallback.invoke(byteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePumpNode.execute",
        error: e,
      });
    }
  }
}

export class PassiveTransformNode {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.Callback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNode.inputCallback",
        error: e,
      });
    }
  }
  disconnectInput() {
    try {
      this.#inputCallbackController.revokeCallback();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNode.disconnectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
      let output = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNode.connectOutput",
        error: e,
      });
    }
  }
  flush() {
    try {
      let output = this.#transform.flush({
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.flush({
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute(item) {
    try {
      let output = this.#transform.execute({
        input: item,
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNode.#execute",
        error: e,
      });
    }
  }
}

export class PassiveTransformNodeToByte {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  #outputByteRate;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.Callback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#outputByteRate = args.outputByteRate;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeToByte constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNodeToByte.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeToByte.connectOutput",
        error: e,
      });
    }
  }
  flush() {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.flush({
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength !== 0) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.flush({
          output: outputView,
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeToByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNodeToByte.flushedSignal",
        error: e,
      });
    }
  }
  #execute(inputItem) {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: inputItem,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeToByte.#execute",
        error: e,
      });
    }
  }
}

export class PassiveTransformNodeFromByte {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  #block;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.ByteCallback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeFromByte constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNodeFromByte.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
      let outputItem = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      while (outputItem !== null) {
        this.#outputCallback.invoke(outputItem);
        outputItem = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeFromByte.connectOutput",
        error: e,
      });
    }
  }
  flush() {
    try {
      let output = this.#transform.flush({
        state: this.#state,
      });
      while (output !== null) {
        this.#outputCallback.invoke(output);
        output = this.#transform.flush({
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeFromByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveTransformNodeFromByte.flushedSignal",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      this.#block = new Memory.Block({
        byteLength: byteLength,
      });
      return new Memory.View(this.#block);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeFromByte.#allocate",
        error: e,
      });
    }
  }
  #execute(byteLength) {
    try {
      const inputView = (function () {
        if (this.#block === null) {
          return null;
        }
        return new Memory.View({
          memoryBlock: this.#block,
          byteLength: byteLength,
        });
      })();
      let outputItem = this.#transform.execute({
        input: inputView,
        state: this.#state,
      });
      while (outputItem !== null) {
        this.#outputCallback.invoke(outputItem);
        outputItem = this.#transform.execute({
          input: null,
          state: this.#state,
        });
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveTransformNodeFromByte.#execute",
        error: e,
      });
    }
  }
}

export class PassiveByteTransformNode {
  #inputCallbackController;
  #outputCallback;
  #transform;
  #state;
  #flushedSignalController;
  #outputByteRate;
  #block;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueByteCallbackController({
        invoke: staticExecute,
      });
      this.#outputCallback = new Tasks.ByteCallback(null);
      this.#transform = args.transform;
      this.#state = this.#transform.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#outputByteRate = args.outputByteRate;
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransformNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveByteTransformNode.inputCallback",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransformNode.connectOutput",
        error: e,
      });
    }
  }
  #allocate(byteLength) {
    try {
      this.#block = new Memory.Block({
        byteLength: byteLength,
      });
      return new Memory.View(this.#block);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransformNode.#allocate",
        error: e,
      });
    }
  }
  flush() {
    try {
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.flush({
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength !== 0) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.flush({
          output: outputView,
          state: this.#state,
        });
      }
      this.#state = this.#transform.init();
      this.#flushedSignalController.dispatch();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransformNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PassiveByteTransformNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute(byteLength) {
    try {
      const inputView = (function () {
        if (this.#block === null) {
          return null;
        }
        return new Memory.View({
          memoryBlock: this.#block,
          byteLength: byteLength,
        });
      })();
      let outputView = this.#outputCallback.allocate(this.#outputByteRate);
      let outputByteLength = this.#transform.execute({
        input: inputView,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === outputView.byteLength) {
        this.#outputCallback.invoke(outputByteLength);
        outputView = this.#outputCallback.allocate(this.#outputByteRate);
        outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
      }
      this.#outputCallback.invoke(outputByteLength);
      this.#block = null;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PassiveByteTransformNode.#execute",
        error: e,
      });
    }
  }
}

export class LazyTransformNode {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNode constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformNode.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNode.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      // input: pass nothing, returns object
      // transform: returns object as output
      if (this.#flushing) {
        let outputItem = this.#transform.flush({
          state: this.#state,
        });
        if (outputItem !== null) {
          return outputItem;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return null;
      }
      let outputItem = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      if (outputItem !== null) {
        return outputItem;
      }
      let inputItem = this.#inputCallback.invoke();
      outputItem = this.#transform.execute({
        input: inputItem,
        state: this.#state,
      });
      // This has the possibility of entering an infinite loop
      while (outputItem === null) {
        inputItem = this.#inputCallback.invoke();
        outputItem = this.#transform.execute({
          input: inputItem,
          state: this.#state,
        });
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNode.#execute",
        error: e,
      });
    }
  }
}

export class LazyTransformNodeToByte {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeToByte constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformNodeToByte.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeToByte.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeToByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformNodeToByte.flushedSignal",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      // input: pass nothing, returns object
      // transform: returns object as output
      if (this.#flushing) {
        let outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
        if (outputByteLength !== 0) {
          return outputByteLength;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return 0;
      }
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      if (outputByteLength !== 0) {
        return outputByteLength;
      }
      let inputItem = this.#inputCallback.invoke();
      outputByteLength = this.#transform.execute({
        input: inputItem,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === 0) {
        inputItem = this.#inputCallback.invoke();
        outputByteLength = this.#transform.execute({
          input: inputItem,
          output: outputView,
          state: this.#state,
        });
      }
      return outputByteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeToByte.#execute",
        error: e,
      });
    }
  }
}

export class LazyTransformNodeFromByte {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #inputDataRate;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#inputDataRate = args.#inputDataRate;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeFromByte constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformNodeFromByte.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeFromByte.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeFromByte.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyTransformNodeFromByte.flushedSignal",
        error: e,
      });
    }
  }
  #execute() {
    try {
      // input: create and pass Memory.View
      // transform: writes data to outputView
      if (this.#flushing) {
        let outputItem = this.#transform.execute({
          input: null,
          state: this.#state,
        });
        if (outputItem !== null) {
          return outputItem;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return null;
      }
      let outputItem = this.#transform.execute({
        input: null,
        state: this.#state,
      });
      if (outputItem !== null) {
        return outputItem;
      }
      let inputView = this.#inputCallback.invoke();
      outputItem = this.#transform.execute({
        input: inputView,
        state: this.#state,
      });
      while (outputItem === null) {
        inputView = this.#inputCallback.invoke();
        outputItem = this.#transform.execute({
          input: inputView,
          state: this.#state,
        });
      }
      return outputItem;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyTransformNodeFromByte.#execute",
        error: e,
      });
    }
  }
}

export class LazyByteTransformNode {
  #inputCallback;
  #outputCallbackController;
  #transform;
  #state;
  #inputDataRate;
  #flushing;
  #flushedSignalController;
  constructor(args) {
    try {
      const staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallback = new Tasks.Callback();
      this.#outputCallbackController = new Tasks.UniqueCallbackController({
        invoke: staticExecute,
      });
      this.#transform = args.transform;
      this.#state = args.state;
      this.#inputDataRate = args.#inputDataRate;
      this.#flushing = false;
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransformNode constructor",
        error: e,
      });
    }
  }
  get outputCallback() {
    try {
      return this.#outputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyByteTransformNode.outputCallback",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransformNode.connectInput",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#flushing = true;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransformNode.flush",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get LazyByteTransformNode.flushedSignal",
        error: e,
      });
    }
  }
  #execute(outputView) {
    try {
      // input: create and pass Memory.View
      // transform: writes data to outputView
      if (this.#flushing) {
        let outputByteLength = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
        if (outputByteLength !== 0) {
          return outputByteLength;
        }
        // Flushing is complete, perform reset
        this.#state = this.#transform.init();
        this.#flushedSignalController.dispatch();
        return 0;
      }
      let outputByteLength = this.#transform.execute({
        input: null,
        output: outputView,
        state: this.#state,
      });
      if (outputByteLength !== 0) {
        return outputByteLength;
      }
      let inputView = this.#inputCallback.invoke(this.#inputDataRate);
      outputByteLength = this.#transform.execute({
        input: inputView,
        output: outputView,
        state: this.#state,
      });
      while (outputByteLength === 0) {
        inputView = this.#inputCallback.invoke(this.#inputDataRate);
        outputByteLength = this.#transform.execute({
          input: inputView,
          output: outputView,
          state: this.#state,
        });
      }
      return outputByteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "LazyByteTransformNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncTransformNode {
  #transform;
  #state;
  #inputCallback;
  #outputCallback;
  #inputProgressSignalController;
  #outputProgressSignalController;
  #inputProgressThreshold;
  #outputProgressThreshold;
  #inputProgressCounter;
  #outputProgressCounter;
  #targetUsage;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#transform = args.transform;
      this.#inputProgressThreshold = args.inputProgressThreshold;
      this.#outputProgressThreshold = args.outputProgressThreshold;
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#inputProgressCounter = 0;
      this.#outputProgressCounter = 0;
      this.#state = this.#transform.init();
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.Callback(null);
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#outputProgressSignalController = new Tasks.SignalController();
      this.#staticExecute = Tasks.createStatic({
        function: this.execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNode constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNode.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNode.connectOutput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      return this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncTransformNode.inputProgressSignal",
        error: e,
      });
    }
  }
  get outputProgressSignal() {
    try {
      return this.#outputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncTransformNode.outputProgressSignal",
        error: e,
      });
    }
  }
  #execute(outputItem) {
    try {
      const start = performance.now();
      if (outputItem === null) {
        const inputItem = this.#inputCallback.invoke();
        const promise = this.#transform.execute({
          input: inputItem,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        ++this.#inputProgressCounter;
        while (this.#inputProgressCounter >= this.#inputProgressThreshold) {
          this.#inputProgressSignalController.dispatch();
          this.#inputProgressCounter -= this.#inputProgressThreshold;
        }
      } else {
        const promise = this.#transform.execute({
          input: null,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        this.#outputCallback.invoke(outputItem);
        ++this.#outputProgressCounter;
        while (this.#outputProgressCounter >= this.#outputProgressThreshold) {
          this.#outputProgressSignalController.dispatch();
          this.#outputProgressCounter -= this.#outputProgressThreshold;
        }
      }
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncTransformNodeToByte {
  #transform;
  #state;
  #inputCallback;
  #outputCallback;
  #inputProgressSignalController;
  #outputProgressSignalController;
  #inputProgressThreshold;
  #outputProgressThreshold;
  #inputProgressCounter;
  #outputProgressCounter;
  #targetUsage;
  #outputByteLength;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#transform = args.transform;
      this.#inputProgressThreshold = args.inputProgressThreshold;
      this.#outputProgressThreshold = args.outputProgressThreshold;
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#outputByteLength = args.outputByteLength;
      this.#inputProgressCounter = 0;
      this.#outputProgressCounter = 0;
      this.#state = this.#transform.init();
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.Callback(null);
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#outputProgressSignalController = new Tasks.SignalController();
      this.#staticExecute = Tasks.createStatic({
        function: this.execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeToByte constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeToByte.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeToByte.connectOutput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      return this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncTransformNodeToByte.inputProgressSignal",
        error: e,
      });
    }
  }
  get outputProgressSignal() {
    try {
      return this.#outputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncTransformNodeToByte.outputProgressSignal",
        error: e,
      });
    }
  }
  #execute(outputByteLength) {
    try {
      const start = performance.now();
      if (outputByteLength === 0) {
        const inputItem = this.#inputCallback.invoke();
        const outputView = this.#outputCallback.allocate(this.#outputByteLength);
        const promise = this.#transform.execute({
          input: inputItem,
          output: outputView,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        ++this.#inputProgressCounter;
        while (this.#inputProgressCounter >= this.#inputProgressThreshold) {
          this.#inputProgressSignalController.dispatch();
          this.#inputProgressCounter -= this.#inputProgressThreshold;
        }
      } else {
        const outputView = this.#outputCallback.allocate(this.#outputByteLength);
        const promise = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        this.#outputCallback.invoke(outputByteLength);
        this.#outputProgressCounter += outputByteLength;
        while (this.#outputProgressCounter >= this.#outputProgressThreshold) {
          this.#outputProgressSignalController.dispatch();
          this.#outputProgressCounter -= this.#outputProgressThreshold;
        }
      }
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeToByte.#execute",
        error: e,
      });
    }
  }
}

export class AsyncTransformNodeFromByte {
  #transform;
  #state;
  #inputCallback;
  #outputCallback;
  #inputProgressSignalController;
  #outputProgressSignalController;
  #inputProgressThreshold;
  #outputProgressThreshold;
  #inputProgressCounter;
  #outputProgressCounter;
  #targetUsage;
  #inputByteLength;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#transform = args.transform;
      this.#inputProgressThreshold = args.inputProgressThreshold;
      this.#outputProgressThreshold = args.outputProgressThreshold;
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#inputByteLength = args.inputByteLength;
      this.#inputProgressCounter = 0;
      this.#outputProgressCounter = 0;
      this.#state = this.#transform.init();
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.Callback(null);
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#outputProgressSignalController = new Tasks.SignalController();
      this.#staticExecute = Tasks.createStatic({
        function: this.execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeFromByte constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeFromByte.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeFromByte.connectOutput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      return this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncTransformNodeFromByte.inputProgressSignal",
        error: e,
      });
    }
  }
  get outputProgressSignal() {
    try {
      return this.#outputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncTransformNodeFromByte.outputProgressSignal",
        error: e,
      });
    }
  }
  #execute(outputItem) {
    try {
      const start = performance.now();
      if (outputItem === null) {
        const inputBlock = new Memory.Block({
          byteLength: this.#inputByteLength,
        });
        const inputView = new Memory.View({
          memoryBlock: inputBlock,
        });
        this.#inputCallback.invoke(inputView);
        const promise = this.#transform.execute({
          input: inputView,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        this.#inputProgressCounter += inputView.byteLength;
        while (this.#inputProgressCounter >= this.#inputProgressThreshold) {
          this.#inputProgressSignalController.dispatch();
          this.#inputProgressCounter -= this.#inputProgressThreshold;
        }
      } else {
        const promise = this.#transform.execute({
          input: null,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        this.#outputCallback.invoke(outputItem);
        ++this.#outputProgressCounter;
        while (this.#outputProgressCounter >= this.#outputProgressThreshold) {
          this.#outputProgressSignalController.dispatch();
          this.#outputProgressCounter -= this.#outputProgressThreshold;
        }
      }
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncTransformNodeFromByte.#execute",
        error: e,
      });
    }
  }
}

export class AsyncByteTransformNode {
  #transform;
  #state;
  #inputCallback;
  #outputCallback;
  #inputProgressSignalController;
  #outputProgressSignalController;
  #inputProgressThreshold;
  #outputProgressThreshold;
  #inputProgressCounter;
  #outputProgressCounter;
  #targetUsage;
  #inputByteLength;
  #outputByteLength;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#transform = args.transform;
      this.#inputProgressThreshold = args.inputProgressThreshold;
      this.#outputProgressThreshold = args.outputProgressThreshold;
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#inputByteLength = args.inputByteLength;
      this.#outputByteLength = args.outputByteLength;
      this.#inputProgressCounter = 0;
      this.#outputProgressCounter = 0;
      this.#state = this.#transform.init();
      this.#inputCallback = new Tasks.Callback(null);
      this.#outputCallback = new Tasks.Callback(null);
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#outputProgressSignalController = new Tasks.SignalController();
      this.#staticExecute = Tasks.createStatic({
        function: this.execute,
        this: this,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteTransformNode constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteTransformNode.connectInput",
        error: e,
      });
    }
  }
  connectOutput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("allocate" in newCallback)) {
        throw "Callback must have member \"allocate\".";
      }
      if (!(Types.isInvocable(newCallback.allocate))) {
        throw "Callback.allocate must be invocable.";
      }
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#outputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteTransformNode.connectOutput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      return this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncByteTransformNode.inputProgressSignal",
        error: e,
      });
    }
  }
  get outputProgressSignal() {
    try {
      return this.#outputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncByteTransformNode.outputProgressSignal",
        error: e,
      });
    }
  }
  #execute(outputByteLength) {
    try {
      const start = performance.now();
      if (outputByteLength === 0) {
        const inputBlock = new Memory.Block({
          byteLength: this.#inputByteLength,
        });
        const inputView = new Memory.View({
          memoryBlock: inputBlock,
        });
        this.#inputCallback.invoke(inputView);
        const outputView = this.#outputCallback.allocate(this.#outputByteLength);
        const promise = this.#transform.execute({
          input: inputView,
          output: outputView,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        ++this.#inputProgressCounter;
        while (this.#inputProgressCounter >= this.#inputProgressThreshold) {
          this.#inputProgressSignalController.dispatch();
          this.#inputProgressCounter -= this.#inputProgressThreshold;
        }
      } else {
        const outputView = this.#outputCallback.allocate(this.#outputByteLength);
        const promise = this.#transform.execute({
          input: null,
          output: outputView,
          state: this.#state,
        });
        self.setTimeout(function () {
          promise.then(this.#staticExecute);
        }, this.#setTimeoutValue);
        this.#outputCallback.invoke(outputByteLength);
        this.#outputProgressCounter += outputByteLength;
        while (this.#outputProgressCounter >= this.#outputProgressThreshold) {
          this.#outputProgressSignalController.dispatch();
          this.#outputProgressCounter -= this.#outputProgressThreshold;
        }
      }
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncByteTransformNode.#execute",
        error: e,
      });
    }
  }
}

export class PushSinkNode {
  #sink;
  #state;
  #staticExecute;
  #inputCallbackController;
  #flushedSignalController;
  constructor(args) {
    try {
      this.#sink = args.#sink;
      this.#state = this.#sink.init();
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController(this.#staticExecute);
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSinkNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PushSinkNode.inputCallback",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PushSinkNode.flushedSignal",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#sink.flush({
        state: this.#state;
      });
      this.#flushedSignalController.dispatch();
      this.#state = this.#sink.init();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSinkNode.flush",
        error: e,
      });
    }
  }
  #execute(inputItem) {
    try {
      this.#sink.execute({
        input: inputItem,
        state: this.#state;
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PushSinkNode.#execute",
        error: e,
      });
    }
  }
}

export class PullSinkNode {
  #sink;
  #state;
  #inputCallback;
  #flushedSignalController;
  #inputProgressSignalController;
  #inputProgressThreshold;
  #inputProgressCounter;
  #targetUsage;
  #inputByteLength;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#sink = args.#sink;
      this.#state = this.#sink.init();
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#inputByteLength = args.inputByteLength;
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#setTimeoutValue = 4;
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#lastStartTime = performance.now();
      self.setTimeout(this.#staticExecute, this.#setTimeoutValue);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSinkNode constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSinkNode.connectInput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSinkNode.inputProgressSignal",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get PullSinkNode.flushedSignal",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#sink.flush({
        state: this.#state,
      });
      this.#flushedSignalController.dispatch();
      this.#state = this.#sink.init();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSinkNode.flush",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const start = performance.now();
      const inputItem = this.#inputCallback.invoke();
      ++this.#inputProgressCounter;
      if (this.#inputProgressCounter >= this.#inputProgressThreshold) {
        this.#inputProgressSignalController.dispatch();
        this.#inputProgressCounter -= this.#inputProgressThreshold;
      }
      this.#sink.execute({
        input: inputItem,
        state: this.#state,
      });
      self.setTimeout(this.#staticExecute, this.#setTimeoutValue);
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "PullSinkNode.#execute",
        error: e,
      });
    }
  }
}

export class BytePushSinkNode {
  #sink;
  #state;
  #staticExecute;
  #inputCallbackController;
  #flushedSignalController;
  constructor(args) {
    try {
      this.#sink = args.#sink;
      this.#state = this.#sink.init();
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#inputCallbackController = new Tasks.UniqueCallbackController(this.#staticExecute);
      this.#flushedSignalController = new Tasks.SignalController();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSinkNode constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#inputCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePushSinkNode.inputCallback",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePushSinkNode.flushedSignal",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#sink.flush({
        state: this.#state;
      });
      this.#flushedSignalController.dispatch();
      this.#state = this.#sink.init();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSinkNode.flush",
        error: e,
      });
    }
  }
  #execute(inputView) {
    try {
      this.#sink.execute({
        input: inputView,
        state: this.#state;
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePushSinkNode.#execute",
        error: e,
      });
    }
  }
}

export class BytePullSinkNode {
  #sink;
  #state;
  #inputCallback;
  #flushedSignalController;
  #inputProgressSignalController;
  #inputProgressThreshold;
  #inputProgressCounter;
  #targetUsage;
  #inputByteLength;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#sink = args.#sink;
      this.#state = this.#sink.init();
      this.#smoothingFactor = args.smoothingFactor;
      this.#targetUsage = args.targetUsage;
      this.#inputByteLength = args.inputByteLength;
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#setTimeoutValue = 4;
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#lastStartTime = performance.now();
      self.setTimeout(this.#staticExecute, this.#setTimeoutValue);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSinkNode constructor",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSinkNode.connectInput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePullSinkNode.inputProgressSignal",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get BytePullSinkNode.flushedSignal",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#sink.flush({
        state: this.#state,
      });
      this.#flushedSignalController.dispatch();
      this.#state = this.#sink.init();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSinkNode.flush",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const start = performance.now();
      const inputBlock = new Memory.Block({
        byteLength: this.#inputByteLength,
      });
      const inputView = new Memory.View({
        memoryBlock: inputBlock,
      });
      this.#inputCallback.invoke(inputView);
      ++this.#inputProgressCounter;
      if (this.#inputProgressCounter >= this.#inputProgressThreshold) {
        this.#inputProgressSignalController.dispatch();
        this.#inputProgressCounter -= this.#inputProgressThreshold;
      }
      this.#sink.execute({
        input: inputView,
        state: this.#state,
      });
      self.setTimeout(this.#staticExecute, this.#setTimeoutValue);
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "BytePullSinkNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncPullSinkNode {
  #sink;
  #state;
  #inputCallback;
  #flushedSignalController;
  #inputProgressSignalController;
  #inputProgressThreshold;
  #inputProgressCounter;
  #targetUsage;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#sink = args.sink;
      this.#state = this.#sink.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#inputProgressThreshold = args.inputProgressThreshold;
      this.#inputProgressCounter = 0;
      this.#targetUsage = args.targetUsage;
      this.#inputByteLength = args.inputByteLength;
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#setTimeoutValue = 4;
      this.#smoothingFactor = args.smoothingFactor;
      this.#lastStartTime = performance.now();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPullSinkNode.connectInput",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPullSinkNode.connectInput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      return this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPullSinkNode.inputProgressSignal",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncPullSinkNode.flushedSignal",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#sink().flush({
        state: this.#state,
      });
      this.#flushedSignalController.dispatch();
      this.#state = this.#sink.init();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPullSinkNode.flush",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const start = performance.now();
      const staticExecute = this.#staticExecute;
      const inputItem = this.#inputCallback.invoke();
      const promise = this.#sink.execute({
        input: inputItem,
        state: this.#state,
      });
      self.setTimeout(function () {
        promise.then(staticExecute);
      }, this.setTimeoutValue);
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncPullSinkNode.#execute",
        error: e,
      });
    }
  }
}

export class AsyncBytePullSinkNode {
  #sink;
  #state;
  #inputCallback;
  #flushedSignalController;
  #inputProgressSignalController;
  #inputProgressThreshold;
  #inputProgressCounter;
  #targetUsage;
  #staticExecute;
  #setTimeoutValue;
  // Statistics
  #smoothingFactor;
  #lastStartTime;
  #avgRunTime;
  #avgInterval;
  constructor(args) {
    try {
      this.#sink = args.sink;
      this.#state = this.#sink.init();
      this.#flushedSignalController = new Tasks.SignalController();
      this.#inputProgressSignalController = new Tasks.SignalController();
      this.#inputProgressThreshold = args.inputProgressThreshold;
      this.#inputProgressCounter = 0;
      this.#targetUsage = args.targetUsage;
      this.#inputByteLength = args.inputByteLength;
      this.#staticExecute = Tasks.createStatic({
        function: this.#execute,
        this: this,
      });
      this.#setTimeoutValue = 4;
      this.#smoothingFactor = args.smoothingFactor;
      this.#lastStartTime = performance.now();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePullSinkNode.connectInput",
        error: e,
      });
    }
  }
  connectInput(args) {
    try {
      const newCallback = (function () {
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "callback"))) {
            throw "Argument \"callback\" must be provided.";
          }
          return args.sink;
        } else {
          return args;
        }
      })();
      if (!("invoke" in newCallback)) {
        throw "Callback must have member \"invoke\".";
      }
      if (!(Types.isInvocable(newCallback.invoke))) {
        throw "Callback.invoke must be invocable.";
      }
      if (!("isRevoked" in newCallback)) {
        throw "Callback must have member \"isRevoked\".";
      }
      if (!(Types.isInvocable(newCallback.isRevoked))) {
        throw "Callback.isRevoked must be invocable.";
      }
      this.#inputCallback = newCallback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePullSinkNode.connectInput",
        error: e,
      });
    }
  }
  get inputProgressSignal() {
    try {
      return this.#inputProgressSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePullSinkNode.inputProgressSignal",
        error: e,
      });
    }
  }
  get flushedSignal() {
    try {
      return this.#flushedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get AsyncBytePullSinkNode.flushedSignal",
        error: e,
      });
    }
  }
  flush() {
    try {
      this.#sink().flush({
        state: this.#state,
      });
      this.#flushedSignalController.dispatch();
      this.#state = this.#sink.init();
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePullSinkNode.flush",
        error: e,
      });
    }
  }
  #execute() {
    try {
      const start = performance.now();
      const staticExecute = this.#staticExecute;
      const inputBlock = new Memory.Block({
        byteLength: this.#inputByteLength,
      });
      const inputView = new Memory.View({
        memoryBlock: inputBlock,
      });
      this.#inputCallback.invoke(inputView);
      const promise = this.#sink.execute({
        input: inputView,
        state: this.#state,
      });
      self.setTimeout(function () {
        promise.then(staticExecute);
      }, this.setTimeoutValue);
      const end = performance.now();
      // Statistics
      this.#avgInterval *= (1 - this.#smoothingFactor);
      this.#avgInterval += this.#smoothingFactor * (start - this.#lastStartTime);
      this.#avgRunTime *= (1 - this.#smoothingFactor);
      this.#avgRunTime += this.#smoothingFactor * (end - start);
      this.#lastStartTime = start;
      // Estimate proper interval
      const estInterval = (this.#avgRunTime / this.#targetUsage);
      // Adjust setTimeoutValue to attempt to reach this interval
      this.#setTimeoutValue += 0.1 * (estInterval - this.#avgInterval);
      if (this.#setTimeoutValue < 1) {
        this.#setTimeoutValue = 1;
      }
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "AsyncBytePullSinkNode.#execute",
        error: e,
      });
    }
  }
}













// From "PushSink" callback
export function createWritableStream(callback) {
  try {
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        callback.invoke(chunk);
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
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createWritableStream",
      error: e,
    });
  }
}

// From "PullSource" callback
export function createReadableStream(callback) {
  try {
    const underlyingSource = {
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        const item = callback.invoke();
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
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createReadableStream",
      error: e,
    });
  }
}

export class ReadableByteStreamPushSource {
  #reader;
  #pushSourceController;
  #closedSignalController;
  #cancelledSignalController;
  constructor(args) {
    try {
      const { readableStream, chunkByteLength } = (function () {
        let ret = {};
        if (Types.isSimpleObject(args)) {
          if (!(Object.hasOwn(args, "readableStream"))) {
            throw "Argument \"readableStream\" must be provided.";
          }
          ret.readableStream = args.readableStream;
          if (!(Object.hasOwn(args, "chunkByteLength"))) {
            throw "Argument \"chunkByteLength\" must be provided.";
          }
          ret.chunkByteLength = args.chunkByteLength;
        } else {
          throw "Invalid Arguments";
        }
        return ret;
      })();
      if (!(readableStream instanceof self.ReadableStream)) {
        throw "Argument \"readableStream\" must be of type self.ReadableStream.";
      }
      if (readableStream.locked) {
        throw "Argument \"readableStream\" must be unlocked.";
      }
      const reader = readableStream.getReader({ mode: "byob" });
      this.#reader = reader;
      const callbackFunction = Tasks.createStatic({
        function: this.#process,
        this: this,
      });
      const callbackController = new Tasks.CallbackController({
        invoke: callbackFunction,
      });
      this.#pushSourceController = new AsyncByteReaderPushSource({
        callback: callbackController.callback,
        outputByteRate: outputByteRate,
      });
      this.#closedSignalController = new Tasks.SignalController();
      this.#cancelledSignalController = new Tasks.SignalController();
      const dispatchClose = Tasks.createStatic({
        function: this.#dispatchClose,
        this: this,
      });
      reader.closed.then(dispatchClose);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableByteStreamPushSource constructor",
        error: e,
      });
    }
  }
  #dispatchClose() {
    this.#closedSignalController.dispatch();
    this.#cancelledSignalController.dispatch();
  }
  connectOutput(args) {
    try {
      return this.#pushSourceController.connectOutput(args);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableByteStreamPushSource.connectOutput",
        error: e,
      });
    }
  }
  async #process(view) {
    try {
      const uint8Array = view.toUint8Array();
      const { value, done } = await this.#reader.read(uint8Array);
      if (done) {
        return null;
      }
      return value.byteLength;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "ReadableByteStreamPushSource.process",
        error: e,
      });
    }
  }
  get closed() {
    try {
      return this.#closedSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableByteStreamPushSource.closed",
        error: e,
      });
    }
  }
  get cancelled() {
    try {
      return this.#cancelledSignalController.signal;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get ReadableByteStreamPushSource.cancelled",
        error: e,
      });
    }
  }
};

export class WritableStreamPushSink {
  #pushCallbackController;
  #writer;
  constructor(args) {
    try {
      let writableStream = (function () {
        if (Types.isSimpleObject(args)) {
          if (Object.hasOwn(args, "writableStream")) {
            throw "Argument \"writableStream\" must be provided.";
          }
          writableStream = args.writableStream;
        } else {
          writableStream = args;
        }
      })();
      if (!(writableStream instanceof self.WritableStream)) {
        throw "Argument \"writableStream\" must be of type self.WritableStream.";
      }
      if (writableStream.locked) {
        throw "Argument \"writableStream\" must be unlocked.";
      }
      this.#writer = writableStream.getWriter();
      const pushSinkCallbackFunction = Tasks.createStatic({
        function: this.#writer.write,
        this: this.#writer,
      });
      this.#pushCallbackController = new Tasks.CallbackController({
        invoke: pushSinkCallbackFunction,
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink constructor",
        error: e,
      });
    }
  }
  get inputCallback() {
    try {
      return this.#pushCallbackController.callback;
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "get WritableStreamPushSink.callback",
        error: e,
      });
    }
  }
  disconnectInput() {
    try {
      this.#pushCallbackController.replace(null);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "WritableStreamPushSink.disconnectInput",
        error: e,
      });
    }
  }
};

// From "PushSink" byte callback
export function createWritableByteStream(callback) {
  try {
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        const view = callback.allocate(chunk.byteLength);
        view.set(chunk);
        callback.invoke(chunk.byteLength);
      },
      close: function (controller) {
      },
      abort: function (reason) {
      },
      mode: "bytes",
    };
    const writeQueuingStrategy = {
      highWaterMark: 1,
    }
    return new self.WritableStream(underlyingSink, writeQueuingStrategy);
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createWritableByteStream",
      error: e,
    });
  }
}

// From "PullSource" callback (not byte callback)
export function createReadableByteStream(callback) {
  try {
    const underlyingSource = {
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        const item = callback.invoke();
        controller.enqueue(item);
      },
      cancel: function (reason) {
        return;
      },
      mode: "bytes",
    };
    const readQueuingStrategy = {
      highWaterMark: 1,
      size: function (chunk) {
        return 1;
      }
    };
    return new self.ReadableStream(underlyingSource, readQueuingStrategy);
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "createReadableByteStream",
      error: e,
    });
  }
}
