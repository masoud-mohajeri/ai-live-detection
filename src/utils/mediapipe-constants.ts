// import { FaceLandmarker } from '@mediapipe/tasks-vision'

// FaceLandmarker.FACE_LANDMARKS_LEFT_EYE
// const leftEye = [
//   {
//     start: 263,
//     end: 249,
//   },
//   ...
//   {
//     start: 398,
//     end: 362,
//   },
// ]

// const distinct = (input) => {
//   const result = new Set([])
//   input.forEach((item) => {
//     result.add(item.start)
//     result.add(item.end)
//   })

// distinct(lips)

const leftEyeDistinct = [263, 249, 390, 373, 374, 380, 381, 382, 362, 466, 388, 387, 386, 385, 384, 398]
const rightEyeDistinct = [33, 7, 163, 144, 145, 153, 154, 155, 133, 246, 161, 160, 159, 158, 157, 173]
const faceOvalDistinct = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
]
const lipsDistinct = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 185, 40, 39, 37, 0, 267, 269, 270, 409, 78, 95, 88, 178, 87, 14,
  317, 402, 318, 324, 308, 191, 80, 81, 82, 13, 312, 311, 310, 415,
]

export const FacePartsPolygonIndexes = {
  lips: lipsDistinct,
  rightEye: rightEyeDistinct,
  leftEye: leftEyeDistinct,
  faceOval: faceOvalDistinct,
}

// // // // // // // // // // // // // // // // // // // // // // // //
export const videoWidth = 640
export const videoHeight = 370
