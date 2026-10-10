import React, { useState } from 'react';
import {
  Code2,
  Database,
  Server,
  FileCode,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ARCHITECTURE_DOCUMENTATION, DocSection } from '../data/architectureDocs';

export const ArchitectureDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schemas' | 'apis' | 'prototype'>('schemas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              <span>সিস্টেম আর্কিটেকচার ও ডেলিভারেবলস (Architecture & API Design)</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
              সিনিয়র ইঞ্জিনিয়ারিং ডেলিভারেবলস
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            মঙ্গোডিবি / এসকিউএল স্কিমা, ব্যাকএন্ড রেস্ট এপিআই (REST API) ডিজাইন এবং সিঙ্গেল-ফাইল প্রোটোটাইপ কোড
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('schemas')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'schemas'
                ? 'bg-white text-indigo-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ১. ডাটাবেজ স্কিমা (Schemas)
          </button>
          <button
            onClick={() => setActiveTab('apis')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'apis'
                ? 'bg-white text-indigo-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ২. রেস্ট এপিআই (API Endpoints)
          </button>
          <button
            onClick={() => setActiveTab('prototype')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'prototype'
                ? 'bg-white text-indigo-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ৩. সিঙ্গেল-ফাইল প্রোটোটাইপ
          </button>
        </div>
      </div>

      {/* Tab 1: Database Schemas */}
      {activeTab === 'schemas' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl text-xs text-indigo-950 flex items-start gap-3">
            <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-indigo-900 text-sm">
                ডাটাবেজ আর্কিটেকচার স্ট্রাকচার (MongoDB Mongoose & SQLite Relational DDL)
              </h4>
              <p className="text-indigo-800 mt-1">
                উভয় ডাটাবেজ আর্কিটেকচারেই দৈনিক ট্রানজেকশন, কাস্টমার বকেয়া লেজার, এমএফএস এজেন্ট ওয়ালেট
                এবং ইনভেন্টরি স্টক ট্র্যাকিং নিশ্চিত করা হয়েছে।
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {ARCHITECTURE_DOCUMENTATION.databaseSchemas.map((schema) => (
              <div
                key={schema.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md text-slate-200"
              >
                <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{schema.titleBn}</h3>
                    <p className="text-[11px] text-slate-400">{schema.titleEn} • {schema.description}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(schema.id, schema.code)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    {copiedId === schema.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কোড কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed max-h-[500px]">
                  <code>{schema.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: REST API Endpoints */}
      {activeTab === 'apis' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-950 flex items-start gap-3">
            <Server className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">
                ব্যাকএন্ড এক্সপ্রেস / নোড এপিআই ডিজাইন (Backend Express.js Controllers)
              </h4>
              <p className="text-emerald-800 mt-1">
                ট্রানজেকশন এন্ট্রি, স্টক স্বয়ংক্রিয় ডিডাকশন, কাস্টমার বকেয়া খতিয়ান আপডেট এবং দৈনিক লাভ-ক্ষতি
                হিসাব করার শক্তিশালী এগ্রিগেশন পাইপলাইন কোড।
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {ARCHITECTURE_DOCUMENTATION.apiEndpoints.map((api) => (
              <div
                key={api.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md text-slate-200"
              >
                <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{api.titleBn}</h3>
                    <p className="text-[11px] text-slate-400">{api.titleEn} • {api.description}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(api.id, api.code)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    {copiedId === api.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>এপিআই কোড কপি</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono overflow-x-auto text-blue-300 leading-relaxed max-h-[500px]">
                  <code>{api.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Single-File Prototype Layout */}
      {activeTab === 'prototype' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
            <FileCode className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                সিঙ্গেল-ফাইল এইচটিএমএল + টেলউইন্ড প্রোটোটাইপ লেআউট (Single-File Prototype)
              </h4>
              <p className="text-amber-800 mt-1">
                সম্পূর্ণ সেলফ-কন্টেইন্ড এইচটিএমএল৫ ও টেলউইন্ড সিএসএস ফাইল যা যেকোনো ব্রাউজারে ডাবল ক্লিক করলেই
                ড্যাশবোর্ড ও লেনদেন ফর্ম প্রদর্শন করে।
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md text-slate-200">
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  prototype_dashboard_form.html
                </h3>
                <p className="text-[11px] text-slate-400">
                  Single-file prototype layout (HTML + Tailwind CSS) for Dashboard and Add Transaction form
                </p>
              </div>
              <button
                onClick={() =>
                  handleCopy('prototype-html', ARCHITECTURE_DOCUMENTATION.singleFilePrototypeLayout)
                }
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                {copiedId === 'prototype-html' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>সম্পূর্ণ HTML কপি করুন</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono overflow-x-auto text-amber-200 leading-relaxed max-h-[550px]">
              <code>{ARCHITECTURE_DOCUMENTATION.singleFilePrototypeLayout}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
