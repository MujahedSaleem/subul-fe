import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeNotification, selectNotifications } from '../store/slices/notificationSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faTimes, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const NotificationContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: faCheckCircle,
          iconColor: 'text-green-500',
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: faExclamationCircle,
          iconColor: 'text-red-500',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: faExclamationTriangle,
          iconColor: 'text-yellow-500',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: faInfoCircle,
          iconColor: 'text-blue-500',
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: faInfoCircle,
          iconColor: 'text-gray-500',
        };
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`
              ${styles.container}
              border rounded-lg p-4 shadow-lg
              transform transition-all duration-300 ease-in-out
              animate-slide-in-right
            `}
          >
            <div className="flex items-start gap-3">
              <FontAwesomeIcon 
                icon={styles.icon} 
                className={`${styles.iconColor} mt-0.5 flex-shrink-0`} 
              />
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <h4 className="font-semibold text-sm mb-1">
                    {notification.title}
                  </h4>
                )}
                <p className="text-sm leading-relaxed">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => dispatch(removeNotification(notification.id))}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              >
                <FontAwesomeIcon 
                  icon={faTimes} 
                  className="w-3 h-3 opacity-60 hover:opacity-100" 
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationContainer; 