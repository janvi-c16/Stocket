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

# 1. Fetch historical stock data
def get_data(ticker, period='10y'):
    """
    Robustly fetch historical data for a ticker. Tries multiple yfinance methods and a few
    symbol fallbacks (NSE/BSE) for non-US tickers.

    Raises RuntimeError with a detailed message on failure so the server logs contain useful info.
    """
    try:
        if not ticker or not isinstance(ticker, str):
            raise ValueError("Ticker must be a non-empty string")

        original_ticker = ticker
        ticker = ticker.strip()
        # Normalize common formats
        ticker = ticker.upper()

        def _log(msg):
            # Print to stdout so Render logs capture it
            print(f"[LSTM_prediction] {msg}", flush=True)

        _log(f"Fetching data for ticker: '{original_ticker}' -> normalized: '{ticker}', period={period}")

        # Helper to try a fetch and return df or None
        def try_history(sym, retry_count=3):
            for attempt in range(retry_count):
                try:
                    _log(f"Attempt {attempt+1}/{retry_count}: Trying yf.Ticker('{sym}').history()")
                    
                    # Create ticker with timeout and proxy settings
                    # Disable browser impersonation to fix ImpersonateError
                    import yfinance.scrapers.history
                    yfinance.scrapers.history.ENABLE_CHROME_IMPERSONATE = False
                    
                    stock = yf.Ticker(sym)
                    
                    # Try with different parameters that may work better on Render
                    df_local = stock.history(
                        period=period,
                        timeout=30,  # Longer timeout for slower networks
                        raise_errors=False  # Don't raise on 404s
                    )
                    
                    if df_local is not None and not df_local.empty:
                        _log(f"✓ history() returned {len(df_local)} rows for {sym}")
                        return df_local
                    else:
                        _log(f"✗ history() returned empty dataframe for {sym}")
                        
                except Exception as ex:
                    _log(f"✗ history() for {sym} attempt {attempt+1} raised: {type(ex).__name__}: {str(ex)}")
                    if attempt < retry_count - 1:
                        import time
                        time.sleep(1)  # Brief pause before retry
                        
            return None

        # 1) Try the given symbol
        df = try_history(ticker)

        # 2) If empty and looks like an Indian symbol without suffix, try .NS then .BO
        if df is None and not (ticker.endswith('.NS') or ticker.endswith('.BO')):
            if ticker.startswith('NSE:'):
                sym = ticker[4:]
                df = try_history(sym + '.NS') or try_history(sym + '.BO')
            elif ticker.startswith('BSE:'):
                sym = ticker[4:]
                df = try_history(sym + '.BO') or try_history(sym + '.NS')
            else:
                df = try_history(ticker + '.NS') or try_history(ticker + '.BO')

        # 3) As a fallback try yf.download
        if df is None:
            try:
                _log(f"Falling back to yf.download('{ticker}')")
                
                # Disable browser impersonation
                import yfinance.scrapers.history
                yfinance.scrapers.history.ENABLE_CHROME_IMPERSONATE = False
                
                df2 = yf.download(
                    ticker, 
                    period=period, 
                    progress=False, 
                    threads=False,
                    timeout=30
                )
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
                f"This could be due to: 1) Invalid ticker symbol, 2) Network connectivity issues on the server, "
                f"3) Yahoo Finance blocking requests from this IP, or 4) Rate limiting. "
                f"If this works locally but not on Render, it's likely a network/firewall issue."
            )
            _log(f"FINAL ERROR: {error_msg}")
            raise ValueError(error_msg)

        _log(f"✓ Successfully fetched {len(df)} rows of data for {ticker}")
        return df
        
    except Exception as e:
        # Include original message and re-raise as RuntimeError so the Flask route returns it
        raise RuntimeError(f"Error fetching data: {str(e)}")

