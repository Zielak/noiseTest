import { FreeCamera, Scene } from "@babylonjs/core"

export function applyKeyboardControls(scene: Scene, camera: FreeCamera) {
  camera.keysUp.push(87)
  camera.keysDown.push(83)
  camera.keysLeft.push(65)
  camera.keysRight.push(68)
}
