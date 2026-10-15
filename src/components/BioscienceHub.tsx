import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Activity, 
  Clock
} from 'lucide-react';

interface BioscienceHubProps {
  isDarkMode: boolean;
}

interface BioInspectResult {
  accession: string;
  durationMs: number;
  alphaFold: {
    entryId: string;
    gene: string;
    organism: string;
    cifUrl: string;
    pdbUrl: string;
    paeDocUrl: string;
    sequenceLength: number;
  } | null;
  uniprot: {
    primaryAccession: string;
    proteinName: string;
    organismName: string;
    genes: string[];
    commentsCount: number;
    featuresCount: number;
  } | null;
  provenance: {
    alphaFold: string;
    uniprot: string;
    status: string;
  };
}

const SAMPLE_ENTITIES = [
  { label: 'TP53 (P04637)', accession: 'P04637', name: 'Cellular tumor antigen p53' },
  { label: 'BRCA1 (P38398)', accession: 'P38398', name: 'Breast cancer type 1 susceptibility protein' },
  { label: 'EGFR (P00533)', accession: 'P00533', name: 'Epidermal growth factor receptor' },
  { label: 'PCSK9 (Q8NBP7)', accession: 'Q8NBP7', name: 'Proprotein convertase subtilisin/kexin 9' },
  { label: 'ABL1 (P00520)', accession: 'P00520', name: 'Tyrosine-protein kinase ABL1' },
];

export const BioscienceHub: React.FC<BioscienceHubProps> = ({ isDarkMode }) => {
  const [accessionInput, setAccessionInput] = useState('P04637');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BioInspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBioData = async (acc: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bioscience/inspect/${acc.trim().toUpperCase()}`);
      if (!res.ok) {
        throw new Error(`Failed to query bioscience APIs (HTTP ${res.status})`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with upstream bioinformatics services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBioData('P04637');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Dna className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bioscience Infrastructure & API Observability</h1>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} mt-0.5`}>
              Integrated life-sciences service monitor probing AlphaFold DB (EMBL-EBI), UniProtKB, and RCSB PDB with epistemic provenance.
            </p>
          </div>
        </div>

        {/* Reference Target Chips with Smooth Rounded-Full Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-semibold'}`}>Biomolecular Reference Targets:</span>
          {SAMPLE_ENTITIES.map(entity => (
            <button
              key={`bio_sample_${entity.accession}`}
              onClick={() => {
                setAccessionInput(entity.accession);
                fetchBioData(entity.accession);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
                accessionInput === entity.accession
                  ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/20 font-semibold'
                  : isDarkMode 
                    ? 'bg-[#14161a] border-zinc-700 text-zinc-300 hover:border-teal-500/50' 
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-teal-500'
              }`}
            >
              {entity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar with Smooth 3XL Curvature */}
      <div className={`p-5 rounded-3xl border ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
      } shadow-sm`}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (accessionInput.trim()) fetchBioData(accessionInput);
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-4 top-3.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={accessionInput}
              onChange={(e) => setAccessionInput(e.target.value)}
              placeholder="Enter UniProt accession ID (e.g. P04637, P38398, P00533)..."
              className={`w-full pl-11 pr-4 py-2.5 text-xs font-mono rounded-full border focus:outline-none transition-all ${
                isDarkMode 
                  ? 'bg-[#14161a] border-zinc-700 text-zinc-100 focus:border-teal-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-600'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold rounded-full bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center gap-2"
          >
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            <span>{loading ? 'Probing...' : 'Inspect Service'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className={`p-4 rounded-2xl border text-xs ${
          isDarkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
        }`}>
          <strong>Service Query Failed:</strong> {error}
        </div>
      )}

      {/* Response Display with Smooth 3XL Cards */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: AlphaFold DB Prediction Inspection */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
            isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
          } space-y-4`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                    [Predicted by model]
                  </span>
                  <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>AFDB v6</span>
                </div>
                <h3 className={`font-bold text-base mt-1.5 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>AlphaFold Protein Structure</h3>
                <p className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Target: {result.alphaFold?.gene || result.accession} ({result.alphaFold?.entryId || 'AF-' + result.accession})
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Operational ({result.durationMs}ms)
              </span>
            </div>

            {/* Canonical AlphaFold pLDDT Confidence Legend with Smooth Rounded-Full Indicators */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] font-mono font-semibold block ${isDarkMode ? 'text-zinc-400' : 'text-slate-700'}`}>
                AlphaFold pLDDT Confidence Tiers:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0053D6]" />
                  <span className={isDarkMode ? 'text-zinc-300' : 'text-slate-700'}>&gt; 90 (Very High)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#65CBF3]" />
                  <span className={isDarkMode ? 'text-zinc-300' : 'text-slate-700'}>70-90 (Confident)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FFDB13]" />
                  <span className={isDarkMode ? 'text-zinc-300' : 'text-slate-700'}>50-70 (Low)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF7D45]" />
                  <span className={isDarkMode ? 'text-zinc-300' : 'text-slate-700'}>&lt; 50 (Very Low)</span>
                </div>
              </div>
            </div>

            {result.alphaFold ? (
              <div className={`space-y-2 text-xs font-mono ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                <div className={`flex justify-between py-1.5 border-b ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}>Organism:</span>
                  <span className={isDarkMode ? 'text-zinc-200' : 'text-slate-900'}>{result.alphaFold.organism}</span>
                </div>
                <div className={`flex justify-between py-1.5 border-b ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}>Sequence Length:</span>
                  <span className={isDarkMode ? 'text-zinc-200' : 'text-slate-900'}>{result.alphaFold.sequenceLength} amino acids</span>
                </div>
                <div className={`flex justify-between py-1.5 border-b ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}>mmCIF Model:</span>
                  <a 
                    href={result.alphaFold.cifUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Download .cif</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}>PAE Matrix JSON:</span>
                  <a 
                    href={result.alphaFold.paeDocUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Inspect PAE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">No AlphaFold DB record found for {result.accession}.</div>
            )}
          </div>

          {/* Card 2: UniProtKB Annotation Service Inspection */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
            isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
          } space-y-4`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    [Literature curated]
                  </span>
                  <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>UniProtKB/Swiss-Prot</span>
                </div>
                <h3 className={`font-bold text-base mt-1.5 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>UniProtKB Functional Annotations</h3>
                <p className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Accession: {result.accession}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified REST
              </span>
            </div>

            {result.uniprot ? (
              <div className="space-y-3.5 text-xs">
                <div className={`p-3.5 rounded-2xl border space-y-1 ${
                  isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`font-mono text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Recommended Name:</div>
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{result.uniprot.proteinName}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase block ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Curated Features</span>
                    <span className="text-base font-bold text-teal-600 dark:text-teal-400">{result.uniprot.featuresCount}</span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] uppercase block ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Functional Comments</span>
                    <span className="text-base font-bold text-teal-600 dark:text-teal-400">{result.uniprot.commentsCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className={`font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-600'}`}>Official UniProt Portal:</span>
                  <a
                    href={`https://www.uniprot.org/uniprotkb/${result.accession}/entry`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    <span>View UniProt Entry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">No UniProt record found for {result.accession}.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
