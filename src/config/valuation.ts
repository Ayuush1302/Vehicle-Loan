export const VALUATION_PARAMS = {
  'New_2W': { maxLTV: 0.85, maxTenure: 48, maxAge: null, minTicket: 20000, maxTicket: 300000 },
  'New_4W': { maxLTV: 0.90, maxTenure: 84, maxAge: null, minTicket: 150000, maxTicket: 4000000 },
  'Used_2W': { maxLTV: 0.60, maxTenure: 36, maxAge: 8, minTicket: 15000, maxTicket: 200000 },
  'Used_4W': { maxLTV: 0.70, maxTenure: 60, maxAge: 12, minTicket: 100000, maxTicket: 2500000 },
};

const DEP_4W = [0, 0.15, 0.25, 0.32, 0.38, 0.44, 0.50, 0.55, 0.60, 0.64, 0.68];
const DEP_2W = [0, 0.15, 0.27, 0.37, 0.45, 0.52, 0.58, 0.63, 0.68];

export function computeValuation(asset: any, vehicle: any, variantPrice: number = 0) {
  const isNew = asset.condition === 'New';
  const typeStr = `${asset.condition}_${asset.type}`;
  const params = VALUATION_PARAMS[typeStr as keyof typeof VALUATION_PARAMS];

  let fundingBase = 0;
  let vehicleAgeYears = 0;
  let marketValue = 0;
  let messages: string[] = [];
  let eligible = true;
  let depreciationStr = 'N/A';

  if (isNew) {
    fundingBase = vehicle.onRoadPrice || 0;
  } else {
    // Age calculation
    const regDate = new Date(vehicle.regDate);
    const today = new Date(); // Application date
    const ageMs = today.getTime() - regDate.getTime();
    vehicleAgeYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    
    if (vehicleAgeYears < 0) vehicleAgeYears = 0;
    const ageIndex = Math.ceil(vehicleAgeYears);

    // Hard eligibility checks
    if (params.maxAge !== null && vehicleAgeYears > params.maxAge) {
      eligible = false;
      messages.push(`Vehicle age (${vehicleAgeYears.toFixed(1)} years) exceeds maximum allowed (${params.maxAge} years).`);
    }

    if (vehicle.hypothecationStatus === 'Active' && !vehicle.existingFinancier) {
      eligible = false;
      messages.push(`Active hypothecation requires a declared existing financier.`);
    }

    // Depreciation
    const depTable = asset.type === '4W' ? DEP_4W : DEP_2W;
    let depFactor = 0;
    if (ageIndex >= depTable.length) {
      depFactor = depTable[depTable.length - 1]; // cap at max known
    } else {
      depFactor = depTable[ageIndex];
    }
    depreciationStr = `${(depFactor * 100).toFixed(0)}%`;

    // Odometer factor
    let odoFactor = 1.0;
    const odo = vehicle.odometer || 0;
    if (asset.type === '4W') {
      if (odo >= 30000 && odo <= 60000) odoFactor = 0.95;
      else if (odo > 60000) odoFactor = 0.88;
    } else {
      if (odo >= 15000 && odo <= 30000) odoFactor = 0.95;
      else if (odo > 30000) odoFactor = 0.88;
    }

    // Owner factor
    let ownerFactor = 1.0;
    const owners = vehicle.ownerCount || 1;
    if (owners === 2) ownerFactor = 0.95;
    else if (owners >= 3) ownerFactor = 0.88;

    marketValue = variantPrice * (1 - depFactor) * odoFactor * ownerFactor;
    fundingBase = Math.min(vehicle.agreedPrice || 0, marketValue);
  }

  // Calculate constraints
  let maxLoan = fundingBase * params.maxLTV;
  if (maxLoan < params.minTicket && eligible) {
    eligible = false;
    messages.push(`Maximum eligible loan (₹${maxLoan.toLocaleString()}) is below the minimum ticket size (₹${params.minTicket.toLocaleString()}).`);
  }
  
  if (maxLoan > params.maxTicket) {
    maxLoan = params.maxTicket;
  }

  let maxTenure = params.maxTenure;
  if (!isNew && params.maxAge) {
    const remainingAgeMonths = Math.floor((params.maxAge - vehicleAgeYears) * 12);
    if (remainingAgeMonths < maxTenure) {
      maxTenure = remainingAgeMonths;
    }
  }

  // Minimum required down payment
  const requiredDownPayment = isNew ? (fundingBase - maxLoan) : (vehicle.agreedPrice - maxLoan);

  return {
    eligible,
    messages,
    fundingBase,
    marketValue, // For used only
    depreciationStr, // For used only
    maxLTV: params.maxLTV,
    maxLoan: Math.floor(maxLoan),
    maxTenure,
    requiredDownPayment: Math.ceil(requiredDownPayment > 0 ? requiredDownPayment : 0)
  };
}
