import { NiftyswapExchange, Token, Currency } from "./../generated/schema";
import { BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD } from './utils/constants'

import {
  LiquidityAdded,
  LiquidityRemoved,
  TokensPurchase,
  CurrencyPurchase,
} from "./../generated/NiftyswapFactory/NiftyswapExchange";

export function handleLiquidityAdded(event: LiquidityAdded): void {
  let niftyswapExchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (niftyswapExchange == null) {
    log.error("Exchange not found: {}", [event.address.toHexString()]);
    return;
  }

  let currency = Currency.load(niftyswapExchange.currency) as Currency;
  if (currency == null) {
    log.error("Currency not found: {}", [niftyswapExchange.currency]);
    return;
  }

  let tokenIds = event.params.tokenIds;
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toString()
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
      let reserve = divRound(numerator, denominator);
      token.currencyReserve = token.currencyReserve.plus(reserve);
    }
    token.tokenAmount = token.tokenAmount.plus(event.params.tokenAmounts[i]);
    // Spot price calculation
    if (
      token.currencyReserve > BigInt.fromI32(0) &&
      token.tokenAmount > BigInt.fromI32(0)
    ) {
      let currencyReserve = token.currencyReserve.toBigDecimal();
      let denominator = bigDecimalExponated(BigDecimal.fromString("10"), currency.decimals);
      let tokenAmount = token.tokenAmount.toBigDecimal();
      token.spotPrice = currencyReserve.div(denominator).div(tokenAmount);
    } else {
      token.spotPrice = BigDecimal.zero();
    }

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

  let currency = Currency.load(niftyswapExchange.currency) as Currency;
  if (currency == null) {
    log.error("Currency not found: {}", [niftyswapExchange.currency]);
    return;
  }

  let tokenIds = event.params.tokenIds;
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenConId = tokenIds[i]
      .toString()
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
      event.params.details[i].currencyAmount
    );
    // Spot price calculation
    if (
      token.currencyReserve > BigInt.fromI32(0) &&
      token.tokenAmount > BigInt.fromI32(0)
    ) {
      let currencyReserve = token.currencyReserve.toBigDecimal();
      let denominator = bigDecimalExponated(BigDecimal.fromString("10"), currency.decimals);
      let tokenAmount = token.tokenAmount.toBigDecimal();
      token.spotPrice = currencyReserve.div(denominator).div(tokenAmount);
    } else {
      token.spotPrice = BigDecimal.zero();
    }
    token.save();
  }
  niftyswapExchange.txCount = niftyswapExchange.txCount.plus(BigInt.fromI32(1));
  niftyswapExchange.save();
}

export function handleTokenPurchase(event: TokensPurchase): void {
  let niftyswapExchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (niftyswapExchange == null) {
    log.error("Exchange not found: {}", [event.address.toHexString()]);
    return;
  }

  let currency = Currency.load(niftyswapExchange.currency) as Currency;
  if (currency == null) {
    log.error("Currency not found: {}", [niftyswapExchange.currency]);
    return;
  }

  let tokenIds = event.params.tokensBoughtIds;
  for (let i = 0; i < tokenIds.length; i++) {
    log.error("TokenPurchase: {}", [
      event.params.tokensBoughtAmounts[i].toString(),
    ]);
    let tokenConId = tokenIds[i]
      .toString()
      .concat("-")
      .concat(niftyswapExchange.tokenMeta)
      .concat("-")
      .concat(niftyswapExchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      log.error("Token not found: {}", [tokenConId]);
      return;
    }

    let amountBought = event.params.tokensBoughtAmounts[i] as BigInt;
    let currencyReserve = token.currencyReserve as BigInt;
    let tokenAmount = token.tokenAmount as BigInt;
    let lpFee = niftyswapExchange.lpFee;

    let numerator = currencyReserve
      .times(amountBought)
      .times(BigInt.fromI32(1000));
    let denominator = tokenAmount
      .minus(amountBought)
      .times(BigInt.fromI32(1000).minus(lpFee));

    let buyPrice = divRound(numerator, denominator);

    token.tokenAmount = token.tokenAmount.minus(
      event.params.tokensBoughtAmounts[i]
    );

    token.currencyReserve = token.currencyReserve.plus(buyPrice);

    // Spot price calculation
    if (
      token.currencyReserve > BigInt.fromI32(0) &&
      token.tokenAmount > BigInt.fromI32(0)
    ) {
      let currencyReserve = token.currencyReserve.toBigDecimal();
      let denominator = bigDecimalExponated(BigDecimal.fromString("10"), currency.decimals);
      let tokenAmount = token.tokenAmount.toBigDecimal();
      token.spotPrice = currencyReserve.div(denominator).div(tokenAmount);
    } else {
      token.spotPrice = BigDecimal.zero();
    }
    token.save();
  }
  niftyswapExchange.txCount = niftyswapExchange.txCount.plus(BigInt.fromI32(1));
  niftyswapExchange.save();
}

