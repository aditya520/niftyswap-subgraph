import { Exchange } from "./../generated/schema";
import {
  LiquidityAdded,
  LiquidityRemoved,
  TokensPurchase,
  CurrencyPurchase,
} from "./../generated/NiftyswapFactory/NiftyswapExchange";
import { Token, TokenMeta } from "../generated/schema";

export function handleLiquidityAdded(event: LiquidityAdded): void {
  let exchange = Exchange.load(event.address.toHexString()) as Exchange;
  if (exchange == null) {
    console.error("Exchange not found: " + event.address.toHexString());
    return;
  }
  let tokenIds = event.params.tokenIds;

  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(exchange.tokenMeta)
      .concat("-")
      .concat(exchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      token = new Token(tokenConId);
    }
    token.tokenAmount = token.tokenAmount.plus(event.params.tokenAmounts[i]);
    token.save();
  }
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  let exchange = Exchange.load(event.address.toHexString()) as Exchange;
  if (exchange == null) {
    console.error("Exchange not found: " + event.address.toHexString());
    return;
  }
  let tokenIds = event.params.tokenIds;

  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(exchange.tokenMeta)
      .concat("-")
      .concat(exchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      console.error("Token not found: " + tokenConId);
      return;
    }
    token.tokenAmount = token.tokenAmount.minus(event.params.tokenAmounts[i]);
    token.save();
  }
}

export function handleTokenPurchase(event: TokensPurchase): void {
    let exchange = Exchange.load(event.address.toHexString()) as Exchange;
  if (exchange == null) {
    console.error("Exchange not found: " + event.address.toHexString());
    return;
  }

  let tokenIds = event.params.tokensBoughtIds;
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(exchange.tokenMeta)
      .concat("-")
      .concat(exchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      console.error("Token not found: " + tokenConId);
      return;
    }
    token.tokenAmount = token.tokenAmount.minus(event.params.tokensBoughtAmounts[i]);
    token.save();
  }
}

export function handleCurrencyPurchase(event: CurrencyPurchase): void {
    let exchange = Exchange.load(event.address.toHexString()) as Exchange;
  if (exchange == null) {
    console.error("Exchange not found: " + event.address.toHexString());
    return;
  }

  let tokenIds = event.params.tokensSoldIds;
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(exchange.tokenMeta)
      .concat("-")
      .concat(exchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      console.error("Token not found: " + tokenConId);
      return;
    }
    token.tokenAmount = token.tokenAmount.plus(event.params.tokensSoldAmounts[i]);
    token.save();
  }
}
