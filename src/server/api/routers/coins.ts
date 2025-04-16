import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { config } from "~/config";
// Real coin addresses - using real pump.fun addresses


// Special coin address for detailed data

interface CoinData {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
  twitter: string | null;
  telegram: string | null;
  bonding_curve: string;
  associated_bonding_curve: string;
  creator: string;
  created_timestamp: number;
  raydium_pool: string | null;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  website: string | null;
  show_name: boolean;
  king_of_the_hill_timestamp: number | null;
  market_cap: number;
  reply_count: number;
  last_reply: number;
  nsfw: boolean;
  market_id: string | null;
  usd_market_cap: number;
}

const coinResponseSchema = z.object({
  mint: z.string(),
  name: z.string(),
  symbol: z.string(),
  description: z.string(),
  image_uri: z.string(),
  metadata_uri: z.string(),
  twitter: z.string().nullable(),
  telegram: z.string().nullable(),
  bonding_curve: z.string(),
  associated_bonding_curve: z.string(),
  creator: z.string(),
  created_timestamp: z.number(),
  raydium_pool: z.string().nullable(),
  complete: z.boolean(),
  virtual_sol_reserves: z.number(),
  virtual_token_reserves: z.number(),
  total_supply: z.number(),
  website: z.string().nullable(),
  show_name: z.boolean(),
  king_of_the_hill_timestamp: z.number().nullable(),
  market_cap: z.number(),
  reply_count: z.number(),
  last_reply: z.number().nullable(),
  nsfw: z.boolean(),
  market_id: z.string().nullable(),
  usd_market_cap: z.number(),
});

// Available color options
const blueShades = ["bg-blue-400", "bg-blue-500", "bg-blue-600"] as const;

async function fetchCoinData(address: string): Promise<CoinData> {
  const response = await fetch(`https://frontend-api-v3.pump.fun/coins/${address}`);
  const rawData = await response.json() as unknown;
  const data = coinResponseSchema.parse(rawData) as CoinData;
  return data;
}




export const coinsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    try {
      // Fetch regular coins data
      const regularCoinsPromises = config.coinAddresses.map(async (address: string, index) => {
        const data = await fetchCoinData(address);
        const colorIndex = index % blueShades.length;
        const uniqueId = `${data.mint}-${index.toString()}`;
        
        return {
          ...data,
          uniqueId,
          color: blueShades[colorIndex],
          isSpecialData: false
        };
      });
      
      // Fetch the special coin data using the real API
      
      // Combine regular coins with the special coin if available
      const regularCoinsData = await Promise.all(regularCoinsPromises);
      return regularCoinsData;
    } catch (error) {
      console.error("Error fetching coins:", error);
      throw new Error("Failed to fetch coins");
    }
  }),
}); 
  
 