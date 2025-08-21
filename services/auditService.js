// Servicio de auditoría para registrar eventos importantes
const AUDIT_KEY = 'audit_log';

export const logEvent = (event, data = {}) => {
  try {
    const auditLog = getAuditLog();
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      event,
      data: {
        ...data,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };
    
    auditLog.push(logEntry);
    
    // Mantener solo los últimos 100 eventos
    const recentLog = auditLog.slice(-100);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(recentLog));
    
    console.log(`[AUDIT] ${event}:`, logEntry);
  } catch (error) {
    console.error('Error logging event:', error);
  }
};

export const getAuditLog = () => {
  try {
    const log = localStorage.getItem(AUDIT_KEY);
    return log ? JSON.parse(log) : [];
  } catch (error) {
    console.error('Error getting audit log:', error);
    return [];
  }
};

// Eventos de auditoría
export const AUDIT_EVENTS = {
  JUGADA_CREATED: 'jugada_created',
  JUGADA_CHECKED: 'jugada_checked',
  PAYMENT_ATTEMPTED: 'payment_attempted',
  RESULTS_VIEWED: 'results_viewed',
  SECURITY_VIOLATION: 'security_violation',
  DATA_CORRUPTION: 'data_corruption'
};