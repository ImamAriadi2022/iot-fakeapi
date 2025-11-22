import { useState } from "react";
import { Button, ButtonGroup, Col, Modal, Row } from "react-bootstrap";
import {
    Brush,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";



export function resampleTimeSeriesWithMeanFill(data, intervalMinutes, fields) {
  if (!Array.isArray(data) || data.length === 0) return [];
  data = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const start = new Date(data[0].timestamp);
  const now = new Date(); // gunakan waktu sekarang sebagai end
  let result = [];
  let current = new Date(start);

  // Ambil data jam terakhir untuk pengisian slot kosong
  const lastData = data[data.length - 1];

  while (current < now) {
    const currentTime = new Date(current);
    let next = new Date(currentTime);
    next.setMinutes(next.getMinutes() + intervalMinutes);

    let slotData = data.filter(item => {
      let t = new Date(item.timestamp);
      return t >= currentTime && t < next;
    });

    let resampled = { timestamp: currentTime.toISOString() };
    fields.forEach(field => {
      let value;
      if (slotData.length === 0) {
        // Isi dengan data jam terakhir + variasi random ±2%
        const base = parseFloat(lastData[field]) || 0;
        const variation = base * 0.02 * (Math.random() - 0.5) * 2;
        value = base + variation;
      } else {
        // Rata-rata slot + variasi random ±2%
        const mean = slotData.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0) / slotData.length;
        const variation = mean * 0.02 * (Math.random() - 0.5) * 2;
        value = mean + variation;
      }
      resampled[field] = isNaN(value) ? null : Number(value.toFixed(2));
    });
    result.push(resampled);
    current = next;
  }
  return result;
}


const formatXAxis = (tick) => {
  if (!tick) return '';
  const d = new Date(tick);
  return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const TrendChart = ({ data, fields }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [interval, setInterval] = useState(15); // 15 or 30
  const [range, setRange] = useState('1d'); // '1d', '7d', '1m'

  // Filter data by range (fungsi sudah benar)
  const filterByRange = (data, filter) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const now = new Date();
    let minDate;
    if (filter === '1d') minDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (filter === '7d') minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (filter === '1m') minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else minDate = null;
    return minDate
      ? data.filter(d => {
          const t = new Date(d.timestamp);
          return t >= minDate && t <= now;
        })
      : data;
  };


    // Resample and filter data for modal chart
    const modalData = (() => {
      // Ambil data sesuai filter range dan interval
      let filtered = filterByRange(data, range); // <-- filter sesuai range
      let resampled = resampleTimeSeriesWithMeanFill(filtered, interval, [selectedMetric]);
      return resampled;
    })();


  return (
    <>
      <Row>
        {fields.map((field) => (
          <Col md={4} className="mb-4" key={field.key}>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedMetric(field.key);
                setShowDetail(true);
              }}
            >
              <h5 style={{ color: "#007bff", textAlign: "center" }}>
                {field.label}
              </h5>
              {/* Chart default: resample per 4 jam */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={resampleTimeSeriesWithMeanFill(data, 240, [field.key])}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={tick => {
                      const d = new Date(tick);
                      return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:00`;
                    }}
                    interval="preserveStartEnd"
                    tickCount={6}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis domain={['dataMin - 5', 'dataMax + 10']} tickCount={6} />
                  <Tooltip labelFormatter={formatXAxis} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={field.key}
                    stroke="#007bff"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>
        ))}
      </Row>

      {/* Modal untuk Detail Chart */}
      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMetric
              ? fields.find((f) => f.key === selectedMetric)?.label
              : "Detail Chart"}
          </Modal.Title>
        </Modal.Header>
            <Modal.Body>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <ButtonGroup>
                      <Button
                        variant={interval === 15 ? "primary" : "outline-primary"}
                        onClick={() => setInterval(15)}
                      >
                        15 Menit
                      </Button>
                      <Button
                        variant={interval === 30 ? "primary" : "outline-primary"}
                        onClick={() => setInterval(30)}
                      >
                        30 Menit
                      </Button>
                    </ButtonGroup>
                    <ButtonGroup>
                      <Button
                        variant={range === '1d' ? 'success' : 'outline-success'}
                        onClick={() => setRange('1d')}
                      >
                        1 Hari Terakhir
                      </Button>
                      <Button
                        variant={range === '7d' ? 'success' : 'outline-success'}
                        onClick={() => setRange('7d')}
                      >
                        7 Hari Terakhir
                      </Button>
                      <Button
                        variant={range === '1m' ? 'success' : 'outline-success'}
                        onClick={() => setRange('1m')}
                      >
                        1 Bulan Terakhir
                      </Button>
                    </ButtonGroup>
                  </div>
                  <div style={{ width: "100%", overflowX: "auto" }}>
                    <ResponsiveContainer width={900} height={400}>
                      <LineChart data={modalData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={tick => {
                            const d = new Date(tick);
                            return `${d.getDate()}/${d.getMonth()+1}\n${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
                          }}
                          interval="preserveStartEnd"
                          tickCount={7}
                          angle={0}
                          textAnchor="middle"
                          height={40}
                          style={{ fontSize: 12 }}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tickCount={6}
                          allowDecimals={true}
                          style={{ fontSize: 12 }}
                        />
                        <Tooltip labelFormatter={formatXAxis} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={selectedMetric}
                          stroke="#007bff"
                          dot={false}
                          strokeWidth={2}
                        />
                        <Brush
                          dataKey="timestamp"
                          height={25}
                          stroke="#007bff"
                          travellerWidth={8}
                          tickFormatter={tick => {
                            const d = new Date(tick);
                            return `${d.getDate()}/${d.getMonth()+1}`;
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
            </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TrendChart;