/* eslint-disable no-bitwise */
function getHashCode(string) {
  let hash = 0;

  if (string.length === 0) return hash;

  for (let i = 0; i < string.length; i += 1) {
    const char = string.charCodeAt(i);
    hash &= (hash << 5) - hash + char;
  }

  return hash;
}

module.exports = getHashCode;
