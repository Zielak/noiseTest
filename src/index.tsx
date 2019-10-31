import "./styles.scss"
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { Vector3, Color3 } from "@babylonjs/core/Maths/math"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight"

import { GridMaterial } from "@babylonjs/materials/grid"

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
// import "@babylonjs/core/Meshes/meshBuilder"

import ReactDOM from "react-dom"
import React from "react"
import { Gui } from "./viewComponents/gui"

import { TerrainController } from "./terrainController"
import { applyKeyboardControls } from "./keyboardControls"
import { MinimapSectorProps } from "./viewComponents/minimap"
import { WebVRFreeCamera } from "@babylonjs/core"

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement
const engine = new Engine(canvas)
const scene = new Scene(engine)

const camera = new FreeCamera("camera1", new Vector3(75, 20, 75), scene)
camera.speed = 1.5
camera.setTarget(new Vector3(25, 16, 25))
camera.attachControl(canvas, true)

const vrCamera = new WebVRFreeCamera("cameravr", new Vector3(75, 20, 75), scene)

const initVrButton = document.getElementById("initVR")
function initVR() {
  initVrButton.removeEventListener("click", initVR)

  camera.detachControl(canvas)
  vrCamera.attachControl(canvas, true)
}
initVrButton.addEventListener("click", initVR)

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
const light = new HemisphericLight("light1", new Vector3(3, 10, 9), scene)
light.intensity = 0.8
light.specular = new Color3(0.1, 0.3, 0.7)

// Create a grid material
const gridMaterial = new GridMaterial("grid0", scene)
// Blue
gridMaterial.lineColor = new Color3(0, 1, 1)
// gridMaterial.wireframe = true

const gridMaterial1 = new GridMaterial("grid1", scene)
// Green
gridMaterial1.lineColor = new Color3(0, 1, 0)
// gridMaterial1.wireframe = true

const gridMaterial2 = new GridMaterial("grid2", scene)
// Yellow
gridMaterial2.lineColor = new Color3(1, 1, 0)
// gridMaterial2.wireframe = true

const gridMaterial3 = new GridMaterial("grid3", scene)
// Pink
gridMaterial3.lineColor = new Color3(1, 0, 1)
// gridMaterial3.wireframe = true

const terrainController = new TerrainController(
  {
    sectorSizeX: 200,
    sectorSizeY: 200,
    LODDistanceModifiers: [3, 4, 6, 40],
    initialPlayerPos: camera.position
  },
  scene
)

window["terrain"] = terrainController
// window["getCurrentSector"] = () =>
//   terrainController.getSectorFromPosition(camera.position.x, camera.position.z)

setInterval(() => {
  terrainController.updatePlayerPosition(camera.position.clone())
}, 1000)

export const EVENTS = {
  updateCurrentSector: "updateCurrentSector"
}

ReactDOM.render(<Gui />, document.getElementById("gui"))

setInterval(() => {
  const { x, y } = terrainController.getSectorFromVector(camera.position)

  const allSectors = []
  const sectors = terrainController.sectorsMap.sectors
  for (let secColumn in sectors) {
    for (let secRow in sectors[secColumn]) {
      allSectors.push(sectors[secColumn][secRow])
    }
  }

  const data: EUpdateCurrentSector = {
    currentX: x,
    currentY: y,
    minimap: allSectors.map(el => ({
      x: el.x,
      y: el.y,
      current: el.x === x && el.y === y,
      bestLod: el.currentBestLOD,
      terrains: el.terrains.length
    }))
  }

  document.dispatchEvent(
    new CustomEvent(EVENTS.updateCurrentSector, { detail: data })
  )
}, 500)

// Render every frame
engine.runRenderLoop(() => {
  scene.render()
})

applyKeyboardControls(scene, camera)

const camElevation = 2.0
scene.registerBeforeRender(() => {
  camera.position.y =
    terrainController.getHeightFromMap(camera.position.x, camera.position.z) +
    camElevation
})

export interface EUpdateCurrentSector {
  currentX: number
  currentY: number
  minimap: MinimapSectorProps[]
}
