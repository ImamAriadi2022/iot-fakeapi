import { saveAs } from 'file-saver';
import { useState } from 'react';
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { resampleTimeSeries } from '../../utils/timeSeriesResampler';

// Ambil data dari localStorage kedua station
function getStationData(station) {
  let key = '';
  if (station === 'Station 1') key = 'station1_data';
  if (station === 'Station 2') key = 'station2_data';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper validasi tanggal (format ISO atau DD-MM-YY HH:mm:ss)
function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  
  // Coba ISO format dulu (YYYY-MM-DDTHH:mm:ss atau YYYY-MM-DD HH:mm:ss)
  let iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso;
  
  // Coba format DD-MM-YY HH:mm:ss
  if (str.includes(' ') && str.includes('-')) {
    const [datePart, timePart] = str.split(' ');
    if (datePart && timePart) {
      const [day, month, year] = datePart.split('-');
      if (day && month && year) {
        const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
        const mm = month.padStart(2, '0');
        const dd = day.padStart(2, '0');
        
        const isoString = `${fullYear}-${mm}-${dd}T${timePart}`;
        const parsedDate = new Date(isoString);
        
        if (!isNaN(parsedDate.getTime())) return parsedDate;
      }
    }
  }
  
  // Coba format alternatif
  try {
    const parsed = new Date(str.replace(' ', 'T'));
    if (!isNaN(parsed.getTime())) return parsed;
  } catch (e) {
    // ignore
  }
  
  console.warn('Failed to parse timestamp:', str);
  return null;
}

