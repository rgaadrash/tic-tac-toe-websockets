# Tic-Tac-Toe with WebSockets

A real-time multiplayer Tic-Tac-Toe game built with Vanilla JavaScript and WebSockets.

## Features

- Real-time multiplayer gameplay using WebSockets
- Clean, responsive UI built with vanilla JavaScript
- Two-player game mode
- Game state synchronization across clients
- Automatic reconnection handling

## Prerequisites

- Node.js (v12 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/rgaadrash/tic-tac-toe-websockets.git
cd tic-tac-toe-websockets
```

2. Install dependencies:
```bash
npm install
```

## Running the Server

Start the WebSocket server:
```bash
node server.js
```

The server will start on `http://localhost:3000` (or the configured port in your environment).

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Share the link with another player
3. Players take turns clicking on empty squares
4. The first player to get three in a row wins!

## Project Structure

```
├── server.js           # WebSocket server
├── package.json        # Dependencies and scripts
├── ngrok.yml           # ngrok configuration
├── assets/
│   └── script.js       # Client-side game logic
└── public/
    ├── index.html      # Main game page
    └── readme.md       # This file
```

## Technologies Used

- **Backend**: Node.js with WebSocket support
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Communication**: WebSockets for real-time bidirectional communication

## License

This project is open source and available for educational purposes.
