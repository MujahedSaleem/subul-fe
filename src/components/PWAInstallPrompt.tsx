import React, { useState, useEffect } from 'react';
import { Button } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSyncAlt, faRedo } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import { useRegisterSW, setUpdateFunction } from '../serviceWorkerRegistration';

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
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const dispatch = useAppDispatch();

  // Check if the app is running in standalone mode
  const checkStandaloneMode = (): boolean => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as SafariNavigator).standalone === true;
    return standalone;
  };

  // Use the React hook from Vite PWA
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,
    onRegistered(registration) {
      console.log('[PWA] Service worker registered');
    },
    onRegisteredSW(swUrl) {
      console.log(`[PWA] Service worker registered at: ${swUrl}`);
    },
    onOfflineReady() {
      // App ready to work offline
      dispatch(showSuccess({ 
        message: 'التطبيق جاهز للعمل بدون اتصال بالإنترنت',
        duration: 3000
      }));
    },
    onNeedRefresh() {
      // New content available
      console.log('[PWA] New content available');
    },
    onRegisterError(error) {
      console.error('[PWA] Error registering service worker:', error);
    }
  });

  // Make the update function available globally for non-React components
  useEffect(() => {
    setUpdateFunction(updateServiceWorker);
  }, [updateServiceWorker]);

  useEffect(() => {
    // Set initial states
    const standalone = checkStandaloneMode();
    setIsStandalone(standalone);
    setIsInstalled(standalone);
    
    // Check if device is mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Handle "Add to Home Screen" prompt
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
      setIsStandalone(true);
    });

    // Listen for standalone mode changes
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };
    
    standaloneMediaQuery.addEventListener('change', handleStandaloneChange);

    // Auto-update for mobile/standalone without prompting
    if (needRefresh && (isMobile || standalone)) {
      updateServiceWorker(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      standaloneMediaQuery.removeEventListener('change', handleStandaloneChange);
    };
  }, [dispatch, needRefresh, isMobile, updateServiceWorker]);

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
    dispatch(showSuccess({ message: 'جاري تحديث التطبيق...', duration: 3000 }));
    // Use the updateServiceWorker from the hook
    updateServiceWorker(true);
    setNeedRefresh(false);
  };

  const handleClosePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleForceRefreshClick = () => {
    dispatch(showSuccess({ message: 'جاري تحديث التطبيق بالكامل...', duration: 3000 }));
    updateServiceWorker(true);
    setNeedRefresh(false);
  };

  // For standalone mode, don't show any UI
  if (isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* PWA Install Button */}
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
      
      {/* Update Available Button */}
      {needRefresh && !isStandalone && (
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
      
      {/* Force Refresh Button (Mobile Only) */}
      {isMobile && !isStandalone && (
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
      
      {/* Offline Ready Toast */}
      {offlineReady && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg border border-gray-200">
          <div className="mb-2">التطبيق جاهز للعمل بدون اتصال بالإنترنت</div>
          <Button
            size="sm"
            className="bg-gray-500"
            onClick={handleClosePrompt}
            placeholder=""
            onPointerEnterCapture={null}
            onPointerLeaveCapture={null}
          >
            إغلاق
          </Button>
        </div>
      )}
    </div>
  );
};

export default PWAInstallPrompt; 