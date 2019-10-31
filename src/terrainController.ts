import { Mesh, Vector3, Vector2, Scene, MeshBuilder } from "@babylonjs/core"
import { TerrainSector } from "./sector"
import { SectorsMap } from "./sectorsMap"
import { getStepping } from "./utils/mesh"
import { LoadBalancer } from "./loadBalancer"
import { wrap } from "./utils/numbers"

class TerrainController {
  lastPlayerPosition: Vector3
  LODDistanceModifiers: number[]
  scene: Scene
  sectorsMap: SectorsMap
  terrainWorkers: LoadBalancer

  constructor(options: TerrainControllerOptions, scene: Scene) {
    const {
      sectorSizeX,
      sectorSizeY,
      LODDistanceModifiers,
      initialPlayerPos
    } = options

    this.LODDistanceModifiers = LODDistanceModifiers

    this.scene = scene

    this.sectorsMap = new SectorsMap(
      sectorSizeX,
      sectorSizeY,
      LODDistanceModifiers.length
    )
    this.terrainWorkers = new LoadBalancer(
      [
        new Worker("./terrain.worker.js"),
        new Worker("./terrain.worker.js"),
        new Worker("./terrain.worker.js"),
        new Worker("./terrain.worker.js"),
        new Worker("./terrain.worker.js"),
        new Worker("./terrain.worker.js")
      ],
      e => this.handleWorkerMessage(e)
    )
    this.terrainWorkers.postMessageAll({
      type: "init",
      seed1: "" + Math.random(),
      seed2: "" + Math.random()
    })

    this.lastPlayerPosition = initialPlayerPos
      ? initialPlayerPos.clone()
      : Vector3.Zero()

    this.updateTerrain()
  }

  /**
   * Fire and forget. Maybe you'll get the terrain, maybe not,
   * maybe you privided invalid data...
   * @param {number} sectorX
   * @param {number} positionY
   * @param {number} LOD level of detail for this sector
   */
  requestNewSector(sectorX, sectorY, LOD) {
    console.debug(` <= requesting new sector [${sectorX},${sectorY}_${LOD}]`)

    this.terrainWorkers.postMessage({
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
      .getSectorsToGenerate(
        this.lastPlayerPosition.clone(),
        this.LODDistanceModifiers
      )
      .forEach((lodMap, LOD) =>
        lodMap.forEach(vec => {
          this.requestNewSector(vec.x, vec.y, LOD)
        })
      )
  }

  /**
   *
   * @param {Vector3} position
   * @returns {Vector2} or undefined if player is still in the same spot
   */
  didPlayerChangeSector(position) {
    const secX = this.sectorsMap.posX2sectorX(position.x)
    const secY = this.sectorsMap.posY2sectorY(position.z)

    if (secX !== this.currentSectorX || secY !== this.currentSectorY) {
      return new Vector2(secX - this.currentSectorX, secY - this.currentSectorY)
    }
  }

  handleWorkerMessage(e: MessageEvent) {
    const { uneveneness, sectorX, sectorY, pointValues, LOD } = e.data

    // The more ground is unevenen, the more detail needs to be seen
    const lodBase =
      (this.sectorsMap.halfSizeX + this.sectorsMap.halfSizeY) / 1.5
    const exp = uneveneness + 0.5

    const LODDistances = this.LODDistanceModifiers.map(
      distance => lodBase * (distance * exp)
    )

    const mesh = MeshBuilder.CreateRibbon(
      `sector_${sectorX},${sectorY},LOD${LOD}`,
      {
        sideOrientation: Mesh.BACKSIDE,
        pathArray: this.parseMapData(pointValues, LOD)
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
    console.debug(
      ` => Got data [${sectorX},${sectorY}_${LOD}], ${
        pointValues.length
      } points, uneveneness: ${uneveneness.toFixed(4)}`
    )
  }

  /**
   * @returns {Vector3[][]} points in 2d map: sectorSizeX * sectorSizeY
   */
  parseMapData(data: Float32Array, LOD: number) {
    const result: Array<Array<Vector3>> = [[]]

    const maxX = this.sectorsMap.sizeX / getStepping(LOD) + 1
    const maxY = this.sectorsMap.sizeY / getStepping(LOD) + 1

    for (let y = 0; y < maxY; y++) {
      result[y] = []
      for (let x = 0; x < maxX; x++) {
        result[y].push(
          new Vector3(
            x * getStepping(LOD),
            data[x + y * maxY],
            y * getStepping(LOD)
          )
        )
      }
    }

    return result
  }

  /**
   * Gets terrain height for given world position
   * @param posX
   * @param posZ
   * @returns {number} height or 0 if given position isn't on any sector
   */
  getHeightFromMap(posX, posZ) {
    // console.log("getHeightFromMap CALLED")

    const sector = this.getSectorFromPosition(posX, posZ)

    if (sector) {
      return sector.getHeight(
        wrap(posX, this.sectorsMap.sizeX),
        wrap(posZ, this.sectorsMap.sizeY)
      )
    } else {
      return 0
    }
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
    const pos = new Vector2(this.getSectorX(x), this.getSectorY(z))
    return this.sectorsMap.getSector(pos.x, pos.y)
  }
  getSectorFromVector(vector) {
    return new Vector2(this.getSectorX(vector.x), this.getSectorY(vector.z))
  }
}

export { TerrainController }

export type TerrainControllerOptions = {
  sectorSizeX: number
  sectorSizeY: number
  LODDistanceModifiers: number[]
  initialPlayerPos: Vector3
  viewDistance?: number
}
