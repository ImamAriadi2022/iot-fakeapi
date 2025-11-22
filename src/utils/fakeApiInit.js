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
  
  // Generate some initial test data if needed
  if (status.dataPoints < 50) {
    console.log('📝 Generating initial test data...');
    apiClient.generateTestData(50).then(() => {
      console.log('✅ Initial test data generated');
    }).catch(err => {
      console.error('❌ Failed to generate initial data:', err);
    });
  }
  
  // Start real-time updates if using fake data
  if (status.mode === 'FAKE') {
    console.log('⏰ Starting real-time data updates...');
    apiClient.startRealTimeUpdates();
  }
  
  // Log every 30 seconds for monitoring
  const logInterval = setInterval(() => {
    const currentStatus = apiClient.getStatus();
    console.log(`📈 Fake API Status Update - Data Points: ${currentStatus.dataPoints}, Real-time: ${currentStatus.realTimeActive}`);
  }, 30000);
  
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