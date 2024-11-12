import { OutgoingSocketData, SocketData } from "@src/types";

type SocketEventListener = (msg: SocketData) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private listeners: SocketEventListener[] = [];
  private url: string;
  private reconnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private missedPongs = 0;
  private readonly MAX_MISSED_PONGS = 3;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  connect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log(`Connected to ${this.url}`);
      this.reconnecting = false;
      this.startHeartbeat()
    };

    this.socket.onclose = () => {
      console.log("Disconnected, attempting to reconnect...");
      this.stopHeartbeat()
      this.reconnect();
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type == "pong") {
        this.resetPongTimeout();
      } else if (data.type == "ping") {
        this.sendMessage({ app: "server", type: "pong" });
      } else {
        this.notifyListeners(data);
      }
    };
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
  }

  sendMessage(message: OutgoingSocketData) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  addListener(listener: SocketEventListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: SocketEventListener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyListeners(data: SocketData) {
    this.listeners.forEach((listener) => listener(data));
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    this.missedPongs = 0;

    // Send "ping" every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendMessage({ app: 'server', type: "ping" });
        this.startPongTimeout();
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private startPongTimeout() {
    // If "pong" isn't received within 10 seconds, increment missed pongs
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.pongTimeout = setTimeout(() => {
      this.missedPongs += 1;
      console.warn(`Missed pong ${this.missedPongs}/${this.MAX_MISSED_PONGS}`);
      if (this.missedPongs >= this.MAX_MISSED_PONGS) {
        this.socket?.close();
        this.reconnect();
      }
    }, 10000);
  }

  private resetPongTimeout() {
    this.missedPongs = 0; // Reset missed pong count on successful pong
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }
}

export default WebSocketManager;