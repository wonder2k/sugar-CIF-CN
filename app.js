const elements = {
  fobSlider: document.getElementById('fob-slider'),
  fobInput: document.getElementById('fob-input'),
  iceSlider: document.getElementById('ice-slider'),
  iceInput: document.getElementById('ice-input'),
  cepeaSlider: document.getElementById('cepea-slider'),
  cepeaInput: document.getElementById('cepea-input'),
  freightSlider: document.getElementById('freight-slider'),
  freightInput: document.getElementById('freight-input'),
  exchangeSlider: document.getElementById('exchange-slider'),
  exchangeInput: document.getElementById('exchange-input'),
  tariffSelect: document.getElementById('tariff-select'),
  insuranceSlider: document.getElementById('insurance-slider'),
  insuranceInput: document.getElementById('insurance-input'),
  otherSlider: document.getElementById('other-slider'),
  otherInput: document.getElementById('other-input'),
  portSlider: document.getElementById('port-slider'),
  portInput: document.getElementById('port-input'),

  lastUpdate: document.getElementById('last-update'),

  resultFobWeighted: document.getElementById('fob-weighted'),
  resultCifPrice: document.getElementById('cif-price'),
  resultTotalUsd: document.getElementById('total-cost-usd'),
  resultTotalCny: document.getElementById('total-cost-cny'),
  resultDiffPct: document.getElementById('diff-pct'),
  suggestion: document.getElementById('suggestion'),

  costChartCtx: document.getElementById('cost-chart').getContext('2d')
};

const zcePrice = 5672;

function syncSliderAndInput(slider, input) {
  slider.addEventListener('input', ()=> {
    input.value = slider.value;
    calculateAndRender();
  });
  input.addEventListener('input', () => {
    slider.value = input.value;
    calculateAndRender();
  });
}

function initSync() {
  syncSliderAndInput(elements.fobSlider, elements.fobInput);
  syncSliderAndInput(elements.iceSlider, elements.iceInput);
  syncSliderAndInput(elements.cepeaSlider, elements.cepeaInput);
  syncSliderAndInput(elements.freightSlider, elements.freightInput);
  syncSliderAndInput(elements.exchangeSlider, elements.exchangeInput);
  syncSliderAndInput(elements.insuranceSlider, elements.insuranceInput);
  syncSliderAndInput(elements.otherSlider, elements.otherInput);
  syncSliderAndInput(elements.portSlider, elements.portInput);

  elements.tariffSelect.addEventListener('change', calculateAndRender);
}

function weightedFOB(cepea, fob, ice) {
  const iceUsdTon = ice * 22.0462;
  return fob*0.4 + cepea*0.35 + iceUsdTon*0.25;
}

let chartInstance = null;

function drawChart(data) {
  const labels = ['配额内进口', '配额外进口'];
  const datasets = [
    {label: 'FOB', data: [data.fob, data.fob], backgroundColor:'#61a0a8'},
    {label: '海运', data: [data.freight, data.freight], backgroundColor:'#d48265'},
    {label: '保险费', data: [data.insurance, data.insurance], backgroundColor:'#91c7ae'},
    {label: '其他费用', data: [data.other, data.other], backgroundColor:'#749f83'},
    {label: '港口杂费', data: [data.port, data.port], backgroundColor:'#ca8622'},
    {label: '关税', data: [data.tariffIn, data.tariffOut], backgroundColor:'#bda29a'},
    {label: '增值税', data: [data.vatIn, data.vatOut], backgroundColor:'#6e7074'}
  ];

  if(chartInstance) chartInstance.destroy();

  chartInstance = new Chart(elements.costChartCtx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: { position: 'top' }
      }
    }
  });
}

