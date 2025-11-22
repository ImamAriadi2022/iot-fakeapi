/**
 * API Client yang menggunakan fake data service
 * Menggantikan actual API calls dengan fake data yang realistic
 */

import fakeApiService from './fakeApiService';

class ApiClient {
  constructor() {
    this.useFakeData = true; // Set true untuk menggunakan fake data
    this.apiEndpoints = {
      petengoran: process.env.REACT_APP_API_PETENGORAN_GET_TOPIC4,
      kalimantan: process.env.REACT_APP_API_KALIMANTAN_GET_TOPIC4, // jika ada
      dashboard: process.env.REACT_APP_API_DASHBOARD_GET_TOPIC4 // jika ada
    };
  }

  /**
   * Toggle between fake data and real API
   */
  setUseFakeData(useFake) {
    this.useFakeData = useFake;
    console.log(`API Client switched to ${useFake ? 'FAKE' : 'REAL'} data mode`);
  }

  /**
   * Get data untuk station/location tertentu
   */
  async getData(location = 'petengoran') {
    if (this.useFakeData) {
      console.log(`[FAKE API] Fetching data for location: ${location}`);
      
      // Untuk station2, berikan sedikit variasi data
      const baseData = await fakeApiService.getLatestData();
      
      if (location === 'station2') {
        // Tambahkan variasi untuk station2
        return baseData.map(item => ({
          ...item,
          humidity: Math.max(30, Math.min(95, item.humidity + (Math.random() - 0.5) * 5)),
          temperature: Math.max(15, Math.min(40, item.temperature + (Math.random() - 0.5) * 2)),
          AirPressure: Math.max(990, Math.min(1030, item.AirPressure + (Math.random() - 0.5) * 10)),
          windSpeed: Math.max(0, Math.min(50, item.windSpeed + (Math.random() - 0.5) * 3)),
          rainfall: Math.max(0, item.rainfall + (Math.random() - 0.5) * 2),
          angle: (item.angle + Math.floor(Math.random() * 60 - 30) + 360) % 360,
          suhuAir: Math.max(15, Math.min(35, item.suhuAir + (Math.random() - 0.5) * 1.5)),
          irradiation: Math.max(0, item.irradiation + (Math.random() - 0.5) * 100),
          bmpTemperature: Math.max(15, Math.min(40, item.bmpTemperature + (Math.random() - 0.5) * 1.5))
        }));
      }
      
      return baseData;
    } else {
      // Real API call
      const endpoint = this.apiEndpoints[location];
      if (!endpoint) {
        console.warn(`No API endpoint configured for location: ${location}`);
        return await fakeApiService.getLatestData(); // Fallback ke fake data
      }
      
      try {
        console.log(`[REAL API] Fetching from: ${endpoint}`);
        const response = await fetch(endpoint);
        const data = await response.json();
        
        // Transform data jika perlu untuk konsistensi format
        return Array.isArray(data) ? data : (Array.isArray(data.result) ? data.result : []);
      } catch (error) {
        console.error('Real API error, falling back to fake data:', error);
        return await fakeApiService.getLatestData();
      }
    }
  }

  /**
   * Get historical data
   */
  async getHistoricalData(location = 'petengoran', days = 7) {
    if (this.useFakeData) {
      console.log(`[FAKE API] Fetching ${days} days historical data for: ${location}`);
      return await fakeApiService.getHistoricalData(days);
    } else {
      // Untuk historical data, gunakan fake data karena biasanya endpoint real tidak menyediakan
      console.log(`[FAKE API] Historical data (${days} days) for: ${location} - Real API doesn't support historical`);
      return await fakeApiService.getHistoricalData(days);
    }
  }

  /**
   * Start real-time data updates
   */
  startRealTimeUpdates() {
    if (this.useFakeData) {
      fakeApiService.startRealTimeData();
    }
  }

  /**
   * Stop real-time data updates
   */
  stopRealTimeUpdates() {
    if (this.useFakeData) {
      fakeApiService.stopRealTimeData();
    }
  }

  /**
   * Get API status
   */
  getStatus() {
    return {
      mode: this.useFakeData ? 'FAKE' : 'REAL',
      realTimeActive: fakeApiService.isRunning,
      dataPoints: fakeApiService.getAllData().length,
      endpoints: this.apiEndpoints
    };
  }

  /**
   * Generate test data untuk development
   */
  async generateTestData(count = 50) {
    if (this.useFakeData) {
      return fakeApiService.generateBulkData(count);
    }
    return [];
  }

  /**
   * Clear all fake data
   */
  clearData() {
    if (this.useFakeData) {
      fakeApiService.clearAllData();
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Auto-start real-time updates jika menggunakan fake data
if (apiClient.useFakeData) {
  // Delay untuk memastikan app sudah load
  setTimeout(() => {
    apiClient.startRealTimeUpdates();
  }, 2000);
}

export default apiClient;