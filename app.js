const elements = {
  fobSantos: document.getElementById('fob-santos'),
  cepeaPrice: document.getElementById('cepea-price'),
  iceNo11: document.getElementById('ice-no11'),
  freight: document.getElementById('freight'),
  insurance: document.getElementById('insurance'),
  otherCosts: document.getElementById('other-costs'),
  portCost: document.getElementById('port-cost'),
  tariffRate: document.getElementById('tariff-rate'),
  vatRate: document.getElementById('vat-rate'),
  exchangeRate: document.getElementById('exchange-rate'),
  recalcBtn: document.getElementById('recalc-btn'),
  lastUpdate: document.getElementById('last-update'),

  resultFobWeighted: document.getElementById('fob-weighted'),
  resultCifPrice: document.getElementById('cif-price'),
  resultTotalUsd: document.getElementById('total-cost-usd'),
  resultTotalCny: document.getElementById('total-cost-cny'),
  resultDiffCny: document.getElementById('diff-cny'),
  resultDiffPct: document.getElementById('diff-pct'),
  resultSuggestion: document.getElementById('arbitrage-suggestion'),
};

const zceFuturesPrice = 5672; // 郑州商品交易所价格，元/吨

async function fetchPriceData() {
  try {
    const response = await fetch('/api/price-data');
    if (!response.ok) throw new Error('网络错误，无法获取价格数据');
    const data = await response.json();
    elements.lastUpdate.textContent = `最后更新：${data.lastUpdate}`;
    // 接口价格覆盖输入框默认值
    elements.cepeaPrice.value = data.cepea;
    elements.fobSantos.value = data.fob_santos;
    elements.iceNo11.value = data.ice_no11_cents;
    elements.exchangeRate.value = data.exchange_rate;
    recalc();
  } catch (e) {
    console.error(e);
    elements.lastUpdate.textContent = '最后更新：数据获取失败，请稍后刷新';
  }
}

function recalc() {
  // 加权平均FOB价格（美元/吨）
  const iceUsdTon = elements.iceNo11.value * 22.0462;
  const fobWeighted = 
    elements.fobSantos.value * 0.4 +
    elements.cepeaPrice.value * 0.35 +
    iceUsdTon * 0.25;

  const freight = parseFloat(elements.freight.value);
  const insurance = parseFloat(elements.insurance.value);
  const otherCosts = parseFloat(elements.otherCosts.value);
  const portCost = parseFloat(elements.portCost.value);
  const tariffRate = parseFloat(elements.tariffRate.value) / 100;
  const vatRate = parseFloat(elements.vatRate.value) / 100;
  const exchangeRate = parseFloat(elements.exchangeRate.value);

  const cifPrice = fobWeighted + freight + insurance + otherCosts;
  const tariff = cifPrice * tariffRate;
  const preVatTotal = cifPrice + tariff + portCost;
  const vat = preVatTotal * vatRate;
  const totalCostUsd = cifPrice + tariff + portCost + vat;
  const totalCostCny = totalCostUsd * exchangeRate;

  const diffCny = totalCostCny - zceFuturesPrice;
  const diffPct = (diffCny / zceFuturesPrice) * 100;

  let suggestion;
  if (diffPct <= 5) suggestion = "建议进口";
  else if (diffPct <= 10) suggestion = "谨慎进口";
  else suggestion = "不建议进口";

  elements.resultFobWeighted.textContent = fobWeighted.toFixed(2);
  elements.resultCifPrice.textContent = cifPrice.toFixed(2);
  elements.resultTotalUsd.textContent = totalCostUsd.toFixed(2);
  elements.resultTotalCny.textContent = totalCostCny.toFixed(0);
  elements.resultDiffCny.textContent = diffCny.toFixed(0);
  elements.resultDiffPct.textContent = diffPct.toFixed(1);
  elements.resultSuggestion.textContent = suggestion;
}

elements.recalcBtn.addEventListener('click', recalc);

// 页面加载后自动获取价格数据
window.onload = fetchPriceData;
