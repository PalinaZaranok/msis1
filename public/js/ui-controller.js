class UIController {
  constructor() {
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

  async analyzeCode() {
    const code = document.getElementById('code-input').value.trim();

    if (!code) {
      this.showError('Please enter some Scala code to analyze.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code })
      });
      let json = await response.json()
      const operands = json.operands
      const operators = json.operators

      const metrics = this.metricsCalculator.calculate(operators, operands);

      this.displayMetrics(metrics);
      this.displayTokenDetails(metrics.operatorCounts, metrics.operandCounts);

      document.querySelector('.results-section').style.display = 'block';

    } catch (error) {
      this.showError(`Error analyzing code: ${error.message}`);
    }
  }

  displayMetrics(metrics) {
    document.getElementById('n1-value').textContent = metrics.distinctOperators.size.toFixed(2);
    document.getElementById('n2-value').textContent = metrics.distinctOperands.size.toFixed(2);
    document.getElementById('N_1-value').textContent = metrics.totalOperators;
    document.getElementById('N_2-value').textContent = metrics.totalOperands;

    document.getElementById('n-value').textContent = metrics.n.toFixed(4);
    document.getElementById('L-value').textContent = metrics.N.toFixed(2);
    document.getElementById('V-value').textContent = metrics.V.toFixed(4);
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
