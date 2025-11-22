import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';

// Endpoint mengikuti Station1.js dan Station2.js
const API_STATION1 = process.env.REACT_APP_API_PETENGORAN_RESAMPLE15M_STATION1;
const API_STATION2 = process.env.REACT_APP_API_PETENGORAN_RESAMPLE15M_STATION2;

// Fungsi parsing timestamp agar bisa dibandingkan dengan filter tanggal
const parseTimestamp = (ts) => {
  if (!ts) return ts;
  if (typeof ts === 'string' && ts.includes('T')) return ts;
  if (typeof ts !== 'string') return ts;
  const [date, time] = ts.split(' ');
  if (!date || !time) return ts;
  const [day, month, year] = date.split('-');
  if (!day || !month || !year) return ts;
  const fullYear = year.length === 2 ? '20' + year : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
};

const formatUserFriendlyDate = (timestamp) => {
  if (!timestamp) return 'Invalid Date';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return 'Invalid Date';
  }
};

const windDirectionToEnglish = (dir) => {
  if (!dir) return '';
  const map = {
    'Utara': 'North',
    'Timur Laut': 'Northeast',
    'Timur': 'East',
    'Timur Timur Laut': 'East-Northeast',
    'Barat Laut': 'Northwest',
    'Barat': 'West',
    'Barat Daya': 'Southwest',
    'Selatan': 'South',
    'Tenggara': 'Southeast',
    'Timur Selatan': 'East-Southeast',
    'Barat Barat Laut': 'West-Northwest',
    'Barat Barat Daya': 'West-Southwest',
    'Selatan Barat Daya': 'South-Southwest',
    'Selatan Tenggara': 'South-Southeast',
    'Timur Timur Selatan': 'East-Southeast',
    'Timur Tenggara': 'East-Southeast',
    'North': 'North',
    'South': 'South',
    'East': 'East',
    'West': 'West',
    'Northeast': 'Northeast',
    'Northwest': 'Northwest',
    'Southeast': 'Southeast',
    'Southwest': 'Southwest',
    'East-Northeast': 'East-Northeast',
    'East-Southeast': 'East-Southeast',
    'West-Northwest': 'West-Northwest',
    'West-Southwest': 'West-Southwest',
    'South-Southwest': 'South-Southwest',
    'South-Southeast': 'South-Southeast',
  };
  return map[dir] || dir;
};

// Mapping untuk Station 1
const mapStation1 = (item) => {
  if (!item) return {};
  if (!item.timestamp || item.timestamp === 'Invalid date' || item.timestamp === 'alat rusak') {
    return { ...item, invalid: true };
  }
  const ts = item.timestamp;
  const parsedTs = parseTimestamp(ts);
  return {
    timestamp: parsedTs,
    userFriendlyDate: formatUserFriendlyDate(parsedTs),
    humidity: item.humidity ?? item.hum_dht22 ?? 0,
    temperature: item.temperature ?? item.temp_dht22 ?? 0,
    rainfall: item.rainfall ?? 0,
    windspeed: item.windspeed ?? item.wind_speed ?? 0,
    irradiation: item.irradiation ?? 0,
    windDirection: windDirectionToEnglish(item.direction ?? ''),
    angle: item.angle ?? 0,
    bmptemperature: item.bmptemperature ?? 0,
    airpressure: item.airpressure ?? 0,
    suhuair: item.suhuair ?? 0,
    invalid: false,
  };
};

// Mapping untuk Station 2
const mapStation2 = (item) => {
  if (!item) return {};
  if (!item.timestamp || item.timestamp === 'Invalid date' || item.timestamp === 'alat rusak') {
    return { ...item, invalid: true };
  }
  const ts = item.timestamp;
  const parsedTs = parseTimestamp(ts);
  return {
    timestamp: parsedTs,
    userFriendlyDate: formatUserFriendlyDate(parsedTs),
    humidity: item.humidity ?? 0,
    temperature: item.temperature ?? 0,
    rainfall: item.rainfall ?? 0,
    windspeed: item.windspeed ?? 0,
    irradiation: item.pyrano ?? item.irradiation ?? 0,
    windDirection: windDirectionToEnglish(item.direction ?? ''),
    angle: item.angle ?? 0,
    bmptemperature: item.bmptemperature ?? 0,
    airpressure: item.airpressure ?? 0,
    suhuair: item.suhuair ?? 0, // <-- Tambahkan agar field suhuair selalu ada
    invalid: false,
  };
};

