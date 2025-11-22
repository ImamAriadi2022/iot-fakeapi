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
    this.maxHistorySize = 50000; // Simpan maksimal 50000 data points (cukup untuk 6 bulan dengan interval 15 menit)
    
    // Inisialisasi dengan beberapa data historis
    this.initializeHistoricalData();
  }

  /**
   * Generate data historis dari Juni 2025 hingga sekarang
   */
  initializeHistoricalData() {
    console.log('🚀 Starting initializeHistoricalData...');
    
    const now = new Date();
    const startDate = new Date('2025-06-01T00:00:00'); // Mulai dari 1 Juni 2025
    
    // Clear existing data
    this.dataHistory = [];
    
    // Generate data setiap 15 menit dari Juni 2025 hingga sekarang
    console.log(`Generating historical data from ${startDate.toISOString()} to ${now.toISOString()}`);
    
    let count = 0;
    for (let time = new Date(startDate); time <= now; time.setMinutes(time.getMinutes() + 15)) {
      const data = this.generateRealisticData(new Date(time));
      this.dataHistory.push(data);
      count++;
      
      // Log progress every 1000 records
      if (count % 1000 === 0) {
        console.log(`📊 Generated ${count} records so far...`);
      }
    }
    
    console.log(`✅ Initialized with ${this.dataHistory.length} historical data points`);
    
    // Update localStorage dengan data lengkap untuk download
    console.log('💾 Updating localStorage...');
    this.updateLocalStorage();
    console.log('✅ localStorage update complete');
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
    
    // Generate data baru setiap 15 menit untuk simulasi realistic
    this.intervalId = setInterval(() => {
      const newData = this.generateRealisticData();
      this.dataHistory.push(newData);
      
      // Hapus data lama jika melebihi batas
      if (this.dataHistory.length > this.maxHistorySize) {
        this.dataHistory = this.dataHistory.slice(-this.maxHistorySize);
      }
      
      // Update localStorage setiap 5 menit (10 data points)
      if (this.dataHistory.length % 10 === 0) {
        this.updateLocalStorage();
      }
      
      console.log('New fake data generated:', newData);
    }, 900000); // 15 menit (900000 ms)
    
    console.log('Fake API service started - generating data every 15 minutes');
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
   * Update localStorage untuk kompatibilitas dengan Download component
   */
  updateLocalStorage() {
    try {
      // Update station1_data untuk dashboard
      const station1Data = this.dataHistory.map(item => ({
        timestamp: item.timestamp,
        humidity: item.humidity,
        temperature: item.temperature,
        airPressure: item.AirPressure,
        windspeed: item.windSpeed,
        rainfall: item.rainfall,
        windDirection: this.angleToDirection(item.angle),
        waterTemperature: item.suhuAir
      }));
      
      localStorage.setItem('station1_data', JSON.stringify(station1Data));
      
      // Update station2_data dengan slight variations
      const station2Data = this.dataHistory.map(item => ({
        timestamp: item.timestamp,
        humidity: Math.max(30, Math.min(95, item.humidity + (Math.random() - 0.5) * 5)),
        temperature: Math.max(15, Math.min(40, item.temperature + (Math.random() - 0.5) * 2)),
        airPressure: Math.max(990, Math.min(1030, item.AirPressure + (Math.random() - 0.5) * 10)),
        windspeed: Math.max(0, Math.min(50, item.windSpeed + (Math.random() - 0.5) * 3)),
        rainfall: Math.max(0, item.rainfall + (Math.random() - 0.5) * 2),
        windDirection: this.angleToDirection((item.angle + Math.floor(Math.random() * 60 - 30) + 360) % 360),
        waterTemperature: Math.max(15, Math.min(35, item.suhuAir + (Math.random() - 0.5) * 1.5))
      }));
      
      localStorage.setItem('station2_data', JSON.stringify(station2Data));
      
      console.log(`Updated localStorage: Station1=${station1Data.length}, Station2=${station2Data.length} records`);
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }

  /**
   * Convert angle to wind direction text
   */
  angleToDirection(angle) {
    const directions = [
      'North', 'North-Northeast', 'Northeast', 'East-Northeast',
      'East', 'East-Southeast', 'Southeast', 'South-Southeast',
      'South', 'South-Southwest', 'Southwest', 'West-Southwest',
      'West', 'West-Northwest', 'Northwest', 'North-Northwest'
    ];
    const index = Math.round(angle / 22.5) % 16;
    return directions[index];
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.dataHistory = [];
    localStorage.removeItem('station1_data');
    localStorage.removeItem('station2_data');
    console.log('All fake data cleared');
  }

  /**
   * Force re-initialization dengan data lengkap
   */
  forceInitialize() {
    console.log('🔄 Force initializing fake API data...');
    
    // Stop current processes
    this.stopRealTimeData();
    
    // Clear dan regenerate data
    this.dataHistory = [];
    
    const now = new Date();
    const startDate = new Date('2025-06-01T00:00:00');
    
    console.log(`Generating complete dataset from ${startDate.toISOString()} to ${now.toISOString()}`);
    
    let count = 0;
    for (let time = new Date(startDate); time <= now; time.setMinutes(time.getMinutes() + 15)) {
      const data = this.generateRealisticData(new Date(time));
      this.dataHistory.push(data);
      count++;
      
      // Log progress every 1000 records
      if (count % 1000 === 0) {
        console.log(`Generated ${count} records...`);
      }
    }
    
    console.log(`✅ Generated ${this.dataHistory.length} total records`);
    
    // Update localStorage immediately
    this.updateLocalStorage();
    
    // Restart real-time updates
    this.startRealTimeData();
    
    return this.dataHistory.length;
  }

  /**
   * Generate bulk data untuk testing
   */
  generateBulkData(count = 100) {
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - (count - i) * 15 * 60 * 1000); // 15 menit interval
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