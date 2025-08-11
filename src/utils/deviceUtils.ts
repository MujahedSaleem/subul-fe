import { DeviceInfo } from '../types/common';

/**
 * Generates a simple device fingerprint based on available browser APIs
 */
const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.platform,
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Detects device type based on user agent and screen size
 */
const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = screen.width;
  
  // Check for mobile devices
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  // Check for tablets
  if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent) || 
      (screenWidth >= 768 && screenWidth <= 1024)) {
    return 'tablet';
  }
  
  return 'desktop';
};

/**
 * Extracts browser information from user agent
 */
const getBrowserInfo = (): { name: string; version: string } => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Safari\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }

  return { name: browserName, version: browserVersion };
};

/**
 * Extracts operating system information from user agent
 */
const getOperatingSystemInfo = (): { name: string; version: string } => {
  const userAgent = navigator.userAgent;
  let osName = 'Unknown';
  let osVersion = 'Unknown';

  // Windows
  if (userAgent.includes('Windows NT')) {
    osName = 'Windows';
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const version = match[1];
      switch (version) {
        case '10.0': osVersion = '10'; break;
        case '6.3': osVersion = '8.1'; break;
        case '6.2': osVersion = '8'; break;
        case '6.1': osVersion = '7'; break;
        default: osVersion = version;
      }
    }
  }
  // macOS
  else if (userAgent.includes('Mac OS X')) {
    osName = 'macOS';
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
  }
  // Linux
  else if (userAgent.includes('Linux')) {
    osName = 'Linux';
    osVersion = 'Unknown';
  }
  // Android
  else if (userAgent.includes('Android')) {
    osName = 'Android';
    const match = userAgent.match(/Android (\d+\.\d+)/);
    osVersion = match ? match[1] : 'Unknown';
  }
  // iOS
  else if (userAgent.includes('iPhone OS') || userAgent.includes('iOS')) {
    osName = 'iOS';
    const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
  }

  return { name: osName, version: osVersion };
};

/**
 * Fetches public IP address from external service
 */
const getPublicIp = async (): Promise<string> => {
  try {
    // Try primary service
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    console.warn('Failed to fetch IP from primary service:', error);
  }

  try {
    // Fallback service
    const response = await fetch('https://ipapi.co/ip/');
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn('Failed to fetch IP from fallback service:', error);
  }

  try {
    // Second fallback service
    const response = await fetch('https://httpbin.org/ip');
    if (response.ok) {
      const data = await response.json();
      return data.origin;
    }
  } catch (error) {
    console.warn('Failed to fetch IP from second fallback service:', error);
  }

  return 'Unknown';
};

/**
 * Collects comprehensive device information
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const publicIp = await getPublicIp();
  
  return {
    deviceType: getDeviceType(),
    browser: getBrowserInfo(),
    operatingSystem: getOperatingSystemInfo(),
    userAgent: navigator.userAgent,
    screenResolution: {
      width: screen.width,
      height: screen.height,
    },
    deviceFingerprint: generateDeviceFingerprint(),
    publicIp,
  };
};

/**
 * Collects device information and returns it as a JSON string
 */
export const getDeviceInfoString = async (): Promise<string> => {
  const deviceInfo = await getDeviceInfo();
  return JSON.stringify(deviceInfo);
};