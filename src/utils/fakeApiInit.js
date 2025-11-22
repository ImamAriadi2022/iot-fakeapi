/**
 * Initialize fake API services when app starts
 */

import apiClient from '../services/apiClient';

// Function to initialize fake API
export const initializeFakeApi = () => {
  console.log('🚀 Initializing Fake API Service...');
  
  // Log current status
  const status = apiClient.getStatus();
  console.log('📊 API Client Status:', status);
  
  // Generate comprehensive historical data from June 2025 to now
  console.log('📝 Ensuring complete historical data from June 2025...');
  
  // The fake API service already initializes with June-November 2025 data
  // Just start real-time updates
  if (status.mode === 'FAKE') {
    console.log('⏰ Starting real-time data updates...');
    apiClient.startRealTimeUpdates();
    
    // Force immediate localStorage update
    setTimeout(() => {
      console.log('🔄 Forcing initial localStorage update...');
      // This will be handled by the fake API service updateLocalStorage method
    }, 2000);
  }
  
  // Log every 5 minutes for monitoring
  const logInterval = setInterval(() => {
    const currentStatus = apiClient.getStatus();
    console.log(`📈 Fake API Status Update - Data Points: ${currentStatus.dataPoints}, Real-time: ${currentStatus.realTimeActive}`);
    
    // Check localStorage status
    try {
      const station1Data = JSON.parse(localStorage.getItem('station1_data') || '[]');
      const station2Data = JSON.parse(localStorage.getItem('station2_data') || '[]');
      console.log(`💾 localStorage Status - Station1: ${station1Data.length}, Station2: ${station2Data.length} records`);
    } catch (e) {
      console.warn('💾 localStorage check failed:', e);
    }
  }, 300000); // 5 minutes
  
  // Cleanup function
  return () => {
    clearInterval(logInterval);
    apiClient.stopRealTimeUpdates();
    console.log('🛑 Fake API Service stopped');
  };
};

// Auto-initialize when module loads
let cleanup = null;

export const startFakeApi = () => {
  if (cleanup) return; // Already initialized
  cleanup = initializeFakeApi();
};

export const stopFakeApi = () => {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
};

// Export for manual control
export default {
  start: startFakeApi,
  stop: stopFakeApi,
  initialize: initializeFakeApi
};