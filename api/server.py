from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/api/price-data')
def price_data():
    # 这里为模拟数据，实际可接入爬虫或第三方API抓取
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
