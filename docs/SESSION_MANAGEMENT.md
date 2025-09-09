# Firebase Session Management

This document describes the session management system implemented in the application to ensure secure user authentication with automatic logout on session expiration.

## Overview

The session management system provides:

- **Session-based authentication persistence** - Users are logged out when browser session ends
- **Maximum session duration** - Automatic logout after 30 minutes regardless of activity
- **Activity-based timeout** - Logout after 15 minutes of inactivity
- **Token validation** - Periodic checks for token validity and expiration
- **User notifications** - Clear feedback when session expires

## Configuration

Session settings are centralized in `src/config/session.ts`:

```typescript
export const SESSION_CONFIG = {
  MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  ACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes of inactivity
  TOKEN_CHECK_INTERVAL: 60 * 1000, // Check every minute
  AUTO_REDIRECT_DELAY: 3000, // 3 seconds after notification
  ACTIVITY_EVENTS: [
    // Events that count as activity
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ],
};
```

## Components

### 1. Firebase Configuration (`src/firebase.ts`)

Sets up session-based persistence:

```typescript
setPersistence(auth, browserSessionPersistence);
```

This ensures users are automatically logged out when they close their browser.

### 2. Enhanced Auth Context (`src/context/FirebaseAuthContext.tsx`)

Provides comprehensive session management:

- **Token monitoring**: Checks token validity every minute
- **Activity tracking**: Monitors user interactions to detect inactivity
- **Automatic logout**: Handles session expiration with proper cleanup
- **Session state**: Exposes `sessionExpired` state for UI feedback

Key features:

- Validates Firebase ID token claims
- Tracks authentication time vs. maximum session duration
- Monitors user activity across multiple event types
- Provides clean session expiration handling

### 3. Session Expired Modal (`src/components/SessionExpiredModal/`)

User-friendly notification system:

- **Visual feedback**: Clear modal with expiration reason
- **Auto-redirect**: Automatically redirects to login after 3 seconds
- **Manual action**: Users can manually click to go to login
- **Theme integration**: Consistent with app's design system

## Session Expiration Triggers

The system automatically logs users out when:

1. **Maximum Duration**: Session exceeds 30 minutes since authentication
2. **Inactivity**: No user activity detected for 15 minutes
3. **Invalid Token**: Firebase token is invalid or corrupted
4. **Browser Session End**: User closes browser (via `browserSessionPersistence`)

## Activity Detection

The following user interactions reset the inactivity timer:

- Mouse movements and clicks
- Keyboard input
- Scrolling
- Touch interactions

## Security Features

### Token Validation

- Validates Firebase ID token every minute
- Checks `auth_time` claim against maximum session duration
- Handles token refresh failures gracefully

### Session Persistence

- Uses `browserSessionPersistence` to clear auth state when browser closes
- Prevents persistent login across browser sessions
- Maintains security for shared computers

### Automatic Cleanup

- Clears all timers when user logs out
- Removes event listeners properly
- Resets session state on authentication changes

## Implementation Details

### Authentication Flow

1. User logs in (email/password or Google)
2. Firebase sets session persistence to browser session only
3. Auth context starts monitoring:
   - Token validity (every minute)
   - User activity (real-time)
   - Session duration (continuous)

### Session Expiration Flow

1. Expiration condition detected
2. Session expired state set to `true`
3. User automatically signed out via Firebase
4. Session expired modal displayed
5. Auto-redirect to login page after 3 seconds
6. All timers and listeners cleaned up

### Error Handling

- Token validation errors trigger automatic logout
- Network errors during token checks are logged but don't cause logout
- Graceful degradation if session storage is unavailable

## Usage Examples

### Checking Session Status

```typescript
const { user, sessionExpired, loading } = useAuth();

if (sessionExpired) {
  // Handle session expiration UI
}
```

### Custom Session Utilities

```typescript
import { SessionUtils } from "../config/session";

// Check if session is expired
const isExpired = SessionUtils.isSessionExpired(authTime);

// Format session duration for display
const duration = SessionUtils.formatSessionDuration(milliseconds);

// Get time until expiration
const timeLeft = SessionUtils.getTimeUntilExpiration(authTime);
```

## Testing

To test session expiration:

1. **Inactivity Test**: Leave app idle for 15+ minutes
2. **Duration Test**: Stay active but wait 30+ minutes
3. **Browser Close Test**: Close and reopen browser
4. **Token Test**: Manually invalidate Firebase token

## Customization

To modify session behavior:

1. Update `SESSION_CONFIG` in `src/config/session.ts`
2. Restart the application for changes to take effect
3. Test thoroughly with new settings

## Security Considerations

- Session durations should balance security vs. user experience
- Activity detection prevents false timeouts during active use
- Token validation catches compromised or expired credentials
- Browser session persistence prevents unauthorized access on shared devices

## Browser Compatibility

The session management system works with:

- All modern browsers supporting Firebase Auth
- Both desktop and mobile browsers
- Private/incognito browsing modes
- Browsers with cookies enabled

## Troubleshooting

Common issues and solutions:

1. **Frequent logouts**: Check if activity events are being detected
2. **No automatic logout**: Verify token validation is running
3. **Modal not showing**: Check if SessionExpiredModal is mounted in App
4. **Timer memory leaks**: Ensure proper cleanup in useEffect dependencies
