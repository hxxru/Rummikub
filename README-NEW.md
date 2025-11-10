# 🎲 Rummikub - Web Game

A polished, playable web-based implementation of the classic tile game Rummikub.

![Rummikub Game](https://i.imgur.com/vzUVt6W.png)

## 🎮 Features

- **Full Rummikub Rules Implementation**
  - Valid runs (3+ consecutive numbers, same color)
  - Valid groups (3-4 same numbers, different colors)
  - Initial meld requirement (30+ points)
  - Proper turn-based gameplay

- **Polished User Experience**
  - Smooth drag-and-drop tile placement
  - Auto-sorting rack functionality
  - Undo move capability
  - Real-time validation feedback
  - Responsive design for all screen sizes

- **Computer AI Opponent**
  - Basic AI that can form valid sets
  - Respects initial meld rules
  - Automatic turn management

- **Modern Tech Stack**
  - Vite for fast development and builds
  - Vanilla JavaScript with ES6 modules
  - Clean, maintainable architecture
  - No framework dependencies

## 🚀 Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173/`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 How to Play

1. **Starting the Game**
   - Click "Start Game" to begin
   - Each player receives 14 tiles

2. **Making Moves**
   - Drag tiles from your rack to the table
   - Form valid runs or groups
   - Your first play must total 30+ points

3. **Types of Sets**
   - **Run**: 3+ consecutive numbers of the same color
     - Example: Blue 3, 4, 5, 6
   - **Group**: 3-4 tiles with the same number but different colors
     - Example: Red 7, Blue 7, Orange 7

4. **Turn Actions**
   - Arrange tiles on the table
   - Click "Done" when finished
   - Or click "Draw Tile" to draw and end turn

5. **Winning**
   - First player to empty their rack wins!

## 📁 Project Structure

```
Rummikub/
├── src/
│   ├── js/
│   │   ├── Tile.js              # Tile class and logic
│   │   ├── RummikubRules.js     # Game rules validation
│   │   ├── GameState.js         # Game state management
│   │   └── GameController.js    # UI and game flow control
│   ├── styles/
│   │   └── main.css            # All styling
│   └── main.js                 # Entry point
├── public/
│   └── images/                 # Tile SVG assets
├── index.html                  # Main HTML file
├── package.json
└── README.md
```

## 🎨 Architecture

### Clean Separation of Concerns

- **Tile.js**: Represents individual tiles with their properties and rendering
- **RummikubRules.js**: Pure validation logic for runs, groups, and game rules
- **GameState.js**: Manages all game state (racks, table, turn, scoring)
- **GameController.js**: Handles UI interactions and coordinates game flow

### Key Design Patterns

- **MVC Pattern**: Clear separation between model (GameState), view (DOM), and controller
- **Modular ES6**: Clean imports/exports for maintainability
- **Event-Driven**: DOM events trigger game logic updates
- **State Management**: Centralized game state with undo functionality

## 🔧 Features Implemented

✅ Full tile generation (104 tiles: 2 sets × 13 numbers × 4 colors)
✅ Drag-and-drop tile movement
✅ Run and group validation
✅ Initial meld requirement (30+ points)
✅ Turn-based gameplay
✅ Computer AI opponent
✅ Undo functionality
✅ Auto-sort rack
✅ Win detection
✅ Responsive design

## 🎯 Future Enhancements

- [ ] Joker tiles implementation
- [ ] Advanced AI with strategic thinking
- [ ] Multiplayer support (online/local)
- [ ] Game statistics and score tracking
- [ ] Sound effects and animations
- [ ] Tutorial mode for new players
- [ ] Save/load game state
- [ ] Multiple difficulty levels

## 🐛 Known Issues

- AI is basic and doesn't attempt complex rearrangements
- No joker tiles yet
- No time limit per turn

## 📜 License

ISC

## 🤝 Contributing

Feel free to fork and improve! This is a learning project that demonstrates:
- Modern JavaScript development
- Game logic implementation
- UI/UX design
- State management

---

Built with ❤️ using Vite and Vanilla JavaScript
