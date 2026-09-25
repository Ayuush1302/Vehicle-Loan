import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { MOCK_CATALOGUE, calculateRoadTax, estimateInsurance } from '../../config/catalogue';
import { ArrowRight, Calculator, Check, AlertCircle } from 'lucide-react';

const newVehicleSchema = z.object({
  cityId: z.string().min(1, 'Select a city'),
  makeId: z.string().min(1, 'Select a make'),
  modelId: z.string().min(1, 'Select a model'),
  variantId: z.string().min(1, 'Select a variant'),
  dealerId: z.string().min(1, 'Select a dealer'),
  invoiceNo: z.string().min(3, 'Enter quotation/invoice number'),
  includeAccessories: z.boolean().optional(),
  includeExtendedWarranty: z.boolean().optional(),
});

const usedVehicleSchema = z.object({
  regNo: z.string().regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/, 'Valid Reg No (e.g. MH01AB1234)'),
  regDate: z.string().min(1, 'Select registration date'),
  mfgYear: z.string().min(4, 'Enter manufacture year'),
  makeId: z.string().min(1, 'Select a make'),
  modelId: z.string().min(1, 'Select a model'),
  variantId: z.string().min(1, 'Select a variant'),
  ownerCount: z.coerce.number().min(1).max(5),
  odometer: z.coerce.number().min(0, 'Invalid odometer reading'),
  insuranceValidity: z.string().min(1, 'Select insurance validity'),
  agreedPrice: z.coerce.number().min(10000, 'Minimum price is 10,000'),
  hypothecationStatus: z.enum(['Clear', 'Active']),
  existingFinancier: z.string().optional()
}).refine(data => data.hypothecationStatus === 'Clear' || data.existingFinancier, {
  message: "Financier name is required for Active hypothecation",
  path: ["existingFinancier"]
});

export default function VehicleStep() {
  const { currentAppId, applications } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  if (!currentApp || !currentApp.asset) {
    return <Navigate to="/apply/asset" replace />;
  }

  const { type, condition } = currentApp.asset;
  const isNew = condition === 'New';

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
        <p className="text-gray-500 mt-2">
          {isNew ? 'Configure your new vehicle to estimate on-road price.' : 'Enter details of the used vehicle you wish to purchase.'}
        </p>
      </div>

      {isNew ? (
        <NewVehicleForm currentApp={currentApp} type={type!} />
      ) : (
        <UsedVehicleForm currentApp={currentApp} type={type!} />
      )}
    </div>
  );
}

