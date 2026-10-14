'use client';

import React from 'react';
import { BookOpen, Layers, ArrowRight, CheckCircle2, Code2, Server } from 'lucide-react';

export const Epic2IntegrationDocs: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
            Tarea #32 • Documentación Técnica
          </span>
          <h3 className="text-xl font-bold">Integración Futura - EPIC 2</h3>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        El motor NLP actual implementa la infraestructura completa en <strong>TypeScript + Node.js + Transformers.js</strong>.
        A continuación se especifica la arquitectura de datos entre los datos estáticos de <code>datos.json</code> y el motor semántico dinámico.
      </p>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold font-mono">
            <Server className="w-4 h-4" />
            <span>Fase Actual (Mock / Engine Standalone)</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1.5 font-mono">
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Candidatos provienen de <code>datos.json</code> (8 perfiles completos).</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span><code>affinity</code> representa el score histórico en el JSON.</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span><code>nlpScore</code> es el cálculo de similitud para una búsqueda dada.</span>
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold font-mono">
            <Layers className="w-4 h-4" />
            <span>Futura Integración Backend EPIC 2</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1.5 font-mono">
            <li className="flex items-center space-x-1.5">
              <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Frontend enviará la oferta laboral al endpoint <code>/api/nlp/search</code>.</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Backend procesará el vector <code>feature-extraction</code> con Transformers.js.</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
              <span>El frontend actualizará en tiempo real el carrusel (#30) y el radar HU-1.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[10px]">
          <span>src/nlpEngine.ts</span>
          <span>TypeScript ESM</span>
        </div>
        <pre className="text-blue-300">
{`/*
 * EPIC 2 CONTRATO DE INTERFAZ SEARCH RESULT:
 * export interface SearchResult extends Candidate {
 *   nlpScore: number; // Porcentaje de similitud semántica calculado (0-100%)
 * }
 */`}
        </pre>
      </div>
    </div>
  );
};
