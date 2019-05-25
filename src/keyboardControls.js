import { FreeCamera } from "@babylonjs/core"

/**
 *
 * @param {Scene} scene
 * @param {FreeCamera} camera
 */
export function applyKeyboardControls(scene, camera) {
  camera.keysUp.push(87)
  camera.keysDown.push(83)
  camera.keysLeft.push(65)
  camera.keysRight.push(68)
}
