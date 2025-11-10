import { GameState } from './GameState.js';
import { RummikubRules } from './RummikubRules.js';

/**
 * Controls game flow and UI interactions
 */
export class GameController {
    constructor() {
        this.gameState = null;
        this.draggedTile = null;
        this.dragSource = null; // {type: 'rack'|'run'|'group', index: number}
        this.aiMode = false;
        this.aiModeInterval = null;
        this.initializeUI();
    }

    /**
     * Initialize UI event listeners
     */
    initializeUI() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        // Game controls
        document.getElementById('sort-btn').addEventListener('click', () => {
            this.sortPlayerRack();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undoMove();
        });

        document.getElementById('draw-btn').addEventListener('click', () => {
            this.drawCard();
        });

        document.getElementById('done-btn').addEventListener('click', () => {
            this.endTurn();
        });

        // AI Mode toggle
        document.getElementById('ai-mode-toggle').addEventListener('change', (e) => {
            this.toggleAIMode(e.target.checked);
        });
    }

    /**
     * Start new game
     */
    startGame() {
        this.gameState = new GameState();
        this.gameState.startPlayerTurn();

        // Hide start screen, show game screen
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Render initial state
        this.render();

        // Enable undo button
        document.getElementById('undo-btn').disabled = false;
    }

    /**
     * Restart game
     */
    restartGame() {
        document.getElementById('win-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    }

    /**
     * Render entire game state
     */
    render() {
        this.renderComputerRack();
        this.renderPlayerRack();
        this.renderRuns();
        this.renderGroups();
        this.updateStats();
    }

    /**
     * Render computer's rack (tile backs)
     */
    renderComputerRack() {
        const rackEl = document.getElementById('computer-rack');
        rackEl.innerHTML = '';

        // Render tile backs for each computer tile
        this.gameState.computerRack.forEach(() => {
            const tileBack = document.createElement('div');
            tileBack.className = 'tile-back';
            rackEl.appendChild(tileBack);
        });
    }

    /**
     * Render player's rack
     */
    renderPlayerRack() {
        const rackEl = document.getElementById('player-rack');
        rackEl.innerHTML = '';

        this.gameState.playerRack.forEach(tile => {
            const tileEl = tile.createDOMElement();
            this.makeTileDraggable(tileEl);
            rackEl.appendChild(tileEl);
        });

        // Make rack a drop zone
        this.makeDroppable(rackEl, { type: 'rack' });
    }

    /**
     * Render runs area (10 run slots)
     */
    renderRuns() {
        const runsArea = document.getElementById('runs-area');
        runsArea.innerHTML = '';

        // Always show 10 run slots
        for (let i = 0; i < 10; i++) {
            const runEl = document.createElement('div');
            runEl.className = 'run';
            runEl.dataset.runIndex = i;

            const tiles = this.gameState.runs[i] || [];
            tiles.forEach(tile => {
                const tileEl = tile.createDOMElement();
                this.makeTileDraggable(tileEl);
                runEl.appendChild(tileEl);
            });

            this.makeDroppable(runEl, { type: 'run', index: i });
            runsArea.appendChild(runEl);
        }
    }

    /**
     * Render groups area (10 group slots)
     */
    renderGroups() {
        const groupsArea = document.getElementById('groups-area');
        groupsArea.innerHTML = '';

        // Always show 10 group slots
        for (let i = 0; i < 10; i++) {
            const groupEl = document.createElement('div');
            groupEl.className = 'group';
            groupEl.dataset.groupIndex = i;

            const tiles = this.gameState.groups[i] || [];
            tiles.forEach(tile => {
                const tileEl = tile.createDOMElement();
                this.makeTileDraggable(tileEl);
                groupEl.appendChild(tileEl);
            });

            this.makeDroppable(groupEl, { type: 'group', index: i });
            groupsArea.appendChild(groupEl);
        }
    }

    /**
     * Make tile draggable
     */
    makeTileDraggable(tileEl) {
        tileEl.addEventListener('dragstart', (e) => {
            this.draggedTile = e.target;

            // Determine source
            if (e.target.closest('.player-rack')) {
                this.dragSource = { type: 'rack' };
            } else if (e.target.closest('.run')) {
                const runEl = e.target.closest('.run');
                this.dragSource = { type: 'run', index: parseInt(runEl.dataset.runIndex) };
            } else if (e.target.closest('.group')) {
                const groupEl = e.target.closest('.group');
                this.dragSource = { type: 'group', index: parseInt(groupEl.dataset.groupIndex) };
            }

            // Create a custom drag image to prevent the tile from disappearing
            const dragImage = e.target.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 25, 35);

            // Remove the temporary drag image after a brief delay
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);

            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.innerHTML);
        });

        tileEl.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    }

    /**
     * Make element a drop zone
     */
    makeDroppable(element, target) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', (e) => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');

            if (this.draggedTile) {
                this.handleTileDrop(this.draggedTile, target);
                this.draggedTile = null;
                this.dragSource = null;
            }
        });
    }

    /**
     * Handle tile drop
     */
    handleTileDrop(tileEl, target) {
        const tileId = tileEl.dataset.tileId;

        // Find and remove tile from source
        let tile;
        if (this.dragSource.type === 'rack') {
            tile = this.gameState.removeTileFromRack(tileId);
        } else if (this.dragSource.type === 'run') {
            const sourceRun = this.gameState.runs[this.dragSource.index];
            const tileIndex = sourceRun.findIndex(t => t.id === tileId);
            if (tileIndex !== -1) {
                tile = sourceRun.splice(tileIndex, 1)[0];
            }
        } else if (this.dragSource.type === 'group') {
            const sourceGroup = this.gameState.groups[this.dragSource.index];
            const tileIndex = sourceGroup.findIndex(t => t.id === tileId);
            if (tileIndex !== -1) {
                tile = sourceGroup.splice(tileIndex, 1)[0];
            }
        }

        if (!tile) return;

        // Add tile to target
        if (target.type === 'rack') {
            this.gameState.addTileToRack(tile);
        } else if (target.type === 'run') {
            this.gameState.runs[target.index].push(tile);
        } else if (target.type === 'group') {
            this.gameState.groups[target.index].push(tile);
        }

        // Re-render
        this.render();
    }

    /**
     * Sort player's rack
     */
    sortPlayerRack() {
        this.gameState.sortRack(this.gameState.playerRack);
        this.renderPlayerRack();
    }

    /**
     * Undo current move
     */
    undoMove() {
        if (this.gameState.undoTurn()) {
            this.render();
        }
    }

    /**
     * Draw a card from pouch
     */
    drawCard() {
        const tile = this.gameState.drawTile('player');
        if (tile) {
            this.render();
            this.showMessage(`Drew: ${tile.color} ${tile.number}`, 'success');
        } else {
            this.showMessage('Pouch is empty!', 'error');
        }
    }

    /**
     * End player turn
     */
    async endTurn() {
        const result = this.gameState.endPlayerTurn();

        if (!result.success) {
            this.showMessage(result.message, 'error');
            return;
        }

        if (result.winner === 'player') {
            this.showWinScreen('player');
            return;
        }

        // Computer's turn
        this.showMessage('Computer is thinking...', 'info');
        await this.gameState.computerTurn();

        if (this.gameState.winner === 'computer') {
            this.showWinScreen('computer');
            return;
        }

        this.render();
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const stats = this.gameState.getStats();
        document.getElementById('player-count').textContent = `x${stats.playerTileCount}`;
        document.getElementById('pouch-count').textContent = `x${stats.pouchCount}`;
    }

    /**
     * Show message to player
     */
    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /**
     * Show win screen
     */
    showWinScreen(winner) {
        const winScreen = document.getElementById('win-screen');
        const winnerText = document.getElementById('winner-text');

        if (winner === 'player') {
            winnerText.textContent = 'You Win!';
        } else {
            winnerText.textContent = 'Computer Wins!';
        }

        winScreen.classList.remove('hidden');

        // Stop AI mode when game ends
        if (this.aiModeInterval) {
            clearInterval(this.aiModeInterval);
            this.aiModeInterval = null;
        }
    }

    /**
     * Toggle AI mode
     */
    toggleAIMode(enabled) {
        this.aiMode = enabled;

        if (enabled) {
            this.showMessage('AI Mode Enabled - Auto-playing...', 'info');
            this.startAIMode();
        } else {
            this.showMessage('AI Mode Disabled', 'info');
            this.stopAIMode();
        }
    }

    /**
     * Start AI mode - automatically play the game
     */
    startAIMode() {
        // Make a move every 2 seconds
        this.aiModeInterval = setInterval(() => {
            if (this.gameState.gameOver) {
                this.stopAIMode();
                return;
            }

            this.makeAIMove();
        }, 2000);
    }

    /**
     * Stop AI mode
     */
    stopAIMode() {
        if (this.aiModeInterval) {
            clearInterval(this.aiModeInterval);
            this.aiModeInterval = null;
        }
    }

    /**
     * Make an AI move for the player
     */
    async makeAIMove() {
        // Use the same logic as computer AI
        const possibleSets = RummikubRules.findPossibleSets(this.gameState.playerRack);

        if (possibleSets.length > 0 &&
            (this.gameState.playerHasMelded || RummikubRules.calculateValue(possibleSets[0]) >= 30)) {
            // Play first valid set
            const setToPlay = possibleSets[0];

            // Remove tiles from player rack
            setToPlay.forEach(tile => {
                const index = this.gameState.playerRack.findIndex(t => t.id === tile.id);
                if (index !== -1) {
                    this.gameState.playerRack.splice(index, 1);
                }
            });

            // Add to appropriate slot
            if (RummikubRules.isValidRun(setToPlay)) {
                // Find first empty run slot
                const emptyRunIndex = this.gameState.runs.findIndex(run => run.length === 0);
                if (emptyRunIndex !== -1) {
                    this.gameState.runs[emptyRunIndex] = setToPlay;
                }
            } else if (RummikubRules.isValidGroup(setToPlay)) {
                // Find first empty group slot
                const emptyGroupIndex = this.gameState.groups.findIndex(group => group.length === 0);
                if (emptyGroupIndex !== -1) {
                    this.gameState.groups[emptyGroupIndex] = setToPlay;
                }
            }
            this.gameState.playerHasMelded = true;

            // Render and check win
            this.render();

            if (this.gameState.playerRack.length === 0) {
                this.gameState.gameOver = true;
                this.gameState.winner = 'player';
                this.showWinScreen('player');
                return;
            }

            // End turn
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            // Draw a card
            this.drawCard();
        }

        // Computer's turn after a delay
        if (!this.gameState.gameOver) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.gameState.computerTurn();

            if (this.gameState.winner === 'computer') {
                this.showWinScreen('computer');
                return;
            }

            this.render();
        }
    }
}
