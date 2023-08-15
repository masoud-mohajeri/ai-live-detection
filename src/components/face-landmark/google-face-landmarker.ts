// /* @ts-ignore */
// import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
// const { FaceLandmarker, FilesetResolver } = vision;
// const demosSection = document.getElementById("demos")!;

// let faceLandmarker;
// let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
// let enableWebcamButton: HTMLButtonElement;
// let webcamRunning: Boolean = false;

// // Before we can use HandLandmarker class we must wait for it to finish
// // loading. Machine Learning models can be large and take a moment to
// // get everything needed to run.
// async function createFaceLandmarker() {
//   const filesetResolver = await FilesetResolver.forVisionTasks(
//     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
//   );
//   faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
//     baseOptions: {
//       modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
//       delegate: "GPU"
//     },
//     outputFaceBlendshapes: true,
//     runningMode,
//     numFaces: 1
//   });
//   demosSection.classList.remove("invisible");
// }
// createFaceLandmarker();

// /********************************************************************
// // Demo 1: Grab a bunch of images from the page and detection them
// // upon click.
// ********************************************************************/

// const imageContainers = document.getElementsByClassName("detectOnClick");

// for (let imageContainer of imageContainers) {
//   imageContainer.children[0].addEventListener("click", handleClick);
// }

// // When an image is clicked, let's detect it and display results!
// async function handleClick(event) {
//   if (!faceLandmarker) {
//     console.log("Wait for faceLandmarker to load before clicking!");
//     return;
//   }

//   if (runningMode === "VIDEO") {
//     runningMode = "IMAGE";
//     await faceLandmarker.setOptions({ runningMode });

//     console.log('drawBlendShapes results')
//   }

//   /********************************************************************
//   // Demo 2: Continuously grab image from webcam stream and detect it.
//   ********************************************************************/

//   const video = document.getElementById("webcam") as HTMLVideoElement;



//   // Check if webcam access is supported.
//   function hasGetUserMedia() {
//     return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
//   }

//   // If webcam supported, add event listener to button for when user
//   // wants to activate it.
//   if (hasGetUserMedia()) {
//     enableWebcamButton = document.getElementById(
//       "webcamButton"
//     ) as HTMLButtonElement;
//     enableWebcamButton.addEventListener("click", enableCam);
//   } else {
//     console.warn("getUserMedia() is not supported by your browser");
//   }

//   // Enable the live webcam view and start detection.
//   function enableCam(event) {
//     if (!faceLandmarker) {
//       console.log("Wait! faceLandmarker not loaded yet.");
//       return;
//     }

//     if (webcamRunning === true) {
//       webcamRunning = false;
//       enableWebcamButton.innerText = "ENABLE PREDICTIONS";
//     } else {
//       webcamRunning = true;
//       enableWebcamButton.innerText = "DISABLE PREDICTIONS";
//     }

//     // getUsermedia parameters.
//     const constraints = {
//       video: true
//     };

//     // Activate the webcam stream.
//     navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
//       video.srcObject = stream;
//       video.addEventListener("loadeddata", predictWebcam);
//     });
//   }

//   let lastVideoTime = -1; 
//   let results = undefined;
//   async function predictWebcam() {

//     if (runningMode === "IMAGE") {
//       runningMode = "VIDEO";
//       await faceLandmarker.setOptions({ runningMode: runningMode });
//     }
//     let startTimeMs = performance.now();
//     if (lastVideoTime !== video.currentTime) {
//       lastVideoTime = video.currentTime;
//       results = faceLandmarker.detectForVideo(video, startTimeMs);
//     }

//     console.log('drawBlendShapes', results)

//     // Call this function again to keep predicting when the browser is ready.
//     if (webcamRunning === true) {
//       window.requestAnimationFrame(predictWebcam);
//     }
//   }
// }

export{}