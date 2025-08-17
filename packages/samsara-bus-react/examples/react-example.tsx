import React from 'react';
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { SamsaraBusProvider, useSamsaraTopic, useSamsaraTopology } from '../src';
import { map, filter } from 'rxjs/operators';

// Initialize the bus and register topics
const bus = new DefaultSamsaraBus();
bus.registerTopic<{ count: number }>('counter', TopicType.BehaviorSubject);
bus.registerTopic<{ user: string, action: string }>('user-events', TopicType.PublishSubject);
bus.registerTopic<{ temperature: number, humidity: number }>('sensor-data', TopicType.ReplaySubject, 5);

// Counter component using useSamsaraTopic
function CounterComponent() {
  const [counter, emitCounter] = useSamsaraTopic<{ count: number }>('counter', {
    initialValue: { count: 0 }
  });

  const increment = () => {
    emitCounter({ count: (counter?.count || 0) + 1 });
  };

  const decrement = () => {
    emitCounter({ count: (counter?.count || 0) - 1 });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Counter Component</h3>
      <p>Count: {counter?.count || 0}</p>
      <button onClick={increment} style={{ marginRight: '10px' }}>
        Increment
      </button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}

// User activity component
function UserActivityComponent() {
  const [userEvent, emitUserEvent] = useSamsaraTopic<{ user: string, action: string }>('user-events');

  const handleLogin = () => {
    emitUserEvent({ user: 'john_doe', action: 'login' });
  };

  const handleLogout = () => {
    emitUserEvent({ user: 'john_doe', action: 'logout' });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>User Activity</h3>
      <p>Last Event: {userEvent ? `${userEvent.user} - ${userEvent.action}` : 'None'}</p>
      <button onClick={handleLogin} style={{ marginRight: '10px' }}>
        Login
      </button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

// Sensor dashboard using topology
function SensorDashboard() {
  const [sensorData, emitSensorData] = useSamsaraTopic<{ temperature: number, humidity: number }>('sensor-data');

  // Define a topology that processes sensor data
  const dashboardData = useSamsaraTopology<{
    temperature: number;
    humidity: number;
    status: string;
    timestamp: Date;
  }>({
    nodes: {
      'sensors': {
        type: 'topic',
        topicName: 'sensor-data'
      },
      'processor': {
        type: 'processor',
        id: 'sensorProcessor',
        inputs: ['sensors'],
        processor: (sensorStream) => sensorStream.pipe(
          filter(data => data.temperature !== undefined && data.humidity !== undefined),
          map(data => ({
            temperature: data.temperature,
            humidity: data.humidity,
            status: data.temperature > 25 ? 'Hot' : data.temperature < 15 ? 'Cold' : 'Normal',
            timestamp: new Date()
          }))
        )
      }
    },
    output: 'processor'
  });

  const generateSensorData = () => {
    const temperature = Math.round((Math.random() * 30 + 10) * 10) / 10; // 10-40°C
    const humidity = Math.round((Math.random() * 60 + 30) * 10) / 10; // 30-90%
    emitSensorData({ temperature, humidity });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Sensor Dashboard (Using Topology)</h3>
      <button onClick={generateSensorData} style={{ marginBottom: '10px' }}>
        Generate Sensor Reading
      </button>
      {dashboardData ? (
        <div>
          <p><strong>Temperature:</strong> {dashboardData.temperature}°C</p>
          <p><strong>Humidity:</strong> {dashboardData.humidity}%</p>
          <p><strong>Status:</strong> {dashboardData.status}</p>
          <p><strong>Last Updated:</strong> {dashboardData.timestamp.toLocaleTimeString()}</p>
        </div>
      ) : (
        <p>No sensor data available</p>
      )}
    </div>
  );
}

// Complex topology example combining multiple topics
function ActivityDashboard() {
  // Complex topology that combines counter and user events
  const activitySummary = useSamsaraTopology<{
    counterValue: number;
    lastUserAction: string;
    totalActivity: number;
  }>({
    nodes: {
      'counter': {
        type: 'topic',
        topicName: 'counter'
      },
      'userEvents': {
        type: 'topic',
        topicName: 'user-events'
      },
      'combiner': {
        type: 'processor',
        id: 'activityCombiner',
        inputs: ['counter', 'userEvents'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([counterData, userEvent]) => ({
            counterValue: counterData?.count || 0,
            lastUserAction: userEvent ? `${userEvent.user}: ${userEvent.action}` : 'None',
            totalActivity: (counterData?.count || 0) + (userEvent ? 1 : 0)
          }))
        )
      }
    },
    output: 'combiner'
  });

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Activity Dashboard (Complex Topology)</h3>
      {activitySummary ? (
        <div>
          <p><strong>Counter Value:</strong> {activitySummary.counterValue}</p>
          <p><strong>Last User Action:</strong> {activitySummary.lastUserAction}</p>
          <p><strong>Total Activity Score:</strong> {activitySummary.totalActivity}</p>
        </div>
      ) : (
        <p>Loading activity data...</p>
      )}
    </div>
  );
}

// Main App component
function App() {
  return (
    <SamsaraBusProvider bus={bus}>
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <h1>Samsara Bus React Example</h1>
        <p>This example demonstrates the usage of samsara-bus-react hooks:</p>
        
        <CounterComponent />
        <UserActivityComponent />
        <SensorDashboard />
        <ActivityDashboard />
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <h4>Instructions:</h4>
          <ul>
            <li>Use the Counter buttons to see <code>useSamsaraTopic</code> in action</li>
            <li>Click Login/Logout to generate user events</li>
            <li>Generate sensor readings to see <code>useSamsaraTopology</code> processing data</li>
            <li>Notice how the Activity Dashboard combines data from multiple topics</li>
          </ul>
        </div>
      </div>
    </SamsaraBusProvider>
  );
}

export default App;
