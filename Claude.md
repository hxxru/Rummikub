# Rummikub Project - Claude Guide

## Project Overview

This is a Rummikub game implementation with both a web interface and tournament system for AI research. The project has achieved breakthrough results in AI strategy development, with UltraAI reaching 64%+ decisive game completion rates through exhaustive multi-set table manipulation.

## Project Goals

### 1. Polish the Web Application
The web app provides an interactive Rummikub game where humans can play against AI opponents.

**Current State:**
- Fully functional game engine with drag-and-drop interface
- UltraAI integrated as default opponent
- Supports initial meld requirements (30 points)
- Visual feedback for valid/invalid moves

**Polish Tasks:**
- UI/UX improvements (animations, transitions, visual clarity)
- Better AI move visualization (show what AI did each turn)
- Game statistics and history tracking
- Settings panel (AI difficulty selection, game rules configuration)
- Mobile responsiveness
- Tutorial/help system for new players
- Sound effects and visual polish
- Save/load game state

### 2. Build Tournament Infrastructure for AI Development
The tournament system enables AI vs AI competitions to evolve sophisticated strategies.

**Current State:**
- 6 AI implementations: RandomAI, GreedyAI, ValueAI, SmartAI, AdvancedAI, UltraAI
- Round-robin tournament runner with statistics
- Comprehensive experimental framework (UltraAI vs UltraAI analysis)
- Action types: draw, play, playMultiple, complexManipulation, totalRebuild, multiSetRearrange

**Infrastructure Tasks:**
- Genetic algorithm framework for AI evolution
- Neural network integration for move evaluation
- Automated hyperparameter tuning
- Large-scale tournament simulations (1000s of games)
- AI performance profiling and analysis tools
- Strategy discovery through reinforcement learning
- Meta-strategy development (adaptive AI that counters opponent patterns)

## Technical Architecture

### Core Components

**src/js/GameState.js** - Game engine
- Manages game state (racks, table, pouch)
- Validates moves through RummikubRules
- Handles both player and computer turns
- Action handlers: play, playMultiple, totalRebuild, manipulate, draw

**src/js/RummikubRules.js** - Game rules validation
- Set validation (runs and groups)
- Initial meld requirement (30 points)
- Table manipulation rules
- Tile combination discovery

**src/js/GameController.js** - Web UI controller
- Drag-and-drop interface
- AI mode toggle
- Visual feedback and rendering
- Event handling

