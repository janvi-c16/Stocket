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

interface PageProps {
    data: any;
    loading: boolean;
    ticker: string;
}

interface ResponseData {
    next_day_prediction: number;
    original_prices: number[];
    predicted_prices: number[];
    ticker: string;
}

const BackendPredictionURL = "http://localhost:5002";

const GRUPage = ({ ticker }: PageProps) => {
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

    let chartData: {date: string, original: number, predicted: number}[] = [];
    if (
        StockData &&
        Array.isArray(StockData.original_prices) &&
        Array.isArray(StockData.predicted_prices) &&
        StockData.original_prices.length === StockData.predicted_prices.length
    ) {
        chartData = StockData.original_prices.map((price, index) => ({
            date: `Day ${index + 1}`,
            original: price,
            predicted: StockData.predicted_prices[index]
        }));
    }

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
            <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-12">
                {/* Main content area */}
                <Card className="p-6 md:col-span-9 overflow-x-auto">
                    <h2 className="text-2xl font-bold mb-6 text-white">Stock Price Prediction Analysis (GRU)</h2>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                                <p className="text-white">Loading chart data...</p>
                            </div>
                        </div>
                    ) : !StockData ? (
                        <div className="flex items-center justify-center h-[400px] w-full">
                            <p>Error loading data. Please try again later.</p>
                        </div>
                    ) : (
                        <ChartContainer
                            config={{
                                original: {
                                    label: "Actual Price",
                                    color: "#3b82f6",
                                },
                                predicted: {
                                    label: "GRU Prediction",
                                    color: "#f59e42",
                                },
                            }}
                            className="h-[450px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid 
                                        strokeDasharray="2 4" 
                                        stroke="#e2e8f0" 
                                        strokeWidth={1}
                                        opacity={0.6}
                                    />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#64748b"
                                        fontSize={12}
                                        fontWeight={500}
                                        tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                    />
                                    <YAxis 
                                        stroke="#64748b"
                                        fontSize={12}
                                        fontWeight={500}
                                        tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                                    />
                                    <ChartTooltip 
                                        content={<ChartTooltipContent 
                                            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
                                            labelFormatter={(label) => `Time: ${label}`}
                                        />} 
                                    />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="line"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="original" 
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        name="Actual Price"
                                        dot={{ 
                                            r: 6, 
                                            stroke: '#3b82f6', 
                                            strokeWidth: 3, 
                                            fill: '#ffffff',
                                            filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                                        }}
                                        activeDot={{ 
                                            r: 8, 
                                            stroke: '#3b82f6', 
                                            strokeWidth: 3, 
                                            fill: '#ffffff',
                                            filter: 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.5))'
                                        }}
                                        strokeDasharray="0"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="predicted" 
                                        stroke="#f59e42"
                                        strokeWidth={4}
                                        name="GRU Prediction"
                                        strokeDasharray="10 5"
                                        dot={{ 
                                            r: 6, 
                                            stroke: '#f59e42', 
                                            strokeWidth: 3, 
                                            fill: '#ffffff',
                                            filter: 'drop-shadow(0 2px 4px rgba(245, 158, 66, 0.3))'
                                        }}
                                        activeDot={{ 
                                            r: 8, 
                                            stroke: '#f59e42', 
                                            strokeWidth: 3, 
                                            fill: '#ffffff',
                                            filter: 'drop-shadow(0 2px 8px rgba(245, 158, 66, 0.5))'
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </Card>
                {/* Right sidebar stack */}
                <div className="grid gap-4 md:gap-6 lg:gap-8 md:col-span-3">
                    <Card className="p-4">
                        <div className="w-full flex flex-col justify-center text-white text-xl font-bold h-full text-left">
                            <h2 className="text-2xl font-extrabold mb-4 text-white">Next Day Prediction</h2>
                            {isLoading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    <p className="text-white">Loading prediction...</p>
                                </div>
                            ) : (
                                StockData && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-300 font-medium">
                                            Expected Price
                                        </p>
                                        <p className="text-3xl font-extrabold text-orange-400">
                                            ${StockData.next_day_prediction.toFixed(2)}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="w-full flex justify-center text-gray-300 flex-col text-sm font-medium h-full text-left space-y-3">
                            <h3 className="text-lg font-bold text-white mb-2">Model Performance</h3>
                            <div className="flex justify-between items-center">
                                <span>Accuracy:</span>
                                <span className="font-bold text-green-600">96.66%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>RMSE:</span>
                                <span className="font-bold text-blue-400">4.17</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>MAE:</span>
                                <span className="font-bold text-blue-400">5.44</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>R-squared:</span>
                                <span className="font-bold text-blue-400">0.87</span>
                            </div>
                        </div>
                    </Card>
                </div>
                {/* Full width bottom section */}
                <Card className="p-6 md:col-span-12">
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
                    <GRUPage data={data} loading={loading} ticker={ticker} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default GRUPage; 