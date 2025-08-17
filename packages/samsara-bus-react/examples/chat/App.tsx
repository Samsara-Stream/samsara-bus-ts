import React, { useState } from 'react';
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { SamsaraBusProvider, useSamsaraTopic, useSamsaraTopology } from 'samsara-bus-react';
import { v4 as uuidv4 } from 'uuid';
import { filter, map } from 'rxjs/operators';

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

// Setup bus and topics
const bus = new DefaultSamsaraBus();
bus.registerTopic<ChatMessage>('chat-messages', TopicType.ReplaySubject, 50);
bus.registerTopic<UserStatus>('user-status', TopicType.BehaviorSubject);
bus.registerTopic<ChatRoom>('chat-rooms', TopicType.BehaviorSubject);

// Seed initial room and user status
defaultSeed();
function defaultSeed() {
  bus.emit('chat-rooms', { id: 'general', name: 'General', participants: ['alice', 'bob'] });
  bus.emit('user-status', { user: 'alice', online: true, lastSeen: new Date() });
  bus.emit('user-status', { user: 'bob', online: true, lastSeen: new Date() });
}

function ChatRoomComponent({ roomId }: { roomId: string }) {
  const enrichedMessages = useSamsaraTopology<{
    message: ChatMessage;
    isUserOnline: boolean;
    userCount: number;
  }>({
    nodes: {
      'messages': { type: 'topic', topicName: 'chat-messages' },
      'userStatus': { type: 'topic', topicName: 'user-status' },
      'rooms': { type: 'topic', topicName: 'chat-rooms' },
      'roomMessages': {
        type: 'processor',
        id: 'filterRoomMessages',
        inputs: ['messages'],
        processor: (stream) => stream.pipe(
          filter((msg: ChatMessage) => msg.room === roomId)
        )
      },
      'currentRoom': {
        type: 'processor',
        id: 'getCurrentRoom',
        inputs: ['rooms'],
        processor: (stream) => stream.pipe(
          filter((room: ChatRoom) => room.id === roomId)
        )
      },
      'enricher': {
        type: 'processor',
        id: 'enrichMessages',
        inputs: ['roomMessages', 'userStatus', 'currentRoom'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([message, userStatus, room]: [ChatMessage, UserStatus, ChatRoom]) => ({
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
    <div className="chat-room" style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
      <h3>Room: {roomId} ({enrichedMessages?.userCount || 0} users)</h3>
      {enrichedMessages?.message && (
        <div className={`message ${enrichedMessages.isUserOnline ? 'online' : 'offline'}`}>
          <span style={{ fontWeight: 'bold', color: enrichedMessages.isUserOnline ? 'green' : 'gray' }}>{enrichedMessages.message.user}</span>
          <span style={{ marginLeft: 8 }}>{enrichedMessages.message.text}</span>
          <span style={{ marginLeft: 8, fontSize: 12 }}>{enrichedMessages.message.timestamp.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

function UserListComponent() {
  const [userStatus] = useSamsaraTopic<UserStatus>('user-status');
  const [room] = useSamsaraTopic<ChatRoom>('chat-rooms');
  return (
    <div style={{ border: '1px solid #eee', padding: 8, marginBottom: 16 }}>
      <h4>Users</h4>
      <ul>
        {room?.participants.map(user => (
          <li key={user} style={{ color: userStatus?.user === user && userStatus?.online ? 'green' : 'gray' }}>
            {user} {userStatus?.user === user && userStatus?.online ? '(online)' : '(offline)'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageComposer({ roomId }: { roomId: string }) {
  const [text, setText] = useState('');
  const [user] = useSamsaraTopic<UserStatus>('user-status');
  const [, emitMessage] = useSamsaraTopic<ChatMessage>('chat-messages');

  const sendMessage = () => {
    if (!text.trim() || !user?.user) return;
    emitMessage({
      id: uuidv4(),
      user: user.user,
      text,
      timestamp: new Date(),
      room: roomId
    });
    setText('');
  };

  return (
    <div style={{ marginTop: 16 }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." style={{ width: '70%' }} />
      <button onClick={sendMessage} style={{ marginLeft: 8 }}>Send</button>
    </div>
  );
}

function App() {
  return (
    <SamsaraBusProvider bus={bus}>
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <h2>Chat Example (Samsara Bus React)</h2>
        <ChatRoomComponent roomId="general" />
        <UserListComponent />
        <MessageComposer roomId="general" />
      </div>
    </SamsaraBusProvider>
  );
}

export default App;
