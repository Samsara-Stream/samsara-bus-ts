/**
 * Advanced Usage Examples for Samsara Bus React
 * 
 * This file demonstrates more complex patterns and use cases
 */

import { Observable, merge, combineLatest, interval } from 'rxjs';
import { map, filter, scan, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// These examples show how you would use the hooks in real React applications

/*

// ============================================================================
// Example 1: Real-time Chat Application
// ============================================================================

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  room: string;
}

interface UserStatus {
  user: string;
  online: boolean;
  lastSeen: Date;
}

interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
}

function ChatApplication() {
  // Setup topics
  const bus = new DefaultSamsaraBus();
  bus.registerTopic<ChatMessage>('chat-messages', TopicType.ReplaySubject, 50);
  bus.registerTopic<UserStatus>('user-status', TopicType.BehaviorSubject);
  bus.registerTopic<ChatRoom>('chat-rooms', TopicType.BehaviorSubject);

  return (
    <SamsaraBusProvider bus={bus}>
      <ChatRoomComponent roomId="general" />
      <UserListComponent />
      <MessageComposer roomId="general" />
    </SamsaraBusProvider>
  );
}

function ChatRoomComponent({ roomId }: { roomId: string }) {
  // Complex topology that enriches messages with user status
  const enrichedMessages = useSamsaraTopology<{
    message: ChatMessage;
    isUserOnline: boolean;
    userCount: number;
  }>({
    nodes: {
      'messages': { type: 'topic', topicName: 'chat-messages' },
      'userStatus': { type: 'topic', topicName: 'user-status' },
      'rooms': { type: 'topic', topicName: 'chat-rooms' },
      
      // Filter messages for this room
      'roomMessages': {
        type: 'processor',
        id: 'filterRoomMessages',
        inputs: ['messages'],
        processor: (stream) => stream.pipe(
          filter(msg => msg.room === roomId)
        )
      },
      
      // Get current room info
      'currentRoom': {
        type: 'processor',
        id: 'getCurrentRoom',
        inputs: ['rooms'],
        processor: (stream) => stream.pipe(
          filter(room => room.id === roomId)
        )
      },
      
      // Enrich messages with user status and room info
      'enricher': {
        type: 'processor',
        id: 'enrichMessages',
        inputs: ['roomMessages', 'userStatus', 'currentRoom'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([message, userStatus, room]) => ({
            message,
            isUserOnline: userStatus?.user === message.user && userStatus?.online,
            userCount: room?.participants?.length || 0
          }))
        )
      }
    },
    output: 'enricher'
  });

  return (
    <div className="chat-room">
      <h3>Room: {roomId} ({enrichedMessages?.userCount} users)</h3>
      {enrichedMessages?.message && (
        <div className={`message ${enrichedMessages.isUserOnline ? 'online' : 'offline'}`}>
          <span className="user">{enrichedMessages.message.user}</span>
          <span className="text">{enrichedMessages.message.text}</span>
          <span className="time">{enrichedMessages.message.timestamp.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Real-time Analytics Dashboard
// ============================================================================

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

function AnalyticsDashboard() {
  const bus = new DefaultSamsaraBus();
  bus.registerTopic<MetricEvent>('metrics', TopicType.PublishSubject);
  bus.registerTopic<Alert>('alerts', TopicType.ReplaySubject, 10);

  return (
    <SamsaraBusProvider bus={bus}>
      <MetricsOverview />
      <AlertPanel />
      <RealTimeChart />
    </SamsaraBusProvider>
  );
}

function MetricsOverview() {
  // Complex analytics topology
  const analytics = useSamsaraTopology<{
    totalEvents: number;
    averageValue: number;
    peakValue: number;
    alertCount: number;
    trends: { metric: string; change: number }[];
  }>({
    nodes: {
      'metrics': { type: 'topic', topicName: 'metrics' },
      'alerts': { type: 'topic', topicName: 'alerts' },
      
      // Calculate running statistics
      'stats': {
        type: 'processor',
        id: 'calculateStats',
        inputs: ['metrics'],
        processor: (stream) => stream.pipe(
          scan((acc, metric) => ({
            count: acc.count + 1,
            sum: acc.sum + metric.value,
            peak: Math.max(acc.peak, metric.value),
            recent: [...acc.recent.slice(-19), metric] // Keep last 20
          }), { count: 0, sum: 0, peak: 0, recent: [] }),
          map(stats => ({
            totalEvents: stats.count,
            averageValue: stats.count > 0 ? stats.sum / stats.count : 0,
            peakValue: stats.peak,
            recent: stats.recent
          }))
        )
      },
      
      // Count alerts
      'alertStats': {
        type: 'processor',
        id: 'countAlerts',
        inputs: ['alerts'],
        processor: (stream) => stream.pipe(
          scan((count) => count + 1, 0)
        )
      },
      
      // Calculate trends
      'trends': {
        type: 'processor',
        id: 'calculateTrends',
        inputs: ['stats'],
        processor: (stream) => stream.pipe(
          map(stats => {
            const metricGroups = stats.recent.reduce((groups, metric) => {
              if (!groups[metric.metric]) groups[metric.metric] = [];
              groups[metric.metric].push(metric.value);
              return groups;
            }, {});
            
            return Object.entries(metricGroups).map(([metric, values]) => {
              const recent = values.slice(-5);
              const older = values.slice(-10, -5);
              const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
              const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
              return {
                metric,
                change: recentAvg - olderAvg
              };
            });
          })
        )
      },
      
      // Combine all analytics
      'combiner': {
        type: 'processor',
        id: 'combineAnalytics',
        inputs: ['stats', 'alertStats', 'trends'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([stats, alertCount, trends]) => ({
            totalEvents: stats.totalEvents,
            averageValue: stats.averageValue,
            peakValue: stats.peakValue,
            alertCount,
            trends
          }))
        )
      }
    },
    output: 'combiner'
  });

  return (
    <div className="analytics-overview">
      <h2>Analytics Overview</h2>
      {analytics && (
        <div className="metrics-grid">
          <div className="metric">
            <h3>Total Events</h3>
            <span className="value">{analytics.totalEvents}</span>
          </div>
          <div className="metric">
            <h3>Average Value</h3>
            <span className="value">{analytics.averageValue.toFixed(2)}</span>
          </div>
          <div className="metric">
            <h3>Peak Value</h3>
            <span className="value">{analytics.peakValue}</span>
          </div>
          <div className="metric">
            <h3>Active Alerts</h3>
            <span className="value">{analytics.alertCount}</span>
          </div>
          <div className="trends">
            <h3>Trends</h3>
            {analytics.trends.map(trend => (
              <div key={trend.metric} className="trend">
                {trend.metric}: {trend.change > 0 ? '↗' : '↘'} {Math.abs(trend.change).toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: E-commerce Shopping Cart
// ============================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  discount: number;
  shipping: number;
}

function ShoppingCart() {
  const bus = new DefaultSamsaraBus();
  bus.registerTopic<CartItem[]>('cart-items', TopicType.BehaviorSubject);
  bus.registerTopic<Product[]>('products', TopicType.BehaviorSubject);
  bus.registerTopic<{ code: string; percent: number }>('discount', TopicType.BehaviorSubject);

  return (
    <SamsaraBusProvider bus={bus}>
      <ProductList />
      <CartSummary />
      <CheckoutButton />
    </SamsaraBusProvider>
  );
}

function CartSummary() {
  // Complex cart calculation topology
  const cartSummary = useSamsaraTopology<CartState>({
    nodes: {
      'cartItems': { type: 'topic', topicName: 'cart-items' },
      'products': { type: 'topic', topicName: 'products' },
      'discount': { type: 'topic', topicName: 'discount' },
      
      // Calculate line totals
      'lineTotals': {
        type: 'processor',
        id: 'calculateLineTotals',
        inputs: ['cartItems', 'products'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([cartItems, products]) => {
            const productMap = products.reduce((map, product) => {
              map[product.id] = product;
              return map;
            }, {});
            
            return cartItems.map(item => ({
              ...item,
              product: productMap[item.productId],
              lineTotal: productMap[item.productId]?.price * item.quantity || 0
            }));
          })
        )
      },
      
      // Calculate subtotal
      'subtotal': {
        type: 'processor',
        id: 'calculateSubtotal',
        inputs: ['lineTotals'],
        processor: (stream) => stream.pipe(
          map(lineItems => lineItems.reduce((total, item) => total + item.lineTotal, 0))
        )
      },
      
      // Apply discount and calculate final total
      'finalTotal': {
        type: 'processor',
        id: 'calculateFinalTotal',
        inputs: ['subtotal', 'discount'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([subtotal, discount]) => {
            const discountAmount = subtotal * (discount?.percent || 0) / 100;
            const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
            return {
              subtotal,
              discount: discountAmount,
              shipping,
              total: subtotal - discountAmount + shipping
            };
          })
        )
      },
      
      // Combine everything
      'cartState': {
        type: 'processor',
        id: 'buildCartState',
        inputs: ['cartItems', 'finalTotal'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([items, totals]) => ({
            items,
            total: totals.total,
            discount: totals.discount,
            shipping: totals.shipping
          }))
        )
      }
    },
    output: 'cartState'
  });

  return (
    <div className="cart-summary">
      <h3>Cart Summary</h3>
      {cartSummary && (
        <div>
          <p>Items: {cartSummary.items.length}</p>
          <p>Discount: -${cartSummary.discount.toFixed(2)}</p>
          <p>Shipping: ${cartSummary.shipping.toFixed(2)}</p>
          <p><strong>Total: ${cartSummary.total.toFixed(2)}</strong></p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Custom Hook Compositions
// ============================================================================

// Custom hook that combines multiple topics for user preferences
function useUserPreferences(userId: string) {
  const [preferences] = useSamsaraTopic(`user-${userId}-preferences`);
  const [settings] = useSamsaraTopic(`user-${userId}-settings`);
  const [theme] = useSamsaraTopic(`user-${userId}-theme`);
  
  return useMemo(() => ({
    ...preferences,
    ...settings,
    theme
  }), [preferences, settings, theme]);
}

// Custom hook for debounced search
function useSearchResults(query: string) {
  const [searchQuery, emitSearchQuery] = useSamsaraTopic('search-query');
  
  const results = useSamsaraTopology({
    nodes: {
      'query': { type: 'topic', topicName: 'search-query' },
      'debouncedQuery': {
        type: 'processor',
        id: 'debounceQuery',
        inputs: ['query'],
        processor: (stream) => stream.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          filter(q => q.length >= 3)
        )
      },
      'searchResults': {
        type: 'processor',
        id: 'performSearch',
        inputs: ['debouncedQuery'],
        processor: (stream) => stream.pipe(
          switchMap(query => 
            // Simulate API call
            new Promise(resolve => 
              setTimeout(() => resolve([`Result for ${query}`]), 100)
            )
          )
        )
      }
    },
    output: 'searchResults'
  });
  
  useEffect(() => {
    emitSearchQuery(query);
  }, [query, emitSearchQuery]);
  
  return results;
}

*/

export interface AdvancedUsageTypes {
  ChatMessage: {
    id: string;
    user: string;
    text: string;
    timestamp: Date;
    room: string;
  };
  
  MetricEvent: {
    metric: string;
    value: number;
    tags: Record<string, string>;
    timestamp: Date;
  };
  
  CartState: {
    items: any[];
    total: number;
    discount: number;
    shipping: number;
  };
}

console.log('Advanced usage examples loaded - check the comments for detailed patterns');
