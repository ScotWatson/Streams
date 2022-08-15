/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const initPageTime = performance.now();

const loadStreamsModule = import("https://scotwatson.github.io/Streams/Streams.mjs");

loadStreamsModule.then(function (module) {
  console.log(Object.getOwnPropertyNames(module));
}, streamFail);

function streamFail(e) {
  console.error("Stream Fail")
  console.error(e)
}

const loadWindow = new Promise(function (resolve, reject) {
  window.addEventListener("load", function (evt) {
    resolve(evt);
  });
});

Promise.all( [ loadWindow, loadStreamsModule ] ).then(start, fail);

function fail(e) {
  console.error("loadFail");
  console.error(e);
}

let maxCount;
let readableHighWaterMark;
let writableHighWaterMark;

function start( [ evtWindow, moduleStreams ] ) {
  const imgBird = document.createElement("img");
  imgBird.src = "FlappingBird.gif";
  document.body.appendChild(imgBird);
  const selectReadableObject = document.createElement("select");
  document.body.appendChild(selectReadableObject);
  const optionRandomCharacter = document.createElement("option");
  optionRandomCharacter.innerHTML = "Random Character";
  optionRandomCharacter.setAttribute("value", "Character");
  selectReadableObject.appendChild(optionRandomCharacter);
  const optionRandomObject = document.createElement("option");
  optionRandomObject.innerHTML = "Random Object";
  optionRandomObject.setAttribute("value", "Object");
  selectReadableObject.appendChild(optionRandomObject);
  const optionRandomNumber = document.createElement("option");
  optionRandomNumber.innerHTML = "Random Number";
  optionRandomNumber.setAttribute("value", "Number");
  selectReadableObject.appendChild(optionRandomNumber);
  document.body.appendChild(document.createElement("br"));
  document.body.appendChild(document.createTextNode("Number of Samples"));
  const inpNumSamples = document.createElement("input");
  inpNumSamples.type = "text";
  inpNumSamples.addEventListener("input", function (evt) {
    maxCount = parseInt(evt.target.value);
  });
  document.body.appendChild(inpNumSamples);
  document.body.appendChild(document.createElement("br"));
  document.body.appendChild(document.createTextNode("readable High Water Mark:"));
  const inpReadableHighWaterMark = document.createElement("input");
  inpReadableHighWaterMark.type = "text";
  inpReadableHighWaterMark.addEventListener("input", function (evt) {
    readableHighWaterMark = parseInt(evt.target.value);
  });
  document.body.appendChild(inpReadableHighWaterMark);
  document.body.appendChild(document.createElement("br"));
  document.body.appendChild(document.createTextNode("writable High Water Mark:"));
  const inpWritableHighWaterMark = document.createElement("input");
  inpWritableHighWaterMark.type = "text";
  inpWritableHighWaterMark.addEventListener("input", function (evt) {
    writableHighWaterMark = parseInt(evt.target.value);
  });
  document.body.appendChild(inpWritableHighWaterMark);
  document.body.appendChild(document.createElement("br"));
  const btnRun = document.createElement("button");
  btnRun.innerHTML = "Run";
  btnRun.addEventListener("click", runStreams);
  document.body.appendChild(btnRun);
  function runStreams() {
    let count = maxCount;
    const readable = new moduleStreams.AnnotatedReadableStream({
      log: window.console.log,
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        window.console.log("readable desiredSize:", controller.desiredSize);
        if (count === 0) {
          window.console.log("readable no more samples");
          return;
        } else {
          window.console.log("count: ", count);
        }
        switch (selectReadableObject.value) {
          case "Character":
            window.console.log("start 1st enqueue");
            controller.enqueue(String.fromCharCode(Math.random() * 0x60 + 0x20));
            window.console.log("end 1st/start 2nd enqueue");
            controller.enqueue(String.fromCharCode(Math.random() * 0x60 + 0x20));
            window.console.log("end 2nd enqueue");
            break;
          case "Object":
            controller.enqueue({
              value: Math.random(),
            });
            break;
          case "Number":
            controller.enqueue(Math.random());
            break;
          default:
            controller.error("Invalid Selection");
            break;
        }
        --count;
        return;
      },
      cancel: function (reason) {
        window.console.error(reason);
        return;
      },
      highWaterMark: readableHighWaterMark,
      chunkSize: function (chunk) {
        console.log("readable chunk:", chunk);
        return 1;
      },
    });
    const writable = new moduleStreams.AnnotatedWritableStream({
      log: window.console.log,
      start: function (controller) {
        return;
      },
      write: function (chunk, controller) {
        window.console.log(chunk);
      },
      close: function (controller) {
        return;
      },
      abort: function (reason) {
        window.console.error(reason);
        return;
      },
      highWaterMark: writableHighWaterMark,
      chunkSize: function (chunk) {
        console.log("writable chunk:", chunk);
        return 1;
      },
    });
    window.console.log("start pipe");
    readable.pipeTo(writable);
    window.console.log("end pipe");
    Promise.resolve().then(test1).then(test2).then(test3).then(test4).then(test5);
    function test1() {
      window.console.log("test1");
    }
    function test2() {
      window.console.log("test2");
    }
    function test3() {
      window.console.log("test3");
    }
    function test4() {
      window.console.log("test4");
    }
    function test5() {
      window.console.log("test5");
    }
    window.console.log("end setup");
  }
  function runByteStreams() {
    const readableByte = new moduleStreams.AnnotatedReadableByteStream({
      start: function (controller) {
        return;
      },
      pull: function (controller) {
        console.log("readableByte desiredSize:", controller.desiredSize);
        const view = new Uint8Array(1);
        view[0] = Math.random() * 0xFF;
        controller.enqueue(view);
      },
      cancel: function (reason) {
        console.error(reason);
        return;
      },
      highWaterMark: 5,
      chunkSize: function (chunk) {
        return 1;
      },
    });
    const writable = new moduleStreams.AnnotatedWritableStream({
      log: window.console.log,
      start: function (controller) {
        return;
      },
      write: function (chunk, controller) {
        window.console.log(chunk);
      },
      close: function (controller) {
        return;
      },
      abort: function (reason) {
        window.console.error(reason);
        return;
      },
      highWaterMark: 5,
      chunkSize: function (chunk) {
        console.log("writable chunk:", chunk);
        return 1;
      },
    });
    readable.pipeTo(writable);
  }
}
