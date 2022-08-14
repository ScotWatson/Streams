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

function start( [ evtWindow, moduleStreams ] ) {
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
  const readable = new moduleStreams.AnnotatedReadableStream({
    start: function (controller) {
      return;
    },
    pull: function (controller) {
      switch (selectReadableObject.value) {
        case "Character":
          controller.enqueue(String.fromCharCode(Math.random() * 0x60 + 0x20));
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
  const readableByte = new moduleStreams.AnnotatedReadableByteStream({
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
  const writable = new moduleStreams.AnnotatedWritableStream({
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
}
