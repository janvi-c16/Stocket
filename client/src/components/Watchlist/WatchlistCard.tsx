import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleMinus } from 'lucide-react';
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ||"http://localhost:5000";

interface WatchlistResponse {
  success: boolean;
  watchlist: string[];
  message?: string;
}

interface StockWidgetCardProps {
  ticker: string;
  username: string;
  onRemove: (ticker: string) => void;
}

const StockWidgetCard = ({ ticker, username, onRemove }: StockWidgetCardProps) => {
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetContainerRef.current) return;
    widgetContainerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbol": "NASDAQ:${ticker}",
        "width": "100%",
        "height": "100%",
        "locale": "en",
        "dateRange": "1M",
        "colorTheme": "dark",
        "isTransparent": true,
        "autosize": true,
        "largeChartUrl": ""
      }
    `;
    widgetContainerRef.current.appendChild(script);
  }, [ticker]);

  const handleRemoveClick = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/watchlist/remove/${username}/${ticker}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to remove ticker from watchlist");
      }
      else{
        toast.success(`Removed ${ticker} from watchlist`);
      }

      // Call the parent handler to update state
      onRemove(ticker);
    } catch (err) {
      console.error("Error removing ticker:", err);
    }
  };

  return (
    <Card className="p-0 shadow-lg rounded-xl bg-background border border-accent min-w-[340px] md:min-w-[400px] h-[260px] md:h-[300px] max-w-full w-full">
      <CardContent className="relative p-0 h-full">
        {/* TradingView Widget */}
        <div
          className="tradingview-widget-container w-full aspect-[16/9] rounded-t-xl overflow-hidden"
          ref={widgetContainerRef}
        ></div>
        {/* Minus Button */}
        <button
          onClick={handleRemoveClick}
          aria-label={`Remove ${ticker} from watchlist`}
          className="absolute top-2 right-2 bg-background/80 text-muted-foreground rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-10 shadow"
        >
          <CircleMinus />
        </button>
      </CardContent>
    </Card>
  );
};

const WatchlistCard = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const username = localStorage.getItem("predicthub_username") || "";

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!username) {
        setError("Please login to view watchlist");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/watchlist/${username}`);
        const data: WatchlistResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch watchlist");
        }

        if (data.success) {
          setWatchlist(data.watchlist);
        }
      } catch (err) {
        setError("Failed to fetch watchlist");
        console.error("Error fetching watchlist:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [username]);

  const handleRemoveTicker = (ticker: string) => {
    setWatchlist((prev) => prev.filter((item) => item !== ticker));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full p-4 overflow-x-auto">
      <div className="flex flex-row flex-wrap gap-8 whitespace-nowrap">
        {watchlist.length === 0 ? (
          <h2 className="text-muted-foreground text-center flex items-center justify-center w-full h-full">No stocks in watchlist</h2>
        ) : (
          watchlist.map((ticker) => (
            <div key={ticker} className="flex-shrink-0">
              <StockWidgetCard
                ticker={ticker}
                username={username}
                onRemove={handleRemoveTicker}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WatchlistCard;