const Download = () => {
  const [selectedStation, setSelectedStation] = useState('Station 1');
  const [startDate, setStartDate] = useState('2025-06-01');
  const [endDate, setEndDate] = useState('2025-11-22');
  const [fileFormat, setFileFormat] = useState('json');
  const [showRusak, setShowRusak] = useState(false);
  
  // Opsi resampling
  const [enableResampling, setEnableResampling] = useState(false);
  const [resampleInterval, setResampleInterval] = useState(15);
  const [resampleMethod, setResampleMethod] = useState('mean');

  // Test function untuk debug
  const testDataAccess = () => {
    console.log('=== TESTING DATA ACCESS ===');
    
    // Test localStorage access
    const s1Raw = localStorage.getItem('station1_data');
    const s2Raw = localStorage.getItem('station2_data');
    
    console.log('Station1 raw exists:', !!s1Raw);
    console.log('Station2 raw exists:', !!s2Raw);
    
    if (s1Raw) {
      console.log('Station1 raw length:', s1Raw.length);
      try {
        const s1Data = JSON.parse(s1Raw);
        console.log('Station1 parsed count:', s1Data.length);
        
        if (s1Data.length > 0) {
          console.log('Station1 first item:', s1Data[0]);
          console.log('Station1 last item:', s1Data[s1Data.length - 1]);
          
          // Test timestamp parsing
          const firstTimestamp = s1Data[0].timestamp;
          const parsedFirst = parseDate(firstTimestamp);
          console.log('First timestamp parsing:', firstTimestamp, '->', parsedFirst);
          
          // Test date filtering
          const testStart = new Date('2025-06-01');
          const testEnd = new Date('2025-11-22');
          console.log('Test date range:', testStart, 'to', testEnd);
          
          let matchCount = 0;
          s1Data.slice(0, 10).forEach((item, i) => {
            const parsed = parseDate(item.timestamp);
            const inRange = parsed && parsed >= testStart && parsed <= testEnd;
            console.log(`[${i}] ${item.timestamp} -> ${parsed ? parsed.toISOString() : 'INVALID'} -> ${inRange ? 'IN RANGE' : 'OUT OF RANGE'}`);
            if (inRange) matchCount++;
          });
          
          console.log('Sample match count (first 10):', matchCount);
        }
      } catch (e) {
        console.error('Station1 parsing error:', e);
      }
    }
    
    // Test getStationData function
    const functionResult = getStationData(selectedStation);
    console.log('getStationData result:', functionResult.length, 'records');
    
    console.log('=== TEST COMPLETE ===');
  };

  const handleDownload = () => {
    console.log('🔽 Download started...');
    
    // Validasi tanggal
    if (!startDate || !endDate) {
      console.log('❌ No date range selected');
      setShowRusak(true);
      return;
    }
    
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    console.log(`📊 Selected station: ${selectedStation}`);
    
    const data = getStationData(selectedStation);
    console.log(`📦 Raw data count: ${data.length}`);
    
    if (!data.length) {
      console.log('❌ No raw data found');
      setShowRusak(true);
      return;
    }
    
    // Log sample timestamps for debugging
    console.log('🔍 Sample timestamps:');
    data.slice(0, 5).forEach((item, i) => {
      console.log(`[${i}] Original: "${item.timestamp}" (${typeof item.timestamp})`);
      const parsed = parseDate(item.timestamp);
      console.log(`[${i}] Parsed: ${parsed ? parsed.toISOString() : 'INVALID'}`);
    });
    
    // Filter data by date
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log(`🎯 Filter range: ${start.toISOString()} to ${end.toISOString()}`);
    
    let filtered = data.filter(item => {
      const d = parseDate(item.timestamp);
      const isValid = d && d >= start && d <= end;
      
      if (filtered.length < 5) { // Log first few filter results
        console.log(`Filter check: "${item.timestamp}" -> ${d ? d.toISOString() : 'INVALID'} -> ${isValid ? 'INCLUDED' : 'EXCLUDED'}`);
      }
      
      return isValid;
    });
    
    console.log(`✅ Filtered data count: ${filtered.length}`);
    
    // Jika ada data yang timestamp-nya null/invalid, atau hasil filter kosong, tampilkan alat rusak
    if (filtered.length === 0) {
      console.log('❌ No data matches the selected date range');
      setShowRusak(true);
      return;
    }

    // Apply resampling jika diaktifkan
    if (enableResampling) {
      try {
        // Tentukan fields yang akan di-resample
        const fields = ['humidity', 'temperature', 'airPressure', 'windspeed', 'rainfall', 'windDirection', 'waterTemperature'];
        filtered = resampleTimeSeries(filtered, resampleInterval, resampleMethod, fields);
        
        if (filtered.length === 0) {
          setShowRusak(true);
          return;
        }
      } catch (error) {
        console.error('Resampling error:', error);
        alert('Error during resampling: ' + error.message);
        return;
      }
    }
    
    // Generate filename with resampling info
    const resampleSuffix = enableResampling ? `_resampled_${resampleInterval}min_${resampleMethod}` : '';
    const baseFilename = `${selectedStation.replace(' ', '_').toLowerCase()}_data${resampleSuffix}`;
    
    // Download
    console.log('💾 Starting download process...');
    try {
      if (fileFormat === 'json') {
        const jsonString = JSON.stringify(filtered, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        saveAs(blob, `${baseFilename}.json`);
        console.log('✅ JSON download initiated');
      } else if (fileFormat === 'csv') {
        const worksheet = XLSX.utils.json_to_sheet(filtered);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `${baseFilename}.csv`);
        console.log('✅ CSV download initiated');
      }
    } catch (downloadError) {
      console.error('❌ Download failed:', downloadError);
      alert('Download failed: ' + downloadError.message);
    }
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
          <Button
            variant={selectedStation === 'Station 1' ? 'primary' : 'outline-primary'}
            onClick={() => setSelectedStation('Station 1')}
            className="me-3 px-4 py-2 fw-bold shadow-sm"
          >
            Station 1
          </Button>
          <Button
            variant={selectedStation === 'Station 2' ? 'primary' : 'outline-primary'}
            onClick={() => setSelectedStation('Station 2')}
            className="px-4 py-2 fw-bold shadow-sm"
          >
            Station 2
          </Button>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Form.Group controlId="startDate">
            <Form.Label className="fw-bold">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
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

      {/* Resampling Options */}
      <Row className="mt-4">
        <Col>
          <Form.Group>
            <Form.Check
              type="checkbox"
              label="Enable Data Resampling"
              checked={enableResampling}
              onChange={(e) => setEnableResampling(e.target.checked)}
              className="fw-bold"
            />
            <Form.Text className="text-muted">
              Resample data ke interval waktu tertentu (berguna untuk dataset besar)
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {enableResampling && (
        <>
          <Row className="mt-3">
            <Col md={6}>
              <Form.Group controlId="resampleInterval">
                <Form.Label className="fw-bold">Interval (minutes)</Form.Label>
                <Form.Select
                  value={resampleInterval}
                  onChange={(e) => setResampleInterval(parseInt(e.target.value))}
                  className="shadow-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>1 day</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="resampleMethod">
                <Form.Label className="fw-bold">Aggregation Method</Form.Label>
                <Form.Select
                  value={resampleMethod}
                  onChange={(e) => setResampleMethod(e.target.value)}
                  className="shadow-sm"
                >
                  <option value="mean">Average (Mean)</option>
                  <option value="first">First Value</option>
                  <option value="last">Last Value</option>
                  <option value="max">Maximum</option>
                  <option value="min">Minimum</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </>
      )}

      <Row className="mt-4">
        <Col className="text-center">
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Button
              variant="info"
              onClick={testDataAccess}
              className="px-3 py-2 fw-bold shadow mb-2"
            >
              🔍 Test Data Access
            </Button>
            <Button
              variant="warning"
              onClick={() => {
                setStartDate('2025-06-01');
                setEndDate('2025-11-22');
                setSelectedStation('Station 1');
                console.log('✅ Set to optimal date range: 2025-06-01 to 2025-11-22, Station 1');
              }}
              className="px-3 py-2 fw-bold shadow mb-2"
            >
              🎯 Set Optimal Range
            </Button>
            <Button
              variant="success"
              onClick={handleDownload}
              className="px-4 py-2 fw-bold shadow-lg mb-2"
            >
              📥 Download Data
            </Button>
          </div>
        </Col>
      </Row>

      {/* Modal Debug Info */}
      <Modal show={showRusak} onHide={() => setShowRusak(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Download Debug Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center" style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2em' }}>
            No data available for the selected date range!
          </div>
          <hr />
          <div style={{ fontSize: '0.9em', textAlign: 'left' }}>
            <strong>Debug Information:</strong><br/>
            • Selected Station: {selectedStation}<br/>
            • Date Range: {startDate} to {endDate}<br/>
            • Raw Data Count: {getStationData(selectedStation).length}<br/>
            <br/>
            <strong>Suggestions:</strong><br/>
            • Try clicking "🔍 Test Data Access" button for detailed analysis<br/>
            • Check if data exists in localStorage<br/>
            • Verify date range covers available data period<br/>
            • Open Developer Console for detailed logs
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Download;