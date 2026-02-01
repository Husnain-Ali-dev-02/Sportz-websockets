import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcastJson(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

  ws.on('connection',async (socket, req) =>{
    if(wsArcjet){
      try {
        const decision = await wsArcjet.protect(req) ;
if(decision.isDenied()){
  const code = decision.reason.isRateLimit() ? 1013 : 1008;
  const reason = decision.reason.isRateLimit() ? 'Too many requests.' : 'Access denied' ;
  socket.close (code, reason);
  return;
}
      } catch (e) {
        console.error('WS connection error', e);
        socket.close(1011, 'Server Security Error');
        return;
      }
    }
  })

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });
  wss.on("connection", (socket) => {
    sendJson(socket, { type: "welcome" });
    socket.on("error", console.error);
  });
  function broadcastMatchCreated(match) {
 broadcastJson(wss, { type: 'match_created', data: match });
  }
  return { broadcastMatchCreated };
}
