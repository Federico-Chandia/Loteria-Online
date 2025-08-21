const API_URL = 'http://192.168.0.102:5000';

export const getSorteos = async () => {
  try {
    const res = await fetch(`${API_URL}/q6r/sorteos`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Error en getSorteos:', error.message);
    throw error;
  }
};

export const getUltimoSorteoCompleto = async () => {
  try {
    const sorteos = await getSorteos();
    if (sorteos && sorteos.length > 0) {
      const ultimo = sorteos[0];
      const detalles = await getSorteo(ultimo.numero);
      return detalles;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo último sorteo:', error.message);
    throw error;
  }
};

export const getSorteo = async (nro) => {
  const res = await fetch(`${API_URL}/q6r/sorteo/${nro}`);
  const json = await res.json();
  return json.data;
};

export const getTodosLosNumeros = async () => {
  const res = await fetch(`${API_URL}/q6r/todoslosnumeros`);
  const json = await res.json();
  return json.data;
};




