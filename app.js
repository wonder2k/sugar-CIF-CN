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

function init
