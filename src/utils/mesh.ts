// FIXME: is that enough? How about different size?
export const getStepping = (LOD, size?) => {
  switch (LOD) {
    case 0:
      return 1
    case 1:
      return 2
    case 2:
      return 8
    case 3:
      return 20
    default:
      20
  }
}
