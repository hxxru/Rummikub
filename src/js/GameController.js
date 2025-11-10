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
        this.renderPlayerRack();
        this.renderRuns();
        this.renderGroups();
        this.updateStats();
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
     * Render runs area (8 run slots)
     */
    renderRuns() {
        const runsArea = document.getElementById('runs-area');
        runsArea.innerHTML = '';

        // Get runs from table
        const runs = this.gameState.table.filter(set =>
            set.length === 0 || RummikubRules.isValidRun(set)
        );

        // Always show 8 run slots
        for (let i = 0; i < 8; i++) {
            const runEl = document.createElement('div');
            runEl.className = 'run';
            runEl.dataset.runIndex = i;

            const tiles = runs[i] || [];
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
     * Render groups area (16 group slots)
     */
    renderGroups() {
        const groupsArea = document.getElementById('groups-area');
        groupsArea.innerHTML = '';

        // Get groups from table
        const groups = this.gameState.table.filter(set =>
            set.length === 0 || RummikubRules.isValidGroup(set)
        );

        // Always show 16 group slots
        for (let i = 0; i < 16; i++) {
            const groupEl = document.createElement('div');
            groupEl.className = 'group';
            groupEl.dataset.groupIndex = i;

            const tiles = groups[i] || [];
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

        // Remove tile from source
        let tile;
        if (this.dragSource.type === 'rack') {
            tile = this.gameState.removeTileFromRack(tileId);
        } else {
            // Find tile in table
            for (let i = 0; i < this.gameState.table.length; i++) {
                const set = this.gameState.table[i];
                const tileIndex = set.findIndex(t => t.id === tileId);
                if (tileIndex !== -1) {
                    tile = set.splice(tileIndex, 1)[0];
                    break;
                }
            }
        }

        if (!tile) return;

        // Add tile to target
        if (target.type === 'rack') {
            this.gameState.addTileToRack(tile);
        } else if (target.type === 'run' || target.type === 'group') {
            // Find or create the set at this position
            const isRun = target.type === 'run';
            const targetSets = this.gameState.table.filter(set =>
                set.length === 0 || (isRun ? RummikubRules.isValidRun(set) : RummikubRules.isValidGroup(set))
            );

            if (targetSets[target.index]) {
                targetSets[target.index].push(tile);
            } else {
                // Create new set
                const newSet = [tile];
                // Find proper position in table
                const existingRunCount = this.gameState.table.filter(set =>
                    set.length > 0 && RummikubRules.isValidRun(set)
                ).length;
                const existingGroupCount = this.gameState.table.filter(set =>
                    set.length > 0 && RummikubRules.isValidGroup(set)
                ).length;

                if (isRun && target.index >= existingRunCount) {
                    this.gameState.table.push(newSet);
                } else if (!isRun && target.index >= existingGroupCount) {
                    this.gameState.table.push(newSet);
                } else {
                    // Insert at proper position
                    this.gameState.table.splice(target.index, 0, newSet);
                }
            }
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
    }
}