# 2. Predict using LSTM model
def LSTM_Model(df):
    """
    Make predictions using the LSTM model
    """
    try:
        print(f"[LSTM_Model] Starting prediction with {len(df)} rows of data", flush=True)
        
        # Use only 'Close' column
        if 'Close' not in df.columns:
            raise ValueError(f"DataFrame missing 'Close' column. Available columns: {list(df.columns)}")
        
        close_prices = df[['Close']]
        dataset = close_prices.values
        
        if len(dataset) < 100:
            raise ValueError(f"Insufficient data: got {len(dataset)} rows, need at least 100 for reliable predictions")

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

        # Load model with better error handling
        # Note: Try both lowercase and uppercase filenames
        possible_model_names = ['lstm_model.keras', 'LSTM_model.keras']
        model_path = None
        
        for model_name in possible_model_names:
            test_path = os.path.join(os.getcwd(), 'utils', 'Saved_Models', model_name)
            if os.path.exists(test_path):
                model_path = test_path
                break
        
        if model_path is None:
            # Try alternative paths
            alternative_paths = [
                'utils/Saved_Models/lstm_model.keras',
                'utils/Saved_Models/LSTM_model.keras',
                'Saved_Models/lstm_model.keras',
                'Saved_Models/LSTM_model.keras',
                '/app/utils/Saved_Models/lstm_model.keras',
                '/app/utils/Saved_Models/LSTM_model.keras',
                './utils/Saved_Models/lstm_model.keras',
                './utils/Saved_Models/LSTM_model.keras'
            ]
            for alt_path in alternative_paths:
                if os.path.exists(alt_path):
                    print(f"[LSTM_Model] Found model at alternative path: {alt_path}", flush=True)
                    model_path = alt_path
                    break
        
        if model_path is None or not os.path.exists(model_path):
            # List what's actually in the directory for debugging
            try:
                print(f"[LSTM_Model] Current working directory: {os.getcwd()}", flush=True)
                utils_path = os.path.join(os.getcwd(), 'utils')
                if os.path.exists(utils_path):
                    print(f"[LSTM_Model] Contents of utils/: {os.listdir(utils_path)}", flush=True)
                    saved_models_path = os.path.join(utils_path, 'Saved_Models')
                    if os.path.exists(saved_models_path):
                        print(f"[LSTM_Model] Contents of Saved_Models/: {os.listdir(saved_models_path)}", flush=True)
            except Exception as e:
                print(f"[LSTM_Model] Error listing directory: {e}", flush=True)
            
            raise FileNotFoundError(f"LSTM model file not found. Tried: {possible_model_names + alternative_paths}")
        
        print(f"[LSTM_Model] Loading model from: {model_path}", flush=True)
        model = load_model(model_path)
        print(f"[LSTM_Model] Model loaded successfully", flush=True)

        # Prepare testing data
        X_test, y_test = [], []
        for i in range(60, len(scaled_total)):
            X_test.append(scaled_total[i-60:i, 0])
            y_test.append(scaled_total[i, 0])
        X_test, y_test = np.array(X_test), np.array(y_test)
        X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

        # Predict
        print(f"[LSTM_Model] Running predictions on {len(X_test)} test samples", flush=True)
        predictions = model.predict(X_test, verbose=0)
        predictions = scaler.inverse_transform(predictions)
        y_test = scaler.inverse_transform(y_test.reshape(-1, 1))

        # Last 30 days prediction comparison
        last_30_true = y_test[-30:].flatten()
        last_30_pred = predictions[-30:].flatten()

        # Predict next day's price
        last_60_days = scaled_total[-60:]
        next_input = last_60_days.reshape(1, 60, 1)
        next_day_scaled = model.predict(next_input, verbose=0)
        next_day_price = scaler.inverse_transform(next_day_scaled)[0][0]
        
        print(f"[LSTM_Model] Prediction complete. Next day price: ${next_day_price:.2f}", flush=True)

        return last_30_true, last_30_pred, next_day_price
        
    except Exception as e:
        print(f"[LSTM_Model] ERROR in prediction: {type(e).__name__}: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Model prediction failed: {str(e)}")

# 3. API Handler
def predict_stock_price_lstm(ticker):
    """
    Main API handler for LSTM stock price prediction
    """
    try:
        print(f"[predict_stock_price_lstm] Request received for ticker: {ticker}", flush=True)
        
        if not ticker:
            return jsonify({'error': 'Ticker is required'}), 400

        # Step 1: Fetch data
        print(f"[predict_stock_price_lstm] Step 1: Fetching data...", flush=True)
        df = get_data(ticker)
        print(f"[predict_stock_price_lstm] Data fetch complete, got {len(df)} rows", flush=True)
        
        # Step 2: Run prediction
        print(f"[predict_stock_price_lstm] Step 2: Running LSTM model...", flush=True)
        last_true, last_pred, next_day_price = LSTM_Model(df)
        print(f"[predict_stock_price_lstm] Prediction complete", flush=True)

        result = {
            "ticker": ticker.upper(),
            "original_prices": last_true.tolist(),
            "predicted_prices": last_pred.tolist(),
            "next_day_prediction": float(round(next_day_price, 3))
        }
        
        print(f"[predict_stock_price_lstm] SUCCESS - Returning prediction for {ticker}", flush=True)
        return jsonify(result)

    except Exception as e:
        error_msg = str(e)
        print(f"[predict_stock_price_lstm] ERROR: {type(e).__name__}: {error_msg}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({'error': error_msg}), 500
