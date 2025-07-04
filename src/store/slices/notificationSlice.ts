import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // in milliseconds, null for persistent
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        duration: action.payload.duration ?? 5000, // Default 5 seconds
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    showSuccess: (state, action: PayloadAction<{ message: string; title?: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'success',
        message: action.payload.message,
        title: action.payload.title,
        duration: action.payload.duration ?? 5000,
      };
      state.notifications.push(notification);
    },
    showError: (state, action: PayloadAction<{ message: string; title?: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'error',
        message: action.payload.message,
        title: action.payload.title,
        duration: action.payload.duration ?? 8000, // Errors stay longer
      };
      state.notifications.push(notification);
    },
    showWarning: (state, action: PayloadAction<{ message: string; title?: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'warning',
        message: action.payload.message,
        title: action.payload.title,
        duration: action.payload.duration ?? 6000,
      };
      state.notifications.push(notification);
    },
    showInfo: (state, action: PayloadAction<{ message: string; title?: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'info',
        message: action.payload.message,
        title: action.payload.title,
        duration: action.payload.duration ?? 5000,
      };
      state.notifications.push(notification);
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearAllNotifications,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications; 