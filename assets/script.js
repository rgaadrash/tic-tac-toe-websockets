const ws = new WebSocket(
  location.protocol === "https:"
    ? "wss://" + location.host
    : "ws://" + location.host
);

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let mySymbol = null;
let currentPlayer = null;
let board = [];

function renderBoard() {
  boardEl.innerHTML = "";
  board.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = value || "";
    cell.onclick = () => {
      if (!value && currentPlayer === mySymbol) {
        ws.send(JSON.stringify({
          type: "move",
          index,
          symbol: mySymbol
        }));
      }
    };
    boardEl.appendChild(cell);
  });
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "init") {
    mySymbol = data.symbol;
    board = data.board;
    currentPlayer = data.currentPlayer;
    statusEl.textContent = `You are ${mySymbol}`;
    renderBoard();
  }

  if (data.type === "update") {
    board = data.board;
    currentPlayer = data.currentPlayer;
    statusEl.textContent = `Turn: ${currentPlayer}`;
    renderBoard();
  }

  if (data.type === "error") {
    alert(data.message);
  }
};