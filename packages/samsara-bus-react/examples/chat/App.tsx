import React, { useState } from 'react';
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { SamsaraBusProvider, useSamsaraTopic, useSamsaraTopology, defineProcessor, topology } from 'samsara-bus-react';
import { v4 as uuidv4 } from 'uuid';

// Types
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

interface EnrichedMessage {
  message: ChatMessage;
  isUserOnline: boolean;
  userCount: number;
}

// Define processors using the new fluent API
const roomMessages = defineProcessor({
  id: 'roomMessages',
  inputs: ['messages'] as const,
  fn: (msg: ChatMessage, params: { roomId: string }) =>
    msg.room === params.roomId ? msg : defineProcessor.SKIP
});

const currentRoom = defineProcessor({
  id: 'currentRoom',
  inputs: ['rooms'] as const,
  fn: (room: ChatRoom, params: { roomId: string }) =>
    room.id === params.roomId ? room : defineProcessor.SKIP
});

const enrichMessages = defineProcessor({
  id: 'enrichMessages',
  inputs: ['roomMessages', 'userStatus', 'currentRoom'] as const,
  combiner: 'withLatestFrom',
  fn: (message: ChatMessage, user: UserStatus, room: ChatRoom): EnrichedMessage => ({
    message,
    isUserOnline: user?.user === message.user && user?.online,
    userCount: room?.participants?.length ?? 0
  })
});

// Define topology using fluent builder
const ChatRoomEnriched = topology('ChatRoomEnriched')
  .param('roomId', (t) => t.string())
  .topic('messages', 'chat-messages')
  .topic('userStatus', 'user-status')
  .topic('rooms', 'chat-rooms')
  .proc(roomMessages)
  .proc(currentRoom)
  .proc(enrichMessages)
  .output('enrichMessages')
  .build();

// Setup bus and topics
const bus = new DefaultSamsaraBus();
bus.registerTopic<ChatMessage>('chat-messages', TopicType.ReplaySubject, 50);
bus.registerTopic<UserStatus>('user-status', TopicType.BehaviorSubject);
bus.registerTopic<ChatRoom>('chat-rooms', TopicType.BehaviorSubject);

// Seed initial data
function seedData() {
  // Create rooms
  bus.emit('chat-rooms', { id: 'general', name: 'General', participants: ['alice', 'bob', 'charlie'] });
  bus.emit('chat-rooms', { id: 'dev-team', name: 'Dev Team', participants: ['alice', 'bob'] });
  
  // Set user statuses
  bus.emit('user-status', { user: 'alice', online: true, lastSeen: new Date() });
  bus.emit('user-status', { user: 'bob', online: true, lastSeen: new Date() });
  bus.emit('user-status', { user: 'charlie', online: false, lastSeen: new Date(Date.now() - 300000) });
  
  // Add some initial messages
  bus.emit('chat-messages', {
    id: uuidv4(),
    user: 'alice',
    text: 'Hello everyone! 👋',
    timestamp: new Date(Date.now() - 120000),
    room: 'general'
  });
  
  bus.emit('chat-messages', {
    id: uuidv4(),
    user: 'bob',
    text: 'Hey Alice! How are you?',
    timestamp: new Date(Date.now() - 60000),
    room: 'general'
  });
  
  bus.emit('chat-messages', {
    id: uuidv4(),
    user: 'alice',
    text: 'Working on the new fluent API. Check this out!',
    timestamp: new Date(Date.now() - 30000),
    room: 'dev-team'
  });
}

function ChatRoomComponent({ roomId }: { roomId: string }) {
  const { data: enrichedMessage, error, status } = useSamsaraTopology<EnrichedMessage>(
    ChatRoomEnriched,
    { roomId }
  );

  if (status === 'loading') {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
        <h3>Room: {roomId}</h3>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '1px solid #f00', margin: '10px' }}>
        <h3>Room: {roomId}</h3>
        <div style={{ color: 'red' }}>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      margin: '10px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Chat Room: {roomId}</h3>
      <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
        👥 {enrichedMessage?.userCount || 0} participants
      </div>
      
      {enrichedMessage ? (
        <div style={{ 
          background: 'white', 
          padding: '12px', 
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: enrichedMessage.isUserOnline ? '#22c55e' : '#9ca3af',
            marginBottom: '4px'
          }}>
            {enrichedMessage.message.user} 
            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
              {enrichedMessage.isUserOnline ? '🟢 online' : '⚫ offline'}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            {enrichedMessage.message.text}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {enrichedMessage.message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
          No messages yet in this room...
        </div>
      )}
    </div>
  );
}

function MessageComposer({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('alice');
  const [, emitMessage] = useSamsaraTopic<ChatMessage>('chat-messages');

  const sendMessage = () => {
    if (message.trim()) {
      emitMessage({
        id: uuidv4(),
        user,
        text: message,
        timestamp: new Date(),
        room: roomId
      });
      setMessage('');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e5e5e5', 
      margin: '10px',
      borderRadius: '8px',
      backgroundColor: '#fafafa'
    }}>
      <h4>Send Message to {roomId}</h4>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ marginRight: '10px' }}>
          User:
          <select 
            value={user} 
            onChange={(e) => setUser(e.target.value)}
            style={{ marginLeft: '5px', padding: '4px' }}
          >
            <option value="alice">Alice</option>
            <option value="bob">Bob</option>
            <option value="charlie">Charlie</option>
          </select>
        </label>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: '8px', 
            borderRadius: '4px', 
            border: '1px solid #ccc' 
          }}
        />
        <button 
          onClick={sendMessage}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            border: 'none', 
            background: '#3b82f6', 
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function UserStatusController() {
  const [, emitUserStatus] = useSamsaraTopic<UserStatus>('user-status');

  const toggleUserStatus = (user: string, online: boolean) => {
    emitUserStatus({
      user,
      online,
      lastSeen: new Date()
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e5e5e5', 
      margin: '10px',
      borderRadius: '8px',
      backgroundColor: '#f0f9ff'
    }}>
      <h4>User Status Controls</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {['alice', 'bob', 'charlie'].map(user => (
          <div key={user} style={{ display: 'flex', gap: '5px' }}>
            <span style={{ minWidth: '60px' }}>{user}:</span>
            <button 
              onClick={() => toggleUserStatus(user, true)}
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: 'none', 
                background: '#22c55e', 
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Online
            </button>
            <button 
              onClick={() => toggleUserStatus(user, false)}
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: 'none', 
                background: '#ef4444', 
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Offline
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  // Seed data on component mount
  React.useEffect(() => {
    seedData();
  }, []);

  return (
    <SamsaraBusProvider bus={bus}>
      <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '20px'
      }}>
        <header style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #e5e5e5'
        }}>
          <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>
            🚌 Samsara Bus React - Fluent API Demo
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Real-time chat application showcasing the new TypeScript-first topology API
          </p>
        </header>

        <div style={{ 
          display: 'grid', 
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
        }}>
          <ChatRoomComponent roomId="general" />
          <ChatRoomComponent roomId="dev-team" />
        </div>

        <UserStatusController />
        
        <div style={{ 
          display: 'grid', 
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
        }}>
          <MessageComposer roomId="general" />
          <MessageComposer roomId="dev-team" />
        </div>

        <footer style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e5e5',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <p>
            This demo shows how the new fluent API provides type-safe, reusable, 
            and composable stream processing with zero boilerplate. 
          </p>
          <p>
            Try sending messages and toggling user status to see real-time updates!
          </p>
        </footer>
      </div>
    </SamsaraBusProvider>
  );
}

export default App;
