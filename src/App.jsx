import { useCallback, useEffect, useState } from "react";
import { peliculasApi } from "./api";

const formularioInicial = { nombre: "" };

export default function App() {
  const [peliculas, setPeliculas] = useState([]);
  const [nombre, setNombre] = useState(formularioInicial.nombre);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarPeliculas = useCallback(async () => {
    try {
      const data = await peliculasApi.listar();
      setPeliculas(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(`No fue posible cargar las películas. ${err.message}`);
    } finally {
      setCargando(false);
    }
  }, []);

  const actualizarPeliculas = useCallback(() => {
    setCargando(true);
    setError("");
    return cargarPeliculas();
  }, [cargarPeliculas]);

  useEffect(() => {
    let vigente = true;

    peliculasApi
      .listar()
      .then((data) => {
        if (!vigente) return;
        setPeliculas(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => {
        if (vigente) {
          setError(`No fue posible cargar las películas. ${err.message}`);
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  async function manejarSubmit(event) {
    event.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError("Escribe el nombre de la película.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      if (editandoId !== null) {
        await peliculasApi.actualizar(editandoId, { nombre: nombreLimpio });
        setMensaje("Película actualizada correctamente.");
      } else {
        await peliculasApi.crear({ nombre: nombreLimpio });
        setMensaje("Película creada correctamente.");
      }

      setNombre("");
      setEditandoId(null);
      await actualizarPeliculas();
    } catch (err) {
      setError(`No fue posible guardar la película. ${err.message}`);
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(pelicula) {
    setNombre(pelicula.nombre ?? "");
    setEditandoId(pelicula.id);
    setError("");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setNombre("");
    setEditandoId(null);
    setError("");
  }

  async function eliminarPelicula(pelicula) {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${pelicula.nombre}"?`,
    );
    if (!confirmar) return;

    setError("");
    setMensaje("");
    try {
      await peliculasApi.eliminar(pelicula.id);
      setMensaje("Película eliminada correctamente.");
      await actualizarPeliculas();
    } catch (err) {
      setError(`No fue posible eliminar la película. ${err.message}`);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Catálogo de películas">
          <span className="brand-icon">▶</span>
          <span>
            CINE<span className="brand-accent">LIST</span>
          </span>
        </a>
        <span className="topbar-label">Panel de administración</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">TU COLECCIÓN, EN UN SOLO LUGAR</p>
          <h1>Colección de películas</h1>
          <p className="hero-copy">
            Accede a tus peliculas y crea nuevas en cualquier momento
          </p>
        </div>
        <div className="hero-count">
          <span className="count-number">{peliculas.length}</span>
          <span className="count-label">PELÍCULAS</span>
        </div>
      </section>

      <section className="content-grid">
        <aside className="form-card">
          <div className="section-heading">
            <span className="heading-mark">
              {editandoId !== null ? "✎" : "+"}
            </span>
            <div>
              <h2>
                {editandoId !== null ? "Editar película" : "Nueva película"}
              </h2>
              <p>
                {editandoId !== null
                  ? "Modifica el nombre registrado."
                  : "Agrega una película al catálogo."}
              </p>
            </div>
          </div>

          <form onSubmit={manejarSubmit}>
            <label htmlFor="nombre">Nombre de la película</label>
            <input
              id="nombre"
              type="text"
              placeholder="Ej. Interestelar"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={120}
              required
            />
            <button
              className="primary-button"
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : editandoId !== null
                  ? "Guardar cambios"
                  : "Agregar película"}
            </button>
            {editandoId !== null && (
              <button
                className="text-button"
                type="button"
                onClick={cancelarEdicion}
              >
                Cancelar edición
              </button>
            )}
          </form>

          <div className="form-note">
            <span>ⓘ</span>
            Los cambios se guardan mediante la API del servidor.
          </div>
        </aside>

        <section className="list-section">
          <div className="list-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2>Películas registradas</h2>
            </div>
            <button
              className="refresh-button"
              onClick={actualizarPeliculas}
              type="button"
              title="Actualizar lista"
            >
              ↻ <span>Actualizar</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          {mensaje && (
            <div className="alert alert-success" role="status">
              {mensaje}
            </div>
          )}

          {cargando ? (
            <div className="empty-state">
              <div className="loader" />
              Cargando películas...
            </div>
          ) : peliculas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">▤</span>
              <strong>Aún no hay películas</strong>
              <span>Agrega la primera película usando el formulario.</span>
            </div>
          ) : (
            <div className="movie-list">
              {peliculas.map((pelicula) => (
                <article className="movie-row" key={pelicula.id}>
                  <div className="movie-poster">▶</div>
                  <div className="movie-info">
                    <h3>{pelicula.nombre}</h3>
                    <span>ID: {pelicula.id}</span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-button edit-button"
                      onClick={() => iniciarEdicion(pelicula)}
                      type="button"
                      aria-label={`Editar ${pelicula.nombre}`}
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      className="icon-button delete-button"
                      onClick={() => eliminarPelicula(pelicula)}
                      type="button"
                      aria-label={`Eliminar ${pelicula.nombre}`}
                      title="Eliminar"
                    >
                      ⌫
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer>
        {" "}
        CINE<span className="brand-accent">LIST</span> · Aplicación de
        demostración Full Stack
      </footer>
    </main>
  );
}
