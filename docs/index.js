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


function start( [ evtWindow, moduleUnicode ] ) {
  /*
  const selectReadableObject = document.createElement("select");
  document.body.appendChild(selectReadableObject);
  const optionRandomNumber = document.createElement("option");
  optionRandomNumber.innerHTML = "Random Number";
  optionRandomNumber.setAttribute("value", "Number");
  selectReadableObject.appendChild(optionRandomNumber);
  const optionRandomObject = document.createElement("option");
  optionRandomObject.innerHTML = "Random Object";
  optionRandomObject.setAttribute("value", "Number");
  selectReadableObject.appendChild(optionRandomObject);
  const readable = new AnnotatedReadableStream({
    start: function (controller) {
      return;
    },
    pull: function (controller) {
      switch (selectReadableObject.value) {
        case "Number":
          controller.enqueue(Math.random());
          break;
        case "Object":
          controller.enqueue({
            value: Math.random(),
          });
          break;
        default:
          controller.error("Invalid Selection");
          break;
      }
      return;
    },
    cancel: function (reason) {
      console.error(reason);
      return;
    },
    highWaterMark: 1,
    chunkSize: function (chunk) {
      return 1;
    },
  });
  const readableByte = new AnnotatedReadableByteStream({
    start: function (controller) {
      return;
    },
    pull: function (controller) {
      controller.enqueue();
    },
    cancel: function (reason) {
      console.error(reason);
      return;
    },
    highWaterMark: 1,
    chunkSize: function (chunk) {
      return 1;
    },
  });
  const writable = new AnnotatedWritableStream({
    start: function (controller) {
      return;
    },
    write: function (chunk, controller) {
      console.log(chunk);
    },
    close: function (controller) {
      return;
    },
    abort: function (reason) {
      console.error(reason);
      return;
    },
    highWaterMark: 1,
    chunkSize: function (chunk) {
      return 1;
    },
  });
  readable.pipeTo(writable);
  */
}