**src/js/ai/** - AI implementations
- **AIPlayer.js**: Base class with strategy pattern
- **RandomAI.js**: Random valid moves (baseline)
- **GreedyAI.js**: Plays highest-value sets first
- **ValueAI.js**: Maximizes points per turn
- **SmartAI.js**: Considers table manipulation opportunities
- **AdvancedAI.js**: Stealing and splitting strategies (9.5% win rate)
- **UltraAI.js**: Complete table rebuild + multi-set manipulation (64% win rate)

**scripts/** - Tournament and analysis tools
- **runTournament.js**: Round-robin tournament runner
- **ultraVsUltra.js**: Experimental framework for UltraAI analysis
- **analyzeStalemateDetails.js**: Deep dive into game stalemates
- **debugUltraAI.js**: AI decision validation
- **testAdvancedAI.js**, **testUltraAI.js**: Unit tests

### Key Technical Concepts

**Multi-Set Manipulation**: Rearranging multiple table sets simultaneously to create new opportunities. UltraAI's breakthrough innovation.

**Complete Table Rebuild** (`totalRebuild` action): Takes ALL tiles from table and hand, rebuilds optimal arrangement from scratch. Not constrained by existing table structure.

**Strategy Pattern**: AIPlayer base class with polymorphic `makeMove()` method. Each AI implements unique decision-making logic.

**Instance Tracking**: Each tile has unique `instanceId` to track movement between rack/table/sets.

**Greedy Set Formation**: Build groups first (fewer combinations), then runs. Enables exhaustive search within reasonable time.

## Breakthrough Results

### UltraAI Performance
- **64% decisive rate** vs mixed opponents (128/200 games)
- **68% decisive rate** vs UltraAI opponent (34/50 games)
- **32% true stalemate rate** (mathematically no valid moves exist)

### Key Findings
1. **Complete rebuild is revolutionary**: Not preserving table structure enables optimal rearrangement
2. **Optimal vs optimal is BETTER**: Opponent mistakes can prolong games
3. **Stalemates are natural**: With 10 tiles remaining, 69% chance no playable sets exist
4. **Multi-set manipulation essential**: Single-set strategies achieve <10% decisive rates

## Development Priorities

### Immediate Next Steps (Web App Polish)
1. **AI Move Visualization**: Show what tiles AI played and how table changed
2. **Settings Panel**: AI difficulty selector (Random/Greedy/Value/Smart/Advanced/Ultra)
3. **Game Statistics**: Track win/loss record, average game length, AI performance
4. **Better Visual Feedback**: Highlight newly played sets, animate AI moves
5. **Mobile Optimization**: Responsive design, touch-friendly controls

### Medium-Term Goals (Tournament Infrastructure)
1. **Genetic Algorithm Framework**:
   - Parameterized AI strategies (weights for different heuristics)
   - Fitness evaluation through tournament play
   - Crossover and mutation operators
   - Population management and evolution tracking

2. **Neural Network Integration**:
   - Board state encoding (tiles in hand, table configuration, pouch state)
   - Move evaluation network (predict win probability for each move)
   - Policy network (learn move selection strategy)
   - Value network (evaluate position strength)

3. **Large-Scale Simulation**:
   - Parallel tournament execution
   - Statistical analysis of strategy effectiveness
   - Elo rating system for AI ranking
   - Strategy diversity metrics

4. **Reinforcement Learning**:
   - Self-play training loop
   - Reward shaping (game completion, tile reduction, move efficiency)
   - Exploration vs exploitation balance
   - Transfer learning from simpler strategies

### Long-Term Vision
1. **Meta-Strategy AI**: Adaptive opponent that identifies and counters player patterns
2. **Strategy Discovery**: Automated discovery of novel manipulation techniques
3. **Human-AI Collaboration**: AI assistant that suggests moves to human players
4. **Tournament League**: Evolving population of AIs competing continuously

## Code Standards

### ES6 Modules
All JavaScript uses ES6 import/export:
```javascript
import { GameState } from './GameState.js';
export class UltraAI extends AIPlayer { ... }
```

### Async/Await for AI
AI moves are async to support future RL/network inference:
```javascript
async makeMove(gameState) { ... }
await this.aiPlayer.makeMove(gameState);
```

### Action-Based Architecture
AI returns structured action objects:
```javascript
return {
    action: 'totalRebuild',
    newSets: [[tile1, tile2, tile3], [tile4, tile5, tile6]]
};
```

GameState handles action execution, maintaining separation of concerns.

### Testing Philosophy
- Unit tests for individual AI strategies
- Integration tests for tournament runner
- Experimental frameworks for statistical validation
- Debug scripts for specific scenario reproduction

## Development Workflow

### Working on Web App
1. Make changes to `src/js/` files
2. Test in browser (serve with simple HTTP server)
3. Verify AI behavior and UI responsiveness
4. Commit with descriptive messages

### Working on AI/Tournament
1. Create new AI in `src/js/ai/` or modify existing
2. Add to tournament in `scripts/runTournament.js`
3. Run experiments: `node scripts/runTournament.js`
4. Analyze results with custom analysis scripts
5. Document findings in commit messages

### Creating Analysis Tools
1. Copy existing script as template (e.g., `ultraVsUltra.js`)
2. Implement custom game logic or statistics collection
3. Run experiments and capture output
4. Use results to inform next AI iteration

## Git Branch Strategy
Development happens on feature branches:
- Pattern: `claude/feature-name-{sessionId}`
- Always push to designated branch
- Create PR when feature is complete

## Important Files Reference

**Must-read for AI development:**
- `src/js/ai/UltraAI.js` - State-of-the-art strategy (580 lines)
- `src/js/RummikubRules.js` - Game rules and validation
- `scripts/runTournament.js` - Tournament infrastructure

**Must-read for web app:**
- `src/js/GameController.js` - UI controller
- `src/js/GameState.js` - Game engine
- `index.html` - Entry point

**Experimental results:**
- `scripts/ultraVsUltra.js` - 68% decisive rate analysis
- `scripts/analyzeStalemateDetails.js` - Stalemate patterns

## Common Tasks

### Add a New AI Strategy
1. Create `src/js/ai/YourAI.js` extending `AIPlayer`
2. Implement `async makeMove(gameState)`
3. Return action object (play/playMultiple/totalRebuild/draw)
4. Add to tournament: `import { YourAI } from '../src/js/ai/YourAI.js'`
5. Test: `node scripts/runTournament.js`

### Add New Action Type
1. Define action structure in AI
2. Add handler in `GameState.js` `computerTurn()` method
3. Add handler in `scripts/runTournament.js` `processComputerTurn()` method
4. Update action documentation in this file

### Run Experiments
```bash
# Full tournament (all AIs, 200 games)
node scripts/runTournament.js

# Specific matchup analysis
node scripts/ultraVsUltra.js

# Stalemate deep dive
node scripts/analyzeStalemateDetails.js

# AI decision debugging
node scripts/debugUltraAI.js
```

### Test Web App
```bash
# Serve locally
python -m http.server 8000
# or
npx serve

# Open browser to http://localhost:8000
```

## Known Issues & Limitations

### Web App
- No mobile optimization yet
- AI moves happen instantly (no animation/delay)
- No save/load functionality
- Limited visual feedback on AI actions

### Tournament System
- Single-threaded (no parallel execution)
- No persistent results database
- Limited AI configuration options
- No automated hyperparameter tuning

### AI Strategies
- UltraAI can be slow on complex tables (exhaustive search)
- No learning or adaptation (all strategies are static)
- No opponent modeling
- 32% true stalemate rate may be reducible with even more sophisticated manipulation

## Research Questions

### Open Problems
1. Can we reduce the 32% stalemate rate further?
2. What is the theoretical maximum decisive rate for Rummikub?
3. Can neural networks discover better manipulation strategies than UltraAI?
4. Is there an optimal tradeoff between computation time and decision quality?
5. Can AI learn to recognize when opponent is vulnerable to specific manipulations?

### Experimental Ideas
1. Hybrid AI: Neural network for position evaluation + search for move selection
2. Monte Carlo Tree Search for long-term planning
3. Opponent modeling: Adjust strategy based on opponent's play style
4. Opening book: Pre-computed optimal plays for early game
5. Endgame solver: Exhaustive search when few tiles remain

## Getting Help

### Documentation
- See `devlog.md` for detailed development history
- Check commit messages for implementation details
- Read code comments in AI implementations

### Debugging
- Use `scripts/debugUltraAI.js` template for AI debugging
- Add console logs to `GameState.js` for turn-by-turn analysis
- Use browser dev tools for web app debugging

### Contact
- GitHub issues for bug reports
- Feature requests via issues with `enhancement` label

---

**Last Updated**: 2025-11-10 (Session: explore-codebase-011CUyv3WnXrjd7QttKk9WXF)
