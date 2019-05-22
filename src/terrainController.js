import { Mesh, Vector3, Vector2, Scene, MeshBuilder } from "@babylonjs/core"
import { TerrainSector } from "./sector"
import { SectorsMap } from "./sectorsMap"

class TerrainController {
  /**
   * @type {number}
   */
  viewDistance = 5

  /**
   * @type {number}
   */
  sectorSizeX
  halfSectorSizeX
  /**
   * @type {number}
   */
  sectorSizeY
  halfSectorSizeY

  sectorsMap = new SectorsMap()

  /**
   * @type {Worker[]}
   */
  workers = []

  lastPlayerPosition = Vector3.Zero()

  /**
   *
   * @param {number} sectorSizeX
   * @param {number} sectorSizeY
   * @param {Scene} scene
   */
  constructor(sectorSizeX, sectorSizeY, scene) {
    this.sectorSizeX = sectorSizeX
    this.sectorSizeY = sectorSizeY
    this.halfSectorSizeX = sectorSizeX / 2
    this.halfSectorSizeY = sectorSizeY / 2
    this.scene = scene

    const camElevation = 4.0
    scene.registerBeforeRender(() => {
      // camera.position.y =
      //   terrain.getHeightFromMap(camera.position.x, camera.position.z) +
      //   camElevation
    })

    // TODO: Let multiple workers work in paralel lol
    this.workers = [new Worker("./terrain.worker.js")]

    this.setupWorkers()
    this.sectorsMap
      .getEmptySpotsInRadius(0, 0, this.viewDistance)
      .forEach(vec => this.requestNewSector(vec.x, vec.y))
  }

  setupWorkers() {
    this.workers.forEach(
      worker => (worker.onmessage = e => this.handleWorkerMessage(e))
    )
  }

  /**
   * Fire and forget. Maybe you'll get the terrain, maybe not,
   * maybe you privided invalid data...
   * @param {number} sectorX
   * @param {number} positionY
   */
  requestNewSector(sectorX = 0, sectorY = 0) {
    console.log(` <= requesting new sector [${sectorX}, ${sectorY}]`)

    this.availableWorker.postMessage({
      type: "generateTerrain",
      sizeX: this.sectorSizeX,
      sizeY: this.sectorSizeY,
      sectorX: parseInt(sectorX),
      sectorY: parseInt(sectorY)
    })
  }

  /**
   *
   * @param {Vector3} position
   */
  updatePlayerPosition(position) {
    // Did player run out of previous sector?
    const gotChange = this.didPlayerChangeSector(position)
    if (gotChange) {
      // Remember new position
      this.lastPlayerPosition = position

      // Load up new sectors
    }
  }

  /**
   *
   * @param {Vector3} position
   * @returns {Vector2} or undefined if player is still in the same spot
   */
  didPlayerChangeSector(position) {
    const secX = Math.floor(position.x / this.sectorSizeX)
    const secY = Math.floor(position.y / this.sectorSizeY)

    if (secX !== this.currentSectorX || secY !== this.currentSectorY) {
      return new Vector2(secX - this.currentSectorX, secY - this.currentSectorY)
    }
  }

  handleWorkerMessage(e) {
    console.log(` => Got data [${e.data.mapData.length / 3} points]`, {
      sectorX: e.data.sectorX,
      sectorY: e.data.sectorY
    })

    const ribbonOptions = {
      pathArray: this.parseMapData(e.data.mapData)
    }

    const g = MeshBuilder.CreateRibbon(
      `sector_${e.data.sectorX},${e.data.sectorY}`,
      ribbonOptions,
      this.scene
    )
    g.position.x = e.data.sectorX * this.sectorSizeX
    g.position.z = e.data.sectorY * this.sectorSizeY
    g.setMaterialByID("grid")

    // terrain.mapData = e.data.mapData
    // camera.position.x =
    //   cameraOrigin.x - (preTerrainCamPos.x - camera.position.x)
    // camera.position.z =
    //   cameraOrigin.z - (preTerrainCamPos.z - camera.position.z)
  }

  /**
   *
   * @param {Float32Array} data
   * @returns {Vector3[][]} points in 2d map: sectorSizeX * sectorSizeY
   */
  parseMapData(data) {
    const result = [[]]

    const max = data.length
    let x = 0
    let y = 0
    let index = 0

    let finished = false

    while (!finished) {
      result[y].push(new Vector3(data[index], data[index + 2], data[index + 1]))
      x++
      if (x >= this.sectorSizeX) {
        y++
        if (y >= this.sectorSizeY) {
          finished = true
          break
        }
        result[y] = []
        x = 0
      }
      index = x * 3 + y * 3 * this.sectorSizeY
    }

    return result
  }

  get availableWorker() {
    return this.workers[0]
  }

  // TODO: Memoize
  get currentSectorX() {
    return Math.floor(
      (this.lastPlayerPosition.x - this.halfSectorSizeX) / this.sectorSizeX
    )
  }
  // TODO: Memoize
  get currentSectorY() {
    return Math.floor(
      (this.lastPlayerPosition.y - this.halfSectorSizeY) / this.sectorSizeY
    )
  }
}

export { TerrainController }