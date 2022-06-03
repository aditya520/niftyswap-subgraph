import { Currency,Token } from './../generated/schema';
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
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  
  // // Entities only exist after they have been saved to the store;
  // // `null` checks allow to create entities on demand
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory == null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.exchangeCount = BigInt.fromI32(0)
    factory.txCount = BigInt.fromI32(0)
    factory.owner = ADDRESS_ZERO
  }

  

  // // BigInt and BigDecimal math are supported
  factory.exchangeCount = factory.exchangeCount.plus(BigInt.fromI32(1))
  factory.txCount = factory.txCount.plus(BigInt.fromI32(1))

  factory.save()

  // Saving currency to the store
  let currency = Currency.load(event.params.currency.toHexString())
  if (currency == null) {
    currency = new Currency(event.params.currency.toHexString())
    let decimals = fetchCurrencyDecimals(event.params.currency)
    if (decimals === null) {
      decimals = BigInt.fromI32(18)
    }
    currency.decimals = decimals
  }
  // Entities can be written to the store with `.save()`
  currency.save()

  // Saving ERC1155 token to the store

  let token = Token.load(event.params.token.toHexString())
  if (token == null) {
    token = new Token(event.params.token.toHexString())
  }
  token.save()

  let exchange = new Exchange(event.params.exchange.toHexString()) as Exchange
  exchange.token = token

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
