// Session management configuration
export const SESSION_CONFIG = {
  // Activity timeout in milliseconds (60 minutes of inactivity)
  ACTIVITY_TIMEOUT: 60 * 60 * 1000,

  // Token validity check interval in milliseconds (5 minutes - less frequent)
  TOKEN_CHECK_INTERVAL: 5 * 60 * 1000,

  // Auto-redirect delay after session expiration notification (5 seconds)
  AUTO_REDIRECT_DELAY: 5000,

  // Events that count as user activity
  ACTIVITY_EVENTS: [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ] as const,
} as const;

// Session expiration reasons
export enum SessionExpirationReason {
  INACTIVITY = "Session timeout due to inactivity",
  INVALID_TOKEN = "Invalid or expired token",
  ACTIVITY_TIMEOUT = "Activity timeout",
}

// Helper functions for session management
export const SessionUtils = {
  /**
   * Check if user has been inactive for too long
   */
  isInactivityTimeout: (lastActivity: number): boolean => {
    const timeSinceLastActivity = Date.now() - lastActivity;
    return timeSinceLastActivity > SESSION_CONFIG.ACTIVITY_TIMEOUT;
  },

  /**
   * Format session duration for display
   */
  formatSessionDuration: (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  },
} as const;
