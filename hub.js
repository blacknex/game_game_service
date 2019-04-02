const WSSManager = require("./wssmanager");

class Hub extends WSSManager {
  constructor(config) {
    super(config.ws);
    this.games = [];
  }

  onAction(msg, session) {
    let game = this.findGame(session);
    console.log(game);

    if(msg === "QUIT") {
      session.close();
      return;
    }

    if(!(game.p1.active && game.p2.active)) {
      session.send("NOT_READY");
      return;
    }
    if(game.turn !== session) {
      session.send("WRONG_TURN");
      return;
    }
    if(msg !== "ROCK" && msg !== "PAPER" && msg !== "SCISSORS") {
      session.send("UNRECOGNIZED");
    }

    if(game.turn === game.p1) game.p1Hand = msg;
    if(game.turn === game.p2) game.p2Hand = msg;
  
    //First Draw
    if(game.p1Hand === null || game.p2Hand === null) {
      game.turn = (game.p1 === game.turn) ? game.p2 : game.p1;
      game.turn.send("YOUR_TURN");
      let notTurn = (game.p1 === game.turn) ? game.p2 : game.p1;
      notTurn.send("NOT_YOUR_TURN");
    } else {
      //Both have drawn, FORGIVE ME FOR THIS
      if(
        (game.p1Hand === "SCISSORS" && game.p2Hand === "PAPER") ||
        (game.p1Hand === "ROCK" && game.p2Hand === "SCISSORS") ||
        (game.p1Hand === "PAPER" && game.p2Hand === "ROCK")
      ) {
        game.p1Wins++;
        game.p1.send("WINNER");
        game.p1.send("P1="+game.p1Wins);
        game.p1.send("P2="+game.p2Wins);
        game.p2.send("LOSER");
        game.p2.send("P1="+game.p1Wins);
        game.p2.send("P2="+game.p2Wins);
      } else if (
        (game.p1Hand === "SCISSORS" && game.p2Hand === "SCISSORS") ||
        (game.p1Hand === "ROCK" && game.p2Hand === "ROCK") ||
        (game.p1Hand === "PAPER" && game.p2Hand === "PAPER") 
      ) {
        //draw
        game.p1Wins++;
        game.p1.send("DRAW");
        game.p2.send("DRAW");
      } else {
        //p2 wins
        game.p2Wins++;
        game.p2.send("WINNER");
        game.p2.send("P1="+game.p1Wins);
        game.p2.send("P2="+game.p2Wins);
        game.p1.send("LOSER");
        game.p1.send("P1="+game.p1Wins);
        game.p1.send("P2="+game.p2Wins);
      }
      this.startGame(game);
    }
  }

  findGame(session) {
    return this.games.filter(g => g.p1 === session || g.p2 === session)[0];
  }

  onConnect(session) {
    let game = this.findGame(session);
    if(!game) {
      session.send("GAME_EXPIRED");
      session.quit = true;
      session.close(); //Game already deleted
      return;
    }
    if(!(game.p1.active && game.p2.active)) {
      session.send("WAITING_OPPONENT");
      return;
    } 
    this.startGame(game);
  }

  onDisconnect(session) {
    let game = this.findGame(session);
    let p;
    if(session === game.p1) p = game.p2;
    if(session === game.p2) p = game.p1;
    this.removeGame(game);
    if(!p.active) return;
    p.send("OPPONENT_DISCONNECT");
    p.close();
  }

  onDrop(session) {
    let game = this.findGame(session);
    if(!game) return;
    let p;
    if(session === game.p1) p = game.p2;
    if(session === game.p2) p = game.p1;

    if(p.active) p.send("OPPONENT_DROP");
  }

  onReconnect(session) {
    let game = this.findGame(session);
    let p;
    if(session === game.p1) p = game.p2;
    if(session === game.p2) p = game.p1;
    if(p.active) p.send("OPPONENT_RECONNECT");
  }

  createGame(p1, p2) {
    let newGame = {
      p1,
      p2,
      p1Wins: 0,
      p2Wins: 0,
    }
    this.games.push(newGame);
  }

  startGame(game) {
    game.turn = (Math.random() > 0.5) ? game.p1 : game.p2;
    let notTurn = (game.p1 === game.turn) ? game.p2 : game.p1;
    game.p1Hand = null;
    game.p2Hand = null;
    game.turn.send("YOU_START");
    notTurn.send("DONT_START");
  }

  removeGame(game) {
    this.games = this.games.filter(g => g !== game);
  }

  onError(err, session) {
    console.log(err);
  }
}

module.exports = Hub;