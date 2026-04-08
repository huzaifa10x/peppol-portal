"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RefreshCw, Shield } from "lucide-react";

export default function TddsPage() {
  const [tddFiles, setTddFiles] = useState<string[]>([]);
  const [mlsLog, setMlsLog]     = useState<string>("");
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await api.tdds();
    const lines = r.tdd_files.trim().split("\n").filter(l => l.includes(".xml"));
    setTddFiles(lines);
    setMlsLog(r.mls_log);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const parseFileLine = (line: string) => {
    const parts = line.trim().split(/\s+/);
    return { size: parts[4], date: `${parts[5]} ${parts[6]} ${parts[7]}`, name: parts[8] };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TDDs & MLS</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tax Data Documents and Message Level Status log</p>
        </div>
        <button onClick={load} className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TDD files */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield size={14} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Generated TDDs ({tddFiles.length})</span>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["Filename", "Size", "Date"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tddFiles.map((line, i) => {
                  const f = parseFileLine(line);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-600 truncate max-w-[180px]">{f.name}</td>
                      <td className="px-4 py-2 text-gray-500">{f.size}</td>
                      <td className="px-4 py-2 text-gray-500">{f.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MLS Log */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">MLS Watcher Log</span>
          </div>
          <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-[500px] p-4 bg-gray-50 leading-relaxed">
            {mlsLog || "No log entries"}
          </pre>
        </div>
      </div>
    </div>
  );
}
