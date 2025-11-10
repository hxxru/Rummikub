import { GameState } from './GameState.js';

/**
 * Controls game flow and UI interactions
 */
export class GameController {
    constructor() {
        this.gameState = null;
        this.draggedTile = null;
        this.dragSource = null; // 'rack' or set index
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
    }

    /**
     * Render entire game state
     */
    render() {
        this.renderPlayerRack();
        this.renderTable();
        this.updateStats();
        this.updateTurnIndicator();
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
        this.makeDroppable(rackEl, 'rack');
    }

    /**
     * Render table (all sets)
     */
    renderTable() {
        const tableEl = document.getElementById('table');
        tableEl.innerHTML = '';

        this.gameState.table.forEach((set, index) => {
            const setEl = this.createSetElement(set, index);
            tableEl.appendChild(setEl);
        });

        // Add empty set for new plays
        const emptySet = this.createSetElement([], this.gameState.table.length);
        emptySet.classList.add('set-empty');
        tableEl.appendChild(emptySet);
    }

    /**
     * Create a set element (run or group)
     */
    createSetElement(tiles, setIndex) {
        const setEl = document.createElement('div');
        setEl.className = 'set';
        setEl.dataset.setIndex = setIndex;

        tiles.forEach(tile => {
            const tileEl = tile.createDOMElement();
            this.makeTileDraggable(tileEl);
            setEl.appendChild(tileEl);
        });

        this.makeDroppable(setEl, setIndex);

        return setEl;
    }

    /**
     * Make tile draggable
     */
    makeTileDraggable(tileEl) {
        tileEl.addEventListener('dragstart', (e) => {
            this.draggedTile = e.target;
            this.dragSource = e.target.closest('.rack') ? 'rack' :
                            parseInt(e.target.closest('.set').dataset.setIndex);
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
        if (this.dragSource === 'rack') {
            tile = this.gameState.removeTileFromRack(tileId);
        } else {
            const sourceSet = this.gameState.table[this.dragSource];
            const index = sourceSet.findIndex(t => t.id === tileId);
            if (index !== -1) {
                tile = sourceSet.splice(index, 1)[0];
            }
        }

        if (!tile) return;

        // Add tile to target
        if (target === 'rack') {
            this.gameState.addTileToRack(tile);
        } else {
            // Add to set on table
            if (target >= this.gameState.table.length) {
                this.gameState.table.push([tile]);
            } else {
                this.gameState.table[target].push(tile);
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
        this.updateTurnIndicator();
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
        document.getElementById('player-count').textContent = stats.playerTileCount;
        document.getElementById('computer-count').textContent = stats.computerTileCount;
        document.getElementById('pouch-count').textContent = stats.pouchCount;
    }

    /**
     * Update turn indicator
     */
    updateTurnIndicator() {
        const indicator = document.getElementById('current-turn');
        if (this.gameState.currentTurn === 'player') {
            indicator.textContent = 'Your Turn';
            indicator.classList.remove('computer-turn');
        } else {
            indicator.textContent = 'Computer\'s Turn';
            indicator.classList.add('computer-turn');
        }
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
        const winMessage = document.getElementById('win-message');

        if (winner === 'player') {
            winnerText.textContent = '🎉 You Win!';
            winMessage.textContent = 'Congratulations! You emptied your rack first!';
        } else {
            winnerText.textContent = '💻 Computer Wins!';
            winMessage.textContent = 'Better luck next time!';
        }

        winScreen.classList.remove('hidden');
    }
}
