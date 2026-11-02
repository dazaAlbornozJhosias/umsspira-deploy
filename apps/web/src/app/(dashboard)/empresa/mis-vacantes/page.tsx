'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, FolderOpen, Search, Eye, Pencil, MoreVertical, 
  Pause, Trash2, Laptop, Building2, Users, BarChart2, Calendar, Ban, Plus
} from 'lucide-react';
import { getAccessToken } from '@/shared/services/auth-session';
import { API_BASE_URL } from '@/shared/config/api';

interface Vacante {
  id: string;
  titulo: string;
  tecnologias: string;
  modalidad: string;
  nivel: string;
  estado: 'ACTIVA' | 'PAUSADA' | 'CERRADA' | 'BORRADOR';
  fecha_publicacion: string;
}

export default function MisVacantesPage() {
  const router = useRouter();
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterModalidad, setFilterModalidad] = useState('Todas');
  const [filterNivel, setFilterNivel] = useState('Todos');
  
  const [vacanteACerrar, setVacanteACerrar] = useState<Vacante | null>(null);
  const [isCerrando, setIsCerrando] = useState(false);
  const [vacanteAEliminar, setVacanteAEliminar] = useState<Vacante | null>(null);
  const [isEliminando, setIsEliminando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  useEffect(() => {
    const fetchVacantes = async () => {
      setIsLoading(true);
      try {
        const token = getAccessToken();
        const response = await fetch(`${API_BASE_URL}/api/v1/vacantes/mis-vacantes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Error al cargar');
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          setVacantes([]);
          return;
        }
        
        const formateadas = data.map((v: any) => {
          const estadoRaw = String(v.estado || '').toUpperCase().trim();
          const modalidadRaw = String(v.modalidad || '').toUpperCase().trim();
          const nivelRaw = String(v.nivel_experiencia || '').toUpperCase().trim();

          let estadoUI: 'ACTIVA' | 'PAUSADA' | 'CERRADA' | 'BORRADOR' = 'BORRADOR';
          if (['PUBLICADO', 'PUBLICADA', 'ACTIVA', 'ACTIVO', 'ACTIVE', 'PUBLISHED'].includes(estadoRaw)) estadoUI = 'ACTIVA';
          if (['PAUSADO', 'PAUSADA', 'PAUSED'].includes(estadoRaw)) estadoUI = 'PAUSADA';
          if (['CERRADO', 'CERRADA', 'CLOSED'].includes(estadoRaw)) estadoUI = 'CERRADA';

          let modalidadUI = 'Presencial';
          if (['REMOTO', 'REMOTE'].includes(modalidadRaw)) modalidadUI = 'Remoto';
          if (['HIBRIDO', 'HÍBRIDO', 'HYBRID', 'HIBRIDA', 'HÍBRIDA'].includes(modalidadRaw)) modalidadUI = 'Híbrido';

          let nivelUI = 'Senior';
          if (['JUNIOR', 'JR', 'SIN_EXPERIENCIA'].includes(nivelRaw)) nivelUI = 'Junior';
          if (['SEMI-SENIOR', 'SEMISENIOR', 'SEMI_SENIOR', 'MID'].includes(nivelRaw)) nivelUI = 'Semi-Senior';

          return {
            id: v.id,
            titulo: v.titulo,
            tecnologias: v.descripcion_tecnica || 'Sin descripción',
            modalidad: modalidadUI,
            nivel: nivelUI,
            estado: estadoUI,
            fecha_publicacion: v.created_at ? new Date(v.created_at).toLocaleDateString('es-ES') : 'Sin fecha',
          };
        });

        setVacantes(formateadas);
      } catch (error) {
        console.error("Error al cargar de la BD:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVacantes();
  }, []);

  const handlePausar = async (vacante: Vacante) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/vacantes/${vacante.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'PAUSADA' })
      });

      if (!response.ok) throw new Error('Error al pausar');
      
      setVacantes((prev) => 
        prev.map((v) => v.id === vacante.id ? { ...v, estado: 'PAUSADA' } : v)
      );
      setMenuAbierto(null);
    } catch (error) {
      alert("Error al pausar la vacante.");
    }
  };

  const handleConfirmarCierre = async () => {
    if (!vacanteACerrar) return;
    setIsCerrando(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/vacantes/${vacanteACerrar.id}/cerrar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cerrar');
      setVacantes((prev) => 
        prev.map((v) => v.id === vacanteACerrar.id ? { ...v, estado: 'CERRADA' } : v)
      );
      setVacanteACerrar(null);
    } catch (error) {
      alert("Error al cerrar la vacante en la base de datos.");
    } finally {
      setIsCerrando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!vacanteAEliminar) return;
    setIsEliminando(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/vacantes/${vacanteAEliminar.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al eliminar');
      
      setVacantes((prev) => prev.filter((v) => v.id !== vacanteAEliminar.id));
      setVacanteAEliminar(null);
    } catch (error) {
      alert("Error al eliminar la vacante. Es posible que tenga postulantes asociados.");
    } finally {
      setIsEliminando(false);
    }
  };

  const handleEditar = (id: string) => {
    router.push(`/empresa/mis-vacantes/${id}/editar`);
  };

  const getBadgeStyle = (estado: string) => {
    switch(estado) {
      case 'ACTIVA': return { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' };
      case 'PAUSADA': return { bg: '#fef3c7', color: '#b45309', dot: '#f59e0b' };
      case 'CERRADA': return { bg: '#e5e7eb', color: '#374151', dot: '#6b7280' };
      default: return { bg: '#f9fafb', color: '#9ca3af', dot: '#d1d5db' };
    }
  };

  const vacantesFiltradas = vacantes.filter(v => {
    const matchSearch = v.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    let matchTab = activeTab === 'Todas';
    if (activeTab === 'Activas') matchTab = v.estado === 'ACTIVA';
    if (activeTab === 'Pausadas') matchTab = v.estado === 'PAUSADA';
    if (activeTab === 'Cerradas') matchTab = v.estado === 'CERRADA';
    if (activeTab === 'Borradores') matchTab = v.estado === 'BORRADOR';
    const matchEstado = filterEstado === 'Todos' || v.estado === filterEstado;
    const matchModalidad = filterModalidad === 'Todas' || v.modalidad === filterModalidad;
    const matchNivel = filterNivel === 'Todos' || v.nivel === filterNivel;
    return matchSearch && matchTab && matchEstado && matchModalidad && matchNivel;
  });

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink)' }}>Cargando vacantes...</div>;

  return (
    <div style={{ backgroundColor: 'var(--palladian)', minHeight: '100vh', padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <Link href="/empresa/vacantes/publicar" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}>
          <ArrowLeft size={16} /> Volver a Publicar Vacantes
        </Link>

        <div style={{ backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid var(--oatmeal)', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--flame)', borderRadius: '0.75rem', color: '#fff', boxShadow: '0 4px 12px rgba(255,177,98,0.3)' }}>
                <FolderOpen size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Mis vacantes publicadas
                </h1>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', margin: '0.2rem 0 0 0', fontWeight: 500 }}>
                  Gestiona tus ofertas activas y revisa su estado
                </p>
              </div>
            </div>
            
            <Link 
              href="/empresa/vacantes/publicar" 
              style={{ 
                padding: '0.65rem 1.25rem', backgroundColor: 'var(--flame)', color: '#fff', 
                borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', 
                display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(255,177,98,0.3)', transition: 'all 0.2s'
              }}
            >
              <Plus size={18} /> Publicar vacante
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '220px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Buscar</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                <input 
                  type="text" 
                  placeholder="Buscar por título..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', height: '3rem', padding: '0 1rem 0 2.75rem', borderRadius: '0.5rem', border: '1px solid var(--oatmeal)', outline: 'none', fontSize: '0.875rem', color: '#111827', backgroundColor: '#fff', fontWeight: 500 }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Estado</label>
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.5rem', border: '1px solid var(--oatmeal)', backgroundColor: '#fff', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontWeight: 500 }}>
                <option value="Todos">Todos</option>
                <option value="ACTIVA">Activa</option>
                <option value="PAUSADA">Pausada</option>
                <option value="CERRADA">Cerrada</option>
                <option value="BORRADOR">Borrador</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Modalidad</label>
              <select value={filterModalidad} onChange={(e) => setFilterModalidad(e.target.value)} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.5rem', border: '1px solid var(--oatmeal)', backgroundColor: '#fff', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontWeight: 500 }}>
                <option value="Todas">Todas</option>
                <option value="Remoto">Remoto</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Nivel</label>
              <select value={filterNivel} onChange={(e) => setFilterNivel(e.target.value)} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.5rem', border: '1px solid var(--oatmeal)', backgroundColor: '#fff', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', fontWeight: 500 }}>
                <option value="Todos">Todos</option>
                <option value="Junior">Junior</option>
                <option value="Semi-Senior">Semi-Senior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['Todas', 'Activas', 'Pausadas', 'Cerradas', 'Borradores'].map((tab) => {
              const isActive = activeTab === tab;
              let count = vacantes.length;
              if (tab === 'Activas') count = vacantes.filter(v => v.estado === 'ACTIVA').length;
              if (tab === 'Pausadas') count = vacantes.filter(v => v.estado === 'PAUSADA').length;
              if (tab === 'Cerradas') count = vacantes.filter(v => v.estado === 'CERRADA').length;
              if (tab === 'Borradores') count = vacantes.filter(v => v.estado === 'BORRADOR').length;
              
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 'bold', cursor: 'pointer',
                    backgroundColor: isActive ? '#1e293b' : '#fff', 
                    color: isActive ? '#fff' : '#111827',
                    border: isActive ? '1px solid #1e293b' : '1px solid var(--oatmeal)',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'Todas' && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#eab308' }}></div>}
                  {tab === 'Activas' && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }}></div>}
                  {tab === 'Pausadas' && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#eab308' }}></div>}
                  {tab === 'Cerradas' && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6b7280' }}></div>}
                  {tab === 'Borradores' && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>}
                  
                  {tab} <span style={{ color: isActive ? '#e2e8f0' : '#4b5563', fontWeight: '600' }}>({count})</span>
                </button>
              );
            })}
          </div>

          <div style={{ border: '1px solid var(--oatmeal)', borderRadius: '0.75rem', backgroundColor: '#fff' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2.5fr 1fr 1fr 1fr 1fr 120px', gap: '1rem', padding: '1rem', backgroundColor: '#fcfcfc', borderBottom: '1px solid var(--oatmeal)', fontSize: '0.75rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center', borderRadius: '0.75rem 0.75rem 0 0' }}>
              <div><input type="checkbox" style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--flame)' }} /></div>
              <div>Título</div>
              <div>Modalidad</div>
              <div>Nivel</div>
              <div>Estado</div>
              <div>Fecha</div>
              <div style={{ textAlign: 'center' }}>Acciones</div>
            </div>

            {vacantesFiltradas.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#4b5563', fontWeight: 500 }}>
                No se encontraron vacantes que coincidan con los filtros.
              </div>
            ) : (
              vacantesFiltradas.map((vacante, index) => {
                const badge = getBadgeStyle(vacante.estado);
                const isLast = index === vacantesFiltradas.length - 1;
                return (
                  <div 
                    key={vacante.id} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '40px 2.5fr 1fr 1fr 1fr 1fr 120px', 
                      gap: '1rem', 
                      padding: '1rem', 
                      borderBottom: !isLast ? '1px solid var(--oatmeal)' : 'none', 
                      alignItems: 'center', 
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      transition: 'background-color 0.2s',
                      borderRadius: isLast ? '0 0 0.75rem 0.75rem' : 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdfbf7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                  >
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--flame)', border: '1px solid #f43f5e', borderRadius: '4px' }} />
                    </div>

                    <div>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{vacante.titulo}</div>
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.25rem', fontWeight: 500 }}>{vacante.tecnologias}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontWeight: 500 }}>
                      {vacante.modalidad === 'Remoto' && <Laptop size={16} />}
                      {vacante.modalidad === 'Híbrido' && <Building2 size={16} />}
                      {vacante.modalidad === 'Presencial' && <Users size={16} />}
                      {vacante.modalidad}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontWeight: 500 }}>
                      <BarChart2 size={16} /> {vacante.nivel}
                    </div>

                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', backgroundColor: badge.bg, color: badge.color, padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badge.dot }}></div>
                        {vacante.estado}
                      </span>
                    </div>

                    <div style={{ color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 500 }}>
                      <Calendar size={15} /> {vacante.fecha_publicacion}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', position: 'relative' }}>
                      
                      <button 
                        onClick={() => router.push(`/empresa/mis-vacantes/${vacante.id}`)}
                        style={{ border: '1px solid var(--oatmeal)', background: '#fff', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer', color: '#374151', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--flame)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--flame)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'var(--oatmeal)'; }}>
                        <Eye size={16} />
                      </button>
                      
                      <button onClick={() => handleEditar(vacante.id)} style={{ border: '1px solid var(--oatmeal)', background: '#fff', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer', color: '#374151', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111827'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#111827'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'var(--oatmeal)'; }}>
                        <Pencil size={16} />
                      </button>

                      <button onClick={() => setMenuAbierto(menuAbierto === vacante.id ? null : vacante.id)} style={{ border: '1px solid var(--oatmeal)', background: menuAbierto === vacante.id ? '#111827' : '#fff', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer', color: menuAbierto === vacante.id ? '#fff' : '#374151', transition: 'all 0.15s' }}>
                        <MoreVertical size={16} />
                      </button>

                      {menuAbierto === vacante.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem', backgroundColor: '#fff', border: '1px solid var(--oatmeal)', borderRadius: '0.5rem', padding: '0.5rem', width: '180px', zIndex: 50, boxShadow: '0 8px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                          <button onClick={() => router.push(`/empresa/mis-vacantes/${vacante.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.8rem', color: '#111827', borderRadius: '0.4rem', fontWeight: 500 }}><Eye size={14} /> Ver detalle</button>
                          <button onClick={() => handleEditar(vacante.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.8rem', color: '#111827', borderRadius: '0.4rem', fontWeight: 500 }}><Pencil size={14} /> Editar</button>
                          
                          {/* 👇 AQUÍ ESTÁ EL BOTÓN CORREGIDO 👇 */}
                          <button onClick={() => router.push(`/empresa/mis-vacantes/${vacante.id}/candidatos`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.8rem', color: '#111827', borderRadius: '0.4rem', fontWeight: 500 }}><Users size={14} /> Ver postulantes</button>
                          {/* 👆 FIN DEL BOTÓN CORREGIDO 👆 */}

                          {vacante.estado === 'ACTIVA' && (
                            <button onClick={() => handlePausar(vacante)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.8rem', color: '#111827', borderRadius: '0.4rem', fontWeight: 500 }}><Pause size={14} /> Pausar</button>
                          )}
                          
                          {vacante.estado === 'ACTIVA' && (
                            <button onClick={() => { setMenuAbierto(null); setVacanteACerrar(vacante); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#fef2f2', color: '#dc2626', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '0.4rem' }}><Ban size={14} /> Desactivar</button>
                          )}
                          
                          <button onClick={() => { setMenuAbierto(null); setVacanteAEliminar(vacante); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', color: '#dc2626', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '0.4rem' }}><Trash2 size={14} /> Eliminar</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {vacanteACerrar && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(27, 38, 50, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--oatmeal)' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.75rem', color: '#111827' }}>¿Cerrar vacante?</h3>
              <p style={{ marginBottom: '1.5rem', color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>
                Estás a punto de cerrar la vacante <strong style={{ color: '#111827' }}>{vacanteACerrar.titulo}</strong>. Esta acción es irreversible.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setVacanteACerrar(null)} disabled={isCerrando} style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--oatmeal)', backgroundColor: '#fff', color: '#111827', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={handleConfirmarCierre} disabled={isCerrando} style={{ padding: '0.6rem 1.2rem', border: 'none', backgroundColor: 'var(--flame)', color: '#fff', borderRadius: '0.5rem', cursor: isCerrando ? 'not-allowed' : 'pointer', opacity: isCerrando ? 0.7 : 1, fontWeight: 'bold' }}>
                  {isCerrando ? 'Cerrando...' : 'Sí, cerrar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {vacanteAEliminar && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(27, 38, 50, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--oatmeal)' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.75rem', color: '#dc2626' }}>¿Eliminar vacante?</h3>
              <p style={{ marginBottom: '1.5rem', color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>
                Estás a punto de eliminar permanentemente la vacante <strong style={{ color: '#111827' }}>{vacanteAEliminar.titulo}</strong>. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setVacanteAEliminar(null)} disabled={isEliminando} style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--oatmeal)', backgroundColor: '#fff', color: '#111827', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={handleConfirmarEliminar} disabled={isEliminando} style={{ padding: '0.6rem 1.2rem', border: 'none', backgroundColor: '#dc2626', color: '#fff', borderRadius: '0.5rem', cursor: isEliminando ? 'not-allowed' : 'pointer', opacity: isEliminando ? 0.7 : 1, fontWeight: 'bold' }}>
                  {isEliminando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}