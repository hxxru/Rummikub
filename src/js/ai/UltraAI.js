import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * Ultra AI - Uses exhaustive multi-set manipulation
 * Can rearrange multiple table sets simultaneously to maximize plays
 */
export class UltraAI extends AIPlayer {
    constructor() {
        super('Ultra AI', 'Uses exhaustive multi-set rearrangement for optimal plays');
    }

    async makeMove(gameState) {
        await this.delay(1000);

        const requirement = gameState.initialMeldRequirement || 30;
        let rack = [...gameState.computerRack];

        // If already melded, try multi-set manipulation
        if (gameState.computerHasMelded) {
            const manipulation = this.findBestMultiSetManipulation(gameState, rack);
            if (manipulation) {
                return manipulation;
            }
        }

        // Fall back to standard play
        const setsToPlay = [];
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(rack);
            if (possibleSets.length === 0) break;

            possibleSets.sort((a, b) => {
                if (b.length !== a.length) return b.length - a.length;
                return RummikubRules.calculateValue(b) - RummikubRules.calculateValue(a);
            });

            const setToPlay = possibleSets[0];
            setsToPlay.push(setToPlay);

            setToPlay.forEach(tile => {
                const index = rack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    rack.splice(index, 1);
                }
            });
        }

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
     * Find the best multi-set manipulation by trying combinations
     */
    findBestMultiSetManipulation(gameState, rack) {
        // Collect all table tiles
        const allTableTiles = [
            ...gameState.runs.flat(),
            ...gameState.groups.flat()
        ];

        if (allTableTiles.length === 0) {
            return null;
        }

        // Strategy 1: Try taking tiles from ALL table sets and rebuilding
        const result = this.tryCompleteRebuild(gameState, rack, allTableTiles);
        if (result) return result;

        // Strategy 2: Try taking from multiple runs
        const multiRunResult = this.tryMultipleRunManipulation(gameState, rack);
        if (multiRunResult) return multiRunResult;

        // Strategy 3: Try taking from multiple groups
        const multiGroupResult = this.tryMultipleGroupManipulation(gameState, rack);
        if (multiGroupResult) return multiGroupResult;

        // Strategy 4: Single-set manipulations (fallback)
        const singleResult = this.trySingleSetManipulations(gameState, rack);
        if (singleResult) return singleResult;

        return null;
    }

    /**
     * Try taking tiles from ALL table sets and completely rebuilding
     * This is the most aggressive strategy
     */
    tryCompleteRebuild(gameState, rack, allTableTiles) {
        // Combine all tiles (hand + table)
        const allTiles = [...rack, ...allTableTiles];

        // Try to build as many sets as possible
        const newSets = [];
        const usedTiles = new Set();

        // First, try to form groups by number
        const byNumber = {};
        allTiles.forEach(tile => {
            if (!byNumber[tile.number]) byNumber[tile.number] = [];
            byNumber[tile.number].push(tile);
        });

        Object.values(byNumber).forEach(tiles => {
            if (tiles.length >= 3) {
                // Try to make groups
                const uniqueColors = [];
                const seenColors = new Set();

                for (const tile of tiles) {
                    if (!seenColors.has(tile.color) && !usedTiles.has(tile.instanceId)) {
                        uniqueColors.push(tile);
                        seenColors.add(tile.color);
                    }
                }

                if (uniqueColors.length >= 3) {
                    const group = uniqueColors.slice(0, Math.min(4, uniqueColors.length));
                    if (RummikubRules.isValidGroup(group)) {
                        newSets.push(group);
                        group.forEach(t => usedTiles.add(t.instanceId));
                    }
                }
            }
        });

        // Then, try to form runs by color
        const byColor = {};
        allTiles.forEach(tile => {
            if (usedTiles.has(tile.instanceId)) return;
            if (!byColor[tile.color]) byColor[tile.color] = [];
            byColor[tile.color].push(tile);
        });

        Object.values(byColor).forEach(tiles => {
            tiles.sort((a, b) => a.number - b.number);

            let i = 0;
            while (i < tiles.length) {
                const run = [tiles[i]];
                let j = i + 1;

                while (j < tiles.length && tiles[j].number === run[run.length - 1].number + 1) {
                    run.push(tiles[j]);
                    j++;
                }

                if (run.length >= 3) {
                    newSets.push(run);
                    run.forEach(t => usedTiles.add(t.instanceId));
                }

                i = j > i + 1 ? j : i + 1;
            }
        });

        // Check if this arrangement plays more tiles from hand than current
        const handTilesPlayed = newSets.reduce((count, set) =>
            count + set.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        // Only use this if we play at least 1 hand tile
        if (handTilesPlayed >= 1) {
            // Check if all new sets are valid
            const allValid = newSets.every(set =>
                RummikubRules.isValidRun(set) || RummikubRules.isValidGroup(set)
            );

            if (allValid && newSets.length > 0) {
                return {
                    action: 'totalRebuild',
                    newSets: newSets
                };
            }
        }

        return null;
    }

    /**
     * Try taking from 2-3 runs and rearranging
     */
    tryMultipleRunManipulation(gameState, rack) {
        const runs = gameState.runs.filter(r => r.length >= 3);
        if (runs.length < 2) return null;

        // Try pairs of runs
        for (let i = 0; i < runs.length; i++) {
            for (let j = i + 1; j < runs.length; j++) {
                const result = this.tryRearrangeTwoRuns(runs[i], runs[j], rack, i, j);
                if (result) return result;
            }
        }

        return null;
    }

    /**
     * Try rearranging two runs with hand tiles
     */
    tryRearrangeTwoRuns(run1, run2, rack, idx1, idx2) {
        // Combine all tiles
        const allTiles = [...run1, ...run2, ...rack];

        // Group by color and try to make new runs
        const byColor = {};
        allTiles.forEach(tile => {
            if (!byColor[tile.color]) byColor[tile.color] = [];
            byColor[tile.color].push(tile);
        });

        const newRuns = [];
        Object.values(byColor).forEach(tiles => {
            tiles.sort((a, b) => a.number - b.number);

            let currentRun = [];
            for (let i = 0; i < tiles.length; i++) {
                if (currentRun.length === 0 || tiles[i].number === currentRun[currentRun.length - 1].number + 1) {
                    currentRun.push(tiles[i]);
                } else {
                    if (currentRun.length >= 3) {
                        newRuns.push([...currentRun]);
                    }
                    currentRun = [tiles[i]];
                }
            }
            if (currentRun.length >= 3) {
                newRuns.push(currentRun);
            }
        });

        // Check if we play more hand tiles
        const handTilesPlayed = newRuns.reduce((count, run) =>
            count + run.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        if (handTilesPlayed >= 1 && newRuns.length >= 2) {
            return {
                action: 'multiSetRearrange',
                operations: [
                    { type: 'clearRuns', indices: [idx1, idx2] },
                    { type: 'addNewSets', sets: newRuns }
                ]
            };
        }

        return null;
    }

    /**
     * Try taking from multiple groups
     */
    tryMultipleGroupManipulation(gameState, rack) {
        const groups = gameState.groups.filter(g => g.length >= 3);
        if (groups.length < 2) return null;

        // Try pairs of groups
        for (let i = 0; i < groups.length; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const result = this.tryRearrangeTwoGroups(groups[i], groups[j], rack, i, j);
                if (result) return result;
            }
        }

        return null;
    }

    /**
     * Try rearranging two groups with hand tiles
     */
    tryRearrangeTwoGroups(group1, group2, rack, idx1, idx2) {
        // If groups are same number, just extend
        if (group1[0].number === group2[0].number) {
            const combined = [...group1, ...group2];
            const uniqueByColor = [];
            const seenColors = new Set();

            for (const tile of combined) {
                if (!seenColors.has(tile.color)) {
                    uniqueByColor.push(tile);
                    seenColors.add(tile.color);
                }
            }

            if (uniqueByColor.length >= 3 && uniqueByColor.length <= 4) {
                return {
                    action: 'multiSetRearrange',
                    operations: [
                        { type: 'clearGroups', indices: [idx1, idx2] },
                        { type: 'addNewSets', sets: [uniqueByColor] }
                    ]
                };
            }
        }

        // Try breaking both groups and forming new ones with hand
        const allTiles = [...group1, ...group2, ...rack];
        const byNumber = {};

        allTiles.forEach(tile => {
            if (!byNumber[tile.number]) byNumber[tile.number] = [];
            byNumber[tile.number].push(tile);
        });

        const newGroups = [];
        Object.values(byNumber).forEach(tiles => {
            const uniqueByColor = [];
            const seenColors = new Set();

            for (const tile of tiles) {
                if (!seenColors.has(tile.color)) {
                    uniqueByColor.push(tile);
                    seenColors.add(tile.color);
                }
            }

            if (uniqueByColor.length >= 3) {
                const group = uniqueByColor.slice(0, Math.min(4, uniqueByColor.length));
                newGroups.push(group);
            }
        });

        const handTilesPlayed = newGroups.reduce((count, group) =>
            count + group.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        if (handTilesPlayed >= 1 && newGroups.length >= 1) {
            return {
                action: 'multiSetRearrange',
                operations: [
                    { type: 'clearGroups', indices: [idx1, idx2] },
                    { type: 'addNewSets', sets: newGroups }
                ]
            };
        }

        return null;
    }

    /**
     * Single-set manipulations (existing behavior)
     */
    trySingleSetManipulations(gameState, rack) {
        // Try extending runs
        for (let i = 0; i < gameState.runs.length; i++) {
            const run = gameState.runs[i];
            if (run.length === 0) continue;

            const extension = this.canExtendRun(run, rack);
            if (extension) {
                return {
                    action: 'playMultiple',
                    sets: [],
                    manipulations: [{
                        type: 'extendRun',
                        targetIndex: i,
                        tiles: extension
                    }]
                };
            }
        }

        // Try adding to groups
        for (let i = 0; i < gameState.groups.length; i++) {
            const group = gameState.groups[i];
            if (group.length === 0 || group.length >= 4) continue;

            const addition = this.canAddToGroup(group, rack);
            if (addition) {
                return {
                    action: 'playMultiple',
                    sets: [],
                    manipulations: [{
                        type: 'addToGroup',
                        targetIndex: i,
                        tiles: [addition]
                    }]
                };
            }
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
