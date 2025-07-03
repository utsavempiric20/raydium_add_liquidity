import {
  ApiV3PoolInfoStandardItem,
  TokenAmount,
  toToken,
  Percent,
  AmmV4Keys,
  AmmV5Keys,
  printSimulate,
} from "@raydium-io/raydium-sdk-v2";
import { initSdk, txVersion } from "./raydiumConfig";
import { isValidAmm } from "./utils";
import Decimal from "decimal.js";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export const addLiquidity = async () => {
  const payer = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  const raydium = await initSdk({ owner: payer });

  const poolId = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";
  let poolKeys: AmmV4Keys | AmmV5Keys | undefined;
  let poolInfo: ApiV3PoolInfoStandardItem;

  if (raydium.cluster === "mainnet") {
    const data = await raydium.api.fetchPoolById({ ids: poolId });
    poolInfo = data[0] as ApiV3PoolInfoStandardItem;
  } else {
    const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId });
    poolInfo = data.poolInfo;
    poolKeys = data.poolKeys;
  }

  console.log(poolInfo);
  if (!isValidAmm(poolInfo.programId))
    throw new Error("target pool is not AMM pool");

  const inputAmount = "0.001";

  const r = raydium.liquidity.computePairAmount({
    poolInfo,
    amount: inputAmount,
    baseIn: true,
    slippage: new Percent(1, 100), // 1%
  });

  const { execute, transaction } = await raydium.liquidity.addLiquidity({
    poolInfo,
    poolKeys,
    amountInA: new TokenAmount(
      toToken(poolInfo.mintA),
      new Decimal(inputAmount).mul(10 ** poolInfo.mintA.decimals).toFixed(0)
    ),
    amountInB: new TokenAmount(
      toToken(poolInfo.mintB),
      new Decimal(r.maxAnotherAmount.toExact())
        .mul(10 ** poolInfo.mintB.decimals)
        .toFixed(0)
    ),
    otherAmountMin: r.minAnotherAmount,
    fixedSide: "a",
    txVersion,
  });

  const { txId } = await execute({ sendAndConfirm: true });
  console.log("liquidity added:", {
    txId: `https://explorer.solana.com/tx/${txId}`,
  });
  process.exit();
};

addLiquidity();
