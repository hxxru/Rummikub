/**
 * Base class for all AI players
 * Each AI strategy should extend this class and implement makeMove()
 */
export class AIPlayer {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.stats = {
            wins: 0,
            losses: 0,
            totalGames: 0,
            totalMoves: 0,
            totalTilesPlayed: 0,
            totalDraws: 0
        };
    }

    /**
     * Make a move based on current game state
     * Must be implemented by each AI strategy
     *
     * @param {GameState} gameState - Current game state
     * @returns {Object} Move object: { action: 'play'|'draw', tiles?: Tile[], targetType?: 'run'|'group', targetIndex?: number }
     */
    async makeMove(gameState) {
        throw new Error(`${this.name} must implement makeMove()`);
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            wins: 0,
            losses: 0,
            totalGames: 0,
            totalMoves: 0,
            totalTilesPlayed: 0,
            totalDraws: 0
        };
    }

    /**
     * Record a game result
     */
    recordGame(won) {
        this.stats.totalGames++;
        if (won) {
            this.stats.wins++;
        } else {
            this.stats.losses++;
        }
    }

    /**
     * Record a move
     */
    recordMove(tilesPlayed) {
        this.stats.totalMoves++;
        if (tilesPlayed > 0) {
            this.stats.totalTilesPlayed += tilesPlayed;
        } else {
            this.stats.totalDraws++;
        }
    }

    /**
     * Get win rate
     */
    getWinRate() {
        if (this.stats.totalGames === 0) return 0;
        return (this.stats.wins / this.stats.totalGames * 100).toFixed(1);
    }

    /**
     * Get average tiles played per move (excluding draws)
     */
    getAvgTilesPerMove() {
        const playMoves = this.stats.totalMoves - this.stats.totalDraws;
        if (playMoves === 0) return 0;
        return (this.stats.totalTilesPlayed / playMoves).toFixed(2);
    }

    /**
     * Get stats summary
     */
    getStatsSummary() {
        return {
            name: this.name,
            wins: this.stats.wins,
            losses: this.stats.losses,
            winRate: this.getWinRate(),
            avgTilesPerMove: this.getAvgTilesPerMove(),
            totalMoves: this.stats.totalMoves,
            totalDraws: this.stats.totalDraws
        };
    }

    /**
     * String representation
     */
    toString() {
        return `${this.name} (${this.description})`;
    }
}
