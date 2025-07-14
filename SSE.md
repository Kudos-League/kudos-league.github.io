# Server-Sent Events (SSE) Implementation Guide

## Overview

This document outlines the backend implementation requirements for Server-Sent Events (SSE) to support real-time notifications in our React application.

Server-Sent Events provide a simple way to send real-time updates from the server to the client using standard HTTP. Unlike WebSockets, SSE is unidirectional (server-to-client only) and automatically handles reconnection.

## Requirements

### Core Endpoint

**Endpoint:** `GET /api/notifications/stream`  
**Content-Type:** `text/event-stream`  
**Method:** GET  
**Protocol:** HTTP/1.1 (keep-alive connection)

### Expected Functionality

1. **Authentication** - Support token-based authentication
2. **Event Streaming** - Send real-time notifications and updates
3. **Reconnection Support** - Handle client reconnections with event replay
4. **Heartbeat** - Keep connections alive
5. **Error Handling** - Graceful error responses
6. **Connection Management** - Handle connection cleanup

## HTTP Headers

### Required Response Headers

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: * (or specific domain)
Access-Control-Allow-Headers: Cache-Control
Access-Control-Allow-Credentials: true (if using credentials)
```

### Optional Request Headers

```http
Authorization: Bearer <token>
Last-Event-ID: <event_id> (for reconnection)
Accept: text/event-stream
```

## Query Parameters

The client may send these query parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `token` | string | Authentication token | `?token=abc123` |
| `lastEventId` | string | Last received event ID for replay | `?lastEventId=1642678901234` |
| `userId` | string | User ID for targeted notifications | `?userId=12345` |
| `channels` | string | Comma-separated list of channels | `?channels=orders,alerts` |

## SSE Message Format

SSE messages must follow this format:

```
id: <unique_identifier>
event: <event_type>
data: <json_data>

```

**Important:** Each message must end with two newlines (`\n\n`)

### Basic Message Structure

```
id: 1642678901234
event: notification
data: {"type":"notification","notificationType":"success","title":"Order Completed","message":"Your order #12345 has been shipped"}

```

## Event Types

### 1. `notification` - UI Notifications

Display notifications in the UI toast system.

```
id: 1642678901234
event: notification
data: {
  "type": "notification",
  "notificationType": "success|error|warning|info",
  "title": "Optional title",
  "message": "Required message text",
  "duration": 5000
}

```

**Fields:**
- `type`: Always `"notification"`
- `notificationType`: `"success"`, `"error"`, `"warning"`, or `"info"`
- `title`: Optional notification title
- `message`: Required notification message
- `duration`: Optional duration in milliseconds (default: 5000)

### 2. `update` - Data Updates

Notify the frontend of data changes.

```
id: 1642678901235
event: update
data: {
  "type": "update",
  "entity": "order",
  "action": "created|updated|deleted",
  "payload": {
    "orderId": 12345,
    "status": "shipped",
    "updatedAt": "2025-07-15T10:30:00Z"
  }
}

```

**Fields:**
- `type`: Always `"update"`
- `entity`: The type of data that changed (e.g., "order", "user", "product")
- `action`: What happened ("created", "updated", "deleted")
- `payload`: The actual data or changes

### 3. `heartbeat` - Keep-Alive

Send every 30 seconds to keep the connection alive.

```
id: 1642678901236
event: heartbeat
data: {}

```

### 4. Custom Events

You can define custom event types for specific use cases:

```
id: 1642678901237
event: user-action
data: {
  "userId": 123,
  "action": "login",
  "timestamp": "2025-07-15T10:30:00Z",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}

```

## Implementation Examples

### Node.js + Express

```javascript
const express = require('express');
const app = express();

// Store active connections
const connections = new Map();

