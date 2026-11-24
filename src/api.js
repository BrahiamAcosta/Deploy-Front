const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const peliculasApi = {
  listar: () => request("/api/peliculas"),
  crear: (pelicula) =>
    request("/api/peliculas", {
      method: "POST",
      body: JSON.stringify(pelicula),
    }),
  actualizar: (id, pelicula) =>
    request(`/api/peliculas/${id}`, {
      method: "PUT",
      body: JSON.stringify(pelicula),
    }),
  eliminar: (id) =>
    request(`/api/peliculas/${id}`, {
      method: "DELETE",
    }),
};
