from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/api/price-data')
def price_data():
    # 模拟数据，部署时可替换为真实数据抓取
    data = {
        "cepea": 535,
        "fob_santos": 490,
        "ice_no11_cents": 16.30,
        "exchange_rate": 7.2,
        "lastUpdate": datetime.now().strftime("%Y-%m-%d")
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run()
