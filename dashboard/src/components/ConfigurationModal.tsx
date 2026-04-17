import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Settings2, Trash2 } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigurationModal({ isOpen, onClose }: ConfigModalProps) {
  const [configData, setConfigData] = useState<any>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newKeywords, setNewKeywords] = useState<{word: string, weight: number | string}>([{word: "", weight: 10}]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('http://localhost:8000/config');
      if (res.ok) {
        const data = await res.json();
        setConfigData(data);
      }
    } catch (error) {
      console.error("Failed to fetch configurations:", error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchConfigs();
  }, [isOpen]);

  const handleToggleActive = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/config/toggle/${id}`, { method: 'PUT' });
      fetchConfigs();
    } catch (error) {
      console.error("Failed to toggle config:", error);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm("Delete this custom AI scoring profile permanently?")) return;
    try {
      await fetch(`http://localhost:8000/config/${id}`, { method: 'DELETE' });
      fetchConfigs();
    } catch (error) {
      console.error("Failed to delete config:", error);
    }
  };

  const handleSaveNew = async () => {
    // 1. Validate Name
    if (!newProfileName.trim()) {
      return alert("Error: Please enter a valid profile name.");
    }
    
    const formattedKeywords: Record<string, number> = {};
    let hasInvalidWeight = false;

    // 2. Validate Inputs & Weights
    newKeywords.forEach(kw => {
      const word = kw.word.trim();
      if (word !== "") {
        const weight = Number(kw.weight);
        // Ensure weight is strictly between 1 and 20
        if (isNaN(weight) || weight < 1 || weight > 20) {
          hasInvalidWeight = true;
        } else {
          formattedKeywords[word.toLowerCase()] = weight;
        }
      }
    });

    if (hasInvalidWeight) {
      return alert("Error: All keyword weights must be strictly between 1 and 20.");
    }

    // 3. Prevent Empty Profiles
    if (Object.keys(formattedKeywords).length === 0) {
      return alert("Error: You must provide at least one valid keyword and weight parameter.");
    }

    setIsSaving(true);

    try {
      await fetch('http://localhost:8000/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProfileName, keywords: formattedKeywords })
      });
      
      // Reset form on success
      setNewProfileName("");
      setNewKeywords([{word: "", weight: 10}]);
      await fetchConfigs();
    } catch (error) {
      console.error("Failed to save new config:", error);
      alert("Critical Error: Failed to connect to the backend API.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
          
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed right-0 top-0 h-full w-full max-w-3xl bg-[#111111] border-l border-[#2a2a2a] z-50 overflow-y-auto flex flex-col">
            
            <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] px-8 py-6 flex justify-between items-center z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#161616] border border-[#2a2a2a] rounded-xl"><Settings2 className="text-gray-300" size={24} /></div>
                <h2 className="text-xl font-semibold text-white">AI Engine Configuration</h2>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-lg bg-[#161616] border border-[#2a2a2a] hover:bg-[#222222] flex items-center justify-center text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="p-8 space-y-8 flex-1">
              
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-[#2a2a2a] pb-2">Active Scoring Profiles</h3>
                <div className="space-y-3">
                  
                  <div className="p-4 rounded-xl border border-[#2a2a2a] bg-[#161616] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-gray-200 font-semibold">Standard Legal Defaults</h4>
                        <span className="bg-gray-500/20 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Always Active (Base)</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">31 Core Urgency Parameters</p>
                    </div>
                  </div>

                  {configData?.configs?.map((conf: any) => {
                    const isActive = configData.active_ids.includes(conf.id);
                    return (
                      <div key={conf.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isActive ? 'bg-[#222222] border-emerald-500/50' : 'bg-[#161616] border-[#2a2a2a] hover:border-[#444]'}`}>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-gray-200 font-semibold">{conf.name}</h4>
                            {isActive && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Live</span>}
                          </div>
                          <p className="text-gray-500 text-xs mt-1">+{Object.keys(conf.keywords).length} Custom Parameters</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleToggleActive(conf.id)} className={`text-xs font-medium border px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-[#111111] border-[#333] hover:text-white text-gray-400'}`}>
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <button onClick={() => handleDeleteProfile(conf.id)} className="p-2 text-gray-500 hover:text-red-400 bg-[#111111] border border-[#333] hover:border-red-500/30 rounded-lg transition-colors" title="Delete Profile"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-[#2a2a2a] pb-2">Create Custom Add-On Profile</h3>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Profile Name</label>
                    <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="e.g., Extreme Fraud Weighting" className="w-full bg-[#111111] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-gray-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Define Additional Urgency Keywords & Impact Weight (1-20)</label>
                    <div className="space-y-3">
                      {newKeywords.map((kw, i) => (
                        <div key={i} className="flex space-x-3 items-center">
                          <input type="text" value={kw.word} onChange={e => { const n = [...newKeywords]; n[i].word = e.target.value; setNewKeywords(n); }} placeholder="Target word/phrase..." className="flex-1 bg-[#111111] border border-[#333] rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500 transition-colors" />
                          
                          {/* Force HTML number constraints */}
                          <input type="number" min="1" max="20" value={kw.weight} onChange={e => { const n = [...newKeywords]; n[i].weight = e.target.value; setNewKeywords(n); }} className="w-24 bg-[#111111] border border-[#333] rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500 text-center transition-colors" />
                          
                          <button onClick={() => setNewKeywords(newKeywords.filter((_, idx) => idx !== i))} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Remove Keyword"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setNewKeywords([...newKeywords, {word: "", weight: 10}])} className="mt-4 flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 font-medium transition-colors"><Plus size={16} /><span>Add Parameter</span></button>
                  </div>
                  <button onClick={handleSaveNew} disabled={isSaving} className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"><Save size={18} /><span>{isSaving ? 'Saving...' : 'Deploy Configuration'}</span></button>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}