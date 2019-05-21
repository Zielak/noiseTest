import SimplexNoise from "simplex-noise"
import R from "ramda"

const seed1 = new SimplexNoise(Math.random())
const seed2 = new SimplexNoise(Math.random())

const layers = {
  base: (x, y) =>
    seed1.noise2D(x / 2000, y / 2000) * seed2.noise2D(x / 800, y / 800) * 4,
  simpleNoise: (x, y) =>
    seed1.noise2D(x / 40, y / 40) *
    0.2 *
    Math.min(0, seed1.noise2D(x / 400, y / 400)),
  sineWaves: (x, y) => {
    const tmpSineWaves = seed1.noise2D(y / 2000, x / 2000)

    return (
      seed1.noise2D(
        Math.sin(seed2.noise2D(x / 300, y / 150)),
        Math.sin(seed2.noise2D(x / 150, y / 300))
      ) *
      tmpSineWaves *
      0.3
    )
  },
  dirtDetail: (x, y) => {
    const tmpSandSmoothnes = Math.max(0, seed2.noise2D(x / 700, y / 700)) * 0.06
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

const generateTerrain = (sizeX = 100, sizeY = 100, baseX = 0, baseY = 0) => {
  const points = new Float32Array(sizeX * sizeY * 3)
  for (let Y = 0; Y <= sizeY; Y++) {
    for (let X = 0; X <= sizeX; X++) {
      const x = X + baseX
      const y = Y + baseY
      const z =
        Object.values(layers)
          .map(func => func(x, y))
          .reduce((prev, curr) => prev + curr, 0) * 15

      points[3 * (Y * sizeX + X)] = x - baseX
      points[3 * (Y * sizeX + X) + 1] = z
      points[3 * (Y * sizeX + X) + 2] = y - baseY
    }
  }
  return points
}

self.onmessage = e => {
  if (e.data.type === "generateTerrain") {
    const mapData = generateTerrain(
      e.data.sizeX,
      e.data.sizeY,
      e.data.baseX,
      e.data.baseY
    )
    self.postMessage({
      mapData,
      baseX: e.data.baseX,
      baseY: e.data.baseY
    })
  }
}
