from flask import jsonify
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime, timedelta
from tensorflow.keras.models import load_model
import yfinance as yf
import os

def get_data(ticker, period='10y'):
    try:
        # Support 'NSE:RELIANCE' or 'BSE:SBIN' as input
        if ticker.upper().startswith('NSE:'):
            ticker = ticker[4:] + '.NS'
        elif ticker.upper().startswith('BSE:'):
            ticker = ticker[4:] + '.BO'
        # If user enters just the symbol for a known Indian stock, try both .NS and .BO
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        if df.empty and not (ticker.endswith('.NS') or ticker.endswith('.BO')):
            # Try NSE then BSE
            df = yf.Ticker(ticker + '.NS').history(period=period)
            if df.empty:
                df = yf.Ticker(ticker + '.BO').history(period=period)
        if df.empty:
            raise ValueError("No data returned from yfinance.")
        return df
    except Exception as e:
        raise RuntimeError(f"Error fetching data: {str(e)}")

# 2. Predict using GRU model

def GRU_Model(df):
    # Use only 'Close' column
    close_prices = df[['Close']]
    dataset = close_prices.values

    # Train/test split (70/30)
    train_size = int(len(dataset) * 0.7)
    train_data = dataset[:train_size]
    test_data = dataset[train_size - 60:]  # include last 60 days for test input

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_train = scaler.fit_transform(train_data)
    scaled_total = scaler.transform(test_data)

    # Prepare training data
    X_train, y_train = [], []
    for i in range(60, len(scaled_train)):
        X_train.append(scaled_train[i-60:i, 0])
        y_train.append(scaled_train[i, 0])
    X_train, y_train = np.array(X_train), np.array(y_train)
    X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)

    # Load model
    model_path = os.path.join(os.getcwd(), 'utils', 'Saved_Models', 'GRU_model.keras')
    model = load_model(model_path)

    # Prepare testing data
    X_test, y_test = [], []
    for i in range(60, len(scaled_total)):
        X_test.append(scaled_total[i-60:i, 0])
        y_test.append(scaled_total[i, 0])
    X_test, y_test = np.array(X_test), np.array(y_test)
    X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

    # Predict
    predictions = model.predict(X_test)
    predictions = scaler.inverse_transform(predictions)
    y_test = scaler.inverse_transform(y_test.reshape(-1, 1))

    # Last 30 days prediction comparison
    last_30_true = y_test[-30:].flatten()
    last_30_pred = predictions[-30:].flatten()

    # Predict next day's price
    last_60_days = scaled_total[-60:]
    next_input = last_60_days.reshape(1, 60, 1)
    next_day_scaled = model.predict(next_input)
    next_day_price = scaler.inverse_transform(next_day_scaled)[0][0]

    return last_30_true, last_30_pred, next_day_price

# 3. API Handler
def predict_stock_price_gru(ticker):
    try:
        if not ticker:
            return jsonify({'error': 'Ticker is required'}), 400

        df = get_data(ticker)
        last_true, last_pred, next_day_price = GRU_Model(df)

        return jsonify({
            "ticker": ticker.upper(),
            "original_prices": last_true.tolist(),
            "predicted_prices": last_pred.tolist(),
            "next_day_prediction": float(round(next_day_price, 3))
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500 