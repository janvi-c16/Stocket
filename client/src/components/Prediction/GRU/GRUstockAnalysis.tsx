import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  import { Card } from "@/components/ui/card"
  import { CodeFileDisplay } from "@/components/CodeFileDisplay/CodeFileDisplay"
  
  const GRUStockAnalysis = () => {
    return (
      <Card className="w-full border-none">
        <h2 className="text-2xl font-bold mb-4">Stock Price Prediction Workflow (GRU)</h2>
        <CodeFileDisplay
          filename="GRU"
          file="https://colab.research.google.com/drive/1Y_PlG_XV769705qb7MdsfLThfTLXPPll?usp=sharing"
        />
        <p className="text-sm mt-5">A comprehensive workflow for analyzing and predicting stock prices using a GRU model.</p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>1. Download Stock Data</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto dark:bg-zinc-900">
                <code className="text-sm">
                  {`import yfinance as yf\n\n# Download stock data\nticker = 'AAPL'\ndata = yf.download(ticker, start='2010-01-01', end='2024-01-01')`}
                </code>
              </pre>
              <ul className="list-disc pl-6 mt-4">
                <li><strong>Purpose:</strong> Fetch historical stock data for training and testing the model.</li>
                <li><strong>Library:</strong> <code>yfinance</code>.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
  
          <AccordionItem value="item-2">
            <AccordionTrigger>2. Preprocess Data</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto dark:bg-zinc-900">
                <code className="text-sm">
                  {`from sklearn.preprocessing import MinMaxScaler\n\n# Scale the data\nscaler = MinMaxScaler(feature_range=(0, 1))\nscaled_data = scaler.fit_transform(data[['Close']].values)`}
                </code>
              </pre>
              <ul className="list-disc pl-6 mt-4">
                <li><strong>Purpose:</strong> Normalize the 'Close' prices to a 0-1 range for better GRU performance.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
  
          <AccordionItem value="item-3">
            <AccordionTrigger>3. Create Training and Testing Datasets</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto dark:bg-zinc-900">
                <code className="text-sm">
                  {`# Split data into training and testing\ntrain_size = int(len(scaled_data) * 0.8)\ntrain_data = scaled_data[:train_size]\ntest_data = scaled_data[train_size:]\n\n# Define a function to create sequences\ndef create_dataset(data, time_step=60):\n    X, y = [], []\n    for i in range(len(data) - time_step - 1):\n        X.append(data[i:(i + time_step), 0])\n        y.append(data[i + time_step, 0])\n    return np.array(X), np.array(y)\n\n# Create sequences for training and testing\ntime_step = 60\nX_train, y_train = create_dataset(train_data, time_step)\nX_test, y_test = create_dataset(test_data, time_step)\n\n# Reshape data for GRU input\nX_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)\nX_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)`}
                </code>
              </pre>
              <ul className="list-disc pl-6 mt-4">
                <li><strong>Purpose:</strong> Create sequences of data for GRU training and reshape for the input format.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
  
          <AccordionItem value="item-4">
            <AccordionTrigger>4. Build and Train GRU Model</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto dark:bg-zinc-900">
                <code className="text-sm">
                  {`from keras.models import Sequential\nfrom keras.layers import GRU, Dense, Dropout\n\n# Build the GRU model\nmodel = Sequential([\n    GRU(50, return_sequences=True, input_shape=(X_train.shape[1], 1)),\n    Dropout(0.2),\n    GRU(50, return_sequences=False),\n    Dropout(0.2),\n    Dense(25),\n    Dense(1)\n])\n\n# Compile the model\nmodel.compile(optimizer='adam', loss='mean_squared_error')\n\n# Train the model\nfrom keras.callbacks import EarlyStopping\nearly_stopping = EarlyStopping(monitor='val_loss', patience=10)\nmodel.fit(X_train, y_train, epochs=100, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stopping])`}
                </code>
              </pre>
              <ul className="list-disc pl-6 mt-4">
                <li><strong>Purpose:</strong> Build and train a GRU model for predicting stock prices.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
  
          <AccordionItem value="item-5">
            <AccordionTrigger>5. Evaluate the Model</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto dark:bg-zinc-900">
                <code className="text-sm">
                  {`# Make predictions and inverse transform\npredictions = model.predict(X_test)\npredictions = scaler.inverse_transform(predictions)\n\n# Inverse transform the test labels\ny_test = scaler.inverse_transform(y_test.reshape(-1, 1))\n\n# Calculate RMSE\nrmse = np.sqrt(np.mean((predictions - y_test) ** 2))\nprint(f'RMSE: {rmse}')`}
                </code>
              </pre>
              <ul className="list-disc pl-6 mt-4">
                <li><strong>Purpose:</strong> Evaluate the trained model's performance using RMSE.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
  
          <AccordionItem value="item-6">
            <AccordionTrigger>6. Plot Predictions</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto dark:bg-zinc-900">
                <code className="text-sm">
                  {`import matplotlib.pyplot as plt\n\n# Plot the actual and predicted prices\nplt.figure(figsize=(16, 8))\nplt.title('Stock Price Prediction')\nplt.xlabel('Date')\nplt.ylabel('Close Price USD')\nplt.plot(data[:train_size]['Close'], label='Training Data')\nvalid = data[train_size:train_size + len(predictions)].copy()\nvalid['Close'] = predictions.flatten()\nplt.plot(valid['Close'], label='Predictions')\nplt.legend()\nplt.show()`}
                </code>
              </pre>
              <ul className="list-disc pl-6 mt-4">
                <li><strong>Purpose:</strong> Visualize the predictions compared to actual stock prices.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    )
  }
  
  export default GRUStockAnalysis 