import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { fetchLiveGenericPrice } from '../services/geminiService';

interface ComparisonViewProps {
  data: AnalysisResult;
  onReset: () => void;
  onSave: (data: AnalysisResult) => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ data, onReset, onSave }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [livePrice, setLivePrice] = useState<string | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  // Check if this item already has an ID (meaning it came from history) or if we just saved it
  useEffect(() => {
    if (data.id) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
    // Reset live price when data changes
    setLivePrice(null);
  }, [data]);

  const handleSave = () => {
    onSave(data);
    setIsSaved(true);
  };

  const handleFetchPrice = async () => {
    if (!data.genericProfile?.name) return;
    
    setIsFetchingPrice(true);
    try {
      const price = await fetchLiveGenericPrice(data.genericProfile.name);
      setLivePrice(price);
    } catch (e) {
      console.error(e);
      setLivePrice("Not available");
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*MediMatch Analysis Result*\n\n` +
      `*Medicine Identified:* ${data.identifiedName || 'Unknown'}\n` +
      `*Type:* ${data.isGeneric ? 'Generic' : 'Brand Name'}\n\n` +
      `*💊 Brand Profile*\n` +
      `Name: ${data.brandProfile?.name || 'N/A'}\n` +
      `Dosage: ${data.brandProfile?.dosage || 'N/A'}\n` +
      `Price: ${data.brandProfile?.typicalPrice || 'N/A'}\n\n` +
      `*🌿 Generic Profile*\n` +
      `Name: ${data.genericProfile?.name || 'N/A'}\n` +
      `Dosage: ${data.genericProfile?.dosage || 'N/A'}\n` +
      `Price: ${livePrice || data.genericProfile?.typicalPrice || 'N/A'}\n\n` +
      `*🏪 Jan Aushadhi Availability:* ${data.janAushadhi?.available ? '✅ Available' : '⚠️ Check Store'}\n` +
      (data.janAushadhi?.available ? `Est. Price: ${data.janAushadhi.priceEstimate}\n` : '') +
      `\n*Clinical Verdict:* ${data.clinicalSummary}\n\n` +
      `_Consult a doctor before changing medication._`;
      
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareGenericOnly = () => {
    const genericName = data.genericProfile?.name || data.janAushadhi?.name || 'Unknown Generic Name';
    const medicineName = data.identifiedName || 'Unknown Medicine';
    const text = `*Medicine Name:* ${medicineName}\n*Generic Name:* ${genericName}\n\nFound via MediMatch.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Header Summary */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-800">
          <span className="text-teal-600">{data.identifiedName || 'Unknown Medicine'}</span> Identified
        </h2>
        <p className="text-gray-500">
           Analysis shows this is likely a <span className="font-semibold text-gray-700">{data.isGeneric ? 'Generic' : 'Brand Name'}</span> medicine.
        </p>
      </div>

      {/* Main Comparison Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Brand Side */}
          <div className="p-6 md:p-8 bg-blue-50/50 border-b md:border-b-0 md:border-r border-blue-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">B</div>
              <h3 className="text-xl font-bold text-gray-800">Brand Name</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Name</p>
                <p className="text-lg font-medium text-gray-900">{data.brandProfile?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Manufacturer</p>
                <p className="text-gray-700">{data.brandProfile?.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Est. Price</p>
                <div className="flex items-center space-x-1">
                   <span className="text-gray-900 font-medium">{data.brandProfile?.typicalPrice || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Dosage & Frequency</p>
                <div className="text-gray-800 font-medium">
                  {data.brandProfile?.dosage || 'N/A'}
                  {data.brandProfile?.frequency ? <span className="text-gray-500 font-normal ml-1">({data.brandProfile.frequency})</span> : ''}
                </div>
              </div>
              <div>
                 <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Active Ingredients</p>
                 <div className="flex flex-wrap gap-2 mt-1">
                    {data.brandProfile?.activeIngredients?.map((ing, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                        {ing}
                      </span>
                    )) || <span className="text-gray-400 text-sm">Not specified</span>}
                 </div>
              </div>
            </div>
          </div>

          {/* Generic Side */}
          <div className="p-6 md:p-8 bg-emerald-50/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">G</div>
              <h3 className="text-xl font-bold text-gray-800">Generic Name</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Name</p>
                <p className="text-lg font-medium text-gray-900">{data.genericProfile?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Manufacturer</p>
                <p className="text-gray-700">{data.genericProfile?.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Est. Price</p>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                     <span className="text-gray-900 font-medium">
                       {livePrice ? livePrice : (data.genericProfile?.typicalPrice || 'N/A')}
                     </span>
                     {livePrice && <span className="text-[10px] uppercase font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">Live</span>}
                     {!livePrice && <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">Usually Cheaper</span>}
                  </div>
                  
                  {!livePrice && data.genericProfile?.name && (
                    <button 
                      onClick={handleFetchPrice}
                      disabled={isFetchingPrice}
                      className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900 disabled:opacity-50 flex items-center"
                    >
                      {isFetchingPrice ? (
                        <>
                          <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Checking Live Price...
                        </>
                      ) : (
                        "Check Live Price"
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Dosage & Frequency</p>
                <div className="text-gray-800 font-medium">
                  {data.genericProfile?.dosage || 'N/A'}
                  {data.genericProfile?.frequency ? <span className="text-gray-500 font-normal ml-1">({data.genericProfile.frequency})</span> : ''}
                </div>
              </div>
              <div>
                 <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active Ingredients</p>
                 <div className="flex flex-wrap gap-2 mt-1">
                    {data.genericProfile?.activeIngredients?.map((ing, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">
                        {ing}
                      </span>
                    )) || <span className="text-gray-400 text-sm">Not specified</span>}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jan Aushadhi Section */}
        {data.janAushadhi && (
          <div className={`border-t border-orange-200 p-6 md:p-8 relative overflow-hidden ${
             data.janAushadhi.available 
             ? 'bg-gradient-to-r from-orange-50 to-orange-100' 
             : 'bg-gray-50'
          }`}>
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
               <svg className="w-64 h-64 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                   <span className={`text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${data.janAushadhi.available ? 'bg-orange-600' : 'bg-gray-500'}`}>
                     {data.janAushadhi.available ? 'India Only' : 'Check Store'}
                   </span>
                   <h3 className={`text-xl font-bold ${data.janAushadhi.available ? 'text-orange-900' : 'text-gray-700'}`}>
                     Jan Aushadhi Kendra
                   </h3>
                </div>

                {data.janAushadhi.available ? (
                   <>
                      <p className="text-orange-800 mb-2 font-medium">Available at Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) stores.</p>
                      <p className="text-lg font-medium text-gray-800 mb-4">
                         Generic Name: <span className="font-bold">{data.janAushadhi.name || 'N/A'}</span>
                      </p>
                   </>
                ) : (
                   <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                     We couldn't confirm if this exact medicine is in the online Jan Aushadhi list, but they stock thousands of quality generic medicines at affordable prices. It is worth checking your local store.
                   </p>
                )}
                
                <div className="bg-white/60 p-3 rounded-lg border border-orange-200 inline-block">
                  <p className="text-xs text-orange-800 mb-2">
                    <span className="font-bold">Note:</span> Availability varies by specific store location.
                  </p>
                  <a 
                    href="https://www.google.com/maps/search/Jan+Aushadhi+Kendra+near+me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-bold text-orange-700 hover:text-orange-900 underline group"
                  >
                    <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Find nearest Kendra
                  </a>
                </div>
              </div>
              
              {data.janAushadhi.available && (
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">Estimated Price</p>
                      <p className="text-3xl font-extrabold text-gray-900">{data.janAushadhi.priceEstimate || 'N/A'}</p>
                   </div>
                   {data.janAushadhi.savingsPercentage && (
                     <div className="bg-green-600 text-white p-3 rounded-xl shadow-md text-center min-w-[100px]">
                        <p className="text-xs font-medium opacity-90 uppercase">Save up to</p>
                        <p className="text-2xl font-bold">{data.janAushadhi.savingsPercentage}</p>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Comparison Table */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 md:p-8">
           <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Direct Comparison</h4>
           <div className="space-y-4">
              {data.comparisonPoints?.map((point, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                     <p className="font-semibold text-gray-800">{point.aspect || 'Aspect'}</p>
                     <p className="text-sm text-gray-500 md:hidden mt-1">Verdict: {point.verdict}</p>
                  </div>
                  <div className="flex-[2] grid grid-cols-2 gap-4 text-sm">
                     <div className="text-blue-700">
                        <span className="font-bold text-blue-900 mr-2 md:hidden">Brand:</span>
                        {point.brandValue || '-'}
                     </div>
                     <div className="text-emerald-700">
                        <span className="font-bold text-emerald-900 mr-2 md:hidden">Generic:</span>
                        {point.genericValue || '-'}
                     </div>
                  </div>
                  <div className="hidden md:block flex-1 text-right text-sm font-medium text-gray-600">
                    {point.verdict || ''}
                  </div>
                </div>
              )) || <p className="text-gray-500 italic">No comparison points available.</p>}
           </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Common Uses
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
               {data.primaryUses?.map((use, i) => (
                 <li key={i}>{use}</li>
               )) || <li>Information unavailable</li>}
            </ul>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Possible Side Effects
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
               {data.sideEffects?.map((effect, i) => (
                 <li key={i}>{effect}</li>
               )) || <li>Information unavailable</li>}
            </ul>
         </div>
      </div>

      {/* Clinical Summary */}
      <div className="bg-teal-900 text-teal-50 p-6 rounded-2xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">Clinical Summary</h3>
        <p className="opacity-90 leading-relaxed">{data.clinicalSummary || 'No summary available.'}</p>
      </div>

      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:flex-wrap justify-center gap-4 pt-8 pb-12 no-print">
        <button 
          onClick={onReset}
          className="bg-gray-800 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          Check Another
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaved}
          className={`px-6 py-3 rounded-full font-semibold shadow-lg transition-colors flex items-center justify-center ${
            isSaved 
             ? 'bg-teal-100 text-teal-700 cursor-default'
             : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {isSaved ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              Saved
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              Save for Later
            </>
          )}
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={handleShareWhatsApp}
          className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share Generic Name
        </button>

        {/* PDF Button */}
        <button
          onClick={handleDownloadPDF}
          className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          PDF
        </button>
      </div>

      <div className="print-footer">
        Generated by MediMatch • Consult a doctor for medical advice.
      </div>
    </div>
  );
};

export default ComparisonView;