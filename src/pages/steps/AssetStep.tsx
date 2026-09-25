
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Car, Bike, User, Store, AlertCircle } from 'lucide-react';

const assetSchema = z.object({
  type: z.enum(['2W', '4W'], { required_error: 'Select a vehicle type' }),
  condition: z.enum(['New', 'Used'], { required_error: 'Select vehicle condition' }),
  sellerType: z.enum(['Dealer', 'Individual']).optional(),
  useType: z.enum(['Personal', 'Commercial']),
}).refine(data => data.condition === 'New' || data.sellerType, {
  message: "Seller type is required for used vehicles",
  path: ["sellerType"]
});

export default function AssetStep() {
  const navigate = useNavigate();
  const { currentAppId, applications, updateApplication } = useAppStore();
  
  const currentApp = applications.find(a => a.id === currentAppId);
  const existingAsset = currentApp?.asset;

  const { handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      type: existingAsset?.type || undefined,
      condition: existingAsset?.condition || undefined,
      sellerType: existingAsset?.sellerType || undefined,
      useType: existingAsset?.useType || 'Personal',
    }
  });

  const watchType = watch('type');
  const watchCondition = watch('condition');
  const watchUseType = watch('useType');
  const watchSellerType = watch('sellerType');

  const onSubmit = (data: any) => {
    if (!currentAppId) return;
    
    // Check if we are changing core asset details that require a reset of downstream steps
    const isMajorChange = existingAsset && (
      existingAsset.type !== data.type || 
      existingAsset.condition !== data.condition
    );

    if (isMajorChange) {
      if (!window.confirm("Changing the vehicle category will clear your existing vehicle and valuation details. Continue?")) {
        return;
      }
      // Reset downstream if user confirms
      updateApplication(currentAppId, {
        asset: data,
        vehicle: undefined,
        valuation: undefined,
      });
    } else {
      updateApplication(currentAppId, { asset: data });
    }
    
    navigate('/apply/vehicle');
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Category</h2>
        <p className="text-gray-500 mt-2">What kind of vehicle are you looking to finance?</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Use Type */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Purpose of vehicle</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('useType', 'Personal')}
              className={`p-4 border rounded-xl flex items-center justify-center font-medium transition ${watchUseType === 'Personal' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
            >
              Personal Use
            </button>
            <button
              type="button"
              onClick={() => setValue('useType', 'Commercial')}
              className={`p-4 border rounded-xl flex items-center justify-center font-medium transition ${watchUseType === 'Commercial' ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
            >
              Commercial / Taxi
            </button>
          </div>
          {watchUseType === 'Commercial' && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Commercial vehicles are not supported in this demo. Please select Personal Use.</p>
            </div>
          )}
        </div>

        {/* Vehicle Type */}
        <div className={`space-y-3 ${watchUseType === 'Commercial' ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="block text-sm font-semibold text-gray-900">Vehicle Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('type', '4W')}
              className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition ${watchType === '4W' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
            >
              <Car className="w-8 h-8" />
              <span className="font-medium">Four Wheeler (Car)</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', '2W')}
              className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition ${watchType === '2W' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
            >
              <Bike className="w-8 h-8" />
              <span className="font-medium">Two Wheeler (Bike)</span>
            </button>
          </div>
          {errors.type && <p className="text-sm text-red-600">{errors.type.message as string}</p>}
        </div>

        {/* Condition */}
        <div className={`space-y-3 ${watchUseType === 'Commercial' ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="block text-sm font-semibold text-gray-900">Vehicle Condition</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setValue('condition', 'New'); setValue('sellerType', undefined); }}
              className={`p-4 border rounded-xl flex items-center justify-center font-medium transition ${watchCondition === 'New' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
            >
              New
            </button>
            <button
              type="button"
              onClick={() => setValue('condition', 'Used')}
              className={`p-4 border rounded-xl flex items-center justify-center font-medium transition ${watchCondition === 'Used' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
            >
              Used
            </button>
          </div>
          {errors.condition && <p className="text-sm text-red-600">{errors.condition.message as string}</p>}
        </div>

        {/* Seller Type (Used only) */}
        {watchCondition === 'Used' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-sm font-semibold text-gray-900">Buying from</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('sellerType', 'Dealer')}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition ${watchSellerType === 'Dealer' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
              >
                <Store className="w-6 h-6" />
                <span className="font-medium">Used Car Dealer</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('sellerType', 'Individual')}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition ${watchSellerType === 'Individual' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
              >
                <User className="w-6 h-6" />
                <span className="font-medium">Individual Seller</span>
              </button>
            </div>
            {errors.sellerType && <p className="text-sm text-red-600">{errors.sellerType.message as string}</p>}
          </div>
        )}

        <button 
          type="submit" 
          disabled={watchUseType === 'Commercial'}
          className="w-full bg-brand-600 text-white p-4 rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
        >
          Continue to Vehicle Details <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
