import React, { createContext, useEffect, useState } from 'react';
import { saveTicket, loadTickets } from '../services/storageService';

export const GameContext = createContext();

export function GameProvider({ children }) {
  const [currentNumbers, setCurrentNumbers] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      const savedTickets = await loadTickets();
      setTickets(savedTickets);
    })();
  }, []);

  const addTicket = async (ticket) => {
    setTickets((prev) => [...prev, ticket]);
    await saveTicket(ticket);
  };

  return (
    <GameContext.Provider value={{ currentNumbers, setCurrentNumbers, tickets, addTicket }}>
      {children}
    </GameContext.Provider>
  );
}
