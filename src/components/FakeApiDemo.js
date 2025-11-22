/**
 * Demo component untuk testing fake API service
 */

import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Row } from 'react-bootstrap';
import apiClient from '../services/apiClient';

const FakeApiDemo = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const result = await apiClient.generateTestData(10);
      console.log('Demo - Generated Test Data:', result);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err.message);
    } finally {
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
  }, []);

  return (
    <Container className="mt-4">
      <h2>Fake API Demo & Testing</h2>
      
      {/* Status Card */}
      <Card className="mb-4">
        <Card.Header>
          <h5>API Status</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <strong>Mode:</strong> <span className={`badge bg-${status.mode === 'FAKE' ? 'success' : 'warning'}`}>{status.mode}</span>
            </Col>
            <Col md={6}>
              <strong>Real-time Active:</strong> <span className={`badge bg-${status.realTimeActive ? 'success' : 'secondary'}`}>
                {status.realTimeActive ? 'Yes' : 'No'}
              </span>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}>
              <strong>Data Points:</strong> {status.dataPoints || 0}
            </Col>
            <Col md={6}>
              <strong>Endpoints:</strong> {status.endpoints ? Object.keys(status.endpoints).length : 0} configured
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
                onClick={generateTestData} 
                disabled={loading}
                className="w-100 mb-2"
              >
                {loading ? 'Loading...' : 'Generate Test Data'}
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="secondary" 
                onClick={getStatus}
                className="w-100 mb-2"
              >
                Refresh Status
              </Button>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Button 
                variant={status.mode === 'FAKE' ? 'warning' : 'success'} 
                onClick={toggleApiMode}
                className="w-100"
              >
                Switch to {status.mode === 'FAKE' ? 'REAL' : 'FAKE'} API
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

      {/* Data Display */}
      <Card>
        <Card.Header>
          <h5>Latest Data ({data.length} records)</h5>
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