/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

const initPageTime = performance.now();

const asyncWindow = new Promise(function (resolve, reject) {
  window.addEventListener("load", function (evt) {
    resolve(evt);
  });
});

const asyncErrorLog = (async function () {
  try {
    const module = await import("https://scotwatson.github.io/Debug/20230705/ErrorLog.mjs");
    return module;
  } catch (e) {
    console.error(e);
  }
})();

const asyncNodes = (async function () {
  try {
    const module = await import("https://scotwatson.github.io/Streams/20230705/Nodes.mjs");
    return module;
  } catch (e) {
    console.error(e);
  }
})();

const asyncOperations = (async function () {
  try {
    const module = await import("https://scotwatson.github.io/Streams/20230705/Operations.mjs");
    return module;
  } catch (e) {
    console.error(e);
  }
})();

(async function () {
  try {
    const modules = await Promise.all( [ asyncWindow, asyncErrorLog, asyncNodes, asyncOperations ] );
    start(modules);
  } catch (e) {
    console.error(e);
  }
})();

async function start( [ evtWindow, ErrorLog, Nodes, Operations ] ) {
  function createRNGSource() {
    const ret = new Operations.Source();
    ret.init = function () {
      return {};
    };
    ret.execute = function () {
      return Math.random();
    };
  }
  try {
    const imgBird = document.createElement("img");
    imgBird.src = "FlappingBird.gif";
    imgBird.style.width = "200px";
    document.body.appendChild(imgBird);
    document.body.appendChild(document.createElement("br"));
/*    
    const underlyingSource = {
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        const item = Math.random();
        controller.enqueue(item);
        return;
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
    const readableStream = new self.ReadableStream(underlyingSource, readQueuingStrategy);
    const readableStreamSource = new Streams.ReadableStreamSource(readableStream);
    const underlyingSink = {
      start: function (controller) {
      },
      write: function (chunk, controller) {
        console.log(chunk);
      },
      close: function (controller) {
      },
      abort: function (reason) {
      },
    };
    const writeQueuingStrategy = {
      highWaterMark: 1,
    }
    const writableStream = new self.WritableStream(underlyingSink, writeQueuingStrategy);
    const writableStreamSink = new Streams.WritableStreamSink(writableStream);
    const pump = new Streams.Pump();
    pump.setSource(readableStreamSource);
    pump.registerSink(writableStreamSink);
    (function execute() {
      const start = performance.now();
      pump.execute();
      const end = performance.now();
      setTimeout(execute, 0);
    })();
*/
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "start",
      error: e,
    });
  }
}
