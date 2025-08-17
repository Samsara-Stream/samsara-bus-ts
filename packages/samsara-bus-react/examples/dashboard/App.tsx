import React, { useState } from 'react';
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { SamsaraBusProvider, useSamsaraTopic, useSamsaraTopology } from '../../src';
import { map, scan } from 'rxjs/operators';

interface MetricEvent {
  metric: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

interface Alert {
  level: 'info' | 'warning' | 'error';
  message: string;
  metric: string;
  value: number;
}

// Setup bus and topics
const bus = new DefaultSamsaraBus();
bus.registerTopic<MetricEvent>('metrics', TopicType.PublishSubject);
bus.registerTopic<Alert>('alerts', TopicType.ReplaySubject, 10);

function MetricsOverview() {
  const analytics = useSamsaraTopology<{
    totalEvents: number;
    averageValue: number;
    peakValue: number;
    alertCount: number;
  }>({
    nodes: {
      'metrics': { type: 'topic', topicName: 'metrics' },
      'alerts': { type: 'topic', topicName: 'alerts' },
      'stats': {
        type: 'processor',
        id: 'calculateStats',
        inputs: ['metrics'],
        processor: (stream) => stream.pipe(
          scan((acc, metric) => ({
            count: acc.count + 1,
            sum: acc.sum + metric.value,
            peak: Math.max(acc.peak, metric.value)
          }), { count: 0, sum: 0, peak: 0 }),
          map(stats => ({
            totalEvents: stats.count,
            averageValue: stats.count > 0 ? stats.sum / stats.count : 0,
            peakValue: stats.peak
          }))
        )
      },
      'alertStats': {
        type: 'processor',
        id: 'countAlerts',
        inputs: ['alerts'],
        processor: (stream) => stream.pipe(
          scan((count) => count + 1, 0)
        )
      },
      'combiner': {
        type: 'processor',
        id: 'combineAnalytics',
        inputs: ['stats', 'alertStats'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([stats, alertCount]) => ({
            totalEvents: stats.totalEvents,
            averageValue: stats.averageValue,
            peakValue: stats.peakValue,
            alertCount
          }))
        )
      }
    },
    output: 'combiner'
  });

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
      <h2>Analytics Overview</h2>
      {analytics && (
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <strong>Total Events:</strong> {analytics.totalEvents}
          </div>
          <div>
            <strong>Average Value:</strong> {analytics.averageValue.toFixed(2)}
          </div>
          <div>
            <strong>Peak Value:</strong> {analytics.peakValue}
          </div>
          <div>
            <strong>Active Alerts:</strong> {analytics.alertCount}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertPanel() {
  const [alert] = useSamsaraTopic<Alert>('alerts');
  return (
    <div style={{ border: '1px solid #eee', padding: 8, marginBottom: 16 }}>
      <h4>Latest Alert</h4>
      {alert ? (
        <div style={{ color: alert.level === 'error' ? 'red' : alert.level === 'warning' ? 'orange' : 'gray' }}>
          <strong>{alert.level.toUpperCase()}</strong>: {alert.message} ({alert.metric}: {alert.value})
        </div>
      ) : <span>No alerts</span>}
    </div>
  );
}

function MetricInput() {
  const [metric, setMetric] = useState('cpu');
  const [value, setValue] = useState(0);
  const [, emitMetric] = useSamsaraTopic<MetricEvent>('metrics');

  const sendMetric = () => {
    emitMetric({
      metric,
      value,
      tags: {},
      timestamp: new Date()
    });
    setValue(0);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <input value={metric} onChange={e => setMetric(e.target.value)} placeholder="Metric name" style={{ marginRight: 8 }} />
      <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} style={{ marginRight: 8 }} />
      <button onClick={sendMetric}>Send Metric</button>
    </div>
  );
}

function AlertInput() {
  const [level, setLevel] = useState<'info' | 'warning' | 'error'>('info');
  const [message, setMessage] = useState('');
  const [metric, setMetric] = useState('cpu');
  const [value, setValue] = useState(0);
  const [, emitAlert] = useSamsaraTopic<Alert>('alerts');

  const sendAlert = () => {
    emitAlert({
      level,
      message,
      metric,
      value
    });
    setMessage('');
    setValue(0);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <select value={level} onChange={e => setLevel(e.target.value as any)} style={{ marginRight: 8 }}>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
      </select>
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Alert message" style={{ marginRight: 8 }} />
      <input value={metric} onChange={e => setMetric(e.target.value)} placeholder="Metric" style={{ marginRight: 8 }} />
      <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} style={{ marginRight: 8 }} />
      <button onClick={sendAlert}>Send Alert</button>
    </div>
  );
}

function App() {
  return (
    <SamsaraBusProvider bus={bus}>
      <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <h2>Dashboard Example (Samsara Bus React)</h2>
        <MetricInput />
        <AlertInput />
        <MetricsOverview />
        <AlertPanel />
      </div>
    </SamsaraBusProvider>
  );
}

export default App;
