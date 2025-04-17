import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { config } from "~/config";
// Real coin addresses - using real pump.fun addresses


// Special coin address for detailed data

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  priceUsd: string;
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  volume?: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
}

const dexScreenerPairSchema = z.object({
  chainId: z.string(),
  dexId: z.string(),
  pairAddress: z.string(),
  priceUsd: z.string(),
  priceChange: z.object({
    m5: z.number().optional(),
    h1: z.number().optional(),
    h6: z.number().optional(),
    h24: z.number().optional(),
  }).optional(),
  volume: z.object({
    h24: z.number(),
    h6: z.number(),
    h1: z.number(),
    m5: z.number(),
  }).optional(),
});

interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

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
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  volume?: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  bestPairAddress?: string;
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
      const regularCoinsPromises = config.coinAddresses.map(async (address: string, index) => {
        const data = await fetchCoinData(address);
        let marketData = undefined;
        let bestPairAddress = undefined;
        
        try {
          const secondFetch = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${data.mint}`);
          const rawSecondData = await secondFetch.json() as unknown;
          
          // Parse and validate the response
          if (Array.isArray(rawSecondData)) {
            const validPairs = rawSecondData
              .map(pair => {
                try {
                  return dexScreenerPairSchema.parse(pair);
                } catch (e) {
                  console.error('Failed to parse pair:', e);
                  return null;
                }
              })
              .filter((pair): pair is DexScreenerPair => pair !== null);

            // Find the pair with highest volume in last 24h
            if (validPairs.length > 0) {
              const sortedPairs = validPairs.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
              const bestPair = sortedPairs[0];
              
              if (bestPair) {
                marketData = {
                  priceChange: bestPair.priceChange ?? {},
                  volume: bestPair.volume ?? {
                    h24: 0,
                    h6: 0,
                    h1: 0,
                    m5: 0
                  }
                };
                bestPairAddress = bestPair.pairAddress;
                console.log('Processed market data:', JSON.stringify(marketData, null, 2));
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching DEX data for ${data.name}:`, error);
        }
        
        const finalData = {
          ...data,
          ...marketData,
          bestPairAddress,
          uniqueId: `${address}-${index}`,
          color: blueShades[index % blueShades.length],
          isSpecialData: false
        };
        return finalData;
      });
      
      const regularCoinsData = await Promise.all(regularCoinsPromises);
      return regularCoinsData;
    } catch (error) {
      console.error("Error fetching coins:", error);
      throw new Error("Failed to fetch coins");
    }
  }),
}); 
  
 