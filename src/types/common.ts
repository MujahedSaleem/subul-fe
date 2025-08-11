import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface Action {
  label: string;
  icon: IconDefinition;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
}

export interface DeviceInfo {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: {
    name: string;
    version: string;
  };
  operatingSystem: {
    name: string;
    version: string;
  };
  userAgent: string;
  screenResolution: {
    width: number;
    height: number;
  };
  deviceFingerprint: string;
  publicIp: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo: string; // JSON string of DeviceInfo
}