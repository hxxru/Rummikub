import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * Advanced AI - Uses sophisticated table manipulation
 * Splits runs, steals from sets, and rearranges multiple sets simultaneously
 */
export class AdvancedAI extends AIPlayer {
    constructor() {
        super('Advanced AI', 'Uses advanced table manipulation to maximize tile plays');
    }

    /**
     * Make a move using advanced table manipulation
     */
    async makeMove(gameState) {
        await this.delay(1000);

        const requirement = gameState.initialMeldRequirement || 30;
        let remainingRack = [...gameState.computerRack];

        // If already melded, try aggressive table manipulation
        if (gameState.computerHasMelded) {
            const manipulation = this.findBestManipulation(gameState, remainingRack);
            if (manipulation) {
                return manipulation;
            }
        }

        // Fall back to standard play: collect all sets
        const setsToPlay = [];
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(remainingRack);
            if (possibleSets.length === 0) break;

            // Sort by length then value
            possibleSets.sort((a, b) => {
                if (b.length !== a.length) return b.length - a.length;
                return RummikubRules.calculateValue(b) - RummikubRules.calculateValue(a);
            });

            const setToPlay = possibleSets[0];
            setsToPlay.push(setToPlay);

            setToPlay.forEach(tile => {
                const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    remainingRack.splice(index, 1);
                }
            });
        }

        // Check if we can play
        if (setsToPlay.length > 0) {
            if (!gameState.computerHasMelded) {
                const totalValue = setsToPlay.reduce((sum, set) =>
                    sum + RummikubRules.calculateValue(set), 0
                );
                if (totalValue < requirement) {
                    return { action: 'draw' };
                }
            }

            return {
                action: 'playMultiple',
                sets: setsToPlay
            };
        }

        return { action: 'draw' };
    }

    /**
     * Find the best table manipulation opportunity
     * This is where the magic happens - we try to steal/split/rearrange table sets
     */
    findBestManipulation(gameState, rack) {
        const allTableTiles = [
            ...gameState.runs.flat(),
            ...gameState.groups.flat()
        ];

        // Strategy 1: Try stealing from runs
        const stealResult = this.tryStealFromRuns(gameState, rack);
        if (stealResult) return stealResult;

        // Strategy 2: Try stealing from groups
        const groupStealResult = this.tryStealFromGroups(gameState, rack);
        if (groupStealResult) return groupStealResult;

        // Strategy 3: Try splitting and reforming runs
        const splitResult = this.trySplitAndReform(gameState, rack);
        if (splitResult) return splitResult;

        // Strategy 4: Simple extensions (fallback)
        const extendResult = this.trySimpleExtensions(gameState, rack);
        if (extendResult) return extendResult;

        return null;
    }

    /**
     * Try to steal a tile from a run if we can form a new set
     * Example: Table has [3,4,5,6,7], hand has [6,7] from different color
     * -> Steal the 6 from table, leaving [3,4,5,7] (invalid!)
     * -> But if we have [3], we could take [3,4,5] and leave [6,7] + our [6,7] makes a group
     */
    tryStealFromRuns(gameState, rack) {
        for (let runIdx = 0; runIdx < gameState.runs.length; runIdx++) {
            const run = gameState.runs[runIdx];
            if (run.length < 4) continue; // Need at least 4 to split safely

            const sorted = [...run].sort((a, b) => a.number - b.number);
            const color = sorted[0].color;

            // Try stealing from the middle by splitting
            // Example: [3,4,5,6,7] -> steal 5, leave [3,4] + [6,7] if both valid
            for (let splitPos = 3; splitPos <= sorted.length - 3; splitPos++) {
                const left = sorted.slice(0, splitPos);
                const right = sorted.slice(splitPos);
                const stolen = sorted[splitPos - 1]; // Steal last tile of left part

                // Check if we can make a set with the stolen tile
                const rackWithStolen = [...rack, stolen];
                const possibleSets = RummikubRules.findPossibleSets(rackWithStolen);

                for (const newSet of possibleSets) {
                    // Check if this set uses the stolen tile
                    if (!newSet.find(t => t.instanceId === stolen.instanceId)) continue;

                    // Check if remaining parts are still valid
                    const leftWithoutStolen = left.slice(0, -1);
                    if (leftWithoutStolen.length >= 3 && RummikubRules.isValidRun(leftWithoutStolen) &&
                        right.length >= 3 && RummikubRules.isValidRun(right)) {

                        // Valid manipulation found!
                        return {
                            action: 'complexManipulation',
                            operations: [
                                { type: 'splitRun', runIndex: runIdx, left: leftWithoutStolen, right: right },
                                { type: 'playSet', set: newSet }
                            ]
                        };
                    }
                }
            }

            // Try stealing from ends
            if (sorted.length >= 4) {
                // Steal from start
                const stolen = sorted[0];
                const remaining = sorted.slice(1);
                if (remaining.length >= 3) {
                    const rackWithStolen = [...rack, stolen];
                    const possibleSets = RummikubRules.findPossibleSets(rackWithStolen);

                    for (const newSet of possibleSets) {
                        if (newSet.find(t => t.instanceId === stolen.instanceId)) {
                            return {
                                action: 'complexManipulation',
                                operations: [
                                    { type: 'modifyRun', runIndex: runIdx, newTiles: remaining },
                                    { type: 'playSet', set: newSet }
                                ]
                            };
                        }
                    }
                }

                // Steal from end
                const stolenEnd = sorted[sorted.length - 1];
                const remainingEnd = sorted.slice(0, -1);
                if (remainingEnd.length >= 3) {
                    const rackWithStolen = [...rack, stolenEnd];
                    const possibleSets = RummikubRules.findPossibleSets(rackWithStolen);

                    for (const newSet of possibleSets) {
                        if (newSet.find(t => t.instanceId === stolenEnd.instanceId)) {
                            return {
                                action: 'complexManipulation',
                                operations: [
                                    { type: 'modifyRun', runIndex: runIdx, newTiles: remainingEnd },
                                    { type: 'playSet', set: newSet }
                                ]
                            };
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Try to steal from a group (4-tile group can lose one and still be valid)
     */
    tryStealFromGroups(gameState, rack) {
        for (let groupIdx = 0; groupIdx < gameState.groups.length; groupIdx++) {
            const group = gameState.groups[groupIdx];
            if (group.length !== 4) continue; // Can only steal from 4-tile groups

            // Try stealing each tile
            for (let i = 0; i < group.length; i++) {
                const stolen = group[i];
                const remaining = group.filter((_, idx) => idx !== i);

                // Remaining should still be a valid group
                if (RummikubRules.isValidGroup(remaining)) {
                    const rackWithStolen = [...rack, stolen];
                    const possibleSets = RummikubRules.findPossibleSets(rackWithStolen);

                    for (const newSet of possibleSets) {
                        if (newSet.find(t => t.instanceId === stolen.instanceId)) {
                            return {
                                action: 'complexManipulation',
                                operations: [
                                    { type: 'modifyGroup', groupIndex: groupIdx, newTiles: remaining },
                                    { type: 'playSet', set: newSet }
                                ]
                            };
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Try to split a run and reform it with hand tiles
     * Example: Table [3,4,5,6], hand [6,7,8] (different colors)
     * -> Take the 6 from table, add 7,8 from hand -> new run [6,7,8]
     * -> Table left with [3,4,5] (still valid)
     */
    trySplitAndReform(gameState, rack) {
        for (let runIdx = 0; runIdx < gameState.runs.length; runIdx++) {
            const run = gameState.runs[runIdx];
            if (run.length < 4) continue;

            const sorted = [...run].sort((a, b) => a.number - b.number);

            // Try each split point
            for (let splitPoint = 3; splitPoint <= sorted.length - 3; splitPoint++) {
                const left = sorted.slice(0, splitPoint);
                const right = sorted.slice(splitPoint);

                // Try building from right part
                for (let takeFromRight = 1; takeFromRight <= right.length - 3; takeFromRight++) {
                    const taken = right.slice(0, takeFromRight);
                    const rightRemaining = right.slice(takeFromRight);

                    if (rightRemaining.length >= 3 && RummikubRules.isValidRun(rightRemaining)) {
                        const rackWithTaken = [...rack, ...taken];
                        const possibleSets = RummikubRules.findPossibleSets(rackWithTaken);

                        for (const newSet of possibleSets) {
                            // Check if this set uses the taken tiles
                            const usesTaken = taken.some(t =>
                                newSet.find(nt => nt.instanceId === t.instanceId)
                            );

                            if (usesTaken) {
                                return {
                                    action: 'complexManipulation',
                                    operations: [
                                        { type: 'splitRun', runIndex: runIdx, left: left, right: rightRemaining },
                                        { type: 'playSet', set: newSet }
                                    ]
                                };
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Simple extensions (existing SmartAI behavior)
     */
    trySimpleExtensions(gameState, rack) {
        const manipulations = [];

        // Try extending runs
        for (let i = 0; i < gameState.runs.length; i++) {
            const run = gameState.runs[i];
            if (run.length === 0) continue;

            const extension = this.canExtendRun(run, rack);
            if (extension) {
                manipulations.push({
                    type: 'extendRun',
                    targetIndex: i,
                    tiles: extension
                });

                extension.forEach(tile => {
                    const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                    if (index !== -1) {
                        rack.splice(index, 1);
                    }
                });
            }
        }

        // Try adding to groups
        for (let i = 0; i < gameState.groups.length; i++) {
            const group = gameState.groups[i];
            if (group.length === 0 || group.length >= 4) continue;

            const addition = this.canAddToGroup(group, rack);
            if (addition) {
                manipulations.push({
                    type: 'addToGroup',
                    targetIndex: i,
                    tiles: [addition]
                });

                const index = rack.findIndex(t => t.instanceId === addition.instanceId);
                if (index !== -1) {
                    rack.splice(index, 1);
                }
            }
        }

        if (manipulations.length > 0) {
            return {
                action: 'playMultiple',
                sets: [],
                manipulations: manipulations
            };
        }

        return null;
    }

    canExtendRun(run, rack) {
        if (run.length === 0) return null;

        const sorted = [...run].sort((a, b) => a.number - b.number);
        const color = sorted[0].color;
        const minNum = sorted[0].number;
        const maxNum = sorted[sorted.length - 1].number;

        const tilesCanAdd = [];

        if (minNum > 1) {
            const beforeTile = rack.find(t => t.color === color && t.number === minNum - 1);
            if (beforeTile) tilesCanAdd.push(beforeTile);
        }

        if (maxNum < 13) {
            const afterTile = rack.find(t => t.color === color && t.number === maxNum + 1);
            if (afterTile) tilesCanAdd.push(afterTile);
        }

        return tilesCanAdd.length > 0 ? tilesCanAdd : null;
    }

    canAddToGroup(group, rack) {
        if (group.length === 0 || group.length >= 4) return null;

        const number = group[0].number;
        const existingColors = new Set(group.map(t => t.color));

        return rack.find(t =>
            t.number === number && !existingColors.has(t.color)
        );
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
