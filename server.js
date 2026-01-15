const PORT = process.env.PORT || 3000;

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));
app.use(express.static("assets"));


let players = [];
let board = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;

function checkWinner(board) {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]           // diagonals
  ];

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell)) return "draw";
  return null;
}


function broadcast(data) {
  players.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: "error", message: "Game full" }));
    ws.close();
    return;
  }

  const symbol = players.length === 0 ? "X" : "O";
  players.push(ws);

  ws.send(JSON.stringify({
    type: "init",
    symbol,
    board,
    currentPlayer
  }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "move") {
      if (gameOver) return;
      if (board[data.index]) return;
      if (data.symbol !== currentPlayer) return;

      board[data.index] = data.symbol;

      const result = checkWinner(board);

      if (result) {
        gameOver = true;
        broadcast({
          type: "gameOver",
          board,
          result
        });
        return;
      }

      currentPlayer = currentPlayer === "X" ? "O" : "X";

      broadcast({
        type: "update",
        board,
        currentPlayer
      });
    }

    if (data.type === "restart") {
      board = Array(9).fill(null);
      currentPlayer = "X";
      gameOver = false;

      broadcast({
        type: "restart",
        board,
        currentPlayer
      });
    }
  });


  ws.on("close", () => {
    players = [];
    board = Array(9).fill(null);
    currentPlayer = "X";
    gameOver = false;
    console.log("WS disconnected");
  });
});

// server.listen(PORT,'0.0.0.0', () => {
//   console.log(`HTTP + WS running on ${PORT}`);
// });

server.listen(PORT, () => {
  console.log(`HTTP + WS running on ${PORT}`);
});