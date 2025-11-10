import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * Smart AI - manipulates table sets to play more tiles
 * Extends runs, adds to groups, and finds strategic plays
 */
export class SmartAI extends AIPlayer {
    constructor() {
        super('Smart AI', 'Manipulates table sets strategically to maximize plays');
    }

    /**
     * Make a move using table manipulation
     */
    async makeMove(gameState) {
        // Add small delay to simulate thinking
        await this.delay(1000);

        // Only manipulate table if we've already melded
        if (gameState.computerHasMelded) {
            // Try to find table manipulation opportunities
            const tableMove = this.findTableManipulation(gameState);
            if (tableMove) {
                return tableMove;
            }
        }

        // Fall back to normal play (like GreedyAI)
        const possibleSets = RummikubRules.findPossibleSets(gameState.computerRack);

        if (possibleSets.length === 0) {
            return { action: 'draw' };
        }

        // Filter sets that meet initial meld requirement if needed
        let validSets = possibleSets;
        if (!gameState.computerHasMelded) {
            validSets = possibleSets.filter(set =>
                RummikubRules.calculateValue(set) >= 30
            );
        }

        if (validSets.length === 0) {
            return { action: 'draw' };
        }

        // Sort by number of tiles (descending)
        validSets.sort((a, b) => b.length - a.length);

        // Play the largest set
        const setToPlay = validSets[0];

        // Determine if it's a run or group
        const isRun = RummikubRules.isValidRun(setToPlay);
        const targetType = isRun ? 'run' : 'group';

        // Find first empty slot
        const slots = isRun ? gameState.runs : gameState.groups;
        const targetIndex = slots.findIndex(slot => slot.length === 0);

        if (targetIndex === -1) {
            return { action: 'draw' };
        }

        return {
            action: 'play',
            tiles: setToPlay,
            targetType: targetType,
            targetIndex: targetIndex
        };
    }

    /**
     * Find opportunities to manipulate existing table sets
     */
    findTableManipulation(gameState) {
        const myRack = gameState.computerRack;

        // Try to extend runs
        for (let i = 0; i < gameState.runs.length; i++) {
            const run = gameState.runs[i];
            if (run.length === 0) continue;

            // Check if we can extend at either end
            const extension = this.canExtendRun(run, myRack);
            if (extension) {
                return {
                    action: 'manipulate',
                    manipulationType: 'extendRun',
                    targetIndex: i,
                    tilesToAdd: extension
                };
            }
        }

        // Try to add to groups
        for (let i = 0; i < gameState.groups.length; i++) {
            const group = gameState.groups[i];
            if (group.length === 0 || group.length >= 4) continue;

            // Check if we can add a tile to this group
            const addition = this.canAddToGroup(group, myRack);
            if (addition) {
                return {
                    action: 'manipulate',
                    manipulationType: 'addToGroup',
                    targetIndex: i,
                    tilesToAdd: [addition]
                };
            }
        }

        return null;
    }

    /**
     * Check if we can extend a run from either end
     */
    canExtendRun(run, rack) {
        if (run.length === 0) return null;

        const sorted = [...run].sort((a, b) => a.number - b.number);
        const color = sorted[0].color;
        const minNum = sorted[0].number;
        const maxNum = sorted[sorted.length - 1].number;

        const tilesCanAdd = [];

        // Try to add to beginning (minNum - 1)
        if (minNum > 1) {
            const beforeTile = rack.find(t => t.color === color && t.number === minNum - 1);
            if (beforeTile) {
                tilesCanAdd.push(beforeTile);
            }
        }

        // Try to add to end (maxNum + 1)
        if (maxNum < 13) {
            const afterTile = rack.find(t => t.color === color && t.number === maxNum + 1);
            if (afterTile) {
                tilesCanAdd.push(afterTile);
            }
        }

        return tilesCanAdd.length > 0 ? tilesCanAdd : null;
    }

    /**
     * Check if we can add a tile to a group
     */
    canAddToGroup(group, rack) {
        if (group.length === 0 || group.length >= 4) return null;

        const number = group[0].number;
        const existingColors = new Set(group.map(t => t.color));

        // Find a tile with same number but different color
        return rack.find(t =>
            t.number === number && !existingColors.has(t.color)
        );
    }

    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
