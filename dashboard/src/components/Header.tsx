import { useState, useRef, useEffect } from 'react';
import { Search, FileText, UploadCloud, Loader2, Settings2 } from 'lucide-react';
import type { Case } from '../types';

interface HeaderProps {
  cases: Case[];
  onCaseSelect: (caseData: Case) => void;
  isSystemActive: boolean;
  onOpenConfig: () => void; // Added this line to accept the function
}

export function Header({ cases, onCaseSelect, isSystemActive, onOpenConfig }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const searchResults = searchQuery.length > 1
    ? cases.filter(c => 
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelect = (caseData: Case) => {
    onCaseSelect(caseData);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        alert(`❌ Import Failed:\n${data.message}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("❌ Critical Error: Could not connect to backend API.");
    } finally {
      event.target.value = '';
      setIsUploading(false);
    }
  };

  return (
    <header className="h-[80px] bg-[#111111] border-b border-[#2a2a2a] flex items-center justify-between px-8 z-30 relative">
      <div className="flex-1 max-w-2xl relative" ref={wrapperRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder="Search cases by ID, type, or keyword..."
          className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-lg pl-11 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#444] transition-colors"
        />

        {isDropdownOpen && searchQuery.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden z-50">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div 
                  key={result.id} 
                  onClick={() => handleSelect(result)}
                  className="p-3 border-b border-[#2a2a2a] last:border-0 hover:bg-[#222222] cursor-pointer transition-colors flex items-center space-x-3"
                >
                  <FileText size={16} className="text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{result.id}</div>
                    <div className="text-xs text-gray-500 truncate max-w-md">{result.summary}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-gray-500 text-center">No cases found matching "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 ml-8">
        
        {/* Import Case Button */}
        <label className={`cursor-pointer bg-[#161616] border border-[#2a2a2a] hover:bg-[#222222] text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          <span>{isUploading ? 'Parsing...' : 'Import Case'}</span>
          <input 
            type="file" 
            className="hidden" 
            accept=".txt,.json,.csv" 
            onChange={handleFileUpload} 
          />
        </label>

        {/* The New Settings Button */}
        <button 
          onClick={onOpenConfig} 
          className="bg-[#161616] border border-[#2a2a2a] hover:bg-[#222222] text-gray-300 hover:text-white p-2 rounded-lg transition-colors"
        >
          <Settings2 size={18} />
        </button>

        <div className="h-6 w-px bg-[#2a2a2a] mx-2"></div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${isSystemActive ? 'bg-emerald-500' : 'bg-red-500'} ${isSystemActive ? 'animate-pulse' : ''}`}></div>
          </div>
          <span className={`font-medium text-sm ${isSystemActive ? 'text-gray-500' : 'text-red-400'}`}>
            {isSystemActive ? 'System Active' : 'System Inactive'}
          </span>
        </div>
      </div>
    </header>
  );
}