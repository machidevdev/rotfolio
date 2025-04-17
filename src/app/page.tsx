"use client";

import { api } from "~/trpc/react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { Skeleton } from "~/components/ui/skeleton";
import { Twitter } from "lucide-react";

interface CoinWithMarketData {
  uniqueId: string;
  name: string;
  symbol: string;
  image_uri: string;
  twitter: string | null;
  usd_market_cap: number;
  raydium_pool: string | null;
  bestPairAddress?: string;
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

// Helper function for formatting numbers
const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1_000_000) {
    return `${(marketCap / 1_000_000).toFixed(2)}M`;
  } else if (marketCap >= 1_000) {
    return `${(marketCap / 1_000).toFixed(2)}K`;
  }
  return marketCap.toFixed(2);
};

// Helper function for formatting price change
const formatPriceChange = (change: number | undefined): string => {
  if (change === undefined || change === null) return "N/A";
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
};

// Helper function for formatting volume
const formatVolume = (volume: number | undefined): string => {
  if (volume === undefined || volume === null) return "N/A";
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(2)}K`;
  }
  return `$${volume.toFixed(2)}`;
};

// Helper function for podium colors
const getPodiumStyles = (
  position: number,
): { color: string; height: string; translate: string } => {
  switch (position) {
    case 0: // 1st place
      return {
        color: "text-chart-1",
        height: "h-[300px]",
        translate: "translate-y-0",
      };
    case 1: // 2nd place
      return {
        color: "text-chart-2",
        height: "h-[260px]",
        translate: "-translate-y-8",
      };
    case 2: // 3rd place
      return {
        color: "text-chart-3",
        height: "h-[220px]",
        translate: "-translate-y-16",
      };
    default:
      return {
        color: "text-muted-foreground",
        height: "h-auto",
        translate: "",
      };
  }
};

export default function Home() {
  const { data, isLoading } = api.coins.getAll.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Sort coins by market cap in descending order
  const sortedCoins = (data as CoinWithMarketData[] | undefined)?.sort(
    (a, b) => b.usd_market_cap - a.usd_market_cap,
  );
  const highestMarketCap = sortedCoins?.[0]?.usd_market_cap ?? 0;

  // Split into podium and rest
  const podiumCoins = sortedCoins?.slice(0, 3) ?? [];
  const remainingCoins = sortedCoins?.slice(3) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center md:mb-12">
        <h1 className="text-3xl font-bold md:text-4xl">Rotfolio Rankings</h1>
        <p className="text-muted-foreground">Top coins ranked by market cap</p>
        <div className="mx-auto mt-2 flex justify-center">
          <Link
            href="https://x.com/machiuwuowo"
            target="_blank"
            className="hover:text-primary inline-flex items-center"
          >
            <Twitter className="text-muted-foreground h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Podium Section */}
      <div className="mb-8 md:mb-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:px-8">
          {isLoading ? (
            // Skeleton loading state for podium
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="relative">
                  <div className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-4 h-6 w-40" />
                      <Skeleton className="mt-4 h-2 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            podiumCoins.map((coin, index) => {
              const styles = getPodiumStyles(index);
              return (
                <div key={coin.uniqueId}>
                  <Card className="dark group relative flex w-full flex-col overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={coin.image_uri}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Overlay and Blur */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col">
                      <CardHeader className="pt-6 pb-0 text-center">
                        <div className="mx-auto mb-4">
                          <div
                            className={`inline-flex h-12 w-12 items-center justify-center rounded-full md:h-16 md:w-16 ${styles.color} bg-muted/10 text-xl font-bold md:text-2xl`}
                          >
                            #{index + 1}
                          </div>
                        </div>
                        <div className="ring-muted relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full ring-4 md:h-24 md:w-24">
                          <Image
                            src={coin.image_uri}
                            alt={coin.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardTitle className="text-lg md:text-xl">
                          {coin.name}
                        </CardTitle>
                        <CardDescription className="flex items-center justify-center gap-2">
                          {coin.symbol}
                          {coin.twitter && (
                            <a
                              href={`https://twitter.com/${coin.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              @{coin.twitter}
                            </a>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-end p-4 text-center md:p-6">
                        <div className="text-xl font-bold md:text-2xl">
                          ${formatMarketCap(coin.usd_market_cap)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Market Cap
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div
                              className={`font-medium ${
                                coin.priceChange?.h24 !== undefined &&
                                coin.priceChange.h24 >= 0
                                  ? "text-green-500"
                                  : coin.priceChange?.h24 !== undefined
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {formatPriceChange(coin.priceChange?.h24)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              24h
                            </div>
                          </div>
                          <div>
                            <div
                              className={`font-medium ${
                                coin.priceChange?.h1 !== undefined &&
                                coin.priceChange.h1 >= 0
                                  ? "text-green-500"
                                  : coin.priceChange?.h1 !== undefined
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {formatPriceChange(coin.priceChange?.h1)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              1h
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {formatVolume(coin.volume?.h24)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Vol
                            </div>
                          </div>
                        </div>
                        <Progress
                          value={(coin.usd_market_cap / highestMarketCap) * 100}
                          className="mt-4"
                        />
                      </CardContent>
                      <CardFooter className="relative z-50 flex justify-end gap-2 pb-4">
                        <Link
                          target="_blank"
                          className="hover:cursor-pointer"
                          href={
                            "https://t.me/menelaus_trojanbot?start=r-machiuwuowo" +
                            coin.uniqueId
                          }
                        >
                          <Button size="sm">Buy</Button>
                        </Link>
                        <Link
                          target="_blank"
                          href={`https://dexscreener.com/solana/${coin.bestPairAddress ?? coin.raydium_pool}`}
                          className="hover:cursor-pointer"
                        >
                          <Button size="sm">Screener</Button>
                        </Link>
                      </CardFooter>
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Remaining Coins List */}
      <Card>
        <CardHeader>
          <CardTitle>Other Coins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              // Skeleton loading state for remaining coins
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[120px]" />
                          <Skeleton className="h-3 w-[80px]" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-3 w-[60px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              remainingCoins.map((coin, index) => (
                <div
                  key={coin.uniqueId}
                  className="group relative overflow-hidden"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={coin.image_uri}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Overlay and Blur */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
                  </div>

                  {/* Content */}
                  <div className="hover:bg-muted/5 relative z-10 flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground w-8 font-mono text-sm md:w-12">
                        #{index + 4}
                      </span>
                      <div className="ring-muted relative h-8 w-8 overflow-hidden rounded-full ring-2 md:h-10 md:w-10">
                        <Image
                          src={coin.image_uri}
                          alt={coin.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <span>{coin.symbol}</span>
                          {coin.twitter && (
                            <a
                              href={`https://twitter.com/${coin.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              @{coin.twitter}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${formatMarketCap(coin.usd_market_cap)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div
                            className={`font-medium ${
                              coin.priceChange?.h24 !== undefined &&
                              coin.priceChange.h24 >= 0
                                ? "text-green-500"
                                : coin.priceChange?.h24 !== undefined
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {formatPriceChange(coin.priceChange?.h24)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            24h
                          </div>
                        </div>
                        <div>
                          <div
                            className={`font-medium ${
                              coin.priceChange?.h1 !== undefined &&
                              coin.priceChange.h1 >= 0
                                ? "text-green-500"
                                : coin.priceChange?.h1 !== undefined
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {formatPriceChange(coin.priceChange?.h1)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            1h
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatVolume(coin.volume?.h24)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Vol
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <Link
                          target="_blank"
                          className="hover:cursor-pointer"
                          href={
                            "https://t.me/menelaus_trojanbot?start=r-machiuwuowo" +
                            coin.uniqueId
                          }
                        >
                          <Button size="sm" variant="outline">
                            Buy
                          </Button>
                        </Link>
                        <Link
                          target="_blank"
                          href={`https://dexscreener.com/solana/${coin.bestPairAddress ?? coin.raydium_pool}`}
                          className="hover:cursor-pointer"
                        >
                          <Button size="sm" variant="outline">
                            Screener
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
