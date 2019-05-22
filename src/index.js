// import { } from '@babylonjs/core'
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { Vector3, Color3 } from "@babylonjs/core/Maths/math"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight"
import { Mesh } from "@babylonjs/core/Meshes/mesh"

import { GridMaterial } from "@babylonjs/materials/grid"

import DynamicTerrain from "./dynamicTerrain"

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import "@babylonjs/core/Meshes/meshBuilder"
import { TerrainController } from "./terrainController"

const canvas = document.getElementById("renderCanvas")
const engine = new Engine(canvas)
var scene = new Scene(engine)

const camera = new FreeCamera("camera1", new Vector3(-200, 20, -200), scene)
camera.speed = 1.1

// This targets the camera to scene origin
camera.setTarget(new Vector3(0, -50, 0))
camera.attachControl(canvas, true)

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new HemisphericLight("light1", new Vector3(3, 10, 9), scene)
light.intensity = 0.7
light.specular = new Color3(0.1, 0.3, 0.7)

// Create a grid material
const gridMaterial = new GridMaterial("grid", scene)
gridMaterial.wireframe = true

const terrainController = new TerrainController(50, 50, scene)

setInterval(() => {
  terrainController.updatePlayerPosition(camera.position.clone())
}, 2000)

// Render every frame
engine.runRenderLoop(() => {
  scene.render()
})
