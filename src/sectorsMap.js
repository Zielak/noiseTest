import { TerrainSector } from "./sector"
import { Vector2, Vector3 } from "@babylonjs/core"

const drawFilledCircle = (radius, points, addPoint) => {
  for (let y = -radius; y <= radius; y++)
    for (let x = -radius; x <= radius; x++)
      if (x * x + y * y <= radius * radius) addPoint(points, x, y)
  return points
}

class SectorsMap {
  /**
   *
   * @param {number} sizeX
   * @param {number} sizeY
   * @param {number} LODcount
   */
  constructor(sizeX, sizeY, LODcount) {
    this.sizeX = sizeX
    this.sizeY = sizeY
    this.halfSizeX = sizeX / 2
    this.halfSizeY = sizeY / 2
    this.LODcount = LODcount

    /**
     * @type {TerrainSector[]}
     */
    this.sectors = []
  }

  /**
   *
   * @param {TerrainSector} sector
   */
  addSector(sector) {
    if (!this.sectors[sector.y]) {
      this.sectors[sector.y] = []
    }
    this.sectors[sector.y][sector.x] = sector
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @returns {TerrainSector}
   */
  getSector(x, y) {
    if (this.sectors[y]) {
      return this.sectors[y][x]
    }
  }

  sectorHasLOD(x, y, LOD) {
    if (this.getSector(x, y)) {
      return !!this.getSector(x, y).terrains[LOD]
    }
    return false
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} r
   * @returns {TerrainSector[]}
   */
  getSectorsInRadius(x, y, r) {
    const result = []
    for (let i = y - r; i <= y + r; i++) {
      for (let j = x - r; j <= x + r; j++) {
        const sec = this.getSector(j, i)
        if (sec) {
          result.push(sec)
        }
      }
    }
  }

  /**
   *
   * @param {Vector3} position
   * @returns {Vector2[][]}
   */
  getSectorsToGenerate(position) {
    const result = Array(this.LODcount).fill([])

    const sx = this.posX2sectorX(position.x)
    const sy = this.posY2sectorY(position.z)
    const lods = {}

    // Get sectors in pattern, map them by their LOD
    // https://drive.google.com/file/d/1118l8elXPER_5bsa036GlOvowMLYWuua/view?usp=sharing

    // 1. Draw a circle in 2D object?
    const addPoint = (points, x, y) => {
      if (!points[y]) points[y] = {}
      if (!points[y][x]) points[y][x] = 4
      points[y][x] -= 1
    }
    const populate = (newData, results) => {
      let i, j, lod
      for (let y in newData) {
        if (newData.hasOwnProperty(y)) {
          for (let x in newData) {
            if (newData.hasOwnProperty(x)) {
              i = sx + Math.round(y / 2)
              j = sy + Math.round(x / 2)
              lod = newData[i][j]
              // Must not already be defined in here
              // Must not already exist in sector.mesh.lod
              if (!results[lod] && !this.sectorHasLOD(i, j, lod)) {
                results[lod] = new Vector2(x + sx, y + sy)
              }
            }
          }
        }
      }
    }
    // TODO: maybe use the efact that wee KNOW how many
    //       lod levels we're gonna have `LODcount`
    drawFilledCircle(1, lods, addPoint)
    populate(lods, result)
    drawFilledCircle(2, lods, addPoint)
    populate(lods, result)
    drawFilledCircle(3, lods, addPoint)
    populate(lods, result)
    drawFilledCircle(5, lods, addPoint)
    populate(lods, result)

    return result
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} r
   * @returns {Vector2[]}
   */
  getEmptySpotsInRadius(x, y, r) {
    // FIXME: sort sectors by distance. Closest are more important
    const result = []
    for (let i = y - r; i <= y + r; i++) {
      for (let j = x - r; j <= x + r; j++) {
        const sec = this.getSector(j, i)
        if (!sec) {
          result.push(new Vector2(j, i))
        }
      }
    }
    return result
  }

  posX2sectorX(value) {
    return Math.floor((value - this.halfSizeX) / this.sizeX)
  }
  posY2sectorY(value) {
    return Math.floor((value - this.halfSizeY) / this.sizeY)
  }
}

export { SectorsMap }
