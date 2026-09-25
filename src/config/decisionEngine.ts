export interface DecisionResult {
  outcome: 'Approved' | 'Counter-offer' | 'Referred' | 'Declined';
  reasonCodes: string[];
  reasons: string[];
  finalRate: number;
  finalAmount: number;
  finalTenure: number;
  ruleVersion: string;
  bureauSummary: {
    score: number;
    activeEmis: number;
    delinquency: boolean;
    newToCredit: boolean;
  };
}

export async function runDecisionEngine(appData: any): Promise<DecisionResult> {
  // Simulate network delay for processing state
  await new Promise(resolve => setTimeout(resolve, 2500));

  const { applicant, loanSetup } = appData;
  const pan = applicant.pan.toUpperCase();
  
  // Default Bureau data
  let score = 750;
  let activeEmis = applicant.existingEmis;
  let delinquency = false;
  let newToCredit = false;

  let outcome: DecisionResult['outcome'] = 'Approved';
  let reasonCodes: string[] = [];
  let reasons: string[] = [];
  let finalAmount = loanSetup.loanAmount;
  let finalTenure = loanSetup.tenureMonths;
  let finalRate = loanSetup.indicativeRate;

  // Persona Mapping (PRD 7)
  if (pan === 'ABCPD1001A') {
    // Strong profile
    score = 780;
  } else if (pan === 'ABCPD2002B') {
    // Thin file, referred
    score = -1; // NTC
    newToCredit = true;
    outcome = 'Referred';
    reasonCodes.push('NTC_REFER');
    reasons.push('New to credit profile requires manual review.');
  } else if (pan === 'ABCPD3003C') {
    // Stretched obligations (FOIR issue)
    score = 710;
    activeEmis = 45000; // Mock high obligations
    outcome = 'Counter-offer';
    finalAmount = Math.max(loanSetup.loanAmount * 0.8, 50000); // 20% reduction
    finalRate = loanSetup.indicativeRate + 1.5; // Risk premium
    reasonCodes.push('HIGH_FOIR_COUNTER');
    reasons.push('Existing obligations are high. We can offer a reduced amount to keep your EMI manageable.');
  } else if (pan === 'ABCPD4004D') {
    // Weak history
    score = 620;
    outcome = 'Declined';
    reasonCodes.push('LOW_SCORE');
    reasons.push('Your credit score does not meet our minimum requirements at this time.');
  } else if (pan === 'ABCPD5005E') {
    // Negative-list hit
    score = 680;
    delinquency = true;
    outcome = 'Declined';
    reasonCodes.push('NEG_LIST_MATCH');
    reasons.push('Internal policy rules prevent us from offering a loan on this profile.');
  } else {
    // Dynamic FOIR Check for un-mapped PANs
    const totalEmi = activeEmis + loanSetup.emi;
    const foir = totalEmi / applicant.netMonthlyIncome;
    
    if (foir > 0.65) {
      outcome = 'Declined';
      reasonCodes.push('FOIR_EXCEEDED');
      reasons.push('Total monthly obligations exceed 65% of net income.');
    } else if (foir > 0.5) {
      outcome = 'Counter-offer';
      finalAmount = loanSetup.loanAmount * 0.85;
      reasonCodes.push('FOIR_HIGH_COUNTER');
      reasons.push('Total monthly obligations are high. Offering a lower amount.');
    }
  }

  // RC mismatch check from vehicle step (Mocked - PRD says mismatch is a flag)
  // For demo, if vehicle condition is Used and ownerCount > 3, maybe refer it.
  if (appData.asset?.condition === 'Used' && appData.vehicle?.ownerCount > 3 && outcome === 'Approved') {
    outcome = 'Referred';
    reasonCodes.push('HIGH_OWNER_COUNT');
    reasons.push('Multiple previous owners requires asset team review.');
  }

  return {
    outcome,
    reasonCodes,
    reasons,
    finalRate,
    finalAmount: Math.floor(finalAmount),
    finalTenure,
    ruleVersion: 'v2.1.0',
    bureauSummary: {
      score,
      activeEmis,
      delinquency,
      newToCredit
    }
  };
}
