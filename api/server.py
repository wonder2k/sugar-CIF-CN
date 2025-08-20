from flask import Flask, jsonify
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# 缓存结构
cache = {
    'cepea': None,
    'fob_santos': None,
    'ice_no11_cents': None,
    'last_update': None,
}

CACHE_DURATION = timedelta(hours=24)

def fetch_cepea_price():
    url = 'https://cepea.esalq.usp.br/br/indicadores/precos.aspx'
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        # 解析页面，假设价格出现在第2行第3列<td>
        price_td = soup.select_one('#ctl00_cphContent_IndicadorRSS_GridView tr:nth-child(2) td:nth-child(3)')
        if price_td:
            text = price_td.get_text(strip=True).replace(',', '.')
            return float(text)
    except Exception as e:
        print(f"CEPEA Price fetch error: {e}")
    return None

def fetch_fob_santos_price():
    # 这里用固定示例值，后续可改为真实数据接口或爬取
    return 490.0

def fetch_ice_no11_price():
    # 示例：爬取ICE官网糖期货价格，或调用API，演示用固定值
    return 16.30

@app.route('/api/price-data')
def price_data():
    now = datetime.utcnow()
    if not cache['last_update'] or (now - cache['last_update']) > CACHE_DURATION:
        cepea = fetch_cepea_price()
        if cepea is not None:
            cache['cepea'] = cepea
        cache['fob_santos'] = fetch_fob_santos_price()
        cache['ice_no11_cents'] = fetch_ice_no11_price()
        cache['last_update'] = now
    return jsonify({
        "cepea": cache['cepea'] or 535.0,  # 默认备用值
        "fob_santos": cache['fob_santos'] or 490.0,
        "ice_no11_cents": cache['ice_no11_cents'] or 16.30,
        "lastUpdate": cache['last_update'].strftime('%Y-%m-%d %H:%M:%S') if cache['last_update'] else None
    })

if __name__ == '__main__':
    app.run()
