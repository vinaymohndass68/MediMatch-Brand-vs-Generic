import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { InputMode } from '../types';
import { COMMON_MEDICINES } from '../data/medicines';

interface InputSectionProps {
  onAnalyzeText: (text: string) => void;
  onAnalyzeImage: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyzeText, onAnalyzeImage, isLoading }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.IMAGE);
  const [textInput, setTextInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Attach stream to video element when camera is opened
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      // Close any existing preview when starting camera
      setPreviewUrl(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Unable to access camera. Please allow camera permissions or use file upload.");
    }
  };

  // Helper to resize and compress images to avoid payload limits
  const processAndCompressImage = async (source: HTMLImageElement | HTMLVideoElement): Promise<string> => {
    const canvas = document.createElement('canvas');
    const MAX_DIMENSION = 1024; // Resize to max 1024px
    
    let width = 0;
    let height = 0;

    if (source instanceof HTMLVideoElement) {
        width = source.videoWidth;
        height = source.videoHeight;
    } else {
        width = source.naturalWidth || source.width;
        height = source.naturalHeight || source.height;
    }
    
    if (!width || !height) {
        throw new Error(`Invalid image dimensions (${width}x${height}). Please try again.`);
    }

    // Scale down if too large
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
        } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
        }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    
    ctx.drawImage(source, 0, 0, width, height);
    
    // Compress to JPEG with 0.7 quality
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    try {
        const base64Data = await processAndCompressImage(videoRef.current);
        stopCamera();
        
        // Create a preview
        const preview = `data:image/jpeg;base64,${base64Data}`;
        setPreviewUrl(preview);
        
        onAnalyzeImage(base64Data, 'image/jpeg');
    } catch (e) {
        console.error(e);
        alert("Failed to capture photo.");
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create an image element to load the file so we can resize it
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
        try {
            const base64Data = await processAndCompressImage(img);
            
            setPreviewUrl(objectUrl);
            onAnalyzeImage(base64Data, 'image/jpeg');
        } catch (err) {
            console.error(err);
            alert("Error processing image.");
        }
    };
    
    img.src = objectUrl;
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTextInput(value);
    
    if (value.length > 0) {
      // Use 'includes' instead of 'startsWith' for better search
      const filtered = COMMON_MEDICINES.filter(med => 
        med.toLowerCase().includes(value.toLowerCase())
      );
      // Removed the .slice(0, 5) limit to allow scrolling through all matches
      setSuggestions(filtered); 
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (med: string) => {
    setTextInput(med);
    setShowSuggestions(false);
    // Optional: Auto submit? No, let user click "Identify"
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onAnalyzeText(textInput);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button 
          className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === InputMode.IMAGE ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => { setMode(InputMode.IMAGE); stopCamera(); }}
        >
          Image Upload
        </button>
        <button 
          className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === InputMode.TEXT ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => { setMode(InputMode.TEXT); stopCamera(); }}
        >
          Type Name
        </button>
      </div>

      <div className="p-6 md:p-8">
        
        {/* TEXT INPUT MODE */}
        {mode === InputMode.TEXT && (
          <form onSubmit={handleSubmitText} className="space-y-4 relative" ref={suggestionRef}>
            <label className="block text-sm font-medium text-gray-700">Enter Medicine Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={textInput}
                onChange={handleTextChange}
                placeholder="e.g., Dolo 650, Pan 40..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                autoComplete="off"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((med, index) => (
                    <div 
                      key={index}
                      className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-gray-700 text-sm border-b border-gray-50 last:border-0"
                      onClick={() => handleSuggestionClick(med)}
                    >
                      {med}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={!textInput.trim() || isLoading}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
            >
              {isLoading ? 'Analyzing...' : 'Identify Medicine'}
            </button>
          </form>
        )}

        {/* IMAGE INPUT MODE */}
        {mode === InputMode.IMAGE && (
          <div className="space-y-6">
            
            {/* Camera Viewport or Preview */}
            <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
              
              {isCameraOpen ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-500">No image selected</p>
                </div>
              )}

              {/* Camera Overlay Controls */}
              {isCameraOpen && (
                <button 
                   onClick={capturePhoto}
                   className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-teal-500 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-12 h-12 bg-teal-500 rounded-full"></div>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isCameraOpen ? (
                 <button 
                   onClick={stopCamera}
                   className="col-span-2 py-3 bg-red-50 text-red-600 rounded-xl font-semibold border border-red-200 hover:bg-red-100 transition-colors"
                 >
                   Cancel Camera
                 </button>
              ) : (
                <>
                  <button 
                    onClick={startCamera}
                    disabled={isLoading}
                    className="flex flex-col items-center justify-center py-3 bg-teal-50 text-teal-700 rounded-xl font-semibold border border-teal-200 hover:bg-teal-100 transition-colors"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    Camera
                  </button>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex flex-col items-center justify-center py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Upload
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </>
              )}
            </div>

            {isLoading && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-3xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                  <p className="text-teal-800 font-semibold animate-pulse">Analyzing Medicine...</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;