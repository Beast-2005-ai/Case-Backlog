import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download } from 'lucide-react';
import type { Case } from '../types';
import { PriorityGauge } from './PriorityGauge';

interface CaseDetailPanelProps {
  caseData: Case | null;
  onClose: () => void;
}

export function CaseDetailPanel({ caseData, onClose }: CaseDetailPanelProps) {
  const handleExport = () => {
    if (!caseData) return;
    const exportData = {
      caseId: caseData.id,
      type: caseData.type,
      priorityScore: caseData.priorityScore,
      summary: caseData.summary,
      justification: caseData.justification,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.id}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to make the AI Justification look like neat badges
  const renderScoringFactors = (justification: string) => {
    // Remove the "SCORE LOGIC:" prefix and split by the pipe symbol
    const factors = justification.replace('SCORE LOGIC: ', '').split(' | ');
    return (
      <div className="flex flex-wrap gap-2">
        {factors.map((factor, idx) => (
          <span key={idx} className="bg-[#222222] border border-[#333] text-gray-300 px-3 py-1.5 rounded-md text-sm font-medium">
            {factor.trim()}
          </span>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {caseData && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#111111] border-l border-[#2a2a2a] z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-[#161616] border border-[#2a2a2a] rounded-xl">
                  <FileText className="text-gray-300" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{caseData.id}</h2>
                  <p className="text-gray-500 text-sm">{caseData.type}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-[#161616] border border-[#2a2a2a] hover:bg-[#222222] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 py-8 space-y-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-100 uppercase tracking-wider mb-3">
                  Priority Assessment
                </h3>
                <div className="flex items-center space-x-6 bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
                  <PriorityGauge score={caseData.priorityScore} />
                  <div>
                    <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                      {caseData.priorityScore}/100
                    </div>
                    <div className="text-gray-500 text-sm font-medium">Semantic Score</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-100 uppercase tracking-wider mb-3">
                  Scoring Breakdown
                </h3>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
                  {/* Now it renders neat badges instead of a wall of text! */}
                  {renderScoringFactors(caseData.justification)}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-100 uppercase tracking-wider mb-3">
                  Summary
                </h3>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {caseData.summary}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleExport}
                  className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3.5 rounded-lg flex items-center justify-center space-x-3 transition-all shadow-sm"
                >
                  <Download size={18} />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}