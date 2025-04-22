# AlgoBlocks - Algorithmic Trading Platform

AlgoBlocks is a visual block-based algorithmic trading platform that allows users to build, backtest, and deploy trading strategies without writing code.

## Features

- Drag-and-drop block editor for creating trading strategies
- Backtest strategies with historical market data
- Paper trading simulation
- Real-time market data dashboard
- User authentication and strategy management
- Dark/light mode support

## Project Structure

The project is organized into two main directories:

- `client`: React frontend application
- `server`: Node.js Express backend API

## Prerequisites

- Node.js v14+ and npm v6+
- MongoDB v4+
- Git

## Environment Variables

### Client (.env)

```
REACT_APP_FINANCIAL_MODELING_PREP_API_KEY=your_api_key_here
```

### Server (.env)

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/algoblocks
JWT_SECRET=your_jwt_secret_key
ALPHA_VANTAGE_API_KEY=your_api_key_here
FINANCIAL_MODELING_PREP_API_KEY=your_api_key_here
```

## Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/algoblocks.git
   cd algoblocks
   ```

2. Install dependencies

   ```
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables

   - Create `.env` files in both client and server directories
   - Add the required environment variables (as shown above)

4. Start the development servers

   ```
   # Start backend server
   cd server
   npm run dev

   # Start frontend server (in another terminal)
   cd client
   npm start
   ```

5. Access the application at http://localhost:3000

## API Documentation

The backend provides RESTful APIs for:

- User authentication (register, login, etc.)
- Strategy management (CRUD operations)
- Market data (real-time quotes, historical data)
- Backtesting

## License

MIT
