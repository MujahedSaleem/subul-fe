import React, { useState, useEffect } from 'react';
import { Button } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSyncAlt, faRedo } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Add type definition for Safari's standalone property
interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

const PWAInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if app is already installed
    const checkStandaloneMode = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as SafariNavigator).standalone === true;
      setIsStandalone(standalone);
      setIsInstalled(standalone);
      return standalone;
    };

    // Initial check
    const standalone = checkStandaloneMode();

    // Check if device is mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // For standalone mode, always show update button and check for updates periodically
    if (standalone) {
      console.log('[PWAInstallPrompt] Standalone mode detected, setting up periodic updates');
      
      // Force a check for updates immediately
      if (typeof window.checkForUpdates === 'function') {
        window.checkForUpdates();
      }
      
      // Set up periodic checks every 2 minutes for standalone mode
      const updateInterval = setInterval(() => {
        console.log('[PWAInstallPrompt] Periodic update check for standalone mode');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.update().catch(err => {
              console.error('Error checking for updates:', err);
            });
          });
        }
      }, 2 * 60 * 1000); // 2 minutes
      
      return () => clearInterval(updateInterval);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      dispatch(showSuccess({ message: 'تم تثبيت التطبيق بنجاح!' }));
      
      // Recheck standalone mode after installation
      setTimeout(checkStandaloneMode, 1000);
    });

    // Listen for standalone mode changes
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };
    
    standaloneMediaQuery.addEventListener('change', handleStandaloneChange);

    // Check if service worker has an update waiting
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setIsUpdateAvailable(true);
        }
        
        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      });
      
      // Listen for messages from service worker
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            setIsUpdateAvailable(true);
          }
        });
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      standaloneMediaQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, [dispatch]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        dispatch(showSuccess({ message: 'شكرًا لتثبيت تطبيقنا!' }));
      }
      
      setInstallPrompt(null);
    } catch (error) {
      console.error('Installation error:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء محاولة التثبيت' }));
    }
  };

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          // Send message to service worker to skip waiting and activate new version
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // Manually check for updates
          if (typeof window.checkForUpdates === 'function') {
            window.checkForUpdates();
          } else {
            dispatch(showSuccess({ message: 'جاري التحقق من وجود تحديثات...' }));
            registration.update().then(() => {
              if (!registration.waiting) {
                dispatch(showSuccess({ message: 'أنت تستخدم أحدث إصدار من التطبيق' }));
              }
            });
          }
        }
      });
    }
  };

  const handleForceRefreshClick = () => {
    dispatch(showSuccess({ message: 'جاري تحديث التطبيق بالكامل...', duration: 3000 }));
    
    // Use the global forceClearCache function
    if (typeof window.forceClearCache === 'function') {
      window.forceClearCache();
    } else {
      // Fallback if the global function is not available
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // For standalone mode, show a fixed banner at the top
  if (isStandalone) {
    return (
      <>
        {/* Fixed update banner for standalone mode */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white p-2 flex justify-between items-center shadow-lg">
          <span className="text-sm font-medium">تطبيق سُبل</span>
          <div className="flex gap-2">
            <button
              onClick={handleUpdateClick}
              className="bg-white text-blue-500 text-xs px-2 py-1 rounded flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faSyncAlt} className="h-3 w-3" />
              <span>تحديث</span>
            </button>
            <button
              onClick={handleForceRefreshClick}
              className="bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faRedo} className="h-3 w-3" />
              <span>تحديث كامل</span>
            </button>
          </div>
        </div>
        
        {/* Add padding to the top of the page to account for the fixed banner */}
        <div className="h-10"></div>
      </>
    );
  }

  // Regular floating buttons for non-standalone mode
  // Don't render anything if the app is installed and no updates are available
  if (isInstalled && !isUpdateAvailable && !installPrompt && !isMobile) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {!isInstalled && installPrompt && (
        <Button
          size="sm"
          className="flex items-center gap-2 bg-blue-500 shadow-lg"
          onClick={handleInstallClick}
          placeholder=""
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
          تثبيت التطبيق
        </Button>
      )}
      
      {isUpdateAvailable && (
        <Button
          size="sm"
          className="flex items-center gap-2 bg-green-500 shadow-lg animate-pulse"
          onClick={handleUpdateClick}
          placeholder=""
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          <FontAwesomeIcon icon={faSyncAlt} className="h-4 w-4" />
          تحديث التطبيق
        </Button>
      )}
      
      {isMobile && (
        <Button
          size="sm"
          className="flex items-center gap-2 bg-red-500 shadow-lg"
          onClick={handleForceRefreshClick}
          placeholder=""
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          <FontAwesomeIcon icon={faRedo} className="h-4 w-4" />
          تحديث كامل
        </Button>
      )}
      
      {(isInstalled || isMobile) && !isUpdateAvailable && (
        <Button
          size="sm"
          className="flex items-center gap-2 bg-gray-500 shadow-lg opacity-80 hover:opacity-100"
          onClick={handleUpdateClick}
          placeholder=""
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          <FontAwesomeIcon icon={faSyncAlt} className="h-4 w-4" />
          التحقق من التحديثات
        </Button>
      )}
    </div>
  );
};

export default PWAInstallPrompt; 