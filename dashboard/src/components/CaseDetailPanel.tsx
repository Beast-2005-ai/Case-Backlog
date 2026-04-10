import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, DatabaseZap, Download, ChevronDown } from 'lucide-react';
import type { Case } from '../types';
import { PriorityGauge } from './PriorityGauge';

interface CaseDetailPanelProps {
  caseData: Case | null;
  onClose: () => void;
}

export function CaseDetailPanel({ caseData, onClose }: CaseDetailPanelProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExport = (format: string) => {
    if (!caseData) return;
    setIsExportMenuOpen(false);

    let xaiData = null;
    try {
      if (caseData.justification.startsWith('XAI_DATA: ')) {
        xaiData = JSON.parse(caseData.justification.replace('XAI_DATA: ', ''));
      }
    } catch(e) {}

    // 1. RAW TEXT / JSON (No graphs)
    if (format === 'JSON') {
      const exportData = { id: caseData.id, type: caseData.type, score: caseData.priorityScore, summary: caseData.summary };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${caseData.id}.json`);
      return;
    }
    
    if (format === 'TXT') {
      const textContent = `CASE ID: ${caseData.id}\nTYPE: ${caseData.type}\nSCORE: ${caseData.priorityScore}\n\nSUMMARY:\n${caseData.summary}`;
      const blob = new Blob([textContent], { type: 'text/plain' });
      downloadBlob(blob, `${caseData.id}.txt`);
      return;
    }

    // 2. VISUAL FORMATS (PDF / DOCX) - Includes simulated bar graphs using HTML/CSS
    const buildVisualHtml = () => {
      let xaiHtml = '<p>No ML data available</p>';
      if (xaiData && xaiData.xai) {
        xaiHtml = xaiData.xai.map((item: any) => `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span>${item.feature}</span>
              <span style="color: ${item.direction==='positive' ? '#dc2626' : '#6b7280'};">
                ${item.direction==='positive'?'+':''}${item.impact} pts
              </span>
            </div>
            <div style="width: 100%; background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 4px;">
              <div style="width: ${(Math.abs(item.impact) / 30) * 100}%; background: ${item.direction==='positive' ? '#ef4444' : '#9ca3af'}; height: 100%;"></div>
            </div>
          </div>
        `).join('');
      }

      return `
        <html>
          <head>
            <title>${caseData.id} - Docket Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
              .header { border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { margin: 0 0 10px 0; font-size: 28px; }
              .meta-box { background: #f4f4f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
              .score-val { font-size: 24px; color: #dc2626; font-weight: bold; }
              h2 { font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header"><h1>Legal Triage Docket</h1><div>OFFICIAL CASE EXPORT • ${new Date().toLocaleDateString()}</div></div>
            <div class="meta-box">
              <div><strong>Case ID:</strong> ${caseData.id} | <strong>Type:</strong> ${caseData.type}</div>
              <div class="score-val">Priority Score: ${caseData.priorityScore} / 100</div>
            </div>
            <h2>Extracted Case Facts</h2>
            <p>${caseData.summary}</p>
            <h2>Machine Learning Explainability (SHAP)</h2>
            ${xaiHtml}
          </body>
        </html>
      `;
    };

    if (format === 'PDF' || format === 'IMG') {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(buildVisualHtml());
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      }
      return;
    }

    if (format === 'DOCX') {
      // Word can perfectly parse HTML if saved as .doc
      const blob = new Blob(['\ufeff', buildVisualHtml()], { type: 'application/msword' });
      downloadBlob(blob, `${caseData.id}.doc`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderScoringFactors = (justification: string) => {
    if (justification.startsWith('XAI_DATA: ')) {
      try {
        const data = JSON.parse(justification.replace('XAI_DATA: ', ''));
        const maxImpact = Math.max(...data.xai.map((item: any) => Math.abs(item.impact)));

        return (
          <div className="space-y-6">
            <div className="bg-[#222222] border border-[#333] rounded-lg p-5">
              <div className="flex items-center space-x-2 mb-3 border-b border-[#333] pb-2">
                <DatabaseZap size={16} className="text-[#D4AF37]" />
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Closest Historical Precedent</span>
              </div>
              <div className="text-gray-200 font-mono text-sm font-bold mb-1">{data.precedent_id || "US-SCOTUS-XXXX"}</div>
              <p className="text-gray-400 text-sm italic leading-relaxed">"{data.precedent_text}"</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-[#2a2a2a] pb-2">
                ML Feature Importance (Why it got this score)
              </h4>
              <div className="space-y-3">
                {data.xai.map((item: any, idx: number) => {
                  const barWidth = `${(Math.abs(item.impact) / maxImpact) * 100}%`;
                  const isPositive = item.direction === 'positive';
                  return (
                    <div key={idx} className="flex flex-col space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium">{item.feature}</span>
                        <span className={`font-semibold ${isPositive ? 'text-red-400' : 'text-gray-500'}`}>{isPositive ? '+' : ''}{item.impact} pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: barWidth }} transition={{ duration: 0.8, delay: idx * 0.1 }} className={`h-full rounded-full ${isPositive ? 'bg-red-500' : 'bg-gray-500'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      } catch (e) { }
    }
    return <div className="text-gray-400 text-sm italic">Awaiting ML processing...</div>;
  };

  return (
    <AnimatePresence>
      {caseData && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }} className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#111111] border-l border-[#2a2a2a] z-50 overflow-y-auto flex flex-col">
            
            <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-[#161616] border border-[#2a2a2a] rounded-xl"><FileText className="text-gray-300" size={24} /></div>
                <div><h2 className="text-xl font-semibold text-white">{caseData.id}</h2><p className="text-gray-500 text-sm">{caseData.type}</p></div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-lg bg-[#161616] border border-[#2a2a2a] hover:bg-[#222222] flex items-center justify-center text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="px-8 py-8 space-y-8 flex-1">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Priority Assessment</h3>
                <div className="flex items-center space-x-6 bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
                  <PriorityGauge score={caseData.priorityScore} />
                  <div><div className="text-3xl font-bold text-white mb-1">{caseData.priorityScore}/100</div><div className="text-gray-500 text-sm font-medium">Algorithmic Priority Score</div></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Scoring Breakdown</h3>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
                  {renderScoringFactors(caseData.justification)}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Extracted Case Facts</h3>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6"><p className="text-gray-300 leading-relaxed text-sm">{caseData.summary}</p></div>
              </div>
            </div>

            {/* EXPORT DROPDOWN FOOTER */}
            <div className="p-8 border-t border-[#2a2a2a] bg-[#111111] sticky bottom-0 z-20">
              <div className="relative">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3.5 rounded-lg flex items-center justify-between px-6 transition-all shadow-sm"
                >
                  <div className="flex items-center space-x-3"><Download size={18} /><span>Export Docket Data</span></div>
                  <ChevronDown size={18} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isExportMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#161616] border border-[#333] rounded-lg shadow-xl overflow-hidden py-1 z-30">
                    <button onClick={() => handleExport('PDF')} className="w-full text-left px-5 py-3 text-sm text-gray-200 hover:bg-[#222] transition-colors">Export as PDF (Visual)</button>
                    <button onClick={() => handleExport('DOCX')} className="w-full text-left px-5 py-3 text-sm text-gray-200 hover:bg-[#222] transition-colors border-t border-[#222]">Export as Word DOCX (Visual)</button>
                    <button onClick={() => handleExport('IMG')} className="w-full text-left px-5 py-3 text-sm text-gray-200 hover:bg-[#222] transition-colors border-t border-[#222]">Export as Image / Print</button>
                    <button onClick={() => handleExport('JSON')} className="w-full text-left px-5 py-3 text-sm text-gray-400 hover:bg-[#222] hover:text-gray-200 transition-colors border-t border-[#333]">Download JSON (Raw Data)</button>
                    <button onClick={() => handleExport('TXT')} className="w-full text-left px-5 py-3 text-sm text-gray-400 hover:bg-[#222] hover:text-gray-200 transition-colors border-t border-[#222]">Download TXT (Raw Text)</button>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}