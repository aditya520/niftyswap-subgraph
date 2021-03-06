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
    log.error("Exchange not found: {}", [event.address.toHexString()]);
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
      token.currencyReserve = BigInt.fromI32(0);
      token.currencyReserve = token.currencyReserve.plus(
        event.params.currencyAmounts[i]
      );
    } else {
      log.error("Liquidity already present: {}", [token.id]);
      let numerator = event.params.tokenAmounts[i].times(
        token.currencyReserve
      ) as BigInt;
      let denominator = token.tokenAmount as BigInt;
      if (denominator.equals(BigInt.fromI32(0))) {
        log.error("Denominator is zero: {}", [token.id]);
        return;
      }
      let reserve = divRound(numerator, denominator);
      token.currencyReserve = token.currencyReserve.plus(reserve);
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
    log.error("Exchange not found: {}", [event.address.toHexString()]);
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
      log.error("Token not found: {}", [tokenConId]);
      return;
    }
    token.tokenAmount = token.tokenAmount.minus(event.params.tokenAmounts[i]);
    token.currencyReserve = token.currencyReserve.minus(
      event.params.currencyAmounts[i]
    );
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
    log.error("Exchange not found: {}", [event.address.toHexString()]);
    return;
  }

  let tokenIds = event.params.tokensBoughtIds;
  for (let i = 0; i < tokenIds.length; i++) {
    log.error("TokenPurchase: {}", [
      event.params.tokensBoughtAmounts[i].toString(),
    ]);
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(exchange.tokenMeta)
      .concat("-")
      .concat(exchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      log.error("Token not found: {}", [tokenConId]);
      return;
    }

    let amountBought = event.params.tokensBoughtAmounts[i] as BigInt;
    let currencyReserve = token.currencyReserve as BigInt;
    let tokenAmount = token.tokenAmount as BigInt;
    let lpFee = exchange.lpFee;

    let numerator = currencyReserve
      .times(amountBought)
      .times(BigInt.fromI32(1000));
    let denominator = tokenAmount
      .minus(amountBought)
      .times(BigInt.fromI32(1000).minus(lpFee));

    if (denominator.equals(BigInt.fromI32(0))) {
      log.error("Denominator is zero: {}", [token.id]);
      return;
    }

    let buyPrice = divRound(numerator, denominator);

    token.tokenAmount = token.tokenAmount.minus(
      event.params.tokensBoughtAmounts[i]
    );

    token.currencyReserve = token.currencyReserve.plus(buyPrice);
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
    log.error("Exchange not found: {}", [event.address.toHexString()]);
    return;
  }

  let tokenIds = event.params.tokensSoldIds;
  for (let i = 0; i < tokenIds.length; i++) {
    log.error("CurrencyPurchase: {}", [
      event.params.tokensSoldAmounts[i].toString(),
    ]);
    let tokenConId = tokenIds[i]
      .toHexString()
      .concat("-")
      .concat(exchange.tokenMeta)
      .concat("-")
      .concat(exchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      log.error("Token not found: {}", [tokenConId]);
      return;
    }

    let amountSold = event.params.tokensSoldAmounts[i] as BigInt;
    let tokenReserve = token.tokenAmount as BigInt;
    let currencyReserve = token.currencyReserve as BigInt;
    let lpFee = exchange.lpFee as BigInt;

    let numerator = currencyReserve
      .times(amountSold)
      .times(BigInt.fromI32(1000).minus(lpFee));
    let denominator = tokenReserve
      .times(BigInt.fromI32(1000))
      .plus(amountSold.times(BigInt.fromI32(1000).minus(lpFee)));

    let sellPrice = numerator.div(denominator);

    token.tokenAmount = token.tokenAmount.plus(
      event.params.tokensSoldAmounts[i]
    );
    token.currencyReserve = token.currencyReserve.minus(sellPrice);
    token.save();
  }
  exchange.txCount = exchange.txCount.plus(BigInt.fromI32(1));
  exchange.save();
}

function divRound(a: BigInt, b: BigInt): BigInt {
  return a.mod(b).equals(BigInt.fromI32(0))
    ? a.div(b)
    : a.div(b).plus(BigInt.fromI32(1));
}
