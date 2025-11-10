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
     * Make a move using table manipulation and playing ALL possible sets
     */
    async makeMove(gameState) {
        // Add small delay to simulate thinking
        await this.delay(1000);

        const setsToPlay = [];
        const manipulations = [];
        let remainingRack = [...gameState.computerRack];
        const requirement = gameState.initialMeldRequirement || 30;

        // If already melded, try table manipulations first
        if (gameState.computerHasMelded) {
            // Try extending runs and adding to groups
            for (let i = 0; i < gameState.runs.length; i++) {
                const run = gameState.runs[i];
                if (run.length === 0) continue;

                const extension = this.canExtendRun(run, remainingRack);
                if (extension) {
                    manipulations.push({
                        type: 'extendRun',
                        targetIndex: i,
                        tiles: extension
                    });
                    // Remove tiles from remaining rack
                    extension.forEach(tile => {
                        const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
                        if (index !== -1) {
                            remainingRack.splice(index, 1);
                        }
                    });
                }
            }

            for (let i = 0; i < gameState.groups.length; i++) {
                const group = gameState.groups[i];
                if (group.length === 0 || group.length >= 4) continue;

                const addition = this.canAddToGroup(group, remainingRack);
                if (addition) {
                    manipulations.push({
                        type: 'addToGroup',
                        targetIndex: i,
                        tiles: [addition]
                    });
                    const index = remainingRack.findIndex(t => t.instanceId === addition.instanceId);
                    if (index !== -1) {
                        remainingRack.splice(index, 1);
                    }
                }
            }
        }

        // Play ALL regular sets from remaining rack
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(remainingRack);

            let validSets = possibleSets;
            if (!gameState.computerHasMelded && setsToPlay.length === 0 && manipulations.length === 0) {
                validSets = possibleSets.filter(set =>
                    RummikubRules.calculateValue(set) >= requirement
                );
            }

            if (validSets.length === 0) break;

            // Sort by number of tiles
            validSets.sort((a, b) => b.length - a.length);

            const setToPlay = validSets[0];
            setsToPlay.push(setToPlay);

            setToPlay.forEach(tile => {
                const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    remainingRack.splice(index, 1);
                }
            });
        }

        // Return combined manipulations and new sets
        if (manipulations.length > 0 || setsToPlay.length > 0) {
            return {
                action: 'playMultiple',
                sets: setsToPlay,
                manipulations: manipulations
            };
        }

        return { action: 'draw' };
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
