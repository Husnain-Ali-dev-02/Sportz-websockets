import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

/**
 * Send a JSON-encoded payload over a WebSocket if the socket is open.
 * Does nothing when the socket is not in the OPEN state.
 * @param {WebSocket} socket - The WebSocket to send the payload on.
 * @param {*} payload - The value to JSON.stringify and send. */
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

/**
 * Attach a WebSocket server to an existing HTTP(S) server and provide a broadcaster for new matches.
 *
 * Installs an upgrade handler that accepts WebSocket upgrades on the "/ws" path, creates a WebSocketServer
 * for managing connections, sends a welcome message to each connected client, and attaches an error handler
 * that logs socket errors. If the optional `wsArcjet` protection is available, each incoming connection is
 * checked; denied connections are closed with code `1013` and reason "Too many requests." when rate-limited,
 * or code `1008` and reason "Access denied" otherwise. If the protection check throws, the connection is
 * closed with code `1011` and reason "Server Security Error".
 *
 * @param {import('http').Server} server - HTTP(S) server to attach the WebSocket upgrade handler to.
 * @returns {{ broadcastMatchCreated: (match: any) => void }} An object exposing `broadcastMatchCreated`, a function
 * that broadcasts a `{ type: 'match_created', data: match }` JSON message to all connected clients.
 */
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