app.get('/api/notifications/stream', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Extract auth token
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  // Authenticate user
  const userId = authenticateToken(token);
  if (!userId) {
    res.write('event: error\ndata: {"error":"Unauthorized"}\n\n');
    res.end();
    return;
  }

  // Store connection
  const connectionId = Date.now();
  connections.set(connectionId, { res, userId, lastEventId: Date.now() });

  // Send initial connection confirmation
  sendSSE(res, 'notification', {
    type: 'notification',
    notificationType: 'info',
    message: 'Connected to notification stream'
  }, connectionId);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    sendSSE(res, 'heartbeat', {}, Date.now());
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    connections.delete(connectionId);
    clearInterval(heartbeat);
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    connections.delete(connectionId);
    clearInterval(heartbeat);
  });
});

// Helper function to send SSE messages
function sendSSE(res, eventType, data, eventId = Date.now()) {
  res.write(`id: ${eventId}\n`);
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Function to broadcast to all connections
function broadcastNotification(notificationData, targetUserId = null) {
  connections.forEach((connection, connectionId) => {
    if (targetUserId && connection.userId !== targetUserId) {
      return; // Skip if targeting specific user
    }
    
    sendSSE(connection.res, 'notification', notificationData, Date.now());
  });
}

// Function to send data updates
function broadcastUpdate(entity, action, payload) {
  const updateData = {
    type: 'update',
    entity,
    action,
    payload
  };
  
  connections.forEach((connection) => {
    sendSSE(connection.res, 'update', updateData, Date.now());
  });
}

// Example usage
app.post('/api/orders', (req, res) => {
  // Create order logic...
  const order = createOrder(req.body);
  
  // Broadcast notification
  broadcastNotification({
    type: 'notification',
    notificationType: 'success',
    title: 'New Order',
    message: `Order #${order.id} has been created`
  });
  
  // Broadcast data update
  broadcastUpdate('order', 'created', order);
  
  res.json(order);
});
```

### Python + FastAPI

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import json
import asyncio
from datetime import datetime

app = FastAPI()

# Store active connections
connections = {}

@app.get("/api/notifications/stream")
async def notification_stream(request: Request, token: str = None):
    # Authenticate user
    user_id = authenticate_token(token)
    if not user_id:
        return {"error": "Unauthorized"}
    
    # Create unique connection ID
    connection_id = datetime.now().timestamp()
    
    async def event_stream():
        try:
            # Store connection
            connections[connection_id] = {
                "user_id": user_id,
                "last_event_id": connection_id
            }
            
            # Send initial connection message
            yield format_sse_message("notification", {
                "type": "notification",
                "notificationType": "info",
                "message": "Connected to notification stream"
            }, connection_id)
            
            # Keep connection alive
            while True:
                # Send heartbeat every 30 seconds
                yield format_sse_message("heartbeat", {}, datetime.now().timestamp())
                await asyncio.sleep(30)
                
        except asyncio.CancelledError:
            # Clean up on disconnect
            connections.pop(connection_id, None)
        except Exception as e:
            print(f"SSE error: {e}")
            connections.pop(connection_id, None)
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

def format_sse_message(event_type: str, data: dict, event_id: float = None):
    if event_id is None:
        event_id = datetime.now().timestamp()
    
    return f"id: {event_id}\nevent: {event_type}\ndata: {json.dumps(data)}\n\n"

async def broadcast_notification(notification_data: dict, target_user_id: int = None):
    message = format_sse_message("notification", notification_data)
    
    # This would need to be implemented with a message queue in production
    # For now, this is a conceptual example
    pass
```

### Django

```python
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import time

@csrf_exempt
def notification_stream(request):
    def event_stream():
        # Authentication
        token = request.GET.get('token') or request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
        user = authenticate_token(token)
        
        if not user:
            yield f"event: error\ndata: {json.dumps({'error': 'Unauthorized'})}\n\n"
            return
        
        # Send initial message
        yield f"id: {time.time()}\nevent: notification\ndata: {json.dumps({'type': 'notification', 'notificationType': 'info', 'message': 'Connected'})}\n\n"
        
        # Keep alive loop
        while True:
            yield f"event: heartbeat\ndata: {{}}\n\n"
            time.sleep(30)
    
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    response['Access-Control-Allow-Origin'] = '*'
    
    return response
```

## Authentication

### Token-based Authentication

1. **Query Parameter**: `?token=your_jwt_token`
2. **Authorization Header**: `Authorization: Bearer your_jwt_token`

### Session-based Authentication

For session-based auth, ensure cookies are sent with:
```http
Access-Control-Allow-Credentials: true
```

## Connection Management

### Reconnection Handling

When a client reconnects, it may send a `Last-Event-ID` header or `lastEventId` query parameter. Your implementation should:

1. Check for the last event ID
2. Replay any missed events since that ID
3. Resume normal streaming

```javascript
const lastEventId = req.headers['last-event-id'] || req.query.lastEventId;
if (lastEventId) {
  // Replay events since lastEventId
  const missedEvents = getEventsSince(lastEventId, userId);
  missedEvents.forEach(event => {
    sendSSE(res, event.type, event.data, event.id);
  });
}
```

### Connection Cleanup

Always clean up resources when connections close:

```javascript
req.on('close', () => {
  connections.delete(connectionId);
  clearInterval(heartbeatInterval);
  // Any other cleanup
});
```

## Error Handling

### Client Errors

Send error events for client-side issues:

```
id: 1642678901240
event: error
data: {"error":"Unauthorized","code":401}

```

### Server Errors

For server errors, close the connection gracefully:

```javascript
try {
  // SSE logic
} catch (error) {
  res.write(`event: error\ndata: ${JSON.stringify({error: 'Internal server error'})}\n\n`);
  res.end();
}
```

## Testing and Debugging

### Testing with curl

```bash
# Basic connection test
curl -N -H "Accept: text/event-stream" "http://localhost:3000/api/notifications/stream?token=your_token"

# With authentication header
curl -N -H "Accept: text/event-stream" -H "Authorization: Bearer your_token" "http://localhost:3000/api/notifications/stream"
```

### Testing with JavaScript

```javascript
const eventSource = new EventSource('/api/notifications/stream?token=your_token');

eventSource.onmessage = (event) => {
  console.log('Default message:', JSON.parse(event.data));
};

eventSource.addEventListener('notification', (event) => {
  console.log('Notification:', JSON.parse(event.data));
});

eventSource.addEventListener('update', (event) => {
  console.log('Update:', JSON.parse(event.data));
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

## Performance Considerations

### Scaling

For production applications:

1. **Use a message queue** (Redis, RabbitMQ) to broadcast messages across multiple server instances
2. **Implement connection pooling** to handle many concurrent connections
3. **Use a reverse proxy** (nginx) to handle SSE connections efficiently
4. **Consider using a dedicated SSE service** for very high-scale applications

### Memory Management

- Clean up closed connections promptly
- Implement connection limits per user
- Use efficient data structures for storing connections

### Example with Redis

```javascript
const redis = require('redis');
const client = redis.createClient();

// Subscribe to notifications channel
client.subscribe('notifications');

client.on('message', (channel, message) => {
  const data = JSON.parse(message);
  
  // Broadcast to all connected clients
  connections.forEach((connection) => {
    if (shouldReceiveMessage(connection, data)) {
      sendSSE(connection.res, data.eventType, data.payload, data.eventId);
    }
  });
});

// To send a notification from anywhere in your app
function sendNotification(notificationData) {
  client.publish('notifications', JSON.stringify({
    eventType: 'notification',
    payload: notificationData,
    eventId: Date.now()
  }));
}
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting to prevent abuse
2. **Authentication**: Always validate tokens/sessions
3. **Authorization**: Ensure users only receive notifications they should see
4. **Input Validation**: Validate all data before sending to clients
5. **CORS**: Configure CORS appropriately for your domain

## Monitoring

Implement monitoring for:

- Number of active connections
- Message throughput
- Connection duration
- Error rates
- Memory usage

This will help you optimize performance and detect issues early.

## Summary

This SSE implementation provides:
- Real-time notifications to the React frontend
- Automatic reconnection handling
- Multiple event types for different use cases
- Proper authentication and security
- Scalable architecture considerations

The frontend React component handles all client-side SSE management, so you only need to focus on implementing the server-side streaming endpoint according to this specification.
