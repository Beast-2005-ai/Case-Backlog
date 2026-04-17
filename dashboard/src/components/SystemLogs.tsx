import { useState, useEffect } from 'react';
import { Trash2, Terminal } from 'lucide-react';

export function SystemLogs() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${apiBase}/logs`);
      
      // NEW: Check if the response is actually OK before trying to parse it
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // NEW: Ensure we only set the state if it's an actual array
      if (Array.isArray(data)) {
        setLogs(data);
        setErrorMsg(null);
      } else {
        throw new Error("Invalid data format received from server.");
      }
      
    } catch (error: any) {
      console.error("Failed to fetch logs:", error);
      setErrorMsg(error.message || "Failed to connect to backend telemetry.");
      setLogs([]); // Clear logs on error
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all system logs?")) return;
    
    try {
      await fetch(`${apiBase}/logs`, { method: 'DELETE' });
      fetchLogs(); // Refresh the empty list
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Auto-refresh logs every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col h-[calc(100vh-160px)]">
      <div className="px-6 py-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#111111]">
        <div className="flex items-center space-x-3">
          <Terminal className="text-gray-400" size={20} />
          <h2 className="text-lg font-semibold text-white">System Audit Logs</h2>
        </div>
        <button 
          onClick={clearLogs}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 size={16} />
          <span>Purge Logs</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a] font-mono text-sm text-gray-300 space-y-2">
        {loading ? (
          <div className="animate-pulse text-gray-500">Fetching telemetry data...</div>
        ) : errorMsg ? (
          <div className="text-red-500 font-semibold flex items-center space-x-2">
            <span>[SYSTEM ERROR]</span>
            <span>{errorMsg}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500 italic">No system logs found.</div>
        ) : (
          logs.map((log, idx) => {
            const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
            return (
              <div key={idx} className={`pb-2 border-b border-[#222] last:border-0 ${isError ? 'text-red-400' : 'text-gray-400'}`}>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}