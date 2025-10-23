from flask import jsonify
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime, timedelta
from tensorflow.keras.models import load_model
import yfinance as yf
import os

# Disable browser impersonation globally to fix ImpersonateError on Render
try:
    import yfinance.scrapers.history
    yfinance.scrapers.history.ENABLE_CHROME_IMPERSONATE = False
except (ImportError, AttributeError):
    pass  # Older version of yfinance may not have this

def get_data(ticker, period='10y'):
    """
    Robust get_data similar to LSTM util; try multiple yfinance methods and fallbacks.
    """
    try:
        if not ticker or not isinstance(ticker, str):
            raise ValueError("Ticker must be a non-empty string")

        original_ticker = ticker
        ticker = ticker.strip().upper()

        def _log(msg):
            print(f"[GRU_prediction] {msg}", flush=True)

        _log(f"Fetching data for ticker: '{original_ticker}' -> '{ticker}'")

        def try_history(sym, retry_count=3):
            for attempt in range(retry_count):
                try:
                    _log(f"Attempt {attempt+1}/{retry_count}: Trying yf.Ticker('{sym}').history()")
                    
                    # Disable browser impersonation to fix ImpersonateError
                    import yfinance.scrapers.history
                    yfinance.scrapers.history.ENABLE_CHROME_IMPERSONATE = False
                    
                    stock = yf.Ticker(sym)
                    df_local = stock.history(
                        period=period,
                        timeout=30,
                        raise_errors=False
                    )
                    if df_local is not None and not df_local.empty:
                        _log(f"✓ history() returned {len(df_local)} rows for {sym}")
                        return df_local
                    else:
                        _log(f"✗ history() returned empty for {sym}")
                except Exception as ex:
                    _log(f"✗ history() for {sym} attempt {attempt+1} raised: {type(ex).__name__}: {str(ex)}")
                    if attempt < retry_count - 1:
                        import time
                        time.sleep(1)
            return None

        df = try_history(ticker)
        if df is None and not (ticker.endswith('.NS') or ticker.endswith('.BO')):
            if ticker.startswith('NSE:'):
                sym = ticker[4:]
                df = try_history(sym + '.NS') or try_history(sym + '.BO')
            elif ticker.startswith('BSE:'):
                sym = ticker[4:]
                df = try_history(sym + '.BO') or try_history(sym + '.NS')
            else:
                df = try_history(ticker + '.NS') or try_history(ticker + '.BO')

        if df is None:
            try:
                _log(f"Falling back to yf.download('{ticker}')")
                
                # Disable browser impersonation
                import yfinance.scrapers.history
                yfinance.scrapers.history.ENABLE_CHROME_IMPERSONATE = False
                
                df2 = yf.download(ticker, period=period, progress=False, threads=False, timeout=30)
                if df2 is not None and not df2.empty:
                    _log(f"✓ yf.download returned {len(df2)} rows for {ticker}")
                    df = df2
                else:
                    _log(f"✗ yf.download returned empty for {ticker}")
            except Exception as ex:
                _log(f"✗ yf.download for {ticker} raised: {type(ex).__name__}: {str(ex)}")

        if df is None or df.empty:
            error_msg = (
                f"No data returned from yfinance for '{original_ticker}' (normalized '{ticker}'). "
                f"This could be due to: 1) Invalid ticker symbol, 2) Network connectivity issues, "
                f"3) Yahoo Finance blocking requests from this IP, or 4) Rate limiting. "
                f"If this works locally but not on Render, it's likely a network/firewall issue."
            )
            _log(f"FINAL ERROR: {error_msg}")
            raise ValueError(error_msg)

        _log(f"✓ Successfully fetched {len(df)} rows of data for {ticker}")
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