import { Exchange } from "./../generated/schema";
import { LiquidityAdded } from "./../generated/NiftyswapFactory/NiftyswapExchange";
import { Token, TokenMeta } from "../generated/schema";

export function handleLiquidityAdded(event: LiquidityAdded): void {
  let exchange = Exchange.load(event.address.toHexString()) as Exchange;
  if (exchange == null) {
    return;
  }
  console.log("LiquidityAdded: " + exchange.id);
  
//   let tokenIds = event.params.tokenIds;
//   tokenIds.forEach((tokenId) => {
//     token = Token.load(tokenId.toHexString());
//     if (token == null) {
//       token = new Token(tokenId.toHexString());
//       if (exchange != null) {
//         tokenMeta = TokenMeta.load(exchange.tokenMeta) as TokenMeta;
//         if (tokenMeta == null) {
//           return;
//         }
//         if (tokenMeta != null) {
//           tokenMeta.tokenIds.push(token.id);
//           tokenMeta.save();
//         }
//       }
//       token.save();
//       exchange.save();
//     }
//   });
  
}
