const tokenData = require('./tokenData.json');
// console.log("TokenData:", tokenData.rinkeby)

// let tokenData;

// fetch("https://ipfs.infura.io/ipfs/bafybeiaixojwq6jcf2blsnj2mlb7cicduvm3g5glumuhchmnsyhiipiily/rinkeby%20copy.json")
// .then(response => response.json())
// .then(data => tokenData = data);

console.log('Raw Token Data:', tokenData);

function getTokensToNetworks(object) {
  let tokenObject = {};

  for (const [key, value] of Object.entries(object)) {
    let tokenDetails = {};

    for (const { tokenContract, decimals, symbol } of Object.values(value)) {
      tokenDetails[tokenContract.toLowerCase()] = {
        decimals: decimals,
        symbol: symbol,
      };
    }
    tokenObject[key] = tokenDetails;
  }

  return tokenObject;
}

const networkTokens = getTokensToNetworks(tokenData);
console.log('network token output:', networkTokens);