export function handleCurrencyPurchase(event: CurrencyPurchase): void {
  let niftyswapExchange = NiftyswapExchange.load(
    event.address.toHexString()
  ) as NiftyswapExchange;
  if (niftyswapExchange == null) {
    log.error("Exchange not found: {}", [event.address.toHexString()]);
    return;
  }

  let currency = Currency.load(niftyswapExchange.currency) as Currency;
  if (currency == null) {
    log.error("Currency not found: {}", [niftyswapExchange.currency]);
    return;
  }

  let tokenIds = event.params.tokensSoldIds;
  for (let i = 0; i < tokenIds.length; i++) {
    log.error("CurrencyPurchase: {}", [
      event.params.tokensSoldAmounts[i].toString(),
    ]);
    let tokenConId = tokenIds[i]
      .toString()
      .concat("-")
      .concat(niftyswapExchange.tokenMeta)
      .concat("-")
      .concat(niftyswapExchange.id);
    let token = Token.load(tokenConId);
    if (token == null) {
      log.error("Token not found: {}", [tokenConId]);
      return;
    }

    let amountSold = event.params.tokensSoldAmounts[i] as BigInt;
    let tokenReserve = token.tokenAmount as BigInt;
    let currencyReserve = token.currencyReserve as BigInt;
    let lpFee = niftyswapExchange.lpFee as BigInt;

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

    // Spot price calculation
    if (
      token.currencyReserve > BigInt.fromI32(0) &&
      token.tokenAmount > BigInt.fromI32(0)
    ) {
      let currencyReserve = token.currencyReserve.toBigDecimal();
      let denominator = bigDecimalExponated(BigDecimal.fromString("10"), currency.decimals);
      let tokenAmount = token.tokenAmount.toBigDecimal();
      token.spotPrice = currencyReserve.div(denominator).div(tokenAmount);
    } else {
      token.spotPrice = BigDecimal.zero();
    }
    token.save();
  }
  niftyswapExchange.txCount = niftyswapExchange.txCount.plus(BigInt.fromI32(1));
  niftyswapExchange.save();
}

function divRound(a: BigInt, b: BigInt): BigInt {
  return a.mod(b).equals(BigInt.fromI32(0))
    ? a.div(b)
    : a.div(b).plus(BigInt.fromI32(1));
}


export function bigDecimalExponated(value: BigDecimal, power: BigInt): BigDecimal {
  if (power.equals(ZERO_BI)) {
    return ONE_BD
  }
  let negativePower = power.lt(ZERO_BI)
  let result = ZERO_BD.plus(value)
  let powerAbs = power.abs()
  for (let i = ONE_BI; i.lt(powerAbs); i = i.plus(ONE_BI)) {
    result = result.times(value)
  }

  if (negativePower) {
    result = safeDiv(ONE_BD, result)
  }

  return result
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD
  } else {
    return amount0.div(amount1)
  }
}