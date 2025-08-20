const el = {
  fobSlider: document.getElementById('fobSlider'),
  fobInput: document.getElementById('fobInput'),
  iceSlider: document.getElementById('iceSlider'),
  iceInput: document.getElementById('iceInput'),
  cepeaSlider: document.getElementById('cepeaSlider'),
  cepeaInput: document.getElementById('cepeaInput'),
  freightSlider: document.getElementById('freightSlider'),
  freightInput: document.getElementById('freightInput'),
  exchangeSlider: document.getElementById('exchangeSlider'),
  exchangeInput: document.getElementById('exchangeInput'),
  tariffSelect: document.getElementById('tariffSelect'),
  insuranceSlider: document.getElementById('insuranceSlider'),
  insuranceInput: document.getElementById('insuranceInput'),
  otherSlider: document.getElementById('otherSlider'),
  otherInput: document.getElementById('otherInput'),
  portSlider: document.getElementById('portSlider'),
  portInput: document.getElementById('portInput'),

  lastUpdate: document.getElementById('last-update'),
  fobWeighted: document.getElementById('fobWeighted'),
  cifPrice: document.getElementById('cifPrice'),
  totalUsd: document.getElementById('totalUsd'),
  totalCny: document.getElementById('totalCny'),
  diffPct: document.getElementById('diffPct'),
  suggestion: document.getElementById('suggestion'),

  chartCanvas: document.getElementById('costChart'),
  costDetails: document.getElementById('costDetails'),
};

const ZCE = 5672;

function sync(slider, input){
  if (!slider || !input) return;
  slider.addEventListener('input', ()=>{input.value = slider.value; render();});
  input.addEventListener('input', ()=>{slider.value = input.value; render();});
}

function initSync(){
  [
    ['fobSlider','fobInput'],
    ['iceSlider','iceInput'],
    ['cepeaSlider','cepeaInput'],
    ['freightSlider','freightInput'],
    ['exchangeSlider','exchangeInput'],
    ['insuranceSlider','insuranceInput'],
    ['otherSlider','otherInput'],
    ['portSlider','portInput'],
  ].forEach(([sid,iid]) => {
    sync(document.getElementById(sid), document.getElementById(iid));
  });
  const tariffSel = document.getElementById('tariffSelect');
  if(tariffSel) tariffSel.addEventListener('change', render);
}

function weightedFOB(cepea, fob, iceCents){
  const iceUsdTon = Number(iceCents) * 22.0462;
  return Number(fob)*0.4 + Number(cepea)*0.35 + iceUsdTon*0.25;
}

function calc() {
  const cepea = parseFloat(el.cepeaInput.value);
  const fob = parseFloat(el.fobInput.value);
  const ice = parseFloat(el.iceInput.value);
  const freight = parseFloat(el.freightInput.value);
  const ex = parseFloat(el.exchangeInput.value);
  const tariffSel = parseFloat(el.tariffSelect.value);
  const insurance = parseFloat(el.insuranceInput.value);
  const other = parseFloat(el.otherInput.value);
  const port = parseFloat(el.portInput.value);

  const fobW = weightedFOB(cepea, fob, ice);
  const cif = fobW + freight + insurance + other;

  const tariffIn = cif * (tariffSel/100);
  const tariffOut = cif * 0.5;

  const preVatIn = cif + tariffIn + port;
  const preVatOut = cif + tariffOut + port;

  const vatIn = preVatIn * 0.13;
  const vatOut = preVatOut * 0.13;

  const totalUsdIn = preVatIn + vatIn;
  const totalUsdOut = preVatOut + vatOut;

  const totalCnyIn = totalUsdIn * ex;
  const diffPctIn = ((totalCnyIn - ZCE) / ZCE) * 100;

  return {
    cepea, fob, ice, freight, insurance, other, port, ex, tariffSel,
    fobW, cif,
    tariffIn, tariffOut, preVatIn, preVatOut, vatIn, vatOut,
    totalUsdIn, totalUsdOut, totalCnyIn, diffPctIn
  };
}

function renderPanels(m){
  el.fobWeighted.textContent = `$${m.fobW.toFixed(2)}`;
  el.cifPrice.textContent = `$${m.cif.toFixed(2)}`;
  el.totalUsd.textContent = `$${m.totalUsdIn.toFixed(2)}`;
  el.totalCny.textContent = `¥${m.totalCnyIn.toFixed(0)}`;
  el.diffPct.textContent = `${m.diffPctIn.toFixed(1)}%`;

  if(m.diffPctIn <= 5){
    el.suggestion.textContent = `可以进口，价差在合理范围内 ( + ${m.diffPctIn.toFixed(1)}% )`;
    el.suggestion.style.background = '#dff4eb';
    el.suggestion.style.color = '#0e7b63';
  }else if(m.diffPctIn <= 10){
    el.suggestion.textContent = `谨慎进口，价差较大 ( + ${m.diffPctIn.toFixed(1)}% )`;
    el.suggestion.style.background = '#fff4e6';
    el.suggestion.style.color = '#a35a00';
  }else{
    el.suggestion.textContent = `暂缓进口，价差过大 ( + ${m.diffPctIn.toFixed(1)}% )`;
    el.suggestion.style.background = '#ffe9e6';
    el.suggestion.style.color = '#bf2e2e';
  }

  const html = `
    <div class="cost-row"><span>加权平均FOB:</span><span>$${m.fobW.toFixed(2)}</span></div>
    <div class="cost-row"><span>海运费:</span><span>$${m.freight.toFixed(2)}</span></div>
    <div class="cost-row"><span>保险费:</span><span>$${m.insurance.toFixed(2)}</span></div>
    <div class="cost-row"><span>其他费用:</span><span>$${m.other.toFixed(2)}</span></div>
    <div class="cost-row cif-summary"><span>CIF小计:</span><span>$${m.cif.toFixed(2)}</span></div>
    <div class="cost-row"><span>关税:</span><span>$${m.tariffSel===15?m.tariffIn.toFixed(2):m.tariffOut.toFixed(2)}</span></div>
    <div class="cost-row"><span>港口清关费:</span><span>$${m.port.toFixed(2)}</span></div>
    <div class="cost-row"><span>增值税 (13%):</span><span>$${(m.tariffSel===15?m.vatIn:m.vatOut).toFixed(2)}</span></div>
    <div class="cost-row final-cost"><span>最终成本:</span><span>$${(m.tariffSel===15?m.totalUsdIn:m.totalUsdOut).toFixed(2)}</span></div>
  `;
  el.costDetails.innerHTML = html;
}

