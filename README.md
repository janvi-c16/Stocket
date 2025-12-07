# Stocket 
**Stocket** is a sophisticated stock price prediction and analysis platform that combines **machine learning** with **real‑time market data** to help **naive users start their trading journey** confidently. The application leverages **LSTM (Long Short‑Term Memory)** neural networks, among other models, to forecast stock prices based on historical data while providing a **personalized dashboard** for tracking favorite stocks.

---

##  Key Features

- **Authentication System** for secure access  
- **Realtime Stock Ticker Tape** to monitor live trends  
- **Personalized Dashboard** showing preferred stocks and analytics  
- **Search any Stock Ticker** with smart autocomplete suggestions  
- Display of **Open, Close, and High Prices** for searched tickers  
- **Company Details** section for in‑depth stock and firm information  
- **Add/Remove Tickers** in a **Watchlist** for personalized tracking  
- **Pre‑prompted Chatbot** for stock market assistance  
- **Candlestick Chart** visualization for each searched ticker  
- **Description of Stock Prediction Methods** used in the app  
- **Three Prediction Models** for next‑day price forecasting:
  - LSTM (Long Short‑Term Memory)  
  - Random Forest  
  - ARIMA  
- **Learning Section** designed for beginners in stock trading  
- **Sharable & Personalized Profile Page** for users  
- **Support Page** to resolve user queries efficiently  
- **Contact & Feedback Form** connected to **MongoDB** for backend storage  
- **Dark Mode Support** for comfortable viewing  

---

## Machine Learning Models

1. **LSTM (Long Short‑Term Memory):** Captures long‑term dependencies in stock time‑series data for accurate sequential forecasting.  
2. **Random Forest:** Ensemble‑based regression approach providing robust non‑linear pattern recognition.  
3. **ARIMA:** Time‑series statistical model for understanding trends and seasonality in financial data.  

---

## Tech Stack

### **Frontend**
- **React.js** with **TypeScript**  
- **Tailwind CSS** for modern, responsive styling  
- **Shadcn UI** for elegant and reusable components  

### **Backend**
- **Flask (Python)** server for routing and API integration  

### **Database**
- **MongoDB** for user data, feedback, and watchlist management  

### **APIs**
- **yfinance** for fetching real‑time and historical market data  
- **Gemini** for additional market insights  

---

## 🏗️ Architecture
<img width="1024" height="430" alt="image" src="https://github.com/user-attachments/assets/344e2e5c-55e2-427c-a6ac-aa0fa2acecfe" />

---

## 🚀 Installation Guide

### **Server**
```
# Navigate to the server directory
cd server

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
./venv/Scripts/activate
# On macOS/Linux:
source venv/bin/activate

# Install the required packages
pip install -r requirements.txt

# Ensure you have content in .env file (.env.example is provided):
# MONGO_URI=YOUR_MONGO_URI
# CLOUDINARY_CLOUD_NAME=CLOUD_NAME
# CLOUDINARY_API_KEY=API_KEY
# CLOUDINARY_API_SECRET=API_SECRET
# GOOGLE_API_KEY=GEMINI_API_KEY

# Start the server
flask run
# or
python app.py
```
**Server will be running on** `http://localhost:5000`

---

### **Prediction Models**

#### **ML Models**
```
# Navigate to the ML Models directory
cd prediction/MLModels

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
./venv/Scripts/activate
# On macOS/Linux:
source venv/bin/activate

# Install the required packages
pip install -r requirements.txt

# Start the ML Models
flask run
# or
python app.py
```
**ML Models will be running on** `http://localhost:5001`

#### **DL Models**
```
# Navigate to the DL Models directory
cd prediction/DLModels

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
./venv/Scripts/activate
# On macOS/Linux:
source venv/bin/activate

# Install the required packages
pip install -r requirements.txt

# Start the DL Models
flask run
# or
python app.py
```
**DL Models will be running on** `http://localhost:5002`

---

### **Client (Frontend)**
```
# Navigate to the client directory
cd client

# Install the dependencies
npm install

# Start the development server
npm run dev
```
**Client will be running on** `http://localhost:5173`

---

##  Images
<img width="1859" height="898" alt="image" src="https://github.com/user-attachments/assets/5a351715-a04f-4297-9dc6-d3561eae51b1" />
<img width="1861" height="879" alt="image" src="https://github.com/user-attachments/assets/83f2bf29-1a86-490f-b7cd-25ddd2645765" />
<img width="993" height="554" alt="image" src="https://github.com/user-attachments/assets/a7373926-30d7-4f15-8090-853a9ac1511f" />

