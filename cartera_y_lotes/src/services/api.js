import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

export async function obtenerLotes() {
  const response = await api.get("/lotes");
  return response.data;
}

export async function crearLote(lote) {
  const response = await api.post("/lotes", lote);
  return response.data;
}

export async function actualizarLote(id, lote) {
  const response = await api.put(`/lotes/${id}`, lote);
  return response.data;
}

export async function registrarPago(id, pago) {
  const response = await api.post(`/lotes/${id}/pago`, pago);
  return response.data;
}

export async function eliminarPago(id, pagoId) {
  const response = await api.delete(
    `/lotes/${id}/pago/${pagoId}`
  );
  return response.data;
}

export async function registrarInicial(id, inicial) {
  const response = await api.post(
    `/lotes/${id}/inicial`,
    inicial
  );

  return response.data;
}

export async function iniciarSesion(usuario, password) {

  const response = await api.post(
    "/login",
    {
      usuario,
      password
    }
  );

  return response.data;
}

export default api;