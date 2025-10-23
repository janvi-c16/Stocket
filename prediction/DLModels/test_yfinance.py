#!/usr/bin/env python3
"""
Quick test script to diagnose yfinance issues
Run this to see what's happening with data fetching
"""
import sys
import yfinance as yf

def test_ticker(ticker):
    print(f"\n{'='*60}")
    print(f"Testing ticker: {ticker}")
    print(f"{'='*60}")
    
    try:
        print(f"\n1. Testing yf.Ticker('{ticker}').history()...")
        stock = yf.Ticker(ticker)
        print(f"   Ticker object created: {stock}")
        
        df = stock.history(period='1mo', timeout=30)
        print(f"   ✓ Success! Got {len(df)} rows")
        print(f"   Columns: {list(df.columns)}")
        if not df.empty:
            print(f"   Latest close: ${df['Close'].iloc[-1]:.2f}")
            print(f"   Date range: {df.index[0]} to {df.index[-1]}")
        return True
        
    except Exception as e:
        print(f"   ✗ Failed: {type(e).__name__}: {str(e)}")
        
    try:
        print(f"\n2. Testing yf.download('{ticker}')...")
        df2 = yf.download(ticker, period='1mo', progress=False)
        print(f"   ✓ Success! Got {len(df2)} rows")
        if not df2.empty:
            print(f"   Latest close: ${df2['Close'].iloc[-1]:.2f}")
        return True
        
    except Exception as e:
        print(f"   ✗ Failed: {type(e).__name__}: {str(e)}")
    
    return False

if __name__ == "__main__":
    tickers_to_test = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
    
    if len(sys.argv) > 1:
        tickers_to_test = sys.argv[1:]
    
    print("yfinance Diagnostic Test")
    print(f"yfinance version: {yf.__version__}")
    
    results = {}
    for ticker in tickers_to_test:
        results[ticker] = test_ticker(ticker)
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for ticker, success in results.items():
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{ticker}: {status}")
