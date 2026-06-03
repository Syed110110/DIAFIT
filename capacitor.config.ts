import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syed.diafit',
  appName: 'DiaFit',
  webDir: 'dist', // <--- Change 'www' to 'dist' here
  server: {
    androidScheme: 'https'
  }
};

export default config;