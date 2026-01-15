const restartBtn = document.getElementById("restart");
  let gameOver = false;

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

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onerror = (e) => {
    console.error("WebSocket error", e);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "init") {
      mySymbol = data.symbol;
      board = data.board;
      currentPlayer = data.currentPlayer;
      statusEl.textContent = `You are ${mySymbol}`;
      render();
    }

    if (data.type === "update") {
      board = data.board;
      currentPlayer = data.currentPlayer;
      statusEl.textContent = `Turn: ${currentPlayer}`;
      render();
    }

    if (data.type === "gameOver") {
      board = data.board;
      gameOver = true;

      if (data.result === "draw") {
        statusEl.textContent = "It's a draw!";
      } else {
        statusEl.textContent = `Player ${data.result} wins!`;
      }

      restartBtn.style.display = "inline-block";
      render();
    }

    if (data.type === "restart") {
      board = data.board;
      currentPlayer = data.currentPlayer;
      gameOver = false;
      statusEl.textContent = `Turn: ${currentPlayer}`;
      restartBtn.style.display = "none";
      render();
    }

  };

  function render() {
    boardEl.innerHTML = "";
    board.forEach((v, i) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = v || "";
      cell.onclick = () => {
        if (gameOver) return;
        if (!v && currentPlayer === mySymbol) {
          ws.send(JSON.stringify({
            type: "move",
            index: i,
            symbol: mySymbol
          }));
        }
      };

      boardEl.appendChild(cell);
    });
  }

  restartBtn.onclick = () => {
    ws.send(JSON.stringify({ type: "restart" }));
  };
