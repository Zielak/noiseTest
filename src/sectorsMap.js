import { TerrainSector } from "./sector"
import { Vector2 } from "@babylonjs/core"

class SectorsMap {
  /**
   * @type {TerrainSector[]}
   */
  sectors
  constructor() {
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
}

export { SectorsMap }
