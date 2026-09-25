export const MOCK_CATALOGUE = {
  makes: [
    { id: 'm1', name: 'Maruti Suzuki', type: '4W' },
    { id: 'm2', name: 'Hyundai', type: '4W' },
    { id: 'm3', name: 'Tata', type: '4W' },
    { id: 'm8', name: 'Toyota', type: '4W' },
    { id: 'm9', name: 'Mahindra', type: '4W' },
    { id: 'm10', name: 'Kia', type: '4W' },
    { id: 'm4', name: 'Honda', type: '2W' },
    { id: 'm5', name: 'Royal Enfield', type: '2W' },
    { id: 'm6', name: 'TVS', type: '2W' },
    { id: 'm7', name: 'Bajaj', type: '2W' },
    { id: 'm11', name: 'Yamaha', type: '2W' },
    { id: 'm12', name: 'Suzuki', type: '2W' }
  ],
  models: [
    // 4W Models
    { id: 'mod1', makeId: 'm1', name: 'Swift' },
    { id: 'mod2', makeId: 'm1', name: 'Vitara Brezza' },
    { id: 'mod10', makeId: 'm1', name: 'Baleno' },
    { id: 'mod11', makeId: 'm1', name: 'Alto 800' },
    { id: 'mod3', makeId: 'm2', name: 'Creta' },
    { id: 'mod12', makeId: 'm2', name: 'i20' },
    { id: 'mod13', makeId: 'm2', name: 'Venue' },
    { id: 'mod4', makeId: 'm3', name: 'Nexon' },
    { id: 'mod14', makeId: 'm3', name: 'Harrier' },
    { id: 'mod15', makeId: 'm3', name: 'Tiago' },
    { id: 'mod16', makeId: 'm8', name: 'Innova Crysta' },
    { id: 'mod17', makeId: 'm8', name: 'Fortuner' },
    { id: 'mod18', makeId: 'm9', name: 'XUV700' },
    { id: 'mod19', makeId: 'm9', name: 'Thar' },
    { id: 'mod20', makeId: 'm10', name: 'Seltos' },
    
    // 2W Models
    { id: 'mod5', makeId: 'm4', name: 'Activa 6G' },
    { id: 'mod6', makeId: 'm4', name: 'Activa 5G' },
    { id: 'mod21', makeId: 'm4', name: 'Shine' },
    { id: 'mod22', makeId: 'm4', name: 'Dio' },
    { id: 'mod7', makeId: 'm5', name: 'Classic 350' },
    { id: 'mod23', makeId: 'm5', name: 'Himalayan' },
    { id: 'mod8', makeId: 'm6', name: 'Jupiter 110' },
    { id: 'mod24', makeId: 'm6', name: 'Apache RTR 160' },
    { id: 'mod9', makeId: 'm7', name: 'Pulsar 150' },
    { id: 'mod25', makeId: 'm11', name: 'FZ-S V3' },
    { id: 'mod26', makeId: 'm11', name: 'R15 V4' },
    { id: 'mod27', makeId: 'm12', name: 'Access 125' }
  ],
  variants: [
    // Persona Variants (Must keep exact ID/Name mapping)
    { id: 'v1', modelId: 'mod1', name: 'ZXi 1.2 MT', fuel: 'Petrol', exShowroom: 750000 },
    { id: 'v2', modelId: 'mod1', name: 'VDi 1.3 DDiS', fuel: 'Diesel', exShowroom: 780000 },
    { id: 'v3', modelId: 'mod2', name: 'ZXi Plus 1.5 MT', fuel: 'Petrol', exShowroom: 1100000 },
    { id: 'v4', modelId: 'mod3', name: '1.6 SX CRDi MT', fuel: 'Diesel', exShowroom: 1550000 },
    { id: 'v5', modelId: 'mod4', name: 'XZ+ 1.2 Revotron', fuel: 'Petrol', exShowroom: 1050000 },
    { id: 'v6', modelId: 'mod5', name: 'Deluxe (Drum/CBS)', fuel: 'Petrol', exShowroom: 82000 },
    { id: 'v7', modelId: 'mod6', name: 'Standard (Drum)', fuel: 'Petrol', exShowroom: 65000 },
    { id: 'v8', modelId: 'mod7', name: 'Dual Channel ABS', fuel: 'Petrol', exShowroom: 220000 },
    { id: 'v9', modelId: 'mod8', name: 'ZX Disc SmartXonnect', fuel: 'Petrol', exShowroom: 88000 },
    { id: 'v10', modelId: 'mod9', name: 'Twin Disc ABS', fuel: 'Petrol', exShowroom: 115000 },
    
    // Fluff Variants
    { id: 'v11', modelId: 'mod10', name: 'Alpha 1.2', fuel: 'Petrol', exShowroom: 900000 },
    { id: 'v12', modelId: 'mod11', name: 'LXi', fuel: 'Petrol', exShowroom: 450000 },
    { id: 'v13', modelId: 'mod12', name: 'Asta (O) 1.2', fuel: 'Petrol', exShowroom: 950000 },
    { id: 'v14', modelId: 'mod13', name: 'SX(O) 1.0 Turbo', fuel: 'Petrol', exShowroom: 1200000 },
    { id: 'v15', modelId: 'mod14', name: 'XZA+ (O)', fuel: 'Diesel', exShowroom: 2200000 },
    { id: 'v16', modelId: 'mod15', name: 'XZA+', fuel: 'Petrol', exShowroom: 750000 },
    { id: 'v17', modelId: 'mod16', name: '2.4 ZX MT', fuel: 'Diesel', exShowroom: 2500000 },
    { id: 'v18', modelId: 'mod17', name: '2.8 4x4 AT', fuel: 'Diesel', exShowroom: 4000000 },
    { id: 'v19', modelId: 'mod18', name: 'AX7 Luxury Pack AT', fuel: 'Diesel', exShowroom: 2400000 },
    { id: 'v20', modelId: 'mod19', name: 'LX 4-Str Hard Top AT', fuel: 'Diesel', exShowroom: 1700000 },
    { id: 'v21', modelId: 'mod20', name: 'GTX Plus 1.4 Turbo', fuel: 'Petrol', exShowroom: 1800000 },
    { id: 'v22', modelId: 'mod21', name: 'Disc', fuel: 'Petrol', exShowroom: 78000 },
    { id: 'v23', modelId: 'mod22', name: 'DLX', fuel: 'Petrol', exShowroom: 72000 },
    { id: 'v24', modelId: 'mod23', name: 'Standard', fuel: 'Petrol', exShowroom: 240000 },
    { id: 'v25', modelId: 'mod24', name: 'Rear Disc', fuel: 'Petrol', exShowroom: 125000 },
    { id: 'v26', modelId: 'mod25', name: 'Deluxe', fuel: 'Petrol', exShowroom: 121000 },
    { id: 'v27', modelId: 'mod26', name: 'M', fuel: 'Petrol', exShowroom: 195000 },
    { id: 'v28', modelId: 'mod27', name: 'Ride Connect Edition', fuel: 'Petrol', exShowroom: 90000 }
  ],
  cities: [
    { id: 'c1', name: 'Mumbai', state: 'MH' },
    { id: 'c2', name: 'Delhi', state: 'DL' },
    { id: 'c3', name: 'Bangalore', state: 'KA' },
  ],
  dealers: [
    { id: 'd1', name: 'Sai Motors, Andheri' },
    { id: 'd2', name: 'Capital Cars, Connaught Place' },
    { id: 'd3', name: 'Southern Auto, Indiranagar' }
  ],
  financiers: [
    { id: 'f1', name: 'HDFC Bank' },
    { id: 'f2', name: 'ICICI Bank' },
    { id: 'f3', name: 'State Bank of India' },
    { id: 'f4', name: 'Bajaj Finance' }
  ]
};

// Simple road tax logic for demo purposes
export const calculateRoadTax = (exShowroom: number, state: string, fuel: string) => {
  if (fuel === 'Electric') return 0; // Configurable EV exemption
  
  let rate = 0.10; // Base 10%
  if (state === 'MH') rate = 0.11;
  if (state === 'KA') rate = 0.14;
  
  // Surcharge for expensive cars
  if (exShowroom > 1000000) rate += 0.02;
  
  return Math.round(exShowroom * rate);
};

export const estimateInsurance = (exShowroom: number, type: '2W' | '4W') => {
  const rate = type === '4W' ? 0.035 : 0.045;
  return Math.round(exShowroom * rate);
};
