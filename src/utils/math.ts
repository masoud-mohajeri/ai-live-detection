export interface PointCoordinate {
  x: number
  y: number
  z: number
}

// https://stackoverflow.com/questions/16285134/calculating-polygon-area
export function calculatePolygonArea(vertices: PointCoordinate[]): number {
  let total = 0

  for (let i = 0, l = vertices.length; i < l; i++) {
    const addX = vertices[i].x
    const addY = vertices[i === vertices.length - 1 ? 0 : i + 1].y
    const subX = vertices[i === vertices.length - 1 ? 0 : i + 1].x
    const subY = vertices[i].y

    total += addX * addY * 0.5
    total -= subX * subY * 0.5
  }

  return Math.abs(total)
}

export const calculateMean = (values: number[]): number => {
  const length = values.length
  if (!length) return 0

  let sum = 0
  for (let index = 0; index < length; index++) {
    sum += values[index]
  }

  const mean = sum / length
  return mean
}

export const calculateVariance = (values: number[]): number => {
  const length = values.length
  let squareDiffs = []

  const average = calculateMean(values)
  for (let index = 0; index < length; index++) {
    const squareDiff = Math.pow(values[index] - average, 2)
    squareDiffs.push(squareDiff)
  }

  const variance = calculateMean(squareDiffs)
  return variance
}

// SD = Standard Division
export const calculateStandardDivision = (values: number[]) => {
  return Math.sqrt(calculateVariance(values))
}
