import "./styles.scss"
import { WebVRFreeCamera, StandardMaterial } from "@babylonjs/core"
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { Vector3, Color3 } from "@babylonjs/core/Maths/math"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight"

import { GridMaterial } from "@babylonjs/materials/grid"

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
// import "@babylonjs/core/Meshes/meshBuilder"

// import ReactDOM from "react-dom"
// import React from "react"
// import { Gui } from "./viewComponents/gui"

import { TerrainController } from "./terrainController"
import { applyKeyboardControls } from "./keyboardControls"
import { MinimapSectorProps } from "./viewComponents/minimap"

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement
const engine = new Engine(canvas)
const scene = new Scene(engine)

const camera = new FreeCamera("camera1", new Vector3(75, 20, 75), scene)
camera.speed = 1.5
camera.setTarget(new Vector3(25, 16, 25))
camera.attachControl(canvas, true)

// const vrCamera = new WebVRFreeCamera("cameravr", new Vector3(75, 20, 75), scene)
const vrHelper = scene.createDefaultVRExperience({})
const { webVRCamera } = vrHelper
webVRCamera.position.set(75, 20, 75)

// const initVrButton = document.getElementById("initVR")
// function initVR() {
//   initVrButton.removeEventListener("click", initVR)

//   camera.detachControl(canvas)
//   webVRCamera.attachControl(canvas, true)
// }
// initVrButton.addEventListener("click", initVR)

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
const light = new HemisphericLight("light1", new Vector3(3, 10, 9), scene)
light.intensity = 0.8
light.specular = new Color3(0.1, 0.3, 0.7)

// Create a grid material
// Blue
// const gridMaterial = new GridMaterial("grid0", scene)
// gridMaterial.lineColor = new Color3(0, 1, 1)
const mat1 = new StandardMaterial("grid0", scene)
mat1.diffuseColor = new Color3(0, 1, 1)

// Green
// const gridMaterial1 = new GridMaterial("grid1", scene)
// gridMaterial1.lineColor = new Color3(0, 1, 0)
const mat2 = new StandardMaterial("grid1", scene)
mat2.diffuseColor = new Color3(0, 1, 0)

// Yellow
// const gridMaterial2 = new GridMaterial("grid2", scene)
// gridMaterial2.lineColor = new Color3(1, 1, 0)
const mat3 = new StandardMaterial("grid2", scene)
mat3.diffuseColor = new Color3(1, 1, 0)

// Pink
// const gridMaterial3 = new GridMaterial("grid3", scene)
// gridMaterial3.lineColor = new Color3(1, 0, 1)
const mat4 = new StandardMaterial("grid3", scene)
mat4.diffuseColor = new Color3(1, 0, 1)

const terrainController = new TerrainController(
  {
    sectorSizeX: 200,
    sectorSizeY: 200,
    LODDistanceModifiers: [2, 3, 5, 40],
    initialPlayerPos: webVRCamera.position
  },
  scene
)

window["terrain"] = terrainController
// window["getCurrentSector"] = () =>
//   terrainController.getSectorFromPosition(camera.position.x, camera.position.z)

setInterval(() => {
  console.log("webVRCamera.pos", vrHelper.position.clone())
  terrainController.updatePlayerPosition(webVRCamera.position.clone())
}, 1000)

export const EVENTS = {
  updateCurrentSector: "updateCurrentSector"
}
;(function() {
  // React interface
  // ReactDOM.render(<Gui />, document.getElementById("gui"))
  // setInterval(() => {
  //   const { x, y } = terrainController.getSectorFromVector(position)
  //   const allSectors = []
  //   const sectors = terrainController.sectorsMap.sectors
  //   for (let secColumn in sectors) {
  //     for (let secRow in sectors[secColumn]) {
  //       allSectors.push(sectors[secColumn][secRow])
  //     }
  //   }
  //   const data: EUpdateCurrentSector = {
  //     currentX: x,
  //     currentY: y,
  //     minimap: allSectors.map(el => ({
  //       x: el.x,
  //       y: el.y,
  //       current: el.x === x && el.y === y,
  //       bestLod: el.currentBestLOD,
  //       terrains: el.terrains.length
  //     }))
  //   }
  //   document.dispatchEvent(
  //     new CustomEvent(EVENTS.updateCurrentSector, { detail: data })
  //   )
  // }, 500)
})()

// Render every frame
engine.runRenderLoop(() => {
  scene.render()
})

applyKeyboardControls(scene, camera)

// const camElevation = 2.0
// scene.registerBeforeRender(() => {
//   webVRCamera.position.y =
//     terrainController.getHeightFromMap(
//       webVRCamera.position.x,
//       webVRCamera.position.z
//     ) + camElevation
// })

export interface EUpdateCurrentSector {
  currentX: number
  currentY: number
  minimap: MinimapSectorProps[]
}
