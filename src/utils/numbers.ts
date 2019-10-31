export const wrap = (val: number, max = 1) => ((val % max) + max) % max
