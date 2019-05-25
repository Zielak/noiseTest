import "./styles.scss"
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { Vector3, Color3 } from "@babylonjs/core/Maths/math"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight"

import { GridMaterial } from "@babylonjs/materials/grid"

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import "@babylonjs/core/Meshes/meshBuilder"
import { TerrainController } from "./terrainController"
import { gui } from "./gui"
import { applyKeyboardControls } from "./keyboardControls"

const canvas = document.getElementById("renderCanvas")
const engine = new Engine(canvas)
var scene = new Scene(engine)

const camera = new FreeCamera("camera1", new Vector3(0, 20, 0), scene)
camera.speed = 3.5
camera.keysDown

// This targets the camera to scene origin
camera.setTarget(new Vector3(-10, 16, -10))
camera.attachControl(canvas, true)

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new HemisphericLight("light1", new Vector3(3, 10, 9), scene)
light.intensity = 0.7
light.specular = new Color3(0.1, 0.3, 0.7)

// Create a grid material
const gridMaterial = new GridMaterial("grid0", scene)
// Blue
gridMaterial.lineColor = new Color3(0, 1, 1)

const gridMaterial1 = new GridMaterial("grid1", scene)
// Green
gridMaterial1.lineColor = new Color3(0, 1, 0)

const gridMaterial2 = new GridMaterial("grid2", scene)
// Yellow
gridMaterial2.lineColor = new Color3(1, 1, 0)

const gridMaterial3 = new GridMaterial("grid3", scene)
// Pink
gridMaterial3.lineColor = new Color3(1, 0, 1)

// gridMaterial.wireframe = true

const terrainController = new TerrainController(
  {
    sectorSizeX: 100,
    sectorSizeY: 100,
    viewDistance: 6,
    LODDistanceModifiers: [2, 4, 8, 32]
  },
  scene
)

setInterval(() => {
  terrainController.updatePlayerPosition(camera.position.clone())
}, 2000)

setInterval(() => {
  const { x, y } = terrainController.getSectorFromVector(camera.position)

  gui.updateCurrentSector(`Sector[${x}, ${y}]`)

  gui.updateMinimap(terrainController.sectorsMap, x, y)
}, 500)

// Render every frame
engine.runRenderLoop(() => {
  scene.render()
})

applyKeyboardControls(scene, camera)

// const camElevation = 2.0
// scene.registerBeforeRender(() => {
//   camera.position.y =
//     terrainController.getHeightFromMap(camera.position.x, camera.position.z) +
//     camElevation
// })
