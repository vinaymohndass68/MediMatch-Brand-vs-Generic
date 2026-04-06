import React from 'react';
import { AnalysisResult } from '../types';

interface HistoryViewProps {
  history: AnalysisResult[];
  onSelect: (item: AnalysisResult) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onDelete, onClearAll, onBack }) => {
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-gray-800">History</h2>
        {history.length > 0 && (
          <button 
            onClick={onClearAll}
            className="text-red-500 hover:text-red-700 text-sm font-medium hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-medium text-gray-600">No saved comparisons yet</h3>
          <p className="text-gray-400 mt-2 mb-6">Analyses you save will appear here.</p>
          <button 
            onClick={onBack}
            className="bg-teal-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-600 transition-colors"
          >
            Start New Search
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                     <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{formatDate(item.timestamp)}</span>
                     {item.janAushadhi?.available && (
                       <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">JAN AUSHADHI</span>
                     )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                    {item.identifiedName || 'Unknown Item'}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                     <span>Brand: <span className="font-medium text-blue-600">{item.brandProfile?.name || 'N/A'}</span></span>
                     <span className="text-gray-300">|</span>
                     <span>Generic: <span className="font-medium text-emerald-600">{item.genericProfile?.name || 'N/A'}</span></span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => onDelete(item.id!, e)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;