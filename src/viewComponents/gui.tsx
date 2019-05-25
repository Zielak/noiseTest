import "./gui.scss"
import React, { FunctionComponent, useState, useEffect } from "react"
import { EVENTS, EUpdateCurrentSector } from ".."
import { Minimap, MinimapSectorProps } from "./minimap"

export type GuiProps = {}

export const Gui: FunctionComponent<GuiProps> = props => {
  const [sectors, setSectors] = useState<MinimapSectorProps[]>()
  const [currentSectorX, setCurrentSectorX] = useState(0)
  const [currentSectorY, setCurrentSectorY] = useState(0)

  useEffect(() => {
    document.addEventListener(EVENTS.updateCurrentSector, event => {
      const data: EUpdateCurrentSector = event.detail
      setSectors(data.minimap)
      setCurrentSectorX(data.currentX)
      setCurrentSectorY(data.currentY)
    })
  }, [])

  return (
    <div className="gui">
      <div className="gui_wrapper">
        <span className="currentSector">
          Sector[{currentSectorX}, {currentSectorY}]
        </span>
        <Minimap
          currentSectorX={currentSectorX}
          currentSectorY={currentSectorY}
          sectors={sectors}
        />
      </div>
    </div>
  )
}
