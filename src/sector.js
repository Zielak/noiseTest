import { Mesh } from "@babylonjs/core"

class TerrainSector {
  /**
   * @param {number} x sectorX position
   * @param {number} y sectorY position
   * @param {Mesh} terrain
   */
  constructor(x, y, terrain) {
    this.x = x
    this.y = y
    this.terrain = terrain
  }
}

export { TerrainSector }
