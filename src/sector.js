import { Mesh } from "@babylonjs/core"

class TerrainSector {
  /**
   * @param {number} x sectorX position
   * @param {number} y sectorY position
   * @param {Mesh} terrain
   */
  constructor(x, y, terrain, pointValues) {
    this.x = x
    this.y = y
    this.terrain = terrain
    this.pointValues = pointValues
  }

  getHeight(x, z) {
    const mapData = this.pointValues

    return 0
  }
}

export { TerrainSector }
