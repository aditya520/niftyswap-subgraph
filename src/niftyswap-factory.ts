import { Currency, Token, TokenMeta } from './../generated/schema';
import { FACTORY_ADDRESS } from './utils/constants';
import { BigInt } from "@graphprotocol/graph-ts"
import {
  NiftyswapFactory,
  NewExchange,
  OwnershipTransferred
} from "../generated/NiftyswapFactory/NiftyswapFactory"
import { Factory, Exchange } from "../generated/schema"
import { ADDRESS_ZERO } from './utils/constants';
import { fetchCurrencyDecimals } from './utils/currency';

export function handleNewExchange(event: NewExchange): void {
  // Loading the Factory contract
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory == null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.exchangeCount = BigInt.fromI32(0)
    factory.txCount = BigInt.fromI32(0)
    factory.owner = event.transaction.from.toHexString()
  }
  factory.exchangeCount = factory.exchangeCount.plus(BigInt.fromI32(1))
  factory.txCount = factory.txCount.plus(BigInt.fromI32(1))
  factory.save()

  // Saving currency to the store
  let currency = Currency.load(event.params.currency.toHexString())
  if (currency == null) {
    currency = new Currency(event.params.currency.toHexString())
    currency.poolCount = BigInt.fromI32(0)
    let decimals = fetchCurrencyDecimals(event.params.currency)
    if (decimals === null) {
      decimals = BigInt.fromI32(18)
    }
    currency.poolCount = BigInt.fromI32(0)
    currency.decimals = decimals
  }
  currency.poolCount = currency.poolCount.plus(BigInt.fromI32(1))
  currency.save()

  // Saving ERC1155 token to the store
  let tokenMeta = TokenMeta.load(event.params.token.toHexString())
  if (tokenMeta == null) {
    tokenMeta = new TokenMeta(event.params.token.toHexString())
    tokenMeta.tokenIds = []
  }
  tokenMeta.save()

  let exchange = new Exchange(event.params.exchange.toHexString()) as Exchange
  exchange.tokenMeta = tokenMeta.id
  exchange.currency = currency.id
  exchange.createdAtTimestamp = event.block.timestamp
  exchange.createdAtBlockNumber  = event.block.number
  exchange.liquidity = BigInt.fromI32(0)
  exchange.txCount = BigInt.fromI32(0)
  exchange.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory == null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.exchangeCount = BigInt.fromI32(0)
    factory.txCount = BigInt.fromI32(0)
    factory.owner = ADDRESS_ZERO
  }
  factory.txCount = factory.txCount.plus(BigInt.fromI32(1))
  factory.owner = event.params.newOwner.toHex()
  factory.save()
}
