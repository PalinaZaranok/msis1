import {extractHalsteadTokens} from './temp.js'
class UIController {
  constructor() {
    this.tokenizer         = new ScalaTokenizer();
    this.metricsCalculator = new HalsteadMetricsCalculator();
    this.fileHandler       = new FileHandler();

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('analyze-btn').addEventListener('click', () => {
      this.analyzeCode();
    });

    document.getElementById('load-example-btn').addEventListener('click', () => {
      this.fileHandler.loadExample();
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      this.fileHandler.clearCode();
    });
  }

  analyzeCode() {
    const code = document.getElementById('code-input').value.trim();

    if (!code) {
      this.showError('Please enter some Scala code to analyze.');
      return;
    }

    try {
      const { operators, operands } = extractHalsteadTokens(code);

      const metrics = this.metricsCalculator.calculate(operators, operands);

      this.displayMetrics(metrics);
      this.displayTokenDetails(metrics.operatorCounts, metrics.operandCounts);

      document.querySelector('.results-section').style.display = 'block';

    } catch (error) {
      this.showError(`Error analyzing code: ${error.message}`);
    }
  }

  displayMetrics(metrics) {
    document.getElementById('n-value').textContent = metrics.n.toFixed(2);
    document.getElementById('N_-value').textContent = metrics.N.toFixed(2);
    document.getElementById('V-value').textContent = metrics.V.toFixed(2);
    document.getElementById('D-value').textContent = metrics.D.toFixed(2);
    document.getElementById('E-value').textContent = metrics.E.toFixed(2);
    document.getElementById('T-value').textContent = metrics.T.toFixed(2);

    document.getElementById('L-value').textContent = metrics.L.toFixed(4);
    document.getElementById('I-value').textContent = metrics.I.toFixed(2);
    document.getElementById('B-value').textContent = metrics.B.toFixed(4);
  }

  displayTokenDetails(operatorCounts, operandCounts) {
    const operatorsTable = document.querySelector('#operators-table tbody');
    operatorsTable.innerHTML = '';

    for (const { item, count } of operatorCounts) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${this.escapeHtml(item)}</td><td>${count}</td>`;
      operatorsTable.appendChild(row);
    }

    const operandsTable = document.querySelector('#operands-table tbody');
    operandsTable.innerHTML = '';

    for (const { item, count } of operandCounts) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${this.escapeHtml(item)}</td><td>${count}</td>`;
      operandsTable.appendChild(row);
    }
  }

  showError(message) {
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'error-message';
      errorElement.className = 'error';
      document.querySelector('.input-section').appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';

    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new UIController();
});
