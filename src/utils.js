/**
 * Filters a set based on the given expression
 * @param {Set} set The set to filter the elements of
 * @param {Function} expression The predicate to match against
 * @returns {Array} The filtered elements
 */
export function filter (set, expression) {
  const results = []
  set.forEach(item => expression(item) && results.push(item))
  return results
}

/**
 * Filters the given set by the given predicate and returns the first match, if any.
 * @param {Set} set The set to filter the elements of
 * @param {Function} expression The predicate to match elements against
 * @returns {any|Null} The first match, if any
 */
export function findFirst (set, expression) {
  return filter(set, expression)[0]
}

/**
 * Gets the first websocket client with the given user ID
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to filter
 * @param {String} userId The userId to find
 * @returns {Array<WebSocket>} The matching clients
 */
export function getClientsById (clients, userId) {
  return filter(clients, ws => ws.isAuthenticated && ws.user.id === userId)
}

/**
 * De-duplicates an array by converting it to a set and back
 * @param {Array<*>} array The array to deduplicate
 * @param {*} append Elements to append to the array before deduplicating
 * @returns {Array<*>} The deduplicated array
 */
export function deduplicate (array, ...append) {
  array.push(...append)
  const arraySet = new Set(array)
  return [...arraySet.values()]
}

/**
 * Removes an element from an array
 * @param {Array<*>} array The array to remove the item from
 * @param {*} item The item to remove
 */
export function remove (array, item) {
  const ind = array.indexOf(item)

  if (ind > -1) {
    array.splice(ind, 1)
  }
}

/**
 * Gets the number of sessions of the given user ID
 * @param {String} userId The user ID to get the sessions of
 * @param {Set<WebSocket>} clients The clients to filter
 */
export function getSessionsOf (userId, clients) {
  return filter(clients, ws => ws.user && ws.user.id === userId).length
}
