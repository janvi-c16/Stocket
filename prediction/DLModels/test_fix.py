#!/usr/bin/env python3
"""
Test the browser impersonation fix
"""
import sys
sys.path.insert(0, 'utils')

from LSTM_prediction import get_data

print("Testing LSTM get_data with browser impersonation disabled...")
print("=" * 60)

try:
    df = get_data('AAPL', period='1mo')
    print(f"\n✓ SUCCESS! Retrieved {len(df)} rows for AAPL")
    print(f"Latest close price: ${df['Close'].iloc[-1]:.2f}")
    print(f"Date range: {df.index[0]} to {df.index[-1]}")
except Exception as e:
    print(f"\n✗ FAILED: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
