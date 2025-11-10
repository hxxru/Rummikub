import { GameState } from './GameState.js';
import { RummikubRules } from './RummikubRules.js';
import { UltraAI } from './ai/UltraAI.js';
import { AnimationHelper } from './AnimationHelper.js';

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
        this.newlyAddedTiles = new Set(); // Track tiles just added to board for glow effect
        this.currentAI = new UltraAI(); // Default AI strategy - uses optimal multi-set manipulation
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
            this.sortPlayerRack(false);
        });

        document.getElementById('sort-number-btn').addEventListener('click', () => {
            this.sortPlayerRack(true);
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
        this.gameState = new GameState(this.currentAI);
        this.gameState.startPlayerTurn();

        // Hide start screen, show game screen
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Render initial state
        this.render();

        // Set player as active
        AnimationHelper.setActivePlayer(true);

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
        const previousCount = rackEl.children.length;
        rackEl.innerHTML = '';

        // Render tile backs for each computer tile
        this.gameState.computerRack.forEach((tile, index) => {
            const tileBack = document.createElement('div');
            tileBack.className = 'tile-back';

            // Add animation for new tiles
            if (this.gameState.computerRack.length > previousCount) {
                AnimationHelper.addSlideInAnimation(tileBack, index * 30);
            }

            rackEl.appendChild(tileBack);
        });
    }

    /**
     * Render player's rack
     */
    renderPlayerRack() {
        const rackEl = document.getElementById('player-rack');
        const previousCount = rackEl.children.length;
        rackEl.innerHTML = '';

        this.gameState.playerRack.forEach((tile, index) => {
            const tileEl = tile.createDOMElement();

            // Add animation for newly drawn tiles
            if (this.gameState.playerRack.length > previousCount) {
                AnimationHelper.addPopInAnimation(tileEl);
            }

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

        // Always show 8 run slots (matching groups)
        for (let i = 0; i < 8; i++) {
            const runEl = document.createElement('div');
            runEl.className = 'run';
            runEl.dataset.runIndex = i;

            const tiles = this.gameState.runs[i] || [];
            tiles.forEach(tile => {
                const tileEl = tile.createDOMElement();
                // Add glow effect to newly added tiles (using instanceId)
                if (this.newlyAddedTiles.has(tile.instanceId)) {
                    tileEl.classList.add('newly-added');
                }
                this.makeTileDraggable(tileEl);
                runEl.appendChild(tileEl);
            });

            this.makeDroppable(runEl, { type: 'run', index: i });
            runsArea.appendChild(runEl);
        }
    }

    /**
     * Render groups area (16 group slots in 2x8 layout)
     */
    renderGroups() {
        const groupsArea = document.getElementById('groups-area');
        groupsArea.innerHTML = '';

        // Create 2 columns
        for (let col = 0; col < 2; col++) {
            const columnEl = document.createElement('div');
            columnEl.className = 'groups-column';

            // 8 rows per column
            for (let row = 0; row < 8; row++) {
                const groupIndex = col * 8 + row;
                const groupEl = document.createElement('div');
                groupEl.className = 'group';
                groupEl.dataset.groupIndex = groupIndex;

                const tiles = this.gameState.groups[groupIndex] || [];
                tiles.forEach(tile => {
                    const tileEl = tile.createDOMElement();
                    // Add glow effect to newly added tiles (using instanceId)
                    if (this.newlyAddedTiles.has(tile.instanceId)) {
                        tileEl.classList.add('newly-added');
                    }
                    this.makeTileDraggable(tileEl);
                    groupEl.appendChild(tileEl);
                });

                this.makeDroppable(groupEl, { type: 'group', index: groupIndex });
                columnEl.appendChild(groupEl);
            }

            groupsArea.appendChild(columnEl);
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
        const instanceId = parseInt(tileEl.dataset.instanceId); // Use instanceId for unique identification

        // Find and remove tile from source
        let tile;
        const fromRack = this.dragSource.type === 'rack';

        if (this.dragSource.type === 'rack') {
            tile = this.gameState.removeTileFromRack(tileId);
        } else if (this.dragSource.type === 'run') {
            const sourceRun = this.gameState.runs[this.dragSource.index];
            // Use instanceId to find the exact tile, not just id (handles duplicate tiles)
            const tileIndex = sourceRun.findIndex(t => t.instanceId === instanceId);
            if (tileIndex !== -1) {
                tile = sourceRun.splice(tileIndex, 1)[0];
            }
        } else if (this.dragSource.type === 'group') {
            const sourceGroup = this.gameState.groups[this.dragSource.index];
            // Use instanceId to find the exact tile, not just id (handles duplicate tiles)
            const tileIndex = sourceGroup.findIndex(t => t.instanceId === instanceId);
            if (tileIndex !== -1) {
                tile = sourceGroup.splice(tileIndex, 1)[0];
            }
        }

        if (!tile) {
            console.error('Could not find tile to move:', { tileId, instanceId, source: this.dragSource });
            return;
        }

        // Track if tile is being added to board (for glow effect)
        const toBoard = target.type === 'run' || target.type === 'group';
        if (fromRack && toBoard) {
            // Use instanceId to avoid highlighting both copies of same tile
            this.newlyAddedTiles.add(tile.instanceId);
        }

        // Add tile to target
        if (target.type === 'rack') {
            this.gameState.addTileToRack(tile);
        } else if (target.type === 'run') {
            this.gameState.runs[target.index].push(tile);
            // Auto-sort runs by tile number
            this.gameState.runs[target.index].sort((a, b) => a.number - b.number);
        } else if (target.type === 'group') {
            this.gameState.groups[target.index].push(tile);
        }

        // Re-render
        this.render();
    }

    /**
     * Sort player's rack
     */
    sortPlayerRack(byNumber = false) {
        // Add sorting class for animation
        const rackEl = document.getElementById('player-rack');
        const tiles = Array.from(rackEl.querySelectorAll('.tile'));

        tiles.forEach(tile => tile.classList.add('sorting'));

        this.gameState.sortRack(this.gameState.playerRack, byNumber);

        setTimeout(() => {
            this.renderPlayerRack();
        }, 100);
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
    async drawCard(autoEndTurn = true) {
        // Animate draw button
        AnimationHelper.animateDrawTile();

        const tile = this.gameState.drawTile('player');
        if (tile) {
            this.gameState.playerDrewThisTurn = true;
            this.render();

            if (autoEndTurn) {
                this.showMessage(`Drew: ${tile.color} ${tile.number} - Turn ending...`, 'success');
                // Automatically end turn after drawing
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.endTurn();
            } else {
                this.showMessage(`Drew: ${tile.color} ${tile.number}`, 'success');
            }
        } else {
            this.showMessage('Pouch is empty!', 'error');
            AnimationHelper.shakeElement(document.getElementById('draw-btn'));
        }
    }

    /**
     * End player turn
     */
    async endTurn() {
        const result = this.gameState.endPlayerTurn();

        if (!result.success) {
            this.showMessage(result.message, 'error');
            AnimationHelper.shakeElement(document.getElementById('player-rack'));
            return;
        }

        // Clear newly added tiles glow when turn ends
        this.newlyAddedTiles.clear();

        if (result.winner === 'player') {
            this.showWinScreen('player');
            return;
        }

        // Turn transition effect
        AnimationHelper.turnTransition();
        AnimationHelper.setActivePlayer(false); // Computer's turn

        // Computer's turn
        AnimationHelper.showAIThinking();
        this.showMessage('Computer is thinking...', 'info');

        // Capture state before AI move
        const beforeState = this.captureGameState();

        const computerResult = await this.gameState.computerTurn();

        AnimationHelper.hideAIThinking();

        // Animate the AI's move if it played tiles
        if (computerResult.action !== 'draw' && computerResult.tilesPlayed > 0) {
            await this.animateAIMove(beforeState, computerResult);
        } else {
            // Just render immediately for draws
            this.render();
        }

        // Show what computer did
        this.showComputerAction(computerResult);

        if (this.gameState.winner === 'computer') {
            this.showWinScreen('computer');
            return;
        }

        // Player's turn again
        AnimationHelper.setActivePlayer(true);
    }

    /**
     * Capture current game state for comparison
     */
    captureGameState() {
        return {
            computerRackSize: this.gameState.computerRack.length,
            runs: this.gameState.runs.map(run => run.map(t => ({ id: t.id, instanceId: t.instanceId }))),
            groups: this.gameState.groups.map(group => group.map(t => ({ id: t.id, instanceId: t.instanceId })))
        };
    }

    /**
     * Animate AI move by comparing before/after states
     */
    async animateAIMove(beforeState, moveResult) {
        // Step 1: Animate tiles leaving computer's rack (one at a time)
        const tilesRemoved = beforeState.computerRackSize - this.gameState.computerRack.length;
        if (tilesRemoved > 0) {
            await this.animateTilesLeavingComputerRack(tilesRemoved);
        }

        // Step 2: For rebuilds, show table being cleared
        if (moveResult.action === 'totalRebuild') {
            await this.animateTableClear();
        }

        // Step 3: Render new state but with tiles invisible (preparing for appearance animation)
        this.render();

        // Step 4: Animate new tiles appearing on table (one at a time)
        await this.animateNewTilesAppearing(beforeState);
    }

    /**
     * Animate tiles leaving computer's rack one at a time
     */
    async animateTilesLeavingComputerRack(count) {
        const computerRack = document.getElementById('computer-rack');
        const tileBacks = Array.from(computerRack.querySelectorAll('.tile-back'));

        // Animate tiles one at a time
        for (let i = 0; i < Math.min(count, tileBacks.length); i++) {
            const tileBack = tileBacks[i];
            tileBack.classList.add('ai-moving');

            await new Promise(resolve => setTimeout(resolve, 200));

            tileBack.classList.add('removing');

            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }

    /**
     * Animate table being cleared for rebuild
     */
    async animateTableClear() {
        const allTableTiles = [
            ...document.querySelectorAll('#runs-area .tile'),
            ...document.querySelectorAll('#groups-area .tile')
        ];

        // Quick flash to show table is being cleared
        allTableTiles.forEach(tile => {
            tile.classList.add('rearranging');
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        allTableTiles.forEach(tile => {
            tile.classList.remove('rearranging');
        });

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Animate new tiles appearing on table one at a time
     */
    async animateNewTilesAppearing(beforeState) {
        // Find all new tiles on the table
        const newTiles = this.findNewTilesOnTable(beforeState);

        // Also find tiles that moved positions (for rearrangements)
        const movedTiles = this.findMovedTilesOnTable(beforeState);

        // First, highlight tiles that moved position (quick flash)
        if (movedTiles.length > 0) {
            for (const tileInfo of movedTiles) {
                const tileElement = this.findTileElement(tileInfo.location, tileInfo.index, tileInfo.tileIndex);
                if (tileElement) {
                    tileElement.classList.add('rearranging');
                }
            }

            await new Promise(resolve => setTimeout(resolve, 400));

            // Remove highlight
            movedTiles.forEach(tileInfo => {
                const tileElement = this.findTileElement(tileInfo.location, tileInfo.index, tileInfo.tileIndex);
                if (tileElement) {
                    tileElement.classList.remove('rearranging');
                }
            });

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Then animate each new tile appearing one at a time
        for (const tileInfo of newTiles) {
            const tileElement = this.findTileElement(tileInfo.location, tileInfo.index, tileInfo.tileIndex);

            if (tileElement) {
                // Start invisible
                tileElement.style.opacity = '0';

                // Trigger reflow
                tileElement.offsetHeight;

                // Add appearing animation
                tileElement.classList.add('appearing');
                tileElement.style.opacity = '1';

                // Wait for this tile to finish appearing before moving to next
                await new Promise(resolve => setTimeout(resolve, 300));

                tileElement.classList.remove('appearing');
            }
        }
    }

    /**
     * Find tiles that are new on the table
     */
    findNewTilesOnTable(beforeState) {
        const newTiles = [];

        // Check runs
        this.gameState.runs.forEach((run, runIndex) => {
            const beforeRun = beforeState.runs[runIndex] || [];
            run.forEach((tile, tileIndex) => {
                const existedBefore = beforeRun.some(bt => bt.instanceId === tile.instanceId);
                if (!existedBefore) {
                    newTiles.push({
                        location: 'run',
                        index: runIndex,
                        tileIndex: tileIndex,
                        instanceId: tile.instanceId
                    });
                }
            });
        });

        // Check groups
        this.gameState.groups.forEach((group, groupIndex) => {
            const beforeGroup = beforeState.groups[groupIndex] || [];
            group.forEach((tile, tileIndex) => {
                const existedBefore = beforeGroup.some(bt => bt.instanceId === tile.instanceId);
                if (!existedBefore) {
                    newTiles.push({
                        location: 'group',
                        index: groupIndex,
                        tileIndex: tileIndex,
                        instanceId: tile.instanceId
                    });
                }
            });
        });

        return newTiles;
    }

    /**
     * Find tiles that moved positions on the table (for rearrangements)
     */
    findMovedTilesOnTable(beforeState) {
        const movedTiles = [];

        // Check runs for tiles that existed before but in different positions
        this.gameState.runs.forEach((run, runIndex) => {
            run.forEach((tile, tileIndex) => {
                // Was this tile on the table before?
                let foundInBefore = false;
                beforeState.runs.forEach((beforeRun, beforeRunIndex) => {
                    const tileIndexInBefore = beforeRun.findIndex(bt => bt.instanceId === tile.instanceId);
                    if (tileIndexInBefore !== -1) {
                        foundInBefore = true;
                        // Did it move?
                        if (beforeRunIndex !== runIndex || tileIndexInBefore !== tileIndex) {
                            movedTiles.push({
                                location: 'run',
                                index: runIndex,
                                tileIndex: tileIndex,
                                instanceId: tile.instanceId
                            });
                        }
                    }
                });

                // Also check if it was in groups before
                if (!foundInBefore) {
                    beforeState.groups.forEach((beforeGroup) => {
                        if (beforeGroup.some(bt => bt.instanceId === tile.instanceId)) {
                            movedTiles.push({
                                location: 'run',
                                index: runIndex,
                                tileIndex: tileIndex,
                                instanceId: tile.instanceId
                            });
                        }
                    });
                }
            });
        });

        // Check groups for tiles that existed before but in different positions
        this.gameState.groups.forEach((group, groupIndex) => {
            group.forEach((tile, tileIndex) => {
                let foundInBefore = false;
                beforeState.groups.forEach((beforeGroup, beforeGroupIndex) => {
                    const tileIndexInBefore = beforeGroup.findIndex(bt => bt.instanceId === tile.instanceId);
                    if (tileIndexInBefore !== -1) {
                        foundInBefore = true;
                        if (beforeGroupIndex !== groupIndex || tileIndexInBefore !== tileIndex) {
                            movedTiles.push({
                                location: 'group',
                                index: groupIndex,
                                tileIndex: tileIndex,
                                instanceId: tile.instanceId
                            });
                        }
                    }
                });

                // Also check if it was in runs before
                if (!foundInBefore) {
                    beforeState.runs.forEach((beforeRun) => {
                        if (beforeRun.some(bt => bt.instanceId === tile.instanceId)) {
                            movedTiles.push({
                                location: 'group',
                                index: groupIndex,
                                tileIndex: tileIndex,
                                instanceId: tile.instanceId
                            });
                        }
                    });
                }
            });
        });

        return movedTiles;
    }

    /**
     * Find a tile element on the table by location and indices
     */
    findTileElement(location, setIndex, tileIndex) {
        if (location === 'run') {
            const runElement = document.querySelector(`#runs-area .run[data-run-index="${setIndex}"]`);
            if (runElement) {
                return runElement.children[tileIndex];
            }
        } else if (location === 'group') {
            const groupElement = document.querySelector(`#groups-area .group[data-group-index="${setIndex}"]`);
            if (groupElement) {
                return groupElement.children[tileIndex];
            }
        }
        return null;
    }

    /**
     * Show computer's action in a message below their rack
     */
    showComputerAction(result) {
        const messageEl = document.getElementById('computer-action-message');

        let message = '';
        if (result.action === 'draw') {
            message = '🎴 Computer drew a tile';
        } else if (result.action === 'totalRebuild') {
            message = `♻️ Computer rebuilt the table and played ${result.tilesPlayed} tile${result.tilesPlayed !== 1 ? 's' : ''} in ${result.setsPlayed} set${result.setsPlayed !== 1 ? 's' : ''}`;
        } else if (result.action === 'playMultiple') {
            message = `🎯 Computer played ${result.tilesPlayed} tile${result.tilesPlayed !== 1 ? 's' : ''} in ${result.setsPlayed} set${result.setsPlayed !== 1 ? 's' : ''}`;
        } else if (result.action === 'play') {
            message = `🎯 Computer played ${result.tilesPlayed} tile${result.tilesPlayed !== 1 ? 's' : ''}`;
        } else if (result.action === 'manipulate') {
            message = `🔄 Computer rearranged tiles and played ${result.tilesPlayed} tile${result.tilesPlayed !== 1 ? 's' : ''}`;
        }

        messageEl.textContent = message;
        messageEl.classList.remove('hidden');

        // Auto-hide after a few seconds
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 4000);
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const stats = this.gameState.getStats();

        // Store previous values
        if (!this.previousStats) {
            this.previousStats = stats;
        }

        const playerCount = document.getElementById('player-count');
        const computerCount = document.getElementById('computer-count');
        const pouchCount = document.getElementById('pouch-count');

        // Animate if values changed
        if (stats.playerTileCount !== this.previousStats.playerTileCount) {
            playerCount.textContent = `x${stats.playerTileCount}`;
            AnimationHelper.animateCountChange(playerCount);
        } else {
            playerCount.textContent = `x${stats.playerTileCount}`;
        }

        if (stats.computerTileCount !== this.previousStats.computerTileCount) {
            computerCount.textContent = `x${stats.computerTileCount}`;
            AnimationHelper.animateCountChange(computerCount);
        } else {
            computerCount.textContent = `x${stats.computerTileCount}`;
        }

        if (stats.pouchCount !== this.previousStats.pouchCount) {
            pouchCount.textContent = `x${stats.pouchCount}`;
            AnimationHelper.animateCountChange(pouchCount);
        } else {
            pouchCount.textContent = `x${stats.pouchCount}`;
        }

        this.previousStats = stats;
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
            // Celebrate player win
            AnimationHelper.celebrateWin(true);
        } else {
            winnerText.textContent = 'Computer Wins!';
        }

        winScreen.classList.remove('hidden');

        // Clear active player indicators
        AnimationHelper.clearActivePlayer();

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
