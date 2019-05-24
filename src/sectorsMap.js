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
    const sx = this.posX2sectorX(position.x)
    const sy = this.posY2sectorY(position.z)

    // Get sectors in pattern, map them by their LOD
    // https://drive.google.com/file/d/1118l8elXPER_5bsa036GlOvowMLYWuua/view?usp=sharing

    // 1. Draw a circle in 2D object?
    const addPoint = (points, x, y) => {
      if (!points[y]) points[y] = {}
      if (!points[y][x]) points[y][x] = 4
      points[y][x] -= 1
    }
    const populate = newData => {
      const result = Array(this.LODcount)
        .fill()
        .map(_ => [])
      let i, j, lod

      const targetMap = {}

      const setPoint = (x, y, v) => {
        if (typeof v !== "number") return
        if (!targetMap[y]) targetMap[y] = {}
        if (v < targetMap[y][x]) {
          debugger
        }
        if (typeof targetMap[y][x] !== "number" || v < targetMap[y][x]) {
          targetMap[y][x] = v
        }
      }

      for (let y in newData) {
        if (newData.hasOwnProperty(y)) {
          for (let x in newData[y]) {
            if (newData[y].hasOwnProperty(x)) {
              i = sx + Math.round(y / 2)
              j = sy + Math.round(x / 2)
              if (!newData[i]) continue
              lod = newData[i][j]
              setPoint(i, j, lod)
            }
          }
        }
      }

      for (let y in targetMap) {
        if (targetMap.hasOwnProperty(y)) {
          for (let x in targetMap[y]) {
            if (targetMap[y].hasOwnProperty(x)) {
              i = sx + parseInt(x)
              j = sy + parseInt(y)
              lod = targetMap[y][x]
              // Must not already be defined in here
              // Must not already exist in sector.mesh.lod
              if (
                typeof lod === "number" &&
                !result[lod].find(e => e.x !== i && e.y !== j) &&
                !this.sectorHasLOD(i, j, lod)
              ) {
                result[lod].push(new Vector2(i, j))
              }
            }
          }
        }
      }
      return result
    }

    const lods = {}
    // TODO: maybe use the fact that we KNOW how many
    //       lod levels we're gonna have `LODcount`
    drawFilledCircle(5, lods, addPoint)
    drawFilledCircle(3, lods, addPoint)
    drawFilledCircle(2, lods, addPoint)
    drawFilledCircle(1, lods, addPoint)

    return populate(lods)
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
