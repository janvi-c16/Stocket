import { AppSidebar } from "@/components/Sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import GRUStockAnalysis from "./GRUstockAnalysis";
import AppHeader from "@/components/Sidebar/app-header";
import { useCallback, useState, useEffect } from "react";
import { fetchStockData } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ResponseData {
    next_day_prediction: number;
    original_prices: number[];
    predicted_prices: number[];
    ticker: string;
}

const BackendPredictionURL = "http://localhost:5002";

const GRUPageComponent = ({ ticker }: { ticker: string }) => {
    const [StockData, setStockData] = useState<ResponseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BackendPredictionURL}/gru/${ticker}`);
                const result = await response.json();
                setStockData(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [ticker]);

    const chartData = StockData ? StockData.original_prices.map((price, index) => ({
        date: `Day ${index + 1}`,
        original: price,
        predicted: StockData.predicted_prices[index]
    })) : [];

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
            <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-4">
                {/* Main content area */}
                <Card className="p-4 md:col-span-3 flex flex-col justify-center items-center min-h-[480px]">
                    <h2 className="text-2xl font-bold mb-4 w-full text-center">GRU Prediction Chart</h2>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px] w-full">
                            <p>Loading chart data...</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center w-full h-full min-h-[400px]">
                            <ChartContainer
                                config={{
                                    original: {
                                        label: "Original Price",
                                        color: "hsl(var(--chart-1))",
                                    },
                                    predicted: {
                                        label: "Predicted Price",
                                        color: "hsl(var(--chart-2))",
                                    },
                                }}
                                className="h-[400px] w-full"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 24, right: 24, left: 8, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="original"
                                            stroke="var(--color-original)"
                                            name="Original Price"
                                            strokeWidth={3}
                                            dot={{
                                                r: 6,
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                                fill: "var(--color-original)",
                                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                                            }}
                                            activeDot={{
                                                r: 8,
                                                stroke: "#fff",
                                                strokeWidth: 3,
                                                fill: "var(--color-original)",
                                                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.18))"
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="predicted"
                                            stroke="var(--color-predicted)"
                                            name="Predicted Price"
                                            strokeWidth={3}
                                            strokeDasharray="6 3"
                                            dot={{
                                                r: 6,
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                                fill: "var(--color-predicted)",
                                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                                            }}
                                            activeDot={{
                                                r: 8,
                                                stroke: "#fff",
                                                strokeWidth: 3,
                                                fill: "var(--color-predicted)",
                                                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.18))"
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    )}
                </Card>
                {/* Right sidebar stack */}
                <div className="grid gap-8 md:gap-10 lg:gap-12 md:col-span-1">
                    <Card className="p-4 flex flex-col justify-center items-center min-h-[100px]">
                        <div className="w-full flex flex-col justify-center text-muted-foreground">
                            <h2 className="mb-2">Prediction</h2>
                            {isLoading ? (
                                <p>Loading prediction...</p>
                            ) : (
                                StockData && (
                                    <p>
                                        Predicted price: {" "}
                                        <span className="text-lg font-bold">
                                            ${StockData.next_day_prediction.toFixed(2)}
                                        </span>
                                    </p>
                                )
                            )}
                        </div>
                    </Card>
                    <Card className="p-4 flex flex-col justify-center items-center min-h-[100px]">
                        <div className="w-full flex justify-center text-muted-foreground flex-col">
                            <p>Accuracy: 96.66%</p>
                            <p>Root Mean Squared Error: 4.17</p>
                            <p>Mean Absolute Error: 5.44</p>
                            <p>R-squared: 0.87</p>
                        </div>
                    </Card>
                </div>

                {/* Full width bottom section */}
                <Card className="p-6 md:col-span-4">
                    <div className="w-full flex text-muted-foreground">
                        <GRUStockAnalysis />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const GRU = () => {
    const [ticker, setTicker] = useState("GOOGL");
    const [inputTicker, setInputTicker] = useState("GOOGL");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (searchTicker: string) => {
        setLoading(true);
        try {
            const result = await fetchStockData(searchTicker);
            setData(result);
        } catch (error) {
            console.error("Error fetching stock data:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData(ticker);
    }, [fetchData, ticker]);
    
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AppHeader
                    ticker={ticker}
                    setTicker={setTicker}
                    setInputTicker={setInputTicker}
                    inputTicker={inputTicker}
                    fetchData={fetchData}
                    isLoading={loading}
                />
                <div className="flex-1 overflow-y-auto pt-16">
                    <GRUPageComponent ticker={ticker} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default GRU; 