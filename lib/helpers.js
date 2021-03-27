// Modified from: https://cwestblog.com/2011/08/02/javascript-isprimitive-function/
function isPrimitive(arg) {
  const type = typeof arg
  if (arg && type === 'object' && arg.then && typeof arg.then === 'function')
    return false

  return arg == null || (type != "function")
}

export { isPrimitive }