const formatDataForCSV = (data, stationType) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((item, index) => {
    const formattedData = {
      'No': index + 1,
      'Tanggal & Waktu': formatUserFriendlyDate(item.timestamp),
      'Status': item.interpolated ? 'Estimasi' : 'Aktual',
      'Kelembapan (%)': parseFloat(item.humidity || 0).toFixed(1),
      'Suhu (°C)': parseFloat(item.temperature || 0).toFixed(1),
      'Curah Hujan (mm)': parseFloat(item.rainfall || 0).toFixed(1),
      'Kecepatan Angin (m/s)': parseFloat(item.windspeed || 0).toFixed(1),
      'Radiasi Matahari (W/m²)': parseFloat(item.irradiation || 0).toFixed(0),
      'Arah Angin': item.windDirection || '',
      'Sudut Angin (°)': parseFloat(item.angle || 0).toFixed(0),
      'BMP Temperature (°C)': parseFloat(item.bmptemperature || 0).toFixed(1),
      'Air Pressure (hPa)': parseFloat(item.airpressure || 0).toFixed(2),
    };
    // Selalu tambahkan Water Temperature untuk kedua station
    formattedData['Water Temperature (°C)'] = parseFloat(item.suhuair || 0).toFixed(1);
    return formattedData;
  });
};

const createFormattedCSV = (data, stationType) => {
  if (!data || data.length === 0) return '';
  const csvData = formatDataForCSV(data, stationType);
  const headers = Object.keys(csvData[0]);
  const headerRow = headers.map(header => `"${header}"`).join(',');
  const dataRows = csvData.map(row =>
    headers.map(header => `"${row[header]}"`).join(',')
  );
  const metadata = [
    `"=== DATA MONITORING STATION ${stationType.toUpperCase()} ==="`,
    `"Diekspor pada: ${formatUserFriendlyDate(new Date().toISOString())}"`,
    `"Total Records: ${data.length}"`,
    `"Status: Aktual = Data asli dari sensor, Estimasi = Data hasil interpolasi"`,
    '""',
    headerRow
  ];
  return [...metadata, ...dataRows].join('\n');
};



