const os = require("os");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));
app.use(express.static("assets"));

/**
 * Player slots (stable across reloads)
 * {
 *   X: { ws, clientId } | null
 *   O: { ws, clientId } | null
 * }
 */
let players = {
  X: null,
  O: null
};

let board = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;
let scores = { X: 0, O: 0 };
let playerInfo = { X: null, O: null };

// ------------------ helpers ------------------

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return board.every(Boolean) ? "draw" : null;
}

function broadcast(payload) {
  Object.values(players).forEach(player => {
    if (player?.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(payload));
    }
  });
}

// ------------------ websocket ------------------

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    /**
     * STEP 3: identity + reconnection
     */
    if (data.type === "identify") {
      const { clientId } = data;
      ws.clientId = clientId;

      // Reconnect to existing slot
      for (const symbol of ["X", "O"]) {
        if (players[symbol]?.clientId === clientId) {
          players[symbol].ws = ws;
          ws.symbol = symbol;

          console.log(`Reconnected player ${symbol}`);

          ws.send(JSON.stringify({
            type: "init",
            symbol,
            board,
            currentPlayer,
            scores
          }));
          return;
        }
      }

      // Assign new slot
      if (!players.X) {
        players.X = { ws, clientId };
        ws.symbol = "X";
      } else if (!players.O) {
        players.O = { ws, clientId };
        ws.symbol = "O";
      } else {
        ws.send(JSON.stringify({
          type: "error",
          message: "Game full"
        }));
        ws.close();
        return;
      }

      console.log(`New player joined as ${ws.symbol}`);

      ws.send(JSON.stringify({
        type: "init",
        symbol: ws.symbol,
        board,
        currentPlayer,
        scores
      }));
      return;
    }

    // Ignore messages until identified
    if (!ws.symbol) return;

    // Player info (name / emoji)
    if (data.type === "playerInfo") {
      playerInfo[ws.symbol] = data.info;
      broadcast({ type: "playerInfo", playerInfo });
    }

    // Move
    if (data.type === "move") {
      if (gameOver) return;
      if (data.symbol !== currentPlayer) return;
      if (board[data.index]) return;

      board[data.index] = data.symbol;
      const result = checkWinner(board);

      if (result) {
        gameOver = true;

        if (result !== "draw") {
          scores[result]++;
          console.log(`Winner: ${playerInfo[result]?.label || result}`);
        }

        broadcast({
          type: "gameOver",
          board,
          result,
          scores
        });
        return;
      }

      currentPlayer = currentPlayer === "X" ? "O" : "X";
      broadcast({ type: "update", board, currentPlayer });
    }

    // Restart game (scores stay)
    if (data.type === "restart") {
      board = Array(9).fill(null);
      currentPlayer = "X";
      gameOver = false;

      broadcast({
        type: "restart",
        board,
        currentPlayer,
        scores
      });
    }
  });

  ws.on("close", () => {
    if (!ws.symbol) return;

    console.log(`Player ${ws.symbol} disconnected`);

    // Keep slot reserved, just drop socket
    if (players[ws.symbol]?.clientId === ws.clientId) {
      players[ws.symbol].ws = null;
    }
  });
});

// ------------------ server start ------------------

server.listen(PORT, HOST, () => {
  const isProd = !!process.env.PORT;

  console.log("Server started");

  if (isProd) {
    console.log(`→ Listening on port ${PORT}`);
  } else {
    console.log("→ Local URLs:");
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://127.0.0.1:${PORT}`);

    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          console.log(`   http://${iface.address}:${PORT}`);
        }
      }
    }
  }
});




// const express = require("express");
// const http = require("http");
// const WebSocket = require("ws");

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// app.use(express.static("public"));
// app.use(express.static("assets"));


// let players = [];
// let board = Array(9).fill(null);
// let currentPlayer = "X";
// let gameOver = false;

// function checkWinner(board) {
//   const wins = [
//     [0,1,2], [3,4,5], [6,7,8], // rows
//     [0,3,6], [1,4,7], [2,5,8], // cols
//     [0,4,8], [2,4,6]           // diagonals
//   ];

//   for (const [a, b, c] of wins) {
//     if (board[a] && board[a] === board[b] && board[a] === board[c]) {
//       return board[a];
//     }
//   }

//   if (board.every(cell => cell)) return "draw";
//   return null;
// }


// function broadcast(data) {
//   players.forEach(ws => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify(data));
//     }
//   });
// }

// wss.on("connection", (ws) => {
//   console.log("WebSocket client connected");

//   if (players.length >= 2) {
//     ws.send(JSON.stringify({ type: "error", message: "Game full" }));
//     ws.close();
//     return;
//   }

//   const symbol = players.length === 0 ? "X" : "O";
//   players.push(ws);

//   ws.send(JSON.stringify({
//     type: "init",
//     symbol,
//     board,
//     currentPlayer
//   }));

//   ws.on("message", (msg) => {
//     const data = JSON.parse(msg);

//     if (data.type === "move") {
//       if (gameOver) return;
//       if (board[data.index]) return;
//       if (data.symbol !== currentPlayer) return;

//       board[data.index] = data.symbol;

//       const result = checkWinner(board);

//       if (result) {
//         gameOver = true;
//         broadcast({
//           type: "gameOver",
//           board,
//           result
//         });
//         return;
//       }

//       currentPlayer = currentPlayer === "X" ? "O" : "X";

//       broadcast({
//         type: "update",
//         board,
//         currentPlayer
//       });
//     }

//     if (data.type === "restart") {
//       board = Array(9).fill(null);
//       currentPlayer = "X";
//       gameOver = false;

//       broadcast({
//         type: "restart",
//         board,
//         currentPlayer
//       });
//     }
//   });


//   ws.on("close", () => {
//     players = [];
//     board = Array(9).fill(null);
//     currentPlayer = "X";
//     gameOver = false;
//     console.log("WS disconnected");
//   });
// });

// // server.listen(PORT,'0.0.0.0', () => {
// //   console.log(`HTTP + WS running on ${PORT}`);
// // });

// server.listen(PORT, () => {
//   console.log(`HTTP + WS running on ${PORT}`);
// });