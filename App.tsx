import React, { useState, useEffect } from 'react';
import InputSection from './components/InputSection';
import ComparisonView from './components/ComparisonView';
import HistoryView from './components/HistoryView';
import { analyzeMedicineFromText, analyzeMedicineFromImage } from './services/geminiService';
import { AnalysisResult } from './types';
import { saveToHistory, getHistory, deleteFromHistory, clearHistory } from './services/historyService';

type ViewState = 'HOME' | 'RESULT' | 'HISTORY';

const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [viewState, setViewState] = useState<ViewState>('HOME');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleTextAnalysis = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeMedicineFromText(text);
      setResult(data);
      setViewState('RESULT');
    } catch (err: any) {
      setError(err.message || "Failed to analyze. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageAnalysis = async (base64: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeMedicineFromImage(base64, mimeType);
      setResult(data);
      setViewState('RESULT');
    } catch (err: any) {
      setError(err.message || "Failed to analyze image. Ensure the label is visible.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setViewState('HOME');
  };

  const handleSaveResult = (data: AnalysisResult) => {
    const savedItem = saveToHistory(data);
    // Update local history state immediately
    setHistory(prev => {
        // Avoid duplicate ID if already exists
        const exists = prev.find(h => h.id === savedItem.id);
        if(exists) return prev;
        return [savedItem, ...prev];
    });
    // Update current result with ID so the view knows it is saved
    setResult(savedItem);
  };

  const handleHistorySelect = (item: AnalysisResult) => {
    setResult(item);
    setViewState('RESULT');
  };

  const handleHistoryDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = deleteFromHistory(id);
    setHistory(updatedHistory);
  };

  const handleClearHistory = () => {
    if(confirm("Are you sure you want to delete all history?")) {
        clearHistory();
        setHistory([]);
    }
  };

  const handleHistoryClick = () => {
    setViewState('HISTORY');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={handleReset}>
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                <span className="text-white font-bold text-xl">+</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">MediMatch</span>
            </div>
            <div className="flex items-center space-x-6 text-sm font-medium text-gray-500">
              <button 
                onClick={handleHistoryClick}
                className={`flex items-center space-x-1 transition-colors ${viewState === 'HISTORY' ? 'text-teal-600' : 'hover:text-teal-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="hidden sm:inline">History</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-pulse">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Router */}
        {viewState === 'HISTORY' ? (
           <HistoryView 
             history={history} 
             onSelect={handleHistorySelect} 
             onDelete={handleHistoryDelete}
             onClearAll={handleClearHistory}
             onBack={handleReset}
           />
        ) : viewState === 'RESULT' && result ? (
           <ComparisonView 
             data={result} 
             onReset={handleReset} 
             onSave={handleSaveResult}
           />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-12 py-10">
            <div className="text-center max-w-2xl space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Know Your Medicine <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
                  Save on Cost
                </span>
              </h1>
              <p className="text-lg text-gray-500">
                Identify pills, bottles, or prescriptions instantly. Compare brand names with their generic equivalents to understand efficacy and price differences.
              </p>
            </div>

            <InputSection 
              onAnalyzeText={handleTextAnalysis} 
              onAnalyzeImage={handleImageAnalysis} 
              isLoading={isLoading}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl text-center">
               <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-800">Snap a Photo</h3>
                  <p className="text-sm text-gray-500 mt-2">Upload an image of the box, bottle, or pill.</p>
               </div>
               <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-800">Instant ID</h3>
                  <p className="text-sm text-gray-500 mt-2">AI identifies the active ingredients and brand.</p>
               </div>
               <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-800">Smart Comparison</h3>
                  <p className="text-sm text-gray-500 mt-2">See how the generic version stacks up against the brand.</p>
               </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} MediMatch. Not medical advice. Consult a doctor.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;