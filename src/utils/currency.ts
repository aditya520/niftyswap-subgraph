import { ERC20 } from './../../generated/NiftyswapFactory/ERC20';
import { BigInt, Address } from '@graphprotocol/graph-ts'


export function fetchCurrencyDecimals(tokenAddress: Address): BigInt {
    let contract = ERC20.bind(tokenAddress)
    // try types uint8 for decimals
    let decimalValue = null
    let decimalResult = contract.try_decimals()

    if (!decimalResult.reverted) {
      decimalValue = decimalResult.value
    }

    return BigInt.fromI32(decimalValue as i32)
  }
  