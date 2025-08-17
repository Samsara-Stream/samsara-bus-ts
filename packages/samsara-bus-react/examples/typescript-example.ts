/**
 * Basic TypeScript example demonstrating samsara-bus-react usage
 * This file shows the API structure without requiring React types to be installed
 */

import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { map, filter, combineLatest } from 'rxjs/operators';

// This is how you would use the hooks in a real React application:

/*

// 1. Setup the bus and provider
const bus = new DefaultSamsaraBus();
bus.registerTopic<CounterState>('counter', TopicType.BehaviorSubject);
bus.registerTopic<UserEvent>('user-events', TopicType.PublishSubject);

function App() {
  return (
    <SamsaraBusProvider bus={bus}>
      <CounterComponent />
      <DashboardComponent />
    </SamsaraBusProvider>
  );
}

// 2. Simple topic usage
interface CounterState {
  count: number;
}

function CounterComponent() {
  const [counter, emitCounter] = useSamsaraTopic<CounterState>('counter', {
    initialValue: { count: 0 }
  });

  const increment = () => {
    emitCounter({ count: (counter?.count || 0) + 1 });
  };

  return (
    <div>
      <p>Count: {counter?.count || 0}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

// 3. Complex topology usage
interface UserEvent {
  user: string;
  action: string;
}

interface DashboardData {
  totalClicks: number;
  lastUser: string;
  isActive: boolean;
}

function DashboardComponent() {
  const dashboardData = useSamsaraTopology<DashboardData>({
    nodes: {
      'counterTopic': {
        type: 'topic',
        topicName: 'counter'
      },
      'userTopic': {
        type: 'topic',
        topicName: 'user-events'
      },
      'processor': {
        type: 'processor',
        id: 'dashboardProcessor',
        inputs: ['counterTopic', 'userTopic'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([counterData, userEvent]) => ({
            totalClicks: counterData?.count || 0,
            lastUser: userEvent?.user || 'none',
            isActive: (counterData?.count || 0) > 0
          }))
        )
      }
    },
    output: 'processor'
  });

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total Clicks: {dashboardData?.totalClicks}</p>
      <p>Last User: {dashboardData?.lastUser}</p>
      <p>Status: {dashboardData?.isActive ? 'Active' : 'Inactive'}</p>
    </div>
  );
}

// 4. Advanced topology with multiple processors
function AdvancedDashboard() {
  const result = useSamsaraTopology({
    nodes: {
      'metrics': { type: 'topic', topicName: 'metrics' },
      'events': { type: 'topic', topicName: 'events' },
      
      // First processor: filter and transform metrics
      'metricsProcessor': {
        type: 'processor',
        id: 'processMetrics',
        inputs: ['metrics'],
        processor: (stream) => stream.pipe(
          filter(data => data.value > 0),
          map(data => ({ ...data, processed: true }))
        )
      },
      
      // Second processor: combine processed metrics with events
      'combiner': {
        type: 'processor',
        id: 'combineData',
        inputs: ['metricsProcessor', 'events'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([metrics, events]) => ({
            metrics,
            events,
            timestamp: new Date(),
            score: metrics.value * events.weight
          }))
        )
      }
    },
    output: 'combiner'
  });

  // The result contains the final processed data
  return result;
}

*/

// Type definitions for reference
export interface CounterState {
  count: number;
}

export interface UserEvent {
  user: string;
  action: string;
  timestamp?: Date;
}

export interface SensorReading {
  temperature: number;
  humidity: number;
  location: string;
}

export interface ProcessedSensorData {
  temperature: number;
  humidity: number;
  status: 'Normal' | 'Hot' | 'Cold' | 'Humid' | 'Dry';
  alerts: string[];
  timestamp: Date;
}

console.log('Samsara Bus React - TypeScript example loaded');
console.log('Check the comments in this file for usage examples');
