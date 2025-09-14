class HalsteadMetricsCalculator {
  constructor() {}
  calculate(operators, operands) {
    const distinctOperators = this.countDistinct(operators);
    const distinctOperands = this.countDistinct(operands);

    const totalOperators = operators.length;
    const totalOperands = operands.length;

    const n = distinctOperators.size + distinctOperands.size;

    const N = totalOperators + totalOperands;

    const V = N * Math.log2(n);

    const D = (distinctOperators.size / 2) * (totalOperands / distinctOperands.size);

    const E = D * V;

    const T = E / 18;

    const L = 1 / D;

    const I = V / D;

    const B = Math.pow(E, 2/3) / 3000;

    return {
      n: n,
      N: N,
      V: V,
      D: D,
      E: E,
      T: T,

      L: L,
      I: I,
      B: B,

      distinctOperators: distinctOperators,
      distinctOperands: distinctOperands,
      totalOperators: totalOperators,
      totalOperands: totalOperands,

      operatorCounts: this.getFrequencyCounts(operators),
      operandCounts: this.getFrequencyCounts(operands)
    };
  }

  countDistinct(items) {
    const distinct = new Map();

    for (const item of items) {
      if (distinct.has(item)) {
        distinct.set(item, distinct.get(item) + 1);
      } else {
        distinct.set(item, 1);
      }
    }

    return distinct;
  }

  getFrequencyCounts(items) {
    const counts = this.countDistinct(items);
    const result = [];

    for (const [item, count] of counts) {
      result.push({ item, count });
    }

    return result.sort((a, b) => b.count - a.count);
  }
}
