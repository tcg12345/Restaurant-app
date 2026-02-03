import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tylergorin.restoradar',
  appName: 'resto-radar-reviews-hub',
  webDir: 'dist',
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    CapacitorCalendar: {
      permissions: ['calendar']
    }
  }
};

export default config;
