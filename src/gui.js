import { SectorsMap } from "./sectorsMap"

const EL = {
  currentSector: document.getElementById("currentSector"),
  minimap: document.getElementById("minimap"),
  minimap_wrapper: document.querySelector(".minimap_wrapper")
}

const updateCurrentSector = value => {
  EL.currentSector.innerText = value
}

/**
 *
 * @param {SectorsMap} sectorsMap
 */
const updateMinimap = (sectorsMap, x, y) => {
  const text = [[], [], [], [], [], [], []]
  EL.minimap_wrapper.innerHTML = ""
  const getSector = (sx, sy, bestLod, terrains) => {
    const el = document.createElement("div")
    el.classList.add("sector")
    if (sx === x && sy === y) {
      el.classList.add("sector--current")
    }
    el.innerHTML = `<div class="sector_position">${x},${y}</div><div class="sector_lod">${bestLod}/${terrains}</div>`
    el.style.top = sy * 50 + "px"
    el.style.left = sx * 50 + "px"
    return el
  }
  sectorsMap
    .getSectorsInRadius(x, y, 3)
    .map(({ x, y, currentBestLOD, terrains }) =>
      getSector(x, y, currentBestLOD, terrains.length)
    )
    .forEach(el => EL.minimap_wrapper.appendChild(el))
}

export const gui = {
  updateCurrentSector,
  updateMinimap
}
