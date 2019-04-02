const WebSocket = require("ws");

class WSSessionManager {
  constructor(config) {
    this.ws = new WebSocket.Server(config);
    this.ws.on("connection", conn => this.newConnection(conn));
    this.sessions = [];
  }

  addSession(id) {
    let found = this.sessions.filter(s => s.id == id);
    if(found.length > 0 && found[0].active) throw new Error("Session active!"); 
    if(found.length > 0 && !found[0].active) return found[0].sessionId;
    this.sessions[id] = {
      sessionId: parseInt(Math.random() * 100000),
      id,
      active: false,
      quit: false,
      timeout: null
    }
    return this.sessions[id];
  }

  activateSession(sessionId) {
    let found = this.sessions.filter(s => s.sessionId == sessionId && !s.active);
    if(found.length < 1) throw new Error("Session couldn't be found!");
    found[0].active = true;
    console.log("Activated " +found[0].sessionId);
    return found[0];
  }

  newConnection(conn) {
    let session = null;
    conn.on("message", msg => {
      try {
        if(msg.length < 1) throw new Error("Invalid message");
        if(!session) {
          session = this.activateSession(msg);
          session.send = msg => conn.send(msg);
          session.close = () => conn.close();
          //Check if rejoin
          if(session.timeout) {
            clearTimeout(session.timeout);
            this.onReconnect(session);
          } else {
            this.onConnect(session);
          }
        } else {
          this.onAction(msg, session);
        }
      } catch (err) {
        if(!session) conn.send(err.message);
        else this.onError(err, session);
      }
    });
    conn.on("close", () => {
      if(!session) return;

      if(session.quit) {
        this.removeSession(session);
      } else {
        this.onDrop(session);
        session.timeout = setTimeout(() => {
          this.onDisconnect(session);
          this.removeSession(session);
        }, 20000);
        session.active = false;
      }
    });
  }

  removeSession(session) {
    this.sessions = this.sessions.filter(s => s !== session);
  }
}

module.exports = WSSessionManager;