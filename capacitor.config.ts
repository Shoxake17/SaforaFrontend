import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shox.pms',
  appName: 'Safora',
  webDir: 'dist-guest',  // ⭐ O'zgardi: dist → dist-guest



  server: {
    url: 'https://v1kmtz97-5174.euw.devtunnels.ms',  
    cleartext: true,
  },
};
export default config;