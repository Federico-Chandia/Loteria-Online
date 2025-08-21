// Servicio simple para jugadas sin imports dinámicos
class JugadaService {
  constructor() {
    this.storageKey = 'jugadas_historial';
  }

  // Guardar jugada
  guardarJugada(jugada) {
    try {
      const jugadas = this.obtenerJugadas();
      
      const nuevaJugada = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        numeros: jugada.numeros,
        modalidad: jugada.tipo || 'Tradicional',
        timestamp: Date.now()
      };

      jugadas.push(nuevaJugada);
      localStorage.setItem(this.storageKey, JSON.stringify(jugadas));
      
      return nuevaJugada;
    } catch (error) {
      console.error('Error guardando jugada:', error);
      throw new Error('No se pudo guardar la jugada');
    }
  }

  // Obtener jugadas
  obtenerJugadas() {
    try {
      const jugadas = localStorage.getItem(this.storageKey);
      return jugadas ? JSON.parse(jugadas) : [];
    } catch (error) {
      console.error('Error obteniendo jugadas:', error);
      return [];
    }
  }

  // Limpiar historial
  limpiarHistorial() {
    localStorage.removeItem(this.storageKey);
  }
}

export const jugadaService = new JugadaService();
export const guardarJugada = (jugada) => jugadaService.guardarJugada(jugada);
export const obtenerJugadas = () => jugadaService.obtenerJugadas();
export const limpiarHistorial = () => jugadaService.limpiarHistorial();