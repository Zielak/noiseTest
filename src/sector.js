import { Mesh } from "@babylonjs/core"

class TerrainSector {
  /**
   * @param {number} x sectorX position
   * @param {number} y sectorY position
   * @param {Mesh} terrain
   */
  constructor(x, y) {
    this.x = x
    this.y = y

    /**
     * @type {TerrainData[]}
     */
    this.terrains = []
  }

  /**
   *
   * @param {number} LOD
   * @param {Mesh} mesh
   * @param {number} distance
   */
  setMeshLODAtDistance(LOD, mesh, distance) {
    if (this.terrains[LOD]) {
      console.warn(`setMeshLODAtDistance(), sector already has LOD ${LOD}`)
    }
    const currBestLOD = this.currentBestLOD
    this.terrains[LOD] = { mesh, distance }
    if (LOD < currBestLOD) {
      this.reapplyLODMeshes()
    } else {
      this.bestTerrainMesh.addLODLevel(distance, mesh)
    }
  }

  reapplyLODMeshes() {
    this.terrains.forEach(data => {
      // 1. remove LOD meshes from every other mesh
      if (data.mesh.hasLODLevels) {
        this.terrains.forEach(({ meshLOD }) =>
          data.mesh.removeLODLevel(meshLOD)
        )
      }
    })
    // 2. Apply all known LODmeshes to the best mesh only
    let first = true
    for (let { mesh, distance } of this.terrains) {
      if (first) {
        first = false
        continue
      }
      this.bestTerrainMesh.addLODLevel(distance, mesh)
    }
  }

  getHeight(x, z) {
    const mapData = this.pointValues

    return 0
  }

  get bestTerrainMesh() {
    return this.terrains[this.currentBestLOD].mesh
  }

  get currentBestLOD() {
    for (let i in this.terrains) {
      return parseInt(i)
    }
    return Infinity
  }
}

export { TerrainSector }

/**
 * @typedef {Object} TerrainData
 * @property {Mesh} mesh
 * @property {number} LODdistance
 */
