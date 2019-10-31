import { TerrainSector } from "./sector"
import { Vector2, Vector3 } from "@babylonjs/core"

const drawFilledCircle = (radius, points, addPoint) => {
  for (let y = -radius; y <= radius; y++)
    for (let x = -radius; x <= radius; x++)
      if (x * x + y * y <= radius * radius) addPoint(points, x, y)
  return points
}

class SectorsMap {
  sizeX: number
  sizeY: number
  halfSizeX: number
  halfSizeY: number
  LODcount: number

  sectors: Array<Array<TerrainSector>>

  constructor(sizeX: number, sizeY: number, LODcount: number) {
    this.sizeX = sizeX
    this.sizeY = sizeY
    this.halfSizeX = sizeX / 2
    this.halfSizeY = sizeY / 2
    this.LODcount = LODcount

    this.sectors = []
  }

  addSector(sector: TerrainSector) {
    if (!this.sectors[sector.y]) {
      this.sectors[sector.y] = []
    }
    this.sectors[sector.y][sector.x] = sector
    sector._parent = this
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
    return result
  }

  getSectorsToGenerate(position: Vector3, lodModifiers: number[]) {
    const sx = this.posX2sectorX(position.x)
    const sy = this.posY2sectorY(position.z)

    // Get sectors in pattern, map them by their LOD
    // https://drive.google.com/file/d/1118l8elXPER_5bsa036GlOvowMLYWuua/view?usp=sharing

    const addPoint = (points, x, y) => {
      if (!points[y]) points[y] = {}
      if (!points[y][x]) points[y][x] = 4
      points[y][x] -= 1
    }
    const populate = newData => {
      const result: Array<Array<Vector2>> = Array(this.LODcount)
        .fill(undefined)
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

      // "Scale down" resulted XY map to 2 times smaller circle
      for (let y in newData) {
        if (newData.hasOwnProperty(y)) {
          for (let x in newData[y]) {
            if (newData[y].hasOwnProperty(x)) {
              i = Math.round(parseInt(y) / 2)
              j = Math.round(parseInt(x) / 2)
              if (!newData[i]) continue
              lod = newData[i][j]
              setPoint(i, j, lod)
            }
          }
        }
      }

      /**
       * Parse the 2D map into an array of sectors
       * in arrays of LOD level
       * [
       *    LOD0: [ sector, sector, ... ]
       *    LOD1: [ sector, sector, ... ]
       *    ...
       * ]
       */

      for (let y in targetMap) {
        if (targetMap.hasOwnProperty(y)) {
          for (let x in targetMap[y]) {
            if (targetMap[y].hasOwnProperty(x)) {
              i = sx + parseInt(x)
              j = sy + parseInt(y)
              lod = targetMap[y][x]
              // Must not already be defined in here
              // Must not already exist in sector.mesh.lod
              if (typeof lod !== "number") {
                console.warn("LOD not a number")
                continue
              }
              if (
                result[lod].find(
                  e => e.x === parseInt(x) && e.y === parseInt(y)
                )
              ) {
                console.debug("same sector already exists in result[lod]")
                continue
              }
              if (this.sectorHasLOD(i, j, lod)) {
                console.debug("sector already has the same LOD")
                continue
              }

              result[lod].push(new Vector2(i, j))
            }
          }
        }
      }
      return result
    }

    const lods = {}

    // Draw a circle in 2D object, larger for each higher LOD
    lodModifiers.forEach(mod => {
      drawFilledCircle(Math.floor(mod / 2), lods, addPoint)
    })

    return populate(lods)
  }

  posX2sectorX(value) {
    return Math.round((value - this.halfSizeX) / this.sizeX)
  }
  posY2sectorY(value) {
    return Math.round((value - this.halfSizeY) / this.sizeY)
  }
}

export { SectorsMap }
