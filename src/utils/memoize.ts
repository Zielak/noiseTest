/**  let cachedFn = memoize(originalFn); */

function memoize() {
  const cache = {
    fn: undefined,
    input: undefined,
    output: undefined
  }

  function memoize(...a) {
    const key = String(a.join("|"))
    if (cache.input === key) {
      return cache.output
    } else {
      cache.input = key
      cache.output = cache.fn.apply(this, a)
      return cache.output
    }
  }

  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    cache.fn = target[propertyKey]
    descriptor.value = memoize
  }
}

export { memoize }
