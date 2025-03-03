let projectName = "eclipse"; //to be updated

//detect user browser
var ua = navigator.userAgent;
var isSafari = false;
var isFirefox = false;
var isIOS = false;
var isAndroid = false;
if(ua.includes("Safari")){
    isSafari = true;
}
if(ua.includes("Firefox")){
    isFirefox = true;
}
if(ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")){
    isIOS = true;
}
if(ua.includes("Android")){
    isAndroid = true;
}
console.log("isSafari: "+isSafari+", isFirefox: "+isFirefox+", isIOS: "+isIOS+", isAndroid: "+isAndroid);

var mediaRecorder;
var recordedChunks;
var finishedBlob;
var recordingMessageDiv = document.getElementById("videoRecordingMessageDiv");
var recordVideoState = false;
var videoRecordInterval;
var videoEncoder;
var muxer;
var mobileRecorder;
var videofps = 30;
let bitrate = 16_000_000;

function saveImage() {
  console.log("Export png image");

  // Create a temporary canvas with the same dimensions
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempContext = tempCanvas.getContext('2d', {
      willReadFrequently: true,
      alpha: false  // Disable alpha to ensure solid background
  });

  // First, fill the temporary canvas with the current background color
  //const [r, g, b] = WebGLUtils.hexToRGB(CONFIG.backgroundColor);
  //tempContext.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  tempContext.fillStyle = "#000000"; 
  tempContext.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the WebGL canvas on top
  tempContext.globalCompositeOperation = 'source-over';
  //drawScene(currentTime);
  drawScene();
  // Force a render frame to ensure latest content
  gl.flush();
  gl.finish();
  tempContext.drawImage(canvas, 0, 0);

  // Create download link
  const link = document.createElement('a');
  link.href = tempCanvas.toDataURL('image/png');
  
  const date = new Date();
  const filename = projectName + `_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.png`;
  link.download = filename;
  link.click();

  // Cleanup
  tempCanvas.remove();
}

function toggleVideoRecord(){

  if(recordVideoState == false){
    recordVideoState = true;
    chooseRecordingFunction();
  } else {
    recordVideoState = false;
    chooseEndRecordingFunction();
  }
}

function chooseRecordingFunction(){
  resetAnimation();
  if(isIOS || isAndroid || isFirefox){
      startMobileRecording();
  }else {
      recordVideoMuxer();
  }
}

function chooseEndRecordingFunction(){
  if(isIOS || isAndroid || isFirefox){
      mobileRecorder.stop();
  }else {
      finalizeVideo();
  }
}

//record html canvas element and export as mp4 video
//source: https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api
async function recordVideoMuxer() {
console.log("start muxer video recording");

var videoWidth = Math.floor(canvas.width/2)*2;
var videoHeight = Math.floor(canvas.height/4)*4; //force a number which is divisible by 4

console.log("Video dimensions: "+videoWidth+", "+videoHeight);

//display user message
recordingMessageDiv.classList.remove("hidden");

recordVideoState = true;
const ctx = canvas.getContext("2d", {
  // This forces the use of a software (instead of hardware accelerated) 2D canvas
  // This isn't necessary, but produces quicker results
  willReadFrequently: true,
  // Desynchronizes the canvas paint cycle from the event loop
  // Should be less necessary with OffscreenCanvas, but with a real canvas you will want this
  desynchronized: true,
});

muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
        // If you change this, make sure to change the VideoEncoder codec as well
        codec: "avc",
        width: videoWidth,
        height: videoHeight,
    },

    firstTimestampBehavior: 'offset', 

  // mp4-muxer docs claim you should always use this with ArrayBufferTarget
  fastStart: "in-memory",
});

videoEncoder = new VideoEncoder({
  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  error: (e) => console.error(e),
});

// This codec should work in most browsers
// See https://dmnsgn.github.io/media-codecs for list of codecs and see if your browser supports
videoEncoder.configure({
  codec: "avc1.4d0032",
  width: videoWidth,
  height: videoHeight,
  bitrate: bitrate,
  bitrateMode: "variable",
});
//NEW codec: "avc1.4d0032",
//ORIGINAL codec: "avc1.42003e",

var frameNumber = 0;
//setTimeout(finalizeVideo,1000*videoDuration+200); //finish and export video after x seconds

//take a snapshot of the canvas every x miliseconds and encode to video

videoRecordInterval = setInterval(
    function(){
        if(recordVideoState == true){
          //gl.flush();
          //gl.finish();
          drawScene();
          renderCanvasToVideoFrameAndEncode({
              canvas,
              videoEncoder,
              frameNumber,
              videofps
          })
          frameNumber++;
        }else{
        }
    } , 1000/videofps);

}

//finish and export video
async function finalizeVideo(){
  console.log("finalize muxer video");
  togglePlayPause();
  clearInterval(videoRecordInterval);
  //playAnimationToggle = false;
  recordVideoState = false;

  // Forces all pending encodes to complete
  await videoEncoder.flush();
  muxer.finalize();
  let buffer = muxer.target.buffer;
  finishedBlob = new Blob([buffer]); 
  downloadBlob(new Blob([buffer]));

  //hide user message
  recordingMessageDiv.classList.add("hidden");
  togglePlayPause();
}

async function renderCanvasToVideoFrameAndEncode({
  canvas,
  videoEncoder,
  frameNumber,
  videofps,
  }) {
  let frame = new VideoFrame(canvas, {
      // Equally spaces frames out depending on frames per second
      timestamp: (frameNumber * 1e6) / videofps,
  });

  // The encode() method of the VideoEncoder interface asynchronously encodes a VideoFrame
  videoEncoder.encode(frame);

  // The close() method of the VideoFrame interface clears all states and releases the reference to the media resource.
  frame.close();
}

function downloadBlob() {
  console.log("download video");
  let url = window.URL.createObjectURL(finishedBlob);
  let a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  const date = new Date();
  const filename = projectName+`_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.mp4`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

//record and download videos on mobile devices
function startMobileRecording(){
  var stream = canvas.captureStream(videofps);
  mobileRecorder = new MediaRecorder(stream, { 'type': 'video/mp4' });
  mobileRecorder.addEventListener('dataavailable', finalizeMobileVideo);

  console.log("start simple video recording");
  console.log("Video dimensions: "+canvas.width+", "+canvas.height);

  //display user message
  //recordingMessageCountdown(videoDuration);
  recordingMessageDiv.classList.remove("hidden");

  recordVideoState = true;
  mobileRecorder.start(); //start mobile video recording

  /*
  setTimeout(function() {
      recorder.stop();
  }, 1000*videoDuration+200);
  */
}

function finalizeMobileVideo(e) {
  setTimeout(function(){
      console.log("finish simple video recording");
      togglePlayPause();
      recordVideoState = false;
      /*
      mobileRecorder.stop();*/
      var videoData = [ e.data ];
      finishedBlob = new Blob(videoData, { 'type': 'video/mp4' });
      downloadBlob(finishedBlob);
      
      //hide user message
      recordingMessageDiv.classList.add("hidden");
      togglePlayPause();

  },500);
}