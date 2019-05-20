// import { } from '@babylonjs/core'
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { Vector3 } from "@babylonjs/core/Maths/math"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight"
import { Mesh } from "@babylonjs/core/Meshes/mesh"

import { GridMaterial } from "@babylonjs/materials/grid"

import DynamicTerrain from "./dynamicTerrain"

import generateTerrain from "./terrain"
import { project } from "./renderer"

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import "@babylonjs/core/Meshes/meshBuilder"

// Get the canvas element from the DOM.
const canvas = document.getElementById("renderCanvas")

// Associate a Babylon Engine to it.
const engine = new Engine(canvas)

// Create our first scene.
var scene = new Scene(engine)

// This creates and positions a free camera (non-mesh)
var camera = new FreeCamera("camera1", Vector3.Zero(), scene)
camera.speed = 1.1

// This targets the camera to scene origin
camera.setTarget(new Vector3(10, 0, 10))

// This attaches the camera to the canvas
camera.attachControl(canvas, true)

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene)

// Default intensity is 1. Let's dim the light a small amount
light.intensity = 0.7

// Create a grid material
var gridMaterial = new GridMaterial("grid", scene)
gridMaterial.wireframe = true

// Our built-in 'sphere' shape. Params: name, subdivs, size, scene
var sphere = Mesh.CreateSphere("sphere1", 16, 2, scene)

// Move the sphere upward 1/2 its height
sphere.position.y = 2

// Affect a material
sphere.material = gridMaterial

// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
// var ground = Mesh.CreateGround("ground1", 6, 6, 2, scene);

const mapSubX = 500
const mapSubZ = 500
const mapParams = {
  mapData: generateTerrain(mapSubX, mapSubZ),
  mapSubX,
  mapSubZ,
  terrainSub: 500 // the terrain wil be 100x100 vertices only
}

const terrain = new DynamicTerrain("terrain", mapParams, scene)
terrain.mesh.material = gridMaterial
terrain.subToleranceX = 16
terrain.subToleranceZ = 16
terrain.LODLimits = [4, 3, 2, 1, 1]

// Affect a material
// ground.material = material

// Render every frame
engine.runRenderLoop(() => {
  scene.render()
})

const camElevation = 2.0
scene.registerBeforeRender(() => {
  camera.position.y =
    terrain.getHeightFromMap(camera.position.x, camera.position.z) +
    camElevation
})