// --- NEW VEHICLE FORM ---
function NewVehicleForm({ currentApp, type }: { currentApp: any, type: string }) {
  const navigate = useNavigate();
  const { updateApplication } = useAppStore();
  const existing = currentApp.vehicle || {};

  const form = useForm({
    resolver: zodResolver(newVehicleSchema),
    defaultValues: {
      cityId: existing.cityId || '',
      makeId: existing.makeId || '',
      modelId: existing.modelId || '',
      variantId: existing.variantId || '',
      dealerId: existing.dealerId || '',
      invoiceNo: existing.invoiceNo || '',
      includeAccessories: existing.accessories > 0,
      includeExtendedWarranty: existing.extendedWarranty > 0,
    }
  });

  const { cityId, makeId, modelId, variantId, includeAccessories, includeExtendedWarranty } = useWatch({ control: form.control });

  // Cascading filters
  const availableMakes = MOCK_CATALOGUE.makes.filter(m => m.type === type);
  const availableModels = MOCK_CATALOGUE.models.filter(m => m.makeId === makeId);
  const availableVariants = MOCK_CATALOGUE.variants.filter(v => v.modelId === modelId);

  // Derived Pricing
  const city = MOCK_CATALOGUE.cities.find(c => c.id === cityId);
  const variant = availableVariants.find(v => v.id === variantId);
  
  const exShowroom = variant ? variant.exShowroom : 0;
  const roadTax = (variant && city) ? calculateRoadTax(exShowroom, city.state, variant.fuel) : 0;
  const insurance = variant ? estimateInsurance(exShowroom, type as '2W'|'4W') : 0;
  
  const accessoriesCost = includeAccessories ? 15000 : 0;
  const warrantyCost = includeExtendedWarranty ? 8000 : 0;
  const onRoadPrice = exShowroom + roadTax + insurance + accessoriesCost + warrantyCost;

  const onSubmit = (data: any) => {
    updateApplication(currentApp.id, {
      vehicle: {
        ...data,
        fuel: variant?.fuel,
        exShowroom,
        roadTax,
        insurance,
        accessories: accessoriesCost,
        extendedWarranty: warrantyCost,
        onRoadPrice
      }
    });
    navigate('/apply/valuation');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City of Registration</label>
          <select {...form.register('cityId')} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500">
            <option value="">Select City</option>
            {MOCK_CATALOGUE.cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {form.formState.errors.cityId && <p className="text-sm text-red-600 mt-1">{form.formState.errors.cityId.message as string}</p>}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-900">Vehicle Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Make</label>
            <select 
              {...form.register('makeId')} 
              value={makeId}
              onChange={(e) => { form.setValue('makeId', e.target.value); form.setValue('modelId', ''); form.setValue('variantId', ''); }}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            >
              <option value="">Select Make</option>
              {availableMakes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <select 
              {...form.register('modelId')} 
              value={modelId}
              onChange={(e) => { form.setValue('modelId', e.target.value); form.setValue('variantId', ''); }}
              disabled={!makeId}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm disabled:bg-gray-100"
            >
              <option value="">Select Model</option>
              {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Variant</label>
            <select 
              {...form.register('variantId')} 
              value={variantId}
              disabled={!modelId}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm disabled:bg-gray-100"
            >
              <option value="">Select Variant</option>
              {availableVariants.map(v => <option key={v.id} value={v.id}>{v.name} ({v.fuel})</option>)}
            </select>
          </div>
        </div>
        {(form.formState.errors.makeId || form.formState.errors.variantId) && 
          <p className="text-sm text-red-600">Please complete vehicle selection.</p>}
      </div>

      {variantId && (
        <div className="bg-white border border-brand-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-brand-50 px-5 py-3 border-b border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-800 font-semibold">
              <Calculator className="w-5 h-5" /> Estimated Price Breakdown
            </div>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ex-Showroom Price</span>
              <span className="font-medium font-financial text-gray-900">₹{exShowroom.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">RTO / Road Tax (est.)</span>
              <span className="font-medium font-financial text-gray-900">₹{roadTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-200 pb-3">
              <span className="text-gray-500">Comprehensive Insurance (est.)</span>
              <span className="font-medium font-financial text-gray-900">₹{insurance.toLocaleString()}</span>
            </div>
            
            <div className="pt-1 space-y-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2 text-gray-700 group-hover:text-gray-900 transition">
                  <input type="checkbox" {...form.register('includeAccessories')} className="rounded text-brand-600 focus:ring-brand-500" />
                  <span>Accessories Package</span>
                </div>
                <span className="font-financial">₹15,000</span>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2 text-gray-700 group-hover:text-gray-900 transition">
                  <input type="checkbox" {...form.register('includeExtendedWarranty')} className="rounded text-brand-600 focus:ring-brand-500" />
                  <span>Extended Warranty</span>
                </div>
                <span className="font-financial">₹8,000</span>
              </label>
            </div>

            <div className="flex justify-between pt-4 mt-2 border-t border-gray-200 items-end">
              <span className="font-semibold text-gray-900">Total On-Road Price</span>
              <span className="text-xl font-bold font-financial text-brand-600">₹{onRoadPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name</label>
          <select {...form.register('dealerId')} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500">
            <option value="">Select Dealer</option>
            {MOCK_CATALOGUE.dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {form.formState.errors.dealerId && <p className="text-sm text-red-600 mt-1">{form.formState.errors.dealerId.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quotation / Proforma Invoice No.</label>
          <input {...form.register('invoiceNo')} type="text" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500 uppercase" placeholder="INV-2026-XXXX" />
          {form.formState.errors.invoiceNo && <p className="text-sm text-red-600 mt-1">{form.formState.errors.invoiceNo.message as string}</p>}
        </div>
      </div>

      <button type="submit" className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2">
        Continue to Valuation <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}

// --- USED VEHICLE FORM ---
function UsedVehicleForm({ currentApp, type }: { currentApp: any, type: string }) {
  const navigate = useNavigate();
  const { updateApplication } = useAppStore();
  const existing = currentApp.vehicle || {};
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lastFetchedRegNo, setLastFetchedRegNo] = useState('');

  const form = useForm({
    resolver: zodResolver(usedVehicleSchema),
    defaultValues: {
      regNo: existing.regNo || '',
      regDate: existing.regDate || '',
      mfgYear: existing.mfgYear || '',
      makeId: existing.makeId || '',
      modelId: existing.modelId || '',
      variantId: existing.variantId || '',
      ownerCount: existing.ownerCount || 1,
      odometer: existing.odometer || '',
      insuranceValidity: existing.insuranceValidity || '',
      agreedPrice: existing.agreedPrice || '',
      hypothecationStatus: existing.hypothecationStatus || 'Clear',
      existingFinancier: existing.existingFinancier || '',
    }
  });

  const { regNo, makeId, modelId, variantId, hypothecationStatus } = useWatch({ control: form.control });

  // Cascading filters
  const availableMakes = MOCK_CATALOGUE.makes.filter(m => m.type === type);
  const availableModels = MOCK_CATALOGUE.models.filter(m => m.makeId === makeId);
  const availableVariants = MOCK_CATALOGUE.variants.filter(v => v.modelId === modelId);
  const variant = availableVariants.find(v => v.id === variantId);

  // Vahan/Fastag Lookup Simulation
  useEffect(() => {
    const isValidRegNo = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/i.test(regNo || '');
    const upRegNo = (regNo || '').toUpperCase();
    
    // Auto-populate whenever a new valid regNo is fully typed
    if (isValidRegNo && upRegNo !== lastFetchedRegNo && !isLookingUp) {
      setIsLookingUp(true);
      
      // Simulate API latency
      setTimeout(() => {
        const upReg = (regNo || '').toUpperCase();
        
        // 10 Exact Non-EV Edge Case Personas for Demo
        const VAHAN_PERSONAS: Record<string, any> = {
          // 4W Personas (Non-EV)
          'MH01AB1234': { makeId: 'm1', modelId: 'mod1', variantId: 'v1', mfgYear: '2021', regDate: '2021-06-15', ownerCount: '1', hypothecationStatus: 'Clear' }, // Swift ZXi
          'DL04CC9876': { makeId: 'm2', modelId: 'mod3', variantId: 'v4', mfgYear: '2019', regDate: '2019-10-10', ownerCount: '2', hypothecationStatus: 'Clear' }, // Creta 1.6 SX
          'KA03XY4567': { makeId: 'm3', modelId: 'mod4', variantId: 'v5', mfgYear: '2022', regDate: '2022-03-20', ownerCount: '1', hypothecationStatus: 'Active', existingFinancier: 'HDFC Bank' }, // Nexon XZ+
          'GJ01MN3344': { makeId: 'm1', modelId: 'mod2', variantId: 'v3', mfgYear: '2020', regDate: '2020-08-14', ownerCount: '1', hypothecationStatus: 'Clear' }, // Brezza ZXi Plus
          'TN07ZZ9999': { makeId: 'm1', modelId: 'mod1', variantId: 'v2', mfgYear: '2015', regDate: '2015-05-10', ownerCount: '3', hypothecationStatus: 'Active', existingFinancier: 'ICICI Bank' }, // Swift VDi
          
          // 2W Personas (Non-EV)
          'MH02CD4321': { makeId: 'm4', modelId: 'mod5', variantId: 'v6', mfgYear: '2022', regDate: '2022-04-05', ownerCount: '1', hypothecationStatus: 'Clear' }, // Activa 6G Deluxe
          'KA05EE7777': { makeId: 'm5', modelId: 'mod7', variantId: 'v8', mfgYear: '2020', regDate: '2020-09-12', ownerCount: '2', hypothecationStatus: 'Clear' }, // Classic 350
          'TS09FF8888': { makeId: 'm6', modelId: 'mod8', variantId: 'v9', mfgYear: '2023', regDate: '2023-01-20', ownerCount: '1', hypothecationStatus: 'Active', existingFinancier: 'Bajaj Finance' }, // Jupiter 110
          'UP14GG5555': { makeId: 'm7', modelId: 'mod9', variantId: 'v10', mfgYear: '2021', regDate: '2021-11-11', ownerCount: '1', hypothecationStatus: 'Clear' }, // Pulsar 150
          'RJ14HH4444': { makeId: 'm4', modelId: 'mod6', variantId: 'v7', mfgYear: '2018', regDate: '2018-07-07', ownerCount: '3', hypothecationStatus: 'Clear' } // Activa 5G
        };

        const persona = VAHAN_PERSONAS[upReg];

        if (persona) {
          // It's a known persona
          Object.keys(persona).forEach(key => {
            form.setValue(key as any, persona[key], { shouldValidate: true });
          });
        } else {
          // Fallback generic logic for any other valid plate
          const mockMake = availableMakes[0];
          if (mockMake) {
            form.setValue('makeId', mockMake.id, { shouldValidate: true });
            const mockModels = MOCK_CATALOGUE.models.filter(m => m.makeId === mockMake.id);
            const mockModel = mockModels[0];
            if (mockModel) {
              form.setValue('modelId', mockModel.id, { shouldValidate: true });
              const mockVariants = MOCK_CATALOGUE.variants.filter(v => v.modelId === mockModel.id);
              const mockVariant = mockVariants[0];
              if (mockVariant) {
                form.setValue('variantId', mockVariant.id, { shouldValidate: true });
              }
            }
          }
          form.setValue('mfgYear', '2019', { shouldValidate: true });
          form.setValue('regDate', '2019-08-20', { shouldValidate: true });
        }
        
        setLastFetchedRegNo(upReg);
        setIsLookingUp(false);
      }, 800);
    }
  }, [regNo, lastFetchedRegNo, isLookingUp, form, availableMakes, type]);

  const onSubmit = (data: any) => {
    updateApplication(currentApp.id, {
      vehicle: {
        ...data,
        fuel: variant?.fuel
      }
    });
    navigate('/apply/valuation');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      
      <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] mb-6 flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isLookingUp ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
          {isLookingUp ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <Check className="w-4 h-4" />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Vahan DB Integration Active</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Enter a valid Registration Number to fetch details. Try these demo edge cases:
          </p>
          <div className="mt-2 text-[10px] grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-gray-500 font-mono bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-subtle)]">
            <div className="col-span-1 md:col-span-2 font-semibold text-gray-900 border-b border-[var(--border-subtle)] pb-1 mb-1">4W Demo Plates</div>
            <div><span className="font-semibold text-gray-700">MH01AB1234</span>: Swift (2021)</div>
            <div><span className="font-semibold text-gray-700">DL04CC9876</span>: Creta (2019)</div>
            <div><span className="font-semibold text-gray-700">KA03XY4567</span>: Nexon (2022) w/ Loan</div>
            <div><span className="font-semibold text-gray-700">GJ01MN3344</span>: Brezza (2020)</div>
            <div><span className="font-semibold text-gray-700">TN07ZZ9999</span>: Swift (2015) w/ Loan</div>
            
            <div className="col-span-1 md:col-span-2 font-semibold text-gray-900 border-b border-[var(--border-subtle)] pb-1 mt-2 mb-1">2W Demo Plates</div>
            <div><span className="font-semibold text-gray-700">MH02CD4321</span>: Activa 6G (2022)</div>
            <div><span className="font-semibold text-gray-700">KA05EE7777</span>: Classic 350 (2020)</div>
            <div><span className="font-semibold text-gray-700">TS09FF8888</span>: Jupiter 110 (2023) w/ Loan</div>
            <div><span className="font-semibold text-gray-700">UP14GG5555</span>: Pulsar 150 (2021)</div>
            <div><span className="font-semibold text-gray-700">RJ14HH4444</span>: Activa 5G (2018)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
          <div className="relative">
            <input 
              {...form.register('regNo')} 
              type="text" 
              className={`w-full border ${isLookingUp ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-300'} rounded-xl p-3 focus:ring-brand-500 uppercase font-mono transition-all`} 
              placeholder="MH01AB1234" 
            />
            {isLookingUp && <span className="absolute right-3 top-3.5 text-xs font-semibold text-blue-600 animate-pulse">Fetching...</span>}
          </div>
          {form.formState.errors.regNo && <p className="text-sm text-red-600 mt-1">{form.formState.errors.regNo.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Purchase Price</label>
          <div className="relative">
            <span className="absolute left-3 top-3.5 font-financial text-gray-500">₹</span>
            <input {...form.register('agreedPrice')} type="number" className="w-full border border-gray-300 rounded-xl p-3 pl-8 focus:ring-brand-500" placeholder="0.00" />
          </div>
          {form.formState.errors.agreedPrice && <p className="text-sm text-red-600 mt-1">{form.formState.errors.agreedPrice.message as string}</p>}
        </div>
      </div>

      <div className={`bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4 transition-opacity ${isLookingUp ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <h3 className="font-semibold text-gray-900">Vehicle Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Make</label>
            <select 
              {...form.register('makeId')} 
              value={makeId}
              onChange={(e) => { form.setValue('makeId', e.target.value); form.setValue('modelId', ''); form.setValue('variantId', ''); }}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="">Select Make</option>
              {availableMakes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <select 
              {...form.register('modelId')} 
              value={modelId}
              onChange={(e) => { form.setValue('modelId', e.target.value); form.setValue('variantId', ''); }}
              disabled={!makeId}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm disabled:bg-gray-100 bg-white"
            >
              <option value="">Select Model</option>
              {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Variant</label>
            <select 
              {...form.register('variantId')} 
              value={variantId}
              disabled={!modelId}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm disabled:bg-gray-100 bg-white"
            >
              <option value="">Select Variant</option>
              {availableVariants.map(v => <option key={v.id} value={v.id}>{v.name} ({v.fuel})</option>)}
            </select>
          </div>
        </div>
        {(form.formState.errors.makeId || form.formState.errors.variantId) && 
          <p className="text-sm text-red-600">Please complete vehicle selection.</p>}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${isLookingUp ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mfg Year</label>
          <input {...form.register('mfgYear')} type="number" min="2010" max="2026" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500 bg-white" placeholder="YYYY" />
          {form.formState.errors.mfgYear && <p className="text-sm text-red-600 mt-1">{form.formState.errors.mfgYear.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
          <input {...form.register('regDate')} type="date" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500 bg-white" />
          {form.formState.errors.regDate && <p className="text-sm text-red-600 mt-1">{form.formState.errors.regDate.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (km)</label>
          <input {...form.register('odometer')} type="number" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" placeholder="e.g. 45000" />
          {form.formState.errors.odometer && <p className="text-sm text-red-600 mt-1">{form.formState.errors.odometer.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Owners</label>
          <select {...form.register('ownerCount')} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500">
            <option value="1">1 (First Owner)</option>
            <option value="2">2 (Second Owner)</option>
            <option value="3">3 (Third Owner)</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Valid Until</label>
          <input {...form.register('insuranceValidity')} type="date" className="w-full border border-gray-300 rounded-xl p-3 focus:ring-brand-500" />
          {form.formState.errors.insuranceValidity && <p className="text-sm text-red-600 mt-1">{form.formState.errors.insuranceValidity.message as string}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Hypothecation Status (Existing Loan)</label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => { form.setValue('hypothecationStatus', 'Clear'); form.setValue('existingFinancier', ''); }}
            className={`p-4 border rounded-xl flex items-center justify-center font-medium transition ${hypothecationStatus === 'Clear' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
          >
            Clear (No Loan)
          </button>
          <button
            type="button"
            onClick={() => form.setValue('hypothecationStatus', 'Active')}
            className={`p-4 border rounded-xl flex items-center justify-center font-medium transition ${hypothecationStatus === 'Active' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
          >
            Active
          </button>
        </div>
        
        {hypothecationStatus === 'Active' && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 animate-in fade-in space-y-3">
            <div className="flex gap-2 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Active hypothecation requires existing loan closure proof, NOC, and Form 35 before funds are released.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Existing Financier Name</label>
              <select {...form.register('existingFinancier')} className="w-full border border-amber-300 rounded-lg p-2 focus:ring-brand-500">
                <option value="">Select Financier</option>
                {MOCK_CATALOGUE.financiers.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              {form.formState.errors.existingFinancier && <p className="text-sm text-red-600 mt-1">{form.formState.errors.existingFinancier.message as string}</p>}
            </div>
          </div>
        )}
      </div>

      <button type="submit" className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition flex justify-center items-center gap-2 mt-6">
        Continue to Valuation <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}