function calculateAndRender() {
  const cepea = parseFloat(elements.cepeaInput.value);
  const fob = parseFloat(elements.fobInput.value);
  const ice = parseFloat(elements.iceInput.value);
  const freight = parseFloat(elements.freightInput.value);
  const exchange = parseFloat(elements.exchangeInput.value);
  const tariffPerc = parseFloat(elements.tariffSelect.value);
  const insurance = parseFloat(elements.insuranceInput.value);
  const other = parseFloat(elements.otherInput.value);
  const port = parseFloat(elements.portInput.value);

  const fobW = weightedFOB(cepea, fob, ice);
  const cifPrice = fobW + freight + insurance + other;

  const tariffIn = cifPrice * (tariffPerc / 100);
  const tariffOut = cifPrice * 0.5; // 配额外关税固定50%

  const preVatIn = cifPrice + tariffIn + port;
  const preVatOut = cifPrice + tariffOut + port;

  const vatIn = preVatIn * 0.13;
  const vatOut = preVatOut * 0.13;

  const totalUsdIn = preVatIn + vatIn;
  const totalUsdOut = preVatOut + vatOut;

  const totalCnyIn = totalUsdIn * exchange;
  const totalCnyOut = totalUsdOut * exchange;

  const diffPctIn = ((totalCnyIn - zcePrice) / zcePrice) * 100;

  elements.resultFobWeighted.textContent = `$${fobW.toFixed(2)}`;
  elements.resultCifPrice.textContent = `$${cifPrice.toFixed(2)}`;
  elements.resultTotalUsd.textContent = `$${totalUsdIn.toFixed(2)}`;
  elements.resultTotalCny.textContent = `¥${totalCnyIn.toFixed(0)}`;
  elements.resultDiffPct.textContent = `${diffPctIn.toFixed(1)}%`;

  if(diffPctIn <= 5) {
    elements.suggestion.textContent = '可以进口，价差在合理范围内 (+ ' + diffPctIn.toFixed(1) + '%)';
    elements.suggestion.style.color = '#2a9d8f';
  } else if(diffPctIn <= 10) {
    elements.suggestion.textContent = '谨慎进口，价差较大 (+ ' + diffPctIn.toFixed(1) + '%)';
    elements.suggestion.style.color = '#f4a261';
  } else {
    elements.suggestion.textContent = '暂缓进口，价差过大 (+ ' + diffPctIn.toFixed(1) + '%)';
    elements.suggestion.style.color = '#e76f51';
  }

  drawChart({
    fob: fobW,
    freight,
    insurance,
    other,
    port,
    tariffIn,
    tariffOut,
    vatIn,
    vatOut
  });
}

async function fetchLatestData() {
  try {
    const res = await fetch('/api/price-data');
    const data = await res.json();
    elements.lastUpdate.textContent = `最后更新：${data.lastUpdate}`;

    // 更新输入框值
    elements.cepeaInput.value = data.cepea;
    elements.cepeaSlider.value = data.cepea;

    elements.fobInput.value = data.fob_santos;
    elements.fobSlider.value = data.fob_santos;

    elements.iceInput.value = data.ice_no11_cents;
    elements.iceSlider.value = data.ice_no11_cents;

    elements.exchangeInput.value = data.exchange_rate;
    elements.exchangeSlider.value = data.exchange_rate;

    calculateAndRender();
  } catch(err){
    console.error(err);
    elements.lastUpdate.textContent = '最后更新：数据请求失败';
  }
}

function setup() {
  initSync();
  fetchLatestData();
}

function initSync() {
  syncSliderAndInput(elements.fobSlider, elements.fobInput);
  syncSliderAndInput(elements.iceSlider, elements.iceInput);
  syncSliderAndInput(elements.cepeaSlider, elements.cepeaInput);
  syncSliderAndInput(elements.freightSlider, elements.freightInput);
  syncSliderAndInput(elements.exchangeSlider, elements.exchangeInput);
  syncSliderAndInput(elements.insuranceSlider, elements.insuranceInput);
  syncSliderAndInput(elements.otherSlider, elements.otherInput);
  syncSliderAndInput(elements.portSlider, elements.portInput);

  elements.tariffSelect.addEventListener('change', calculateAndRender);
}

function syncSliderAndInput(slider, input) {
  slider.oninput = () => {
    input.value = slider.value;
    calculateAndRender();
  };
  input.oninput = () => {
    slider.value = input.value;
    calculateAndRender();
  };
}

window.onload = setup;
