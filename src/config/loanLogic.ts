import Decimal from 'decimal.js';

/**
 * Calculates the monthly EMI
 * @param principal Loan amount
 * @param annualRate Annual interest rate in percentage (e.g. 9.5)
 * @param tenureMonths Number of months
 * @returns EMI rounded to nearest rupee
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  
  if (annualRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  const p = new Decimal(principal);
  const r = new Decimal(annualRate).dividedBy(12).dividedBy(100);
  const n = new Decimal(tenureMonths);

  // EMI = P × r × (1+r)^n / ((1+r)^n − 1)
  const onePlusRToN = r.plus(1).pow(n);
  const numerator = p.times(r).times(onePlusRToN);
  const denominator = onePlusRToN.minus(1);
  
  const emi = numerator.dividedBy(denominator);
  
  return Math.round(emi.toNumber());
}

/**
 * Indicative rates for the demo
 */
export const getIndicativeRate = (condition: string, type: string) => {
  if (condition === 'New' && type === '4W') return 9.5;
  if (condition === 'Used' && type === '4W') return 13.5;
  if (condition === 'New' && type === '2W') return 13.0;
  if (condition === 'Used' && type === '2W') return 18.0;
  return 12.0;
}
