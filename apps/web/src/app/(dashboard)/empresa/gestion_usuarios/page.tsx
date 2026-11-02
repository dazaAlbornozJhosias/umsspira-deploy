
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, X, CheckCircle2, AlertCircle,
  Loader2, Users, UserX, UserCheck,
} from "lucide-react";

import {
  obtenerUsuariosEmpresa,
  invitarUsuarioEmpresa,
  actualizarUsuarioEmpresa,
  cancelarInvitacionEmpresa,
  type UsuarioEmpresa,
  type RolEmpresa,
} from "@/shared/services/company-users";

export default function GestionUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarInvitar, setMostrarInvitar] = useState(false);
  const [confirmarEstado, setConfirmarEstado] =
    useState<UsuarioEmpresa | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] =
    useState<UsuarioEmpresa | null>(null);
  const [invitacionCreada, setInvitacionCreada] =
    useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<RolEmpresa>("Reclutador");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerUsuariosEmpresa()
      .then((datos) => {
        if (activo) setUsuarios(datos);
      })
      .catch((e: unknown) => {
        if (activo) {
          setError(e instanceof Error ? e.message : "Error al cargar usuarios");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) =>
      [u.nombre, u.correo, u.rol, u.estado]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [usuarios, busqueda]);

  const limpiarMensajes = () => {
    setError("");
    setMensaje("");
  };

  async function invitar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (procesando) return;
    limpiarMensajes();

    const n = nombre.trim();
    const c = correo.trim().toLowerCase();

    if (n.length < 2) {
      setError("Ingresa un nombre válido.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (usuarios.some((u) => u.correo.toLowerCase() === c)) {
      setError("Este correo ya está registrado o tiene una invitación pendiente.");
      return;
    }

    setProcesando(true);
    try {
      const creada = await invitarUsuarioEmpresa({
        nombre: n, correo: c, rol,
      });

      // Actualiza la tabla local sin recargar la página.
      setUsuarios((prev) => [
        ...prev,
        { ...creada, nombre: n },
      ]);
      setMostrarInvitar(false);
      setInvitacionCreada(c);
      setNombre("");
      setCorreo("");
      setRol("Reclutador");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la invitación.");
    } finally {
      setProcesando(false);
    }
  }

  async function cancelarInvitacion() {
    const seleccionado = confirmarCancelar;
    if (!seleccionado || procesando) return;
    limpiarMensajes();
    setProcesando(true);

    try {
      await cancelarInvitacionEmpresa(seleccionado.id);

      // Solo elimina la fila cancelada: no hace otro GET.
      setUsuarios((prev) =>
        prev.filter((u) => u.id !== seleccionado.id)
      );
      setConfirmarCancelar(null);
      setMensaje("Invitación cancelada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar la invitación.");
    } finally {
      setProcesando(false);
    }
  }

  async function cambiarEstado() {
    const seleccionado = confirmarEstado;
    if (!seleccionado || procesando) return;
    limpiarMensajes();

    const estado = seleccionado.estado === "Activo"
      ? "Inactivo" : "Activo";

    setProcesando(true);
    try {
      const actualizado = await actualizarUsuarioEmpresa(
        seleccionado.id, { estado }
      );
      setUsuarios((prev) => prev.map((u) =>
        u.id === seleccionado.id ? { ...u, ...actualizado } : u
      ));
      setConfirmarEstado(null);
      setMensaje(`Usuario ${estado === "Activo" ? "activado" : "desactivado"}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
    } finally {
      setProcesando(false);
    }
  }

  async function cambiarRol(u: UsuarioEmpresa, nuevoRol: RolEmpresa) {
    if (procesando || u.esTitular || u.estado === "Pendiente") return;
    if (u.rol === nuevoRol) return;

    limpiarMensajes();
    setProcesando(true);
    try {
      const actualizado = await actualizarUsuarioEmpresa(
        u.id, { rol: nuevoRol }
      );
      setUsuarios((prev) => prev.map((item) =>
        item.id === u.id ? { ...item, ...actualizado } : item
      ));
      setMensaje("Rol actualizado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el rol.");
    } finally {
      setProcesando(false);
    }
  }

  const cerrarInvitar = () => {
    if (!procesando) {
      setMostrarInvitar(false);
      setError("");
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F3ED] px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              Gestión de usuarios
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Administra los usuarios de tu empresa.
              Puedes invitar nuevos colegas y desactivar accesos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              limpiarMensajes();
              setMostrarInvitar(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={20} /> Invitar usuario
          </button>
        </div>

        {mensaje && (
          <div role="status" className="mb-4 flex gap-2 rounded-lg bg-green-50 p-3 text-green-700">
            <CheckCircle2 size={20} /> {mensaje}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 flex gap-2 rounded-lg bg-red-50 p-3 text-red-700">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users size={21} /> Usuarios de la empresa
            </h2>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="rounded-lg border py-2 pl-10 pr-3 outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-blue-900">
                <tr>
                  <th className="px-5 py-4">Nombre</th>
                  <th className="px-5 py-4">Correo electrónico</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <Loader2 className="mx-auto animate-spin" />
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : filtrados.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium">{u.nombre}</td>
                    <td className="px-5 py-4 text-gray-600">{u.correo}</td>
                    <td className="px-5 py-4">
                      {u.esTitular || u.estado === "Pendiente" ? (
                        <span>{u.rol}</span>
                      ) : (
                        <select
                          value={u.rol}
                          disabled={procesando}
                          onChange={(e) =>
                            void cambiarRol(u, e.target.value as RolEmpresa)
                          }
                          className="rounded-md border bg-white px-2 py-2 disabled:opacity-50"
                        >
                          <option value="Administrador">Administrador</option>
                          <option value="Reclutador">Reclutador</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-3 py-1 text-xs font-semibold ${
                        u.estado === "Activo"
                          ? "bg-green-100 text-green-700"
                          : u.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}>
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.estado === "Pendiente" ? (
                        <button
                          disabled={procesando}
                          onClick={() => setConfirmarCancelar(u)}
                          className="rounded-md px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancelar invitación
                        </button>
                      ) : u.esTitular ? (
                        <span className="text-gray-400">Sin acciones</span>
                      ) : (
                        <button
                          disabled={procesando}
                          onClick={() => setConfirmarEstado(u)}
                          className={`flex items-center gap-2 rounded-md px-3 py-2 disabled:opacity-50 ${
                            u.estado === "Activo"
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {u.estado === "Activo" ? (
                            <><UserX size={16} /> Desactivar</>
                          ) : (
                            <><UserCheck size={16} /> Activar</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-5 py-4 text-sm text-gray-500">
            Total de usuarios: {filtrados.length}
          </div>
        </section>
      </div>

      {/* MODAL INVITAR */}
      {mostrarInvitar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-invitar"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="titulo-invitar" className="text-xl font-bold">Invitar usuario</h2>
              <button type="button" disabled={procesando}
                onClick={cerrarInvitar} aria-label="Cerrar">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={(e) => void invitar(e)} className="space-y-4">
              <div>
                <label htmlFor="hu3-nombre" className="mb-2 block text-sm font-medium">
                  Nombre completo
                </label>
                <input id="hu3-nombre" required minLength={2} maxLength={120}
                  value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del colaborador"
                  className="w-full rounded-lg border p-3 outline-none focus:border-orange-400" />
              </div>
              <div>
                <label htmlFor="hu3-correo" className="mb-2 block text-sm font-medium">
                  Correo electrónico
                </label>
                <input id="hu3-correo" required type="email"
                  value={correo} onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-lg border p-3 outline-none focus:border-orange-400" />
              </div>
              <div>
                <label htmlFor="hu3-rol" className="mb-2 block text-sm font-medium">Rol</label>
                <select id="hu3-rol" value={rol}
                  onChange={(e) => setRol(e.target.value as RolEmpresa)}
                  className="w-full rounded-lg border p-3">
                  <option value="Administrador">Administrador</option>
                  <option value="Reclutador">Reclutador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" disabled={procesando} onClick={cerrarInvitar}
                  className="rounded-lg border px-5 py-3">Cancelar</button>
                <button type="submit" disabled={procesando}
                  className="rounded-lg bg-orange-400 px-5 py-3 font-semibold disabled:opacity-50">
                  {procesando ? "Registrando..." : "Invitar usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE INVITACIÓN */}
      {invitacionCreada && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-exito"
            className="w-full max-w-sm rounded-xl bg-white p-7 text-center shadow-xl">
            <CheckCircle2 className="mx-auto mb-4 text-green-600" size={56} />
            <h2 id="titulo-exito" className="text-xl font-bold text-blue-900">
              Invitación registrada
            </h2>
            <p className="mt-3 text-sm">
              Se registró la invitación para <strong>{invitacionCreada}</strong>.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              El correo de activación quedó pendiente de envío.
            </p>
            <button type="button" onClick={() => setInvitacionCreada(null)}
              className="mt-6 w-full rounded-lg bg-orange-500 p-3 font-semibold text-white">
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR INVITACIÓN */}
      {confirmarCancelar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-cancelar"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex justify-end">
              <button type="button" disabled={procesando}
                onClick={() => setConfirmarCancelar(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <AlertCircle className="mx-auto mb-4 text-red-500" size={50} />
            <h2 id="titulo-cancelar" className="text-center text-xl font-bold text-blue-900">
              Cancelar invitación
            </h2>
            <p className="mt-4 text-center text-sm">
              ¿Deseas cancelar la invitación de{" "}
              <strong>{confirmarCancelar.nombre}</strong>?
            </p>
            <p className="mt-3 text-center text-sm text-gray-500">
              {confirmarCancelar.correo}
            </p>
            <p className="my-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              El enlace dejará de ser válido. Esta acción no afecta a usuarios activos.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" disabled={procesando}
                onClick={() => setConfirmarCancelar(null)}
                className="rounded-lg border px-5 py-3">Volver</button>
              <button type="button" disabled={procesando}
                onClick={() => void cancelarInvitacion()}
                className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50">
                {procesando ? "Cancelando..." : "Cancelar invitación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTIVAR / DESACTIVAR */}
      {confirmarEstado && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-estado"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={50} />
            <h2 id="titulo-estado" className="text-center text-xl font-bold text-blue-900">
              {confirmarEstado.estado === "Activo"
                ? "Desactivar usuario" : "Activar usuario"}
            </h2>
            <p className="my-5 text-center text-sm">
              ¿Deseas {confirmarEstado.estado === "Activo" ? "desactivar" : "activar"}{" "}
              a <strong>{confirmarEstado.nombre}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" disabled={procesando}
                onClick={() => setConfirmarEstado(null)}
                className="rounded-lg border px-5 py-3">Cancelar</button>
              <button type="button" disabled={procesando}
                onClick={() => void cambiarEstado()}
                className={`rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-50 ${
                  confirmarEstado.estado === "Activo"
                    ? "bg-red-600" : "bg-green-600"
                }`}>
                {procesando ? "Procesando..." :
                  confirmarEstado.estado === "Activo" ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
