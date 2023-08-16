// import { FaceLandmarker } from '@mediapipe/tasks-vision'

// FaceLandmarker.FACE_LANDMARKS_LEFT_EYE
// const leftEye = [
//   {
//     start: 263,
//     end: 249,
//   },
//   {
//     start: 249,
//     end: 390,
//   },
//   {
//     start: 390,
//     end: 373,
//   },
//   {
//     start: 373,
//     end: 374,
//   },
//   {
//     start: 374,
//     end: 380,
//   },
//   {
//     start: 380,
//     end: 381,
//   },
//   {
//     start: 381,
//     end: 382,
//   },
//   {
//     start: 382,
//     end: 362,
//   },
//   {
//     start: 263,
//     end: 466,
//   },
//   {
//     start: 466,
//     end: 388,
//   },
//   {
//     start: 388,
//     end: 387,
//   },
//   {
//     start: 387,
//     end: 386,
//   },
//   {
//     start: 386,
//     end: 385,
//   },
//   {
//     start: 385,
//     end: 384,
//   },
//   {
//     start: 384,
//     end: 398,
//   },
//   {
//     start: 398,
//     end: 362,
//   },
// ]
// FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE
// const rightEye = [
//   {
//     start: 33,
//     end: 7,
//   },
//   {
//     start: 7,
//     end: 163,
//   },
//   {
//     start: 163,
//     end: 144,
//   },
//   {
//     start: 144,
//     end: 145,
//   },
//   {
//     start: 145,
//     end: 153,
//   },
//   {
//     start: 153,
//     end: 154,
//   },
//   {
//     start: 154,
//     end: 155,
//   },
//   {
//     start: 155,
//     end: 133,
//   },
//   {
//     start: 33,
//     end: 246,
//   },
//   {
//     start: 246,
//     end: 161,
//   },
//   {
//     start: 161,
//     end: 160,
//   },
//   {
//     start: 160,
//     end: 159,
//   },
//   {
//     start: 159,
//     end: 158,
//   },
//   {
//     start: 158,
//     end: 157,
//   },
//   {
//     start: 157,
//     end: 173,
//   },
//   {
//     start: 173,
//     end: 133,
//   },
// ]
// FaceLandmarker.FACE_LANDMARKS_FACE_OVAL
// const faceOval = [
//   {
//     start: 10,
//     end: 338,
//   },
//   {
//     start: 338,
//     end: 297,
//   },
//   {
//     start: 297,
//     end: 332,
//   },
//   {
//     start: 332,
//     end: 284,
//   },
//   {
//     start: 284,
//     end: 251,
//   },
//   {
//     start: 251,
//     end: 389,
//   },
//   {
//     start: 389,
//     end: 356,
//   },
//   {
//     start: 356,
//     end: 454,
//   },
//   {
//     start: 454,
//     end: 323,
//   },
//   {
//     start: 323,
//     end: 361,
//   },
//   {
//     start: 361,
//     end: 288,
//   },
//   {
//     start: 288,
//     end: 397,
//   },
//   {
//     start: 397,
//     end: 365,
//   },
//   {
//     start: 365,
//     end: 379,
//   },
//   {
//     start: 379,
//     end: 378,
//   },
//   {
//     start: 378,
//     end: 400,
//   },
//   {
//     start: 400,
//     end: 377,
//   },
//   {
//     start: 377,
//     end: 152,
//   },
//   {
//     start: 152,
//     end: 148,
//   },
//   {
//     start: 148,
//     end: 176,
//   },
//   {
//     start: 176,
//     end: 149,
//   },
//   {
//     start: 149,
//     end: 150,
//   },
//   {
//     start: 150,
//     end: 136,
//   },
//   {
//     start: 136,
//     end: 172,
//   },
//   {
//     start: 172,
//     end: 58,
//   },
//   {
//     start: 58,
//     end: 132,
//   },
//   {
//     start: 132,
//     end: 93,
//   },
//   {
//     start: 93,
//     end: 234,
//   },
//   {
//     start: 234,
//     end: 127,
//   },
//   {
//     start: 127,
//     end: 162,
//   },
//   {
//     start: 162,
//     end: 21,
//   },
//   {
//     start: 21,
//     end: 54,
//   },
//   {
//     start: 54,
//     end: 103,
//   },
//   {
//     start: 103,
//     end: 67,
//   },
//   {
//     start: 67,
//     end: 109,
//   },
//   {
//     start: 109,
//     end: 10,
//   },
// ]
// FaceLandmarker.FACE_LANDMARKS_LIPS
// const lips = [
//   {
//     start: 61,
//     end: 146,
//   },
//   {
//     start: 146,
//     end: 91,
//   },
//   {
//     start: 91,
//     end: 181,
//   },
//   {
//     start: 181,
//     end: 84,
//   },
//   {
//     start: 84,
//     end: 17,
//   },
//   {
//     start: 17,
//     end: 314,
//   },
//   {
//     start: 314,
//     end: 405,
//   },
//   {
//     start: 405,
//     end: 321,
//   },
//   {
//     start: 321,
//     end: 375,
//   },
//   {
//     start: 375,
//     end: 291,
//   },
//   {
//     start: 61,
//     end: 185,
//   },
//   {
//     start: 185,
//     end: 40,
//   },
//   {
//     start: 40,
//     end: 39,
//   },
//   {
//     start: 39,
//     end: 37,
//   },
//   {
//     start: 37,
//     end: 0,
//   },
//   {
//     start: 0,
//     end: 267,
//   },
//   {
//     start: 267,
//     end: 269,
//   },
//   {
//     start: 269,
//     end: 270,
//   },
//   {
//     start: 270,
//     end: 409,
//   },
//   {
//     start: 409,
//     end: 291,
//   },
//   {
//     start: 78,
//     end: 95,
//   },
//   {
//     start: 95,
//     end: 88,
//   },
//   {
//     start: 88,
//     end: 178,
//   },
//   {
//     start: 178,
//     end: 87,
//   },
//   {
//     start: 87,
//     end: 14,
//   },
//   {
//     start: 14,
//     end: 317,
//   },
//   {
//     start: 317,
//     end: 402,
//   },
//   {
//     start: 402,
//     end: 318,
//   },
//   {
//     start: 318,
//     end: 324,
//   },
//   {
//     start: 324,
//     end: 308,
//   },
//   {
//     start: 78,
//     end: 191,
//   },
//   {
//     start: 191,
//     end: 80,
//   },
//   {
//     start: 80,
//     end: 81,
//   },
//   {
//     start: 81,
//     end: 82,
//   },
//   {
//     start: 82,
//     end: 13,
//   },
//   {
//     start: 13,
//     end: 312,
//   },
//   {
//     start: 312,
//     end: 311,
//   },
//   {
//     start: 311,
//     end: 310,
//   },
//   {
//     start: 310,
//     end: 415,
//   },
//   {
//     start: 415,
//     end: 308,
//   },
// ]

// const distinct = (input) => {
//   const result = new Set([])
//   input.forEach((item) => {
//     result.add(item.start)
//     result.add(item.end)
//   })

//   console.log(result)
// }

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

export const FacePartsPolygon = {
  lips: lipsDistinct,
  rightEye: rightEyeDistinct,
  leftEye: leftEyeDistinct,
  faceOval: faceOvalDistinct,
}

// // // // // // // // // // // // // // // // // // // // // // // //
export const videoWidth = 640
export const videoHeight = 370
