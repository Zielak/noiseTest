import { Mesh, Vector3, Vector2, Scene, MeshBuilder } from "@babylonjs/core"
import { TerrainSector } from "./sector"
import { SectorsMap } from "./sectorsMap"

class TerrainController {
  /**
   * @param {TerrainControllerOptions} options
   * @param {Scene} scene
   */
  constructor(
    { sectorSizeX, sectorSizeY, LODDistanceModifiers, viewDistance = 2 },
    scene
  ) {
    this.viewDistance = viewDistance
    this.LODDistanceModifiers = LODDistanceModifiers

    this.scene = scene

    this.sectorsMap = new SectorsMap(
      sectorSizeX,
      sectorSizeY,
      LODDistanceModifiers.length
    )
    /**
     * @type {Worker[]}
     */
    this.workers = []

    this.lastPlayerPosition = Vector3.Zero()

    const camElevation = 4.0
    scene.registerBeforeRender(() => {
      // camera.position.y =
      //   terrain.getHeightFromMap(camera.position.x, camera.position.z) +
      //   camElevation
    })

    // TODO: Let multiple workers work in paralel lol
    this.workers = [new Worker("./terrain.worker.js")]

    this.setupWorkers()
    this.updateTerrain()
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
   * @param {number} LOD level of detail for this sector
   */
  requestNewSector(sectorX, sectorY, LOD) {
    console.log(` <= requesting new sector [${sectorX},${sectorY}_${LOD}]`)

    this.availableWorker.postMessage({
      type: "generateTerrain",
      sizeX: this.sectorsMap.sizeX,
      sizeY: this.sectorsMap.sizeY,
      sectorX: parseInt(sectorX),
      sectorY: parseInt(sectorY),
      LOD
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
      this.lastPlayerPosition = position.clone()

      this.updateTerrain()

      // TODO: Decide to ditch out of view sectors
    }
  }

  updateTerrain() {
    // Update existing sectors with new LODs if needed.
    this.sectorsMap
      .getSectorsToGenerate(this.lastPlayerPosition.clone())
      .forEach((lodMap, LOD) =>
        lodMap.forEach(vec => {
          this.requestNewSector(vec.x, vec.y, LOD)
        })
      )

    // Fetch new sectors, which we haven't seen before
    // this.sectorsMap
    //   .getEmptySpotsInRadius(
    //     this.currentSectorX,
    //     this.currentSectorY,
    //     this.viewDistance
    //   )
    //   .forEach(vec => this.requestNewSector(vec.x, vec.y))
  }

  /**
   *
   * @param {Vector3} position
   * @returns {Vector2} or undefined if player is still in the same spot
   */
  didPlayerChangeSector(position) {
    const secX = Math.floor(
      (position.x - this.sectorsMap.halfSizeX) / this.sectorsMap.sizeX
    )
    const secY = Math.floor(
      (position.z - this.sectorsMap.halfSizeY) / this.sectorsMap.sizeY
    )

    if (secX !== this.currentSectorX || secY !== this.currentSectorY) {
      return new Vector2(secX - this.currentSectorX, secY - this.currentSectorY)
    }
  }

  handleWorkerMessage(e) {
    const { uneveneness, sectorX, sectorY, pointValues, LOD } = e.data
    // const LODSteps = [1, 2, 4, 10]

    // The more ground is unevenen, the more detail needs to be seen
    const lodBase =
      (this.sectorsMap.halfSizeX + this.sectorsMap.halfSizeY) / 1.5
    const exp = uneveneness + 1

    const LODDistances = this.LODDistanceModifiers.map(
      distance => lodBase * (distance * exp)
    )

    const mesh = MeshBuilder.CreateRibbon(
      `sector_${sectorX},${sectorY},LOD${LOD}`,
      {
        sideOrientation: Mesh.BACKSIDE,
        pathArray: this.parseMapData(pointValues)
      },
      this.scene
    )
    mesh.position.x = sectorX * this.sectorsMap.sizeX
    mesh.position.z = sectorY * this.sectorsMap.sizeY
    mesh.setMaterialByID("grid" + LOD)

    const sector = this.sectorsMap.getSector(sectorX, sectorY)
    if (!sector) {
      // Add new one
      const newSector = new TerrainSector(sectorX, sectorY)
      newSector.setMeshLODAtDistance(LOD, mesh, LODDistances[LOD])
      this.sectorsMap.addSector(newSector)
    } else {
      // Update existing with new mesh data
      sector.setMeshLODAtDistance(LOD, mesh, LODDistances[LOD])
    }
    console.log(
      ` => Got data [${sectorX},${sectorY}_${LOD}] uneveneness: ${uneveneness.toFixed(
        4
      )}`
    )
  }

  /**
   *
   * @param {Float32Array} data
   * @param {number} step how many points should I omit? Useful for building meshes with lower LOD
   * @returns {Vector3[][]} points in 2d map: sectorSizeX * sectorSizeY
   */
  parseMapData(data, step = 1) {
    step = Math.max(1, step)
    const result = [[]]

    const maxX = this.sectorsMap.sizeX + 1
    const maxY = this.sectorsMap.sizeY + 1
    let x = 0
    let y = 0
    let index = 0

    let finished = false

    while (!finished) {
      result[y / step].push(new Vector3(x, data[index], y))
      x += step
      if (x >= maxX) {
        y += step
        if (y >= maxY) {
          finished = true
          break
        }
        result[y / step] = []
        x = 0
      }
      index = x + y * (this.sectorsMap.sizeY + 1)
    }

    return result
  }

  // FIXME: yup
  getHeightFromMap(posX, posZ) {
    const sectorPlz = this.getSectorFromPosition(posX, posZ)
    return this.sectorsMap
      .getSector(sectorPlz.x, sectorPlz.y)
      .getHeight(posX, posZ)
  }

  get availableWorker() {
    return this.workers[0]
  }

  // TODO: Memoize
  get currentSectorX() {
    return this.sectorsMap.posX2sectorX(this.lastPlayerPosition.x)
  }
  // TODO: Memoize
  get currentSectorY() {
    return this.sectorsMap.posY2sectorY(this.lastPlayerPosition.z)
  }

  getSectorX(value) {
    return this.sectorsMap.posX2sectorX(value)
  }

  getSectorY(value) {
    return this.sectorsMap.posY2sectorY(value)
  }

  getSectorFromPosition(x, z) {
    return new Vector2(this.getSectorX(x), this.getSectorY(z))
  }
  getSectorFromVector(vector) {
    return new Vector2(this.getSectorX(vector.x), this.getSectorY(vector.z))
  }
}

export { TerrainController }

/**
 * @typedef {Object} TerrainControllerOptions
 * @property {number} sectorSizeX
 * @property {number} sectorSizeY
 * @property {number[]} LODDistanceModifiers
 * @property {number=} viewDistance
 */
