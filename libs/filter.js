async function filter(arr, str, value) {
  // Sort by object keys/values instead
  if (typeof str === 'object') {
    const obj = str
    const results = []

    for (const item of arr) {

      // All or nothing key/value match
      let itemMatches = false
      for (const key of Object.keys(obj)) {
        if (!item[key]) {
          itemMatches = false
          continue
        }

        if (item[key] === str[key])
          itemMatches = true
        else
          itemMatches = false
      }

      if (itemMatches)
        results.push(item)
    }

    return results
  } else {
    return arr.filter(obj => obj[str] === value)
  }
}

module.exports = filter