let chartInstance = null;

function drawStackedChart(m){
  const ctx = el.chartCanvas.getContext('2d');

  // 三种情景的成本模拟计算
  const optimistic = {
    fob: m.fobW - 30,
    freight: m.freight - 15,
    insurance: Math.max(3, m.insurance - 1),
    other: Math.max(5, m.other -5),
    port: m.port,
  };
  const base = {
    fob: m.fobW,
    freight: m.freight,
    insurance: m.insurance,
    other: m.other,
    port: m.port,
  };
  const pessimistic = {
    fob: m.fobW + 40,
    freight: m.freight + 20,
    insurance: m.insurance + 1,
    other: m.other + 10,
    port: m.port,
  };

  function pack(c){
    const cif = c.fob + c.freight + c.insurance + c.other;
    const tariff = cif * (m.tariffSel / 100);
    const preVat = cif + tariff + c.port;
    const vat = preVat * 0.13;
    return { cif, tariff, vat, total: (preVat + vat) * m.ex };
  }

  const dOpt = pack(optimistic), dBase = pack(base), dPes = pack(pessimistic);

  const labels = ['乐观', '基准', '悲观'];

  const dataSets = [
    { label: 'FOB价', data: [dOpt.fob, dBase.fob, dPes.fob].map(v=>v*m.ex), backgroundColor: '#7fc8d6', stack: 'stack1' },
    { label: '运费', data: [dOpt.freight, dBase.freight, dPes.freight].map(v=>v*m.ex), backgroundColor: '#e1696a', stack: 'stack1' },
    { label: '保险', data: [dOpt.insurance, dBase.insurance, dPes.insurance].map(v=>v*m.ex), backgroundColor: '#a0d468', stack: 'stack1' },
    { label: '其他费', data: [dOpt.other, dBase.other, dPes.other].map(v=>v*m.ex), backgroundColor: '#749f83', stack: 'stack1' },
    { label: '关税', data: [dOpt.tariff, dBase.tariff, dPes.tariff].map(v=>v*m.ex), backgroundColor: '#bda29a', stack: 'stack1' },
    { label: '增值税', data: [dOpt.vat, dBase.vat, dPes.vat].map(v=>v*m.ex), backgroundColor: '#6e7074', stack: 'stack1' },
  ];

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: dataSets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: '价格（元/吨）' }
        },
      }
    }
  });
}

function render() {
  const m = calc();
  renderPanels(m);
  drawStackedChart(m);
}

async function fetchLatest() {
  try {
    const res = await fetch('/api/price-data');
    const data = await res.json();
    el.lastUpdate.textContent = `最后更新：${data.lastUpdate}`;
    el.cepeaInput.value = data.cepea; el.cepeaSlider.value = data.cepea;
    el.fobInput.value = data.fob_santos; el.fobSlider.value = data.fob_santos;
    el.iceInput.value = data.ice_no11_cents; el.iceSlider.value = data.ice_no11_cents;
    el.exchangeInput.value = data.exchange_rate; el.exchangeSlider.value = data.exchange_rate;
    render();
  } catch (e) {
    console.error(e);
    el.lastUpdate.textContent = '最后更新：数据请求失败';
    render();
  }
}

function setup() {
  initSync();
  fetchLatest();
}

window.onload = setup;

function initSync() {
  [
    ['fobSlider', 'fobInput'],
    ['iceSlider', 'iceInput'],
    ['cepeaSlider', 'cepeaInput'],
    ['freightSlider', 'freightInput'],
    ['exchangeSlider', 'exchangeInput'],
    ['insuranceSlider', 'insuranceInput'],
    ['otherSlider', 'otherInput'],
    ['portSlider', 'portInput'],
  ].forEach(([sid, iid]) => {
    sync(document.getElementById(sid), document.getElementById(iid));
  });

  const tariffSel = document.getElementById('tariffSelect');
  if (tariffSel) tariffSel.addEventListener('change', render);
}

function sync(slider, input) {
  if (!slider || !input) return;
  slider.addEventListener('input', () => {
    input.value = slider.value;
    render();
  });
  input.addEventListener('input', () => {
    slider.value = input.value;
    render();
  });
}
