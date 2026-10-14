'use client';

import React, { useState } from 'react';
import { Award, FileText, CheckCircle2, ShieldCheck, ExternalLink, Calendar, Code, Database, Cloud, Lock, ShieldAlert, Target, Mail } from 'lucide-react';

export interface CandidateEvidenceProps {
  candidateName: string;
}

export const EvidenceBreakdown: React.FC<CandidateEvidenceProps> = ({ candidateName }) => {
  const [activeAreaTab, setActiveAreaTab] = useState('desarrollo');

  const tabs = [
    { id: 'desarrollo', label: 'Desarrollo de Software', score: 85, icon: Code },
    { id: 'datos', label: 'Ciencia de Datos & IA', score: 74, icon: Database },
    { id: 'cloud', label: 'Cloud & DevOps', score: 68, icon: Cloud },
    { id: 'gestion', label: 'Gestión de TI & Gob.', score: 58, icon: ShieldAlert },
    { id: 'ciberseguridad', label: 'Ciberseguridad & Redes', score: 52, icon: Lock },
    { id: 'qa', label: 'Aseguramiento de Calidad (QA)', score: 45, icon: Target },
  ];

  const evidenceData: Record<string, Array<{
    type: string;
    subType: string;
    title: string;
    subtitle: string;
    date: string;
    actionLabel: string;
    iconColor: string;
  }>> = {
    desarrollo: [
      {
        type: 'TÍTULO EN PROVISIÓN NACIONAL',
        subType: 'Registro SIS N° 201704982 • Validado por DRE UMSS',
        title: 'Licenciatura en Informática (Mención Ingeniería de Software)',
        subtitle: 'Facultad de Ciencias y Tecnología - Universidad Mayor de San Simón. Aprobado con Acta de Grado y Honores Académicos.',
        date: '18 de Noviembre, 2022',
        actionLabel: 'Ver Acta SIS',
        iconColor: 'bg-amber-100 text-amber-800 border-amber-300',
      },
      {
        type: 'POSGRADO UNIVERSITARIO FCYT',
        subType: 'Certificado Folio: PS-2023-0319 • 120 Horas Académicas',
        title: 'Arquitectura de Microservicios con Spring Boot, Kafka y Docker',
        subtitle: 'Dirección de Posgrado en Ciencias de la Computación - Docente Guía: Dr. R. Peñaranda. Nota final: 98/100.',
        date: 'Julio 2023',
        actionLabel: 'Ver Certificado',
        iconColor: 'bg-blue-100 text-blue-800 border-blue-300',
      },
      {
        type: 'CERTIFICACIÓN DE INDUSTRIA GLOBAL',
        subType: 'Badge ID: AWS-04821X-DVA • Credly / AWS Validated',
        title: 'AWS Certified Developer - Associate',
        subtitle: 'Amazon Web Services Inc. Validación de competencias en computación sin servidor (Lambda, ECS, DynamoDB y CI/CD Pipelines).',
        date: '2023 - 2026',
        actionLabel: 'Verificar Credly',
        iconColor: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      {
        type: 'PROYECTO DE GRADO / TESIS',
        subType: 'Calificación: 98/100 (Distinción Máxima) • Repositorio UMSS Indexado',
        title: 'Plataforma Distribuida de Gestión Académica de Alta Disponibilidad con Arquitectura Basada en Eventos',
        subtitle: 'Tribunal Examinador: M.Sc. Carlos Balderrama, Lic. Patricia Vargas. Implementación en Go, PostgreSQL distribuido y Kafka.',
        date: 'Octubre 2022',
        actionLabel: 'Leer en Repositorio',
        iconColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      },
      {
        type: 'CERTIFICADO PROFESIONAL',
        subType: 'Cert ID: META-FE-77201 • Verificado vía Coursera',
        title: 'Meta Certified Front-End Developer Specialization',
        subtitle: 'Meta Platforms Inc., 5 cursos completados: React Avanzado, Diseño de UI/UX con Figma, Arquitectura Modular y Pruebas Unitarias con Jest.',
        date: 'Marzo 2023',
        actionLabel: 'Ver Certificado',
        iconColor: 'bg-sky-100 text-sky-800 border-sky-300',
      },
    ],
    datos: [
      {
        type: 'DIPLOMADO DE POSGRADO',
        subType: 'Folio POS-AI-2023 • 200 Horas Académicas',
        title: 'Especialización en Machine Learning & Deep Learning con Python',
        subtitle: 'Centro de Posgrado FCyT UMSS. Desarrollo de redes neuronales convolucionales, modelos LLM y visualización avanzada.',
        date: 'Agosto 2023',
        actionLabel: 'Ver Diploma',
        iconColor: 'bg-purple-100 text-purple-800 border-purple-300',
      }
    ],
    cloud: [
      {
        type: 'CERTIFICACIÓN INTERNACIONAL',
        subType: 'Credly Verified ID: K8S-CKA-2023',
        title: 'CKA: Certified Kubernetes Administrator',
        subtitle: 'Cloud Native Computing Foundation (CNCF). Despliegue, configuración y gestión de clústeres Kubernetes en entornos de producción.',
        date: 'Septiembre 2023',
        actionLabel: 'Verificar CNCF',
        iconColor: 'bg-blue-100 text-blue-800 border-blue-300',
      }
    ],
    gestion: [
      {
        type: 'CERTIFICADO ACREDITADO',
        subType: 'Scrum Alliance ID: 00129481',
        title: 'Certified Scrum Master (CSM)',
        subtitle: 'Facilitación de equipos ágiles, remoción de impedimentos y gestión de entregas en ciclos iterativos.',
        date: 'Enero 2024',
        actionLabel: 'Ver Credencial',
        iconColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      }
    ],
    ciberseguridad: [
      {
        type: 'CAPACITACIÓN FCYT',
        subType: 'Certificado de Auditoría N° 9812',
        title: 'Auditoría de Seguridad e Implementación de ISO 27001',
        subtitle: 'Análisis de vulnerabilidades, pentesting de aplicaciones web y hardening de infraestructura enterprise.',
        date: 'Mayo 2023',
        actionLabel: 'Ver Certificado',
        iconColor: 'bg-red-100 text-red-800 border-red-300',
      }
    ],
    qa: [
      {
        type: 'CERTIFICACIÓN QA',
        subType: 'ISTQB Certified Tester',
        title: 'ISTQB Foundation Level Test Automation',
        subtitle: 'Diseño de suite de pruebas con Cypress, Selenium WebDriver e integración continua en Jenkins/GitHub Actions.',
        date: 'Febrero 2023',
        actionLabel: 'Verificar ISTQB',
        iconColor: 'bg-teal-100 text-teal-800 border-teal-300',
      }
    ]
  };

  const currentEvidenceList = evidenceData[activeAreaTab] || evidenceData['desarrollo'];
  const activeTabObj = tabs.find((t) => t.id === activeAreaTab) || tabs[0];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
      {/* Header Banner */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-abyssal-blue text-white text-[10px] font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-burning-flame" />
          <span>EXPEDIENTE ACADÉMICO Y CERTIFICACIONES VERIFICADAS</span>
        </div>
        <h3 className="text-xl font-black text-abyssal-blue tracking-tight">
          Desglose de Evidencia: <span className="text-truffle-trouble">{candidateName}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Validado en tiempo real con la Dirección de Registros e Inscripciones (DRE) y el Centro de Posgrado FCyT.
        </p>
      </div>

      {/* 6 Area Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAreaTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAreaTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                isActive
                  ? 'bg-truffle-trouble text-white border-truffle-trouble shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-palladian border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {tab.score}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Area Summary Header */}
      <div className="bg-truffle-trouble/10 border border-truffle-trouble/20 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-truffle-trouble text-white font-bold text-sm">
            {activeTabObj.score}%
          </div>
          <div>
            <h4 className="font-bold text-abyssal-blue text-sm">{activeTabObj.label}</h4>
            <p className="text-xs text-slate-600">
              {currentEvidenceList.length} respaldos formales registrados: Título Profesional, Certificados e Investigaciones.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 hidden sm:inline-flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Aprobación Académica por Consejo Facultativo FCyT</span>
        </span>
      </div>

      {/* Evidence Cards List */}
      <div className="space-y-4">
        {currentEvidenceList.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${item.iconColor}`}>
                {item.type}
              </span>
              <span className="text-[11px] font-mono text-slate-500">{item.subType}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h5 className="font-bold text-slate-900 text-sm">{item.title}</h5>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.subtitle}</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                </span>

                <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center space-x-1">
                  <span>{item.actionLabel}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <span className="text-[11px] text-slate-600 font-mono max-w-xl flex items-start space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Datos protegidos bajo el Reglamento de Protección de Datos y Privacidad Alumni FCyT (Resolución Facultativa 412/2023).</span>
        </span>

        <div className="flex items-center space-x-3 shrink-0">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-xs hover:bg-slate-50 transition-colors">
            Agendar Entrevista Técnica
          </button>
          <button className="px-5 py-2 bg-burning-flame hover:bg-burning-flame/90 text-abyssal-blue text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Enviar Propuesta Laboral</span>
          </button>
        </div>
      </div>
    </div>
  );
};