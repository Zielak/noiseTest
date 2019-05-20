export function iso(x, y, size) {
  return {
    x: 0.5 * (size + x - y),
    y: 0.5 * (x + y)
  }
}

export function project(flatX, flatY, flatZ, size) {
  var point = iso(flatX, flatY, size)
  var x0 = size * 0.5
  var y0 = size * 0.5
  var z = size * 0.5 - flatZ + point.y * 0.75
  var x = (point.x - size * 0.5) * 6
  var y = (size - point.y) * 0.005 + 1

  return {
    x: x0 + x / y,
    y: y0 + z / y
  }
}
