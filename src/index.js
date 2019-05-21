// import { } from '@babylonjs/core'
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { Vector3, Color3 } from "@babylonjs/core/Maths/math"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight"
import { Mesh } from "@babylonjs/core/Meshes/mesh"

import { GridMaterial } from "@babylonjs/materials/grid"

import DynamicTerrain from "./dynamicTerrain"

const mapSizeX = 500
const mapSizeZ = 500

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import "@babylonjs/core/Meshes/meshBuilder"

const canvas = document.getElementById("renderCanvas")
const engine = new Engine(canvas)
var scene = new Scene(engine)

const cameraOrigin = new Vector3(mapSizeX / 2, 0, mapSizeZ / 2)
const camera = new FreeCamera("camera1", cameraOrigin.clone(), scene)
camera.speed = 1.1

// This targets the camera to scene origin
camera.setTarget(new Vector3(10, 0, 10))
camera.attachControl(canvas, true)

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new HemisphericLight("light1", new Vector3(3, 10, 9), scene)
light.intensity = 0.7
light.specular = new Color3(0.1, 0.3, 0.7)

// Create a grid material
const gridMaterial = new GridMaterial("grid", scene)
gridMaterial.wireframe = true

/**
 * @type {DynamicTerrain}
 */
let terrain
/**
 * @type {Vector3}
 */
let preTerrainCamPos

let traveledX = 0
let traveledZ = 0

let inited = false

const init = initialData => {
  console.log("\tinit")
  const mapOptions = {
    camera,
    mapData: initialData,
    mapSubX: mapSizeX,
    mapSubZ: mapSizeZ,
    terrainSub: 250 // the terrain wil be 100x100 vertices only
  }

  console.log("\tcreating Terrain")
  terrain = new DynamicTerrain("terrain", mapOptions, scene)
  terrain.mesh.material = gridMaterial
  terrain.subToleranceX = 16
  terrain.subToleranceZ = 16
  // terrain.LODLimits = [4, 3, 2, 1, 1]
  terrain.LODLimits = [4, 4, 4, 4, 4]

  const camElevation = 4.0
  scene.registerBeforeRender(() => {
    camera.position.y =
      terrain.getHeightFromMap(camera.position.x, camera.position.z) +
      camElevation
  })
}

const terrainProvider = new Worker("./terrain.worker.js")

terrainProvider.onmessage = e => {
  if (!inited) {
    inited = true
    init(e.data.mapData)
  }

  console.log(" => Got data from terrain worker", {
    baseX: e.data.baseX,
    baseY: e.data.baseY
  })
  terrain.mapData = e.data.mapData
  camera.position.x = cameraOrigin.x - (preTerrainCamPos.x - camera.position.x)
  camera.position.z = cameraOrigin.z - (preTerrainCamPos.z - camera.position.z)

  setTimeout(() => getNewTerrain(), 3000)
}

const getNewTerrain = () => {
  console.log(" <= requesting new terrain...")
  traveledX -= cameraOrigin.x - camera.position.x
  traveledZ -= cameraOrigin.z - camera.position.z
  preTerrainCamPos = camera.position.clone()

  terrainProvider.postMessage({
    type: "generateTerrain",
    sizeX: mapSizeX,
    sizeY: mapSizeZ,
    baseX: traveledX,
    baseY: traveledZ
  })
}
getNewTerrain()

// Render every frame
engine.runRenderLoop(() => {
  scene.render()
})
