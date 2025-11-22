/**
 * Demo component untuk testing fake API service
 */

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
import apiClient from '../services/apiClient';
import Download from './dashboard/Download';

const FakeApiDemo = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [station1Count, setStation1Count] = useState(0);
  const [station2Count, setStation2Count] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');

  const checkLocalStorageData = () => {
    try {
      const station1Data = JSON.parse(localStorage.getItem('station1_data') || '[]');
      const station2Data = JSON.parse(localStorage.getItem('station2_data') || '[]');
      
      setStation1Count(station1Data.length);
      setStation2Count(station2Data.length);
      setLastUpdate(new Date().toLocaleString());
      
      // Log sample data untuk debugging
      if (station1Data.length > 0) {
        console.log('Station1 Sample Data:', station1Data[0]);
        console.log('Station1 Latest Data:', station1Data[station1Data.length - 1]);
        
        // Debug timestamp format
        console.log('Station1 Timestamp Samples:');
        station1Data.slice(0, 5).forEach((item, i) => {
          console.log(`[${i}] Timestamp: "${item.timestamp}" (${typeof item.timestamp})`);
          if (item.timestamp) {
            const parsed = new Date(item.timestamp);
            console.log(`[${i}] Parsed: ${parsed.toISOString()} (Valid: ${!isNaN(parsed.getTime())})`);
          }
        });
      }
      if (station2Data.length > 0) {
        console.log('Station2 Sample Data:', station2Data[0]);
        console.log('Station2 Latest Data:', station2Data[station2Data.length - 1]);
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  };

  const getDateRange = () => {
    try {
      const station1Data = JSON.parse(localStorage.getItem('station1_data') || '[]');
      if (station1Data.length === 0) return 'No data';
      
      const timestamps = station1Data.map(item => new Date(item.timestamp)).filter(d => !isNaN(d.getTime()));
      if (timestamps.length === 0) return 'Invalid timestamps';
      
      const earliest = new Date(Math.min(...timestamps));
      const latest = new Date(Math.max(...timestamps));
      
      return `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
    } catch (error) {
      return 'Error reading data';
    }
  };

  const clearAllData = () => {
    localStorage.removeItem('station1_data');
    localStorage.removeItem('station2_data');
    checkLocalStorageData();
  };

  const fetchData = async (location = 'petengoran') => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getData(location);
      setData(result);
      console.log('Demo - Fake API Data:', result);
    } catch (err) {
      setError(err.message);
      console.error('Demo - Fake API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    const currentStatus = apiClient.getStatus();
    setStatus(currentStatus);
    console.log('Demo - API Client Status:', currentStatus);
  };

  const generateTestData = async () => {
    setLoading(true);
    try {
      const result = await apiClient.generateTestData(100);
      console.log('Demo - Generated Test Data:', result);
      await fetchData(); // Refresh data
      checkLocalStorageData(); // Check localStorage after generating
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forceInitializeData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Force initializing fake API data...');
      
      // Import dan panggil fake API service secara langsung
      const { default: fakeApiService } = await import('../services/fakeApiService');
      
      // Force complete re-initialization
      const recordCount = fakeApiService.forceInitialize();
      console.log(`Force initialization complete: ${recordCount} records generated`);
      
      // Wait a bit then check
      setTimeout(() => {
        checkLocalStorageData();
        setLoading(false);
      }, 3000);
      
    } catch (err) {
      console.error('Force initialization error:', err);
      setError('Force initialization failed: ' + err.message);
      setLoading(false);
    }
  };

  const toggleApiMode = () => {
    const newMode = !apiClient.useFakeData;
    apiClient.setUseFakeData(newMode);
    getStatus();
  };

  useEffect(() => {
    fetchData();
    getStatus();
    checkLocalStorageData();
    
    // Check localStorage every 30 seconds
    const interval = setInterval(checkLocalStorageData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Container className="mt-4">
      <h2 className="text-center text-primary mb-4">
        🚀 Fake API Demo & Download Test
      </h2>
      
      {/* LocalStorage Status */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <Badge bg="primary" className="me-2">Station 1</Badge>
                Data Status
              </Card.Title>
              <Card.Text>
                <strong>Records:</strong> {station1Count.toLocaleString()}<br/>
                <strong>Date Range:</strong> {getDateRange()}<br/>
                <strong>Last Check:</strong> {lastUpdate}
              </Card.Text>
              <div className="d-flex gap-2">
                <Badge bg={station1Count > 0 ? 'success' : 'danger'}>
                  {station1Count > 0 ? 'Ready' : 'No Data'}
                </Badge>
                {station1Count > 10000 && (
                  <Badge bg="info">Full Dataset</Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <Badge bg="success" className="me-2">Station 2</Badge>
                Data Status
              </Card.Title>
              <Card.Text>
                <strong>Records:</strong> {station2Count.toLocaleString()}<br/>
                <strong>Date Range:</strong> {getDateRange()}<br/>
                <strong>Last Check:</strong> {lastUpdate}
              </Card.Text>
              <div className="d-flex gap-2">
                <Badge bg={station2Count > 0 ? 'success' : 'danger'}>
                  {station2Count > 0 ? 'Ready' : 'No Data'}
                </Badge>
                {station2Count > 10000 && (
                  <Badge bg="info">Full Dataset</Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* API Status Card */}
      <Card className="mb-4">
        <Card.Header>
          <h5>🔧 API Service Status</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <strong>Mode:</strong> <Badge bg={status.mode === 'FAKE' ? 'success' : 'warning'}>{status.mode}</Badge>
            </Col>
            <Col md={6}>
              <strong>Real-time Active:</strong> <Badge bg={status.realTimeActive ? 'success' : 'secondary'}>
                {status.realTimeActive ? 'Yes' : 'No'}
              </Badge>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}>
              <strong>Service Data Points:</strong> {status.dataPoints || 0}
            </Col>
            <Col md={6}>
              <strong>Configured Endpoints:</strong> {status.endpoints ? Object.keys(status.endpoints).length : 0}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Controls */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Controls</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Button 
                variant="primary" 
                onClick={() => fetchData('petengoran')} 
                disabled={loading}
                className="w-100 mb-2"
              >
                {loading ? 'Loading...' : 'Fetch Petengoran'}
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="info" 
                onClick={() => fetchData('kalimantan')} 
                disabled={loading}
                className="w-100 mb-2"
              >
                {loading ? 'Loading...' : 'Fetch Kalimantan'}
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="success" 
                onClick={forceInitializeData} 
                disabled={loading}
                className="w-100 mb-2"
              >
                {loading ? 'Loading...' : 'Force Initialize Data'}
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="secondary" 
                onClick={() => {getStatus(); checkLocalStorageData();}}
                className="w-100 mb-2"
              >
                Refresh Status
              </Button>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Button 
                variant={status.mode === 'FAKE' ? 'warning' : 'success'} 
                onClick={toggleApiMode}
                className="w-100"
              >
                Switch to {status.mode === 'FAKE' ? 'REAL' : 'FAKE'} API
              </Button>
            </Col>
            <Col md={6}>
              <Button 
                variant="outline-danger"
                onClick={clearAllData}
                className="w-100 mb-2"
              >
                🗑️ Clear All Data
              </Button>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Button 
                variant="outline-info"
                onClick={() => {
                  console.log('=== LocalStorage Debug ===');
                  const s1 = localStorage.getItem('station1_data');
                  const s2 = localStorage.getItem('station2_data');
                  console.log('Station1 raw:', s1 ? `${s1.length} chars` : 'NULL');
                  console.log('Station2 raw:', s2 ? `${s2.length} chars` : 'NULL');
                  if (s1) {
                    try {
                      const parsed1 = JSON.parse(s1);
                      console.log('Station1 parsed:', parsed1.length, 'records');
                      if (parsed1.length > 0) {
                        console.log('Station1 first:', parsed1[0]);
                        console.log('Station1 last:', parsed1[parsed1.length - 1]);
                      }
                    } catch (e) {
                      console.error('Station1 parse error:', e);
                    }
                  }
                  checkLocalStorageData();
                }}
                className="w-100"
              >
                🔍 Debug LocalStorage
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Download Test */}
      <Card className="mb-4">
        <Card.Header>
          <h5>📥 Download Test</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <strong>📊 Data Information:</strong><br/>
            <strong>Period:</strong> June 2025 - November 2025 (6 months)<br/>
            <strong>Interval:</strong> 15 minutes<br/>
            <strong>Expected Records:</strong> ~17,280 per station<br/>
            <strong>Parameters:</strong> Temperature, Humidity, Air Pressure, Wind Speed, Rainfall, etc.
          </Alert>
          
          {station1Count === 0 && (
            <Alert variant="warning">
              <strong>⚠️ No Data Found!</strong><br/>
              LocalStorage is empty. Click "Force Initialize Data" button above to generate the complete dataset from June 2025 to November 2025.
            </Alert>
          )}
          <Download />
        </Card.Body>
      </Card>

      {/* Data Display */}
      <Card>
        <Card.Header>
          <h5>🔍 Latest API Data ({data.length} records)</h5>
        </Card.Header>
        <Card.Body>
          {data.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ fontSize: '12px' }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-muted">No data available. Click "Fetch" button to load data.</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FakeApiDemo;