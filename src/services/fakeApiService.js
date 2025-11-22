/**
 * Fake API Service untuk simulasi data IoT
 * Menghasilkan data realistic untuk monitoring microclimate
 */

class FakeApiService {
  constructor() {
    this.baseTimestamp = new Date();
    this.isRunning = false;
    this.intervalId = null;
    this.dataHistory = [];
    this.maxHistorySize = 1000; // Simpan maksimal 1000 data points
    
    // Inisialisasi dengan beberapa data historis
    this.initializeHistoricalData();
  }

  /**
   * Generate data historis untuk 7 hari terakhir
   */
  initializeHistoricalData() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Generate data setiap 30 menit untuk 7 hari terakhir
    for (let time = sevenDaysAgo; time <= now; time.setMinutes(time.getMinutes() + 30)) {
      const data = this.generateRealisticData(new Date(time));
      this.dataHistory.push(data);
    }
    
    console.log(`Initialized with ${this.dataHistory.length} historical data points`);
  }

  /**
   * Generate data IoT yang realistic dengan variasi natural
   */
  generateRealisticData(timestamp = new Date()) {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const dayOfYear = Math.floor((timestamp - new Date(timestamp.getFullYear(), 0, 0)) / 86400000);
    
    // Base values dengan variasi musiman
    const seasonalTemp = 25 + Math.sin((dayOfYear / 365) * 2 * Math.PI) * 5; // 20-30°C base
    const seasonalHumidity = 70 + Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI) * 15; // 55-85%
    
    // Variasi harian (suhu lebih tinggi siang hari)
    const dailyTempVariation = Math.sin(((hour - 6) / 12) * Math.PI) * 8; // Puncak jam 2 siang
    const dailyHumidityVariation = Math.sin(((hour - 6) / 12) * Math.PI + Math.PI) * 10; // Terbalik dengan suhu
    
    // Random noise
    const tempNoise = (Math.random() - 0.5) * 4;
    const humidityNoise = (Math.random() - 0.5) * 8;
    const pressureNoise = (Math.random() - 0.5) * 20;
    const windNoise = (Math.random() - 0.5) * 10;
    const rainfallChance = Math.random();
    
    // Calculate values
    const temperature = Math.max(15, Math.min(40, seasonalTemp + dailyTempVariation + tempNoise));
    const humidity = Math.max(30, Math.min(95, seasonalHumidity + dailyHumidityVariation + humidityNoise));
    const airPressure = Math.max(990, Math.min(1030, 1013 + pressureNoise));
    const windSpeed = Math.max(0, Math.min(50, 5 + Math.abs(windNoise)));
    const windDirection = Math.floor(Math.random() * 360);
    
    // Rainfall logic (lebih sering hujan jika humidity tinggi)
    let rainfall = 0;
    if (humidity > 80 && rainfallChance > 0.7) {
      rainfall = Math.random() * 20; // Light to moderate rain
    } else if (humidity > 90 && rainfallChance > 0.5) {
      rainfall = Math.random() * 50; // Moderate to heavy rain
    }
    
    const waterTemperature = temperature - 2 + (Math.random() - 0.5) * 3;
    
    // Irradiation (solar radiation) - tinggi saat siang, rendah saat malam
    const hourlyIrradiation = Math.sin(((hour - 6) / 12) * Math.PI); // 0 saat sunset/sunrise, 1 saat noon
    const baseIrradiation = hourlyIrradiation > 0 ? hourlyIrradiation * 1000 + 200 : 0; // 0-1200 W/m²
    const irradiation = Math.max(0, baseIrradiation + (Math.random() - 0.5) * 200);
    
    // BMP Temperature (biasanya sedikit berbeda dari temperature utama)
    const bmpTemperature = temperature + (Math.random() - 0.5) * 2;
    
    // Format timestamp sesuai dengan format yang digunakan aplikasi
    const formattedTimestamp = this.formatTimestamp(timestamp);
    
    return {
      timestamp: formattedTimestamp,
      humidity: Math.round(humidity * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      AirPressure: Math.round(airPressure * 10) / 10,
      windSpeed: Math.round(windSpeed * 10) / 10,
      angle: windDirection,
      rainfall: Math.round(rainfall * 10) / 10,
      suhuAir: Math.round(waterTemperature * 10) / 10,
      irradiation: Math.round(irradiation * 10) / 10,
      bmpTemperature: Math.round(bmpTemperature * 10) / 10
    };
  }

  /**
   * Format timestamp ke format DD-MM-YY HH:mm:ss
   */
  formatTimestamp(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Mulai generate data real-time
   */
  startRealTimeData() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Generate data baru setiap 30 detik
    this.intervalId = setInterval(() => {
      const newData = this.generateRealisticData();
      this.dataHistory.push(newData);
      
      // Hapus data lama jika melebihi batas
      if (this.dataHistory.length > this.maxHistorySize) {
        this.dataHistory = this.dataHistory.slice(-this.maxHistorySize);
      }
      
      console.log('New fake data generated:', newData);
    }, 30000); // 30 detik
    
    console.log('Fake API service started - generating data every 30 seconds');
  }

  /**
   * Stop generate data real-time
   */
  stopRealTimeData() {
    if (!this.isRunning) return;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('Fake API service stopped');
  }

  /**
   * Simulasi API endpoint - Get latest data
   */
  async getLatestData() {
    // Simulasi network delay
    await this.simulateNetworkDelay();
    
    if (this.dataHistory.length === 0) {
      const data = this.generateRealisticData();
      this.dataHistory.push(data);
    }
    
    // Return latest 10 data points
    const latestData = this.dataHistory.slice(-10);
    
    return new Promise((resolve) => {
      resolve(latestData);
    });
  }

  /**
   * Simulasi API endpoint - Get historical data
   */
  async getHistoricalData(days = 7) {
    await this.simulateNetworkDelay();
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Filter data berdasarkan range waktu
    const filteredData = this.dataHistory.filter(item => {
      const itemDate = this.parseTimestamp(item.timestamp);
      return itemDate >= startDate && itemDate <= now;
    });
    
    return new Promise((resolve) => {
      resolve(filteredData);
    });
  }

  /**
   * Parse timestamp dari format DD-MM-YY HH:mm:ss ke Date object
   */
  parseTimestamp(timestampStr) {
    const [datePart, timePart] = timestampStr.split(' ');
    const [day, month, year] = datePart.split('-');
    const [hours, minutes, seconds] = timePart.split(':');
    
    const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
    
    return new Date(fullYear, parseInt(month) - 1, parseInt(day), 
                   parseInt(hours), parseInt(minutes), parseInt(seconds));
  }

  /**
   * Simulasi network delay
   */
  async simulateNetworkDelay(min = 100, max = 500) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get all data (untuk debugging)
   */
  getAllData() {
    return this.dataHistory;
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.dataHistory = [];
    console.log('All fake data cleared');
  }

  /**
   * Generate bulk data untuk testing
   */
  generateBulkData(count = 100) {
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - (count - i) * 30 * 60 * 1000); // 30 menit interval
      data.push(this.generateRealisticData(timestamp));
    }
    
    this.dataHistory = [...this.dataHistory, ...data];
    
    // Trim jika melebihi batas
    if (this.dataHistory.length > this.maxHistorySize) {
      this.dataHistory = this.dataHistory.slice(-this.maxHistorySize);
    }
    
    return data;
  }
}

// Create singleton instance
const fakeApiService = new FakeApiService();

export default fakeApiService;