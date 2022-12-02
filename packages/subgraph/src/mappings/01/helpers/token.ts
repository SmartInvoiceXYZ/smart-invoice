import { Address } from '@graphprotocol/graph-ts';

import { Token } from '../../../types/schema';
import { ERC20 } from '../../../types/templates/ERC20/ERC20';

export function getToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (token == null) {
    token = new Token(address.toHexString());

    let erc20 = ERC20.bind(address);
    let nameValue = erc20.try_name();
    let symbolValue = erc20.try_symbol();
    let decimalsValue = erc20.try_decimals();

    token.name = nameValue.reverted ? '' : nameValue.value;
    token.symbol = symbolValue.reverted ? '' : symbolValue.value;
    token.decimals = decimalsValue.reverted ? 0 : decimalsValue.value;
  }
  return token as Token;
}
