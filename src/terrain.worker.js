import SimplexNoise from "simplex-noise"

const seed1 = new SimplexNoise(Math.random())
const seed2 = new SimplexNoise(Math.random())

function ridgenoise(nx, ny) {
  return 2 * (0.5 - Math.abs(0.5 - seed1.noise2D(nx, ny)))
}

const layers = {
  base: (x, y) =>
    seed1.noise2D(x / 10000, y / 10000) * seed2.noise2D(x / 2000, y / 2000) * 5,
  baseRidged: (x, y) => {
    const aplitude = seed1.noise2D(y / 3000, x / 3000) / 2 + 0.5
    const scale = 2000

    const e0 = 1 * ridgenoise((1 * x) / scale, (1 * y) / scale)
    const e1 = 0.5 * ridgenoise((2 * x) / scale, (2 * y) / scale) * e0
    const e2 = 0.25 * ridgenoise((4 * x) / scale, (4 * y) / scale) * (e0 + e1)
    const e = e0 + e1 + e2
    return Math.pow(e, 3) * aplitude
  },
  lumpsOfSmallBumps: (x, y) => {
    return (
      ridgenoise(x / 40, y / 40) *
      Math.min(0, seed1.noise2D(x / 400, y / 400)) *
      0.1
    )
  },
  sineWidePerturbances: (x, y) => {
    return (
      Math.max(
        seed1.noise2D(
          Math.sin(seed1.noise2D(x / 1200, y / 200)),
          Math.sin(seed2.noise2D(x / 200, y / 1200))
        ),
        0
      ) * 0.2
    )
  },
  dirtDetail: (x, y) => {
    const tmpSandSmoothnes = Math.max(0, seed2.noise2D(x / 200, y / 200)) * 0.1
    const tmpSandWaves1 = seed1.noise2D(y / 500, x / 500)
    const tmpSandWaves2 = seed2.noise2D(y / 500, x / 500)

    return (
      seed1.noise2D(
        x / ((Math.sin(tmpSandWaves1) + 2) * 10),
        y / ((Math.cos(tmpSandWaves2) + 2) * 10)
      ) * tmpSandSmoothnes
    )
  }
}

/**
 *
 * @param {Float32Array} points
 */
const calculateUnevenness = (points, step = 2) => {
  step = Math.round(step)
  let min = points[0]
  let max = points[0]
  let curr = 0
  const loopLimit = points.length - step
  for (let i = 0; i < loopLimit; i += step) {
    curr = points[i]
    if (curr < min) min = curr
    if (curr > max) max = curr
  }
  return Math.abs(max - min) / 100
}

// TODO: LOD
const generateTerrain = (sizeX = 100, sizeY = 100, baseX = 0, baseY = 0) => {
  // Accomodate for the gaps between sectors
  sizeX++
  sizeY++

  const pointValues = new Float32Array(sizeX * sizeY)
  for (let Y = 0; Y <= sizeY; Y++) {
    for (let X = 0; X <= sizeX; X++) {
      const x = X + baseX
      const y = Y + baseY
      const z =
        Object.values(layers)
          .map(func => func(x, y))
          .reduce((prev, curr) => prev + curr, 0) * 15

      pointValues[Y * sizeX + X] = z
    }
  }

  return {
    pointValues,
    uneveneness: calculateUnevenness(pointValues, (sizeX * sizeY) / 1000)
  }
}

self.onmessage = e => {
  if (e.data.type === "generateTerrain") {
    const mapData = generateTerrain(
      e.data.sizeX,
      e.data.sizeY,
      e.data.sectorX * e.data.sizeX,
      e.data.sectorY * e.data.sizeY,
      e.data.LOD
    )
    self.postMessage({
      pointValues: mapData.pointValues,
      sectorX: e.data.sectorX,
      sectorY: e.data.sectorY,
      uneveneness: mapData.uneveneness,
      LOD: e.data.LOD
    })
  }
}
