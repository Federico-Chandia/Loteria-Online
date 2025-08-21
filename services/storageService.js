import AsyncStorage from '@react-native-async-storage/async-storage';

const TICKETS_KEY = 'tickets';

export async function saveTicket(ticket) {
  try {
    const existing = await AsyncStorage.getItem(TICKETS_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    parsed.push(ticket);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Error al guardar ticket:', error);
  }
}

export async function loadTickets() {
  try {
    const stored = await AsyncStorage.getItem(TICKETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    return [];
  }
}

export async function clearTickets() {
  try {
    await AsyncStorage.removeItem(TICKETS_KEY);
  } catch (error) {
    console.error('Error al borrar tickets:', error);
  }
}
