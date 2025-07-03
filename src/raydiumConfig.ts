import { Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { clusterApiUrl } from "@solana/web3.js";
import { Keypair, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
dotenv.config();

export const connection = new Connection(
  "https://mainnet.helius-rpc.com/?api-key=88e029e3-9c89-4b1a-a3f1-df636c0c0d44",
  {
    commitment: "confirmed",
  }
);

export const txVersion = TxVersion.V0;
const cluster = "mainnet";

let raydium: Raydium | undefined;
export const initSdk = async (params?: {
  loadToken?: boolean;
  owner?: Keypair;
}) => {
  if (raydium) return raydium;
  if (connection.rpcEndpoint === clusterApiUrl("mainnet-beta"))
    console.warn(
      "using free rpc node might cause unexpected error, strongly suggest uses paid rpc node"
    );
  console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`);
  raydium = await Raydium.load({
    connection,
    cluster,
    owner: params?.owner,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: "finalized",
  });
  console.log(raydium);
  return raydium;
};
