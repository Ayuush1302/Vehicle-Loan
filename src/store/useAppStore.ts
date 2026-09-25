import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'In Review'
  | 'Referred'
  | 'Declined'
  | 'Offered'
  | 'Accepted'
  | 'Mandate Set'
  | 'Pending Disbursal'
  | 'Disbursed'
  | 'Closed'
  | 'Expired'
  | 'Withdrawn'
  | 'Cooled-off';

export interface UserProfile {
  mobile: string;
  nameOnPan?: string;
  pan?: string;
  aadhaar?: string;
  kycCompleted?: boolean;
  termsAccepted: boolean;
}

export interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  lastUpdated: string;
  
  // Step 2: Asset
  asset?: {
    type?: '2W' | '4W';
    condition?: 'New' | 'Used';
    sellerType?: 'Dealer' | 'Individual';
    useType?: 'Personal';
  };
  // Step 3: Vehicle
  vehicle?: {
    // Shared & Catalogue
    makeId?: string;
    modelId?: string;
    variantId?: string;
    fuel?: string;
    
    // New Vehicle specific
    cityId?: string;
    dealerId?: string;
    invoiceNo?: string;
    exShowroom?: number;
    roadTax?: number;
    insurance?: number;
    accessories?: number;
    extendedWarranty?: number;
    onRoadPrice?: number;
    
    // Used Vehicle specific
    regNo?: string;
    regDate?: string;
    mfgYear?: number;
    ownerCount?: number;
    odometer?: number;
    insuranceValidity?: string;
    agreedPrice?: number;
    hypothecationStatus?: 'Clear' | 'Active';
    existingFinancier?: string;
  };
  valuation?: any;
  // Step 4: Loan Setup
  loanSetup?: {
    loanAmount: number;
    tenureMonths: number;
    indicativeRate: number;
    emi: number;
    downPayment: number;
    hasCreditLifeInsurance: boolean;
  };
  // Step 5: Applicant & KYC
  applicant?: {
    // APP-0 details
    pan: string;
    nameOnPan: string;
    consentKyc: boolean;
    consentBureau: boolean;
    consentData: boolean;
    
    // APP-1 details
    dob: string;
    email: string;
    employmentType: 'Salaried' | 'Self-employed';
    employerName: string;
    netMonthlyIncome: number;
    existingEmis: number;
    residenceType: 'Owned' | 'Rented' | 'Living with parents';
    addressLine1: string;
    addressLine2: string;
    pincode: string;
    city: string;
    state: string;
    bankAccountNo: string;
    bankIfsc: string;
    bankName: string;
    kycCompleted: boolean;
    kycMethod: 'Aadhaar e-KYC' | 'CKYC';
  };
  // Step 6: Decision
  decision?: {
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
  };
  // Step 8: Disbursal
  disbursal?: {
    checklistCompleted: boolean;
    beneficiaryName: string;
    beneficiaryAccountMasked: string;
    disbursedAmount: number;
    disbursalDate?: string;
    coolingOffActive?: boolean;
  };
}

interface AppStore {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  applications: ApplicationData[];
  currentAppId: string | null;
  setCurrentAppId: (id: string | null) => void;
  createApplication: () => string;
  updateApplication: (id: string, updates: Partial<ApplicationData>) => void;
  clearSession: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      applications: [],
      currentAppId: null,
      setCurrentAppId: (id) => set({ currentAppId: id }),
      createApplication: () => {
        const id = `APP-${Date.now()}`;
        const newApp: ApplicationData = {
          id,
          status: 'Draft',
          lastUpdated: new Date().toISOString(),
        };
        set((state) => ({
          applications: [...state.applications, newApp],
          currentAppId: id,
        }));
        return id;
      },
      updateApplication: (id, updates) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? { ...app, ...updates, lastUpdated: new Date().toISOString() }
              : app
          ),
        }));
      },
      clearSession: () => {
        set({ currentAppId: null, user: null, applications: [] });
      }
    }),
    {
      name: 'gammamoney-storage',
    }
  )
);
