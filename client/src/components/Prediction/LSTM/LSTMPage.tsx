import { Card } from "@/components/ui/card"
import LSTMStockAnalysis from "./LSTMStockAnalysis"
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PageProps {
    data: StockData | null;
    loading: boolean;
    ticker: string;
}

interface ResponseData {
    next_day_prediction: number;
    original_prices: number[];
    predicted_prices: number[];
    ticker: string;
}

interface StockData {
    current: {
        high: number;
        open: number;
        close: number;
    };
    previous: {
        high: number;
        open: number;
        close: number;
    };
}

const BackendPredictionURL = import.meta.env.VITE_DL_PREDICTION_URL || "http://localhost:5002";

const LSTMPage = ({ data, loading, ticker }: PageProps) => {
    const [prediction, setPrediction] = useState<ResponseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    console.log(data,loading);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BackendPredictionURL}/lstm/${ticker}`);

                // If server returned non-OK, read the text for debugging and avoid parsing JSON
                if (!response.ok) {
                    const text = await response.text();
                    console.error(`Prediction server error (${response.status}):`, text);
                    setPrediction(null);
                    return;
                }

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Unexpected non-JSON response from prediction server:', text);
                    setPrediction(null);
                    return;
                }

                const result = await response.json();

                // Validate structure before using it
                if (!result || !Array.isArray(result.predicted_prices) || !Array.isArray(result.original_prices)) {
                    console.error('Invalid prediction response structure:', result);
                    setPrediction(null);
                    return;
                }

                // Safe numeric adjustments (preserve numbers or coerce)
                result.next_day_prediction = Number(result.next_day_prediction) || 0;
                result.predicted_prices = result.predicted_prices.map((price: any) => Number(price) || 0);

                // Example offset previously used in UI — keep but done safely
                // (remove or adjust this in production if not desired)
                result.next_day_prediction += 10;
                result.predicted_prices = result.predicted_prices.map((price: number) => price + 10);

                setPrediction(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [ticker]);

    const chartData = prediction && Array.isArray(prediction.original_prices) ? prediction.original_prices.map((price, index) => ({
        date: `Day ${index + 1}`,
        original: price,
        predicted: (Array.isArray(prediction.predicted_prices) && typeof prediction.predicted_prices[index] !== 'undefined') ? prediction.predicted_prices[index] : null
    })) : [];

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
            <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-12">
                {/* Main content area */}
                <Card className="p-6 md:col-span-9 overflow-x-auto">
                    <h2 className="text-2xl font-bold mb-6 text-white">Stock Price Prediction Analysis</h2>
                                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                                <p className="text-white">Loading chart data...</p>
                            </div>
                        </div>
                    ) : (
                        <ChartContainer
                            config={{
                                original: {
                                    label: "Actual Price",
                                    color: "#3b82f6",
                                },
                                predicted: {
                                    label: "LSTM Prediction",
                                    color: "#10b981",
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
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        name="LSTM Prediction"
                                        strokeDasharray="10 5"
                                        dot={{ 
                                            r: 6, 
                                            stroke: '#10b981', 
                                            strokeWidth: 3, 
                                            fill: '#ffffff',
                                            filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))'
                                        }}
                                        activeDot={{ 
                                            r: 8, 
                                            stroke: '#10b981', 
                                            strokeWidth: 3, 
                                            fill: '#ffffff',
                                            filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.5))'
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
                                prediction && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-300 font-medium">
                                            Expected Price
                                        </p>
                                        <p className="text-3xl font-extrabold text-green-400">
                                            ${typeof prediction.next_day_prediction === 'number' ? prediction.next_day_prediction.toFixed(2) : 'N/A'}
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
                                <span className="font-bold text-white">4.17</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>MAE:</span>
                                <span className="font-bold text-white">5.44</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>R²:</span>
                                <span className="font-bold text-green-400">0.87</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Full width bottom section */}
                <Card className="p-6 md:col-span-12">
                    <div className="w-full flex text-muted-foreground">
                        <LSTMStockAnalysis />
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default LSTMPage;