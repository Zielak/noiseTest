import "./minimap.scss"
import React, {
  FunctionComponent,
  CSSProperties,
  useState,
  useEffect
} from "react"

const sectorTileSize = 52

export type MinimapProps = {
  sectors: MinimapSectorProps[]
  currentSectorX: number
  currentSectorY: number
}

export const Minimap: FunctionComponent<MinimapProps> = props => {
  const [hidden, setHidden] = useState(false)

  const handleHideClick = () => setHidden(!hidden)

  const style: CSSProperties = {
    left: -props.currentSectorX * sectorTileSize + "px",
    top: -props.currentSectorY * sectorTileSize + "px"
  }
  return (
    <div className={`minimap${hidden ? " minimap--hidden" : ""}`}>
      <button
        type="button"
        className="minimap_hideButton"
        onClick={handleHideClick}
      >
        minimap {hidden ? "+" : "x"}
      </button>
      <div className="minimap_wrapper" style={style}>
        {props.sectors &&
          props.sectors.map(props => (
            <MinimapSector key={`${props.x}_${props.y}`} {...props} />
          ))}
      </div>
    </div>
  )
}

export type MinimapSectorProps = {
  x: number
  y: number
  bestLod: number
  terrains: number
  current: boolean
}

const MinimapSector: FunctionComponent<MinimapSectorProps> = props => {
  const style: CSSProperties = {
    top: props.y * sectorTileSize + "px",
    left: props.x * sectorTileSize + "px"
  }
  return (
    <div
      className={`sector${props.current ? " sector--current" : ""}`}
      style={style}
    >
      <div className="sector_position">
        {props.x},{props.y}
      </div>
      <div className={`sector_lod sector_lod--best${props.bestLod}`}>
        {props.bestLod}/{props.terrains}
      </div>
    </div>
  )
}
