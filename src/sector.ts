import { Mesh } from "@babylonjs/core"

class TerrainSector {
  x: number
  y: number
  terrains: TerrainData[]

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

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
        this.terrains.forEach(({ mesh }) => data.mesh.removeLODLevel(mesh))
      }
    })
    // 2. Apply all known LODmeshes to the best mesh only
    let first = true
    this.terrains.forEach(data => {
      if (first) {
        first = false
        return
      }
      if (!data) return
      this.bestTerrainMesh.addLODLevel(data.distance, data.mesh)
    })
  }

  getHeight(x, z) {
    // const mapData = this.pointValues

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

export type TerrainData = {
  mesh: Mesh
  distance: number
}
