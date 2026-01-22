import { WebSocketServer } from 'ws';

// Хранилище для всех подключений
const connections = new Set();

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверяем, есть ли уже WebSocket сервер
  if (!res.socket.server.wss) {
    const wss = new WebSocketServer({ noServer: true });
    
    wss.on('connection', (ws) => {
      console.log('Новое подключение');
      connections.add(ws);
      
      ws.on('message', (message) => {
        console.log('Получено сообщение:', message.toString());
        
        // Рассылаем сообщение всем подключенным клиентам
        connections.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(message.toString());
          }
        });
      });
      
      ws.on('close', () => {
        console.log('Подключение закрыто');
        connections.delete(ws);
      });
      
      // Отправляем приветственное сообщение
      ws.send(JSON.stringify({
        type: 'system',
        message: 'Добро пожаловать в чат!'
      }));
    });
    
    res.socket.server.wss = wss;
  }
  
  // Обновляем подключение для WebSocket
  res.socket.server.wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    res.socket.server.wss.emit('connection', ws, req);
  });
  
  res.end();
}
