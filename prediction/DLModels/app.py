from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.LSTM_prediction import predict_stock_price_lstm
from utils.GRU_prediction import predict_stock_price_gru

app = Flask(__name__)

CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["http://localhost:5173","https://stocketai.vercel.app"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/')
def home():
    return "Welcome to DL Predictions!"
 
@app.route('/lstm/<ticker>', methods=['GET'])
def lstm(ticker):
    try:
        return predict_stock_price_lstm(ticker)
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.status_code = 500
        return response

# BiLSTM route - commented out until BiLSTM_prediction module is implemented
# @app.route('/bilstm/<ticker>', methods=["GET"])
# def bilstm(ticker):
#     return predict_stock_price_bilstm(ticker)

@app.route('/gru/<ticker>', methods=['GET'])
def gru(ticker):
    try:
        return predict_stock_price_gru(ticker)
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.status_code = 500
        return response

if __name__ == '__main__':
    app.run(debug=True, port=5002)