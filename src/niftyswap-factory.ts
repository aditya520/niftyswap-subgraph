import { FACTORY_ADDRESS } from './utils/constants';
import { BigInt } from "@graphprotocol/graph-ts"
import {
  NiftyswapFactory,
  NewExchange,
  OwnershipTransferred
} from "../generated/NiftyswapFactory/NiftyswapFactory"
import { Factory, Exchange } from "../generated/schema"
import { ADDRESS_ZERO } from './utils/constants';

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

  // Entities can be written to the store with `.save()`
  factory.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // let exchange = new Exchange(event.params.exchange.toHex())
  // exchange.token = event.params.token

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.getOwner(...)
  // - contract.getPairExchanges(...)
  // - contract.tokensToExchange(...)
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
