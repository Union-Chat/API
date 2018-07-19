const formatterRegex = /(\{(\d+)\})+/gm;

/**
 * Filters a set based on the given expression
 * @param {Set} set The set to filter the elements of
 * @param {Function} expression The predicate to match against
 * @returns {Array} The filtered elements
 */
function filter (set, expression) {
  const results = [];
  set.forEach(item => expression(item) && results.push(item));
  return results;
}


/**
 * Tries to parse a string into an object, otherwise returns null
 * @param {String} data The string to convert to an object
 */
function safeParse (data) {
  try {
    return JSON.parse(data);
  } catch (exception) {
    return null;
  }
}


/**
 * Gets the number of sessions of the given user ID
 * @param {String} userId The user ID to get the sessions of
 * @param {Set<WebSocket>} clients The clients to filter
 */
function getSessionsOf (userId, clients) {
  const sessions = filter(clients, ws => ws.user && ws.user.id === userId);
  return sessions.length;
}


/**
 * Formats the string with drop-in args
 * @param {String} content The string to format
 * @param {...Object} args The args to format the string with
 */
function formatString (content, ...args) {
  let match;
  while ((match = formatterRegex.exec(content)) !== null) {
    content = content.substring(0, match.index) + args[Number(match[2])].toString() + content.substring(match.index + match[0].length, content.length);
  }
  return content;
}


module.exports = {
  filter,
  safeParse,
  getSessionsOf,
  formatString
};