const Download = () => {
  const [selectedStation, setSelectedStation] = useState('Station 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fileFormat, setFileFormat] = useState('json');
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [station1Data, setStation1Data] = useState([]);
  const [station2Data, setStation2Data] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Hanya fitur resampling
  const [enableResampling, setEnableResampling] = useState(false);
  const [resampleInterval, setResampleInterval] = useState(15);
  const [resampleMethod, setResampleMethod] = useState('mean');

  // Fetch data dari API saat komponen mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hapus setLoading(true) untuk menghilangkan delay visual
        setDataReady(false);

        // Fetch Station 1
        const res1 = await fetch(API_STATION1);
        const json1 = res1.ok ? await res1.json() : { data: { result: [] } };
        const station1Data = Array.isArray(json1.data?.result) ? json1.data.result.map(mapStation1) : [];
        setStation1Data(station1Data);

        // Fetch Station 2
        const res2 = await fetch(API_STATION2);
        const json2 = res2.ok ? await res2.json() : { data: { result: [] } };
        const station2Data = Array.isArray(json2.data?.result) ? json2.data.result.map(mapStation2) : [];
        setStation2Data(station2Data);

        setDataReady(true);
      } catch (error) {
        setStation1Data([]);
        setStation2Data([]);
        setDataReady(false);
      }
      // Hapus finally block setLoading(false)
    };
    fetchData();
  }, []);

  const handleDownload = () => {
    setShowLogin(true);
  };

  // Fungsi untuk cek tanggal yang tidak ada data
  const getMissingDates = (data, startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const dateSet = new Set(
      data.map(item => {
        if (!item.timestamp) return null;
        return new Date(item.timestamp).toISOString().slice(0, 10);
      }).filter(Boolean)
    );
    const missing = [];
    let current = startDate;
    while (current <= endDate) {
      if (!dateSet.has(current)) {
        missing.push(current);
      }
      // Tambah 1 hari secara manual
      const [y, m, d] = current.split('-').map(Number);
      let year = y, month = m, day = d + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) {
        day = 1;
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
      current = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return missing;
  };

  const processDownload = () => {
    if (!dataReady) {
      alert('Data is still loading. Please wait...');
      return;
    }
    if (!startDate || !endDate) {
      alert('Please select both start date and end date.');
      return;
    }
    const rawData = getStationData();
    let data = filterDataByDate(rawData);

    // Cek jika ada data invalid
    const hasInvalid = data.some(
      (item) =>
        item.invalid ||
        item.timestamp === 'Invalid date' ||
        item.timestamp === 'alat rusak'
    );
    if (hasInvalid) {
      alert('Data tidak bisa di-download karena respon dari server tertulis alat rusak atau Invalid date.');
      return;
    }
    if (data.length === 0) {
      const missingDates = getMissingDates(rawData, startDate, endDate);
      if (missingDates.length > 0) {
        alert(
          `No data available for the selected date range.\n` +
          `Tanggal berikut tidak ada data:\n${missingDates.join(', ')}`
        );
      } else {
        alert('No data available for the selected date range.');
      }
      return;
    }

    // Resampling dengan mean untuk mengisi gap data kosong
    if (enableResampling) {
      try {
        let fields = [
          'humidity', 'temperature', 'rainfall', 'windspeed', 'irradiation',
          'windDirection', 'angle', 'bmptemperature', 'airpressure', 'suhuair'
        ];
        // Ambil data valid
        let validData = data.filter(item => item.timestamp && item.timestamp !== 'Invalid date' && item.timestamp !== 'alat rusak');
        // Resampling: jika ada slot waktu kosong, isi dengan mean dari data yang ada di slot itu
        data = resampleTimeSeriesWithMeanFill(validData, resampleInterval, fields);
        if (data.length === 0) {
          alert('No data available after resampling.');
          return;
        }
      } catch (error) {
        alert('Error during resampling: ' + error.message);
        return;
      }
    }

       let filename = `${selectedStation.replace(' ', '_')}_${startDate}_to_${endDate}`;
    if (enableResampling) {
      filename += `_resample${resampleInterval}m`;
    }

    if (fileFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
    } else if (fileFormat === 'csv') {
      const csv = createFormattedCSV(data, selectedStation);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${filename}.csv`);
    }
  };

  // Fungsi resampling dengan mean fill untuk gap data
  function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
    if (!Array.isArray(data) || data.length === 0) return [];
    data = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const start = new Date(data[0].timestamp);
    const end = new Date(data[data.length - 1].timestamp);

  
    let result = [];
    let current = new Date(start);
    while (current <= end) {
      let next = new Date(current);
      next.setMinutes(next.getMinutes() + intervalMinutes);
      let slotData = data.filter(item => {
        let t = new Date(item.timestamp);
        return t >= current && t < next;
      });
      let resampled = { timestamp: current.toISOString(), userFriendlyDate: formatUserFriendlyDate(current.toISOString()) };
      fields.forEach(field => {
        if (slotData.length === 0) {
          const mean = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / data.length;
          resampled[field] = isNaN(mean) ? null : mean;
        } else {
          const mean = slotData.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / slotData.length;
          resampled[field] = isNaN(mean) ? null : mean;
        }
      });
      result.push(resampled);
      current = next;
    }
    return result;
  }

  const handleLoginSubmit = () => {
    if (username === 'admin' && password === 'admin123') {
      setShowLogin(false);
      processDownload();
    } else {
      alert('Invalid credentials!');
    }
  };

  const getStationData = () => {
    return selectedStation === 'Station 1' ? station1Data : station2Data;
  };

  const filterDataByDate = (data) => {
    if (!startDate || !endDate) return [];
    return data.filter((item) => {
      if (!item.timestamp) return false;
      const itemYMD = new Date(item.timestamp).toISOString().slice(0, 10);
      return itemYMD >= startDate && itemYMD <= endDate;
    });
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      <Row>
        <Col>
          <h3 className="text-center fw-bold text-primary">Download Data</h3>
        </Col>
      </Row>

      <Row className="mt-4 d-flex justify-content-center">
        <Col md={6} className="text-center">
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Pilih Station</Form.Label>
            <Form.Select
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              className="shadow-sm"
            >
              <option value="Station 1">Station 1</option>
              <option value="Station 2">Station 2</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Form.Group controlId="startDate">
            <Form.Label className="fw-bold">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value;
                let iso = val;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
                  const [d, m, y] = val.split('/');
                  iso = `${y}-${m}-${d}`;
                }
                setStartDate(iso);
              }}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="endDate">
            <Form.Label className="fw-bold">End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => {
                const val = e.target.value;
                let iso = val;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
                  const [d, m, y] = val.split('/');
                  iso = `${y}-${m}-${d}`;
                }
                setEndDate(iso);
              }}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Form.Group controlId="fileFormat">
            <Form.Label className="fw-bold">Select File Format</Form.Label>
            <Form.Check
              type="radio"
              label="JSON"
              name="fileFormat"
              value="json"
              checked={fileFormat === 'json'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
            <Form.Check
              type="radio"
              label="CSV"
              name="fileFormat"
              value="csv"
              checked={fileFormat === 'csv'}
              onChange={(e) => setFileFormat(e.target.value)}
              className="fw-semibold"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Hapus fitur interpolasi, hanya resampling */}
      <Row className="mt-4">
        <Col>
          <Form.Group>
            <Form.Check
              type="checkbox"
              label="Enable Data Resampling (Agregasi Data)"
              checked={enableResampling}
              onChange={(e) => setEnableResampling(e.target.checked)}
              className="fw-bold"
            />
            <Form.Text className="text-muted">
              Menggabungkan data ke interval waktu yang lebih besar untuk analisis trend
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Pilihan timeframe seperti gambar */}
      {enableResampling && (
        <Row className="mt-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Select timeframe</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  label="1menit"
                  name="timeframe"
                  value={1}
                  checked={resampleInterval === 1}
                  onChange={() => setResampleInterval(1)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  label="15menit"
                  name="timeframe"
                  value={15}
                  checked={resampleInterval === 15}
                  onChange={() => setResampleInterval(15)}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  label="30menit"
                  name="timeframe"
                  value={30}
                  checked={resampleInterval === 30}
                  onChange={() => setResampleInterval(30)}
                  className="mb-2"
                />
              </div>
            </Form.Group>
          </Col>
        </Row>
      )}



      <Row className="mt-4">
        <Col className="text-center">
          {dataReady && (
            <div className="mb-3">
              <small className="text-muted">
                Petengoran {selectedStation}: {getStationData().length} records
                <br />
                {enableResampling && (
                  <><strong>Resampling:</strong> {resampleInterval} menit ({resampleMethod})<br /></>
                )}
              </small>
            </div>
          )}

          <Button
            variant="success"
            onClick={handleDownload}
            className="px-5 py-2 fw-bold shadow-lg"
            disabled={!dataReady}
          >
            Download Data
          </Button>
        </Col>
      </Row>

      {/* Modal Login */}
      <Modal show={showLogin} onHide={() => setShowLogin(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Login Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <Button variant="primary" onClick={handleLoginSubmit}>
              Login
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Download;
