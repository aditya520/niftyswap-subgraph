import { NiftyswapExchange } from "./../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  LiquidityAdded,
  LiquidityRemoved,
  TokensPurchase,
  CurrencyPurchase,
} from "./../generated/NiftyswapFactory/NiftyswapExchange";
import { Token } from "../generated/schema";

export function handleLiquidityAdded(event: LiquidityAdded): void {
  let niftyswapExchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (niftyswapExchange == null) {
    log.error("Exchange not found: ", [event.address.toHexString()]);
    return;
  }
  let tokenIds = event.params.tokenIds;
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(niftyswapExchange.tokenMeta)
      .concat("-")
      .concat(niftyswapExchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      token = new Token(tokenConId);
      token.tokenAmount = BigInt.fromI32(0);
    }
    token.tokenAmount = token.tokenAmount.plus(event.params.tokenAmounts[i]);
    token.save();
  }
  niftyswapExchange.txCount = niftyswapExchange.txCount.plus(BigInt.fromI32(1));
  niftyswapExchange.save();
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  let niftyswapExchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (niftyswapExchange == null) {
    log.error("Exchange not found: ", [event.address.toHexString()]);
    return;
  }
  let tokenIds = event.params.tokenIds;
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(niftyswapExchange.tokenMeta)
      .concat("-")
      .concat(niftyswapExchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      log.error("Token not found: ", [tokenConId]);
      return;
    }
    token.tokenAmount = token.tokenAmount.minus(event.params.tokenAmounts[i]);
    token.save();
  }
  niftyswapExchange.txCount = niftyswapExchange.txCount.plus(BigInt.fromI32(1));
  niftyswapExchange.save();
}

export function handleTokenPurchase(event: TokensPurchase): void {
  let exchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (exchange == null) {
    log.error("Exchange not found: ", [event.address.toHexString()]);
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
      log.error("Token not found: ", [tokenConId]);
      return;
    }
    token.tokenAmount = token.tokenAmount.minus(
      event.params.tokensBoughtAmounts[i]
    );
    token.save();
  }
  exchange.txCount = exchange.txCount.plus(BigInt.fromI32(1));
  exchange.save();
}

export function handleCurrencyPurchase(event: CurrencyPurchase): void {
  let exchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (exchange == null) {
    log.error("Exchange not found: ", [event.address.toHexString()]);
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
      log.error("Token not found: ", [tokenConId]);
      return;
    }
    token.tokenAmount = token.tokenAmount.plus(
      event.params.tokensSoldAmounts[i]
    );
    token.save();
  }
  exchange.txCount = exchange.txCount.plus(BigInt.fromI32(1));
  exchange.save();
}
