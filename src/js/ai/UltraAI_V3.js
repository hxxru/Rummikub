import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * UltraAI V3 - Smart Rebuild
 * Only attempts complete rebuild when conditions are favorable
 * More efficient - avoids expensive complete rebuild when unlikely to succeed
 */
export class UltraAI_V3 extends AIPlayer {
    constructor() {
        super('UltraAI V3', 'Efficient multi-set manipulation with smart rebuild heuristics');
    }

    async makeMove(gameState) {
        await this.delay(1000);

        const requirement = gameState.initialMeldRequirement || 30;
        let rack = [...gameState.computerRack];

        if (gameState.computerHasMelded) {
            const manipulation = this.findBestMultiSetManipulation(gameState, rack);
            if (manipulation) {
                return manipulation;
            }
        }

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

    findBestMultiSetManipulation(gameState, rack) {
        const allTableTiles = [
            ...gameState.runs.flat(),
            ...gameState.groups.flat()
        ];

        if (allTableTiles.length === 0) {
            return null;
        }

        // SMART HEURISTIC: Only try complete rebuild when conditions are favorable
        const shouldTryCompleteRebuild = this.evaluateRebuildConditions(rack, allTableTiles);

        if (shouldTryCompleteRebuild) {
            // Try complete rebuild first when conditions are good
            const result = this.tryCompleteRebuild(gameState, rack, allTableTiles);
            if (result) return result;
        }

        // Try cheaper strategies first
        const multiRunResult = this.tryMultipleRunManipulation(gameState, rack);
        if (multiRunResult) return multiRunResult;

        const multiGroupResult = this.tryMultipleGroupManipulation(gameState, rack);
        if (multiGroupResult) return multiGroupResult;

        const singleResult = this.trySingleSetManipulations(gameState, rack);
        if (singleResult) return singleResult;

        // Last resort: try complete rebuild even if conditions aren't ideal
        if (!shouldTryCompleteRebuild) {
            const result = this.tryCompleteRebuild(gameState, rack, allTableTiles);
            if (result) return result;
        }

        return null;
    }

    /**
     * NEW: Evaluate if complete rebuild is likely to succeed
     */
    evaluateRebuildConditions(rack, allTableTiles) {
        const handSize = rack.length;
        const tableSize = allTableTiles.length;
        const totalTiles = handSize + tableSize;

        // Good conditions for rebuild:
        // 1. Small hand (< 8 tiles) - easier to place all tiles
        // 2. Large table (> 15 tiles) - more material to work with
        // 3. Good ratio (table tiles > hand tiles * 2)

        if (handSize <= 6) return true; // Small hand - always try
        if (tableSize >= 20) return true; // Large table - lots of options
        if (tableSize >= handSize * 2) return true; // Favorable ratio
        if (handSize <= 8 && tableSize >= 12) return true; // Both conditions decent

        return false; // Skip expensive rebuild otherwise
    }

    tryCompleteRebuild(gameState, rack, allTableTiles) {
        const allTiles = [...rack, ...allTableTiles];
        const newSets = [];
        const usedTiles = new Set();

        // Build groups first
        const byNumber = {};
        allTiles.forEach(tile => {
            if (!byNumber[tile.number]) byNumber[tile.number] = [];
            byNumber[tile.number].push(tile);
        });

        Object.values(byNumber).forEach(tiles => {
            if (tiles.length >= 3) {
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

        // Build runs
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

        const handTilesPlayed = newSets.reduce((count, set) =>
            count + set.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        if (handTilesPlayed >= 1) {
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

    tryMultipleRunManipulation(gameState, rack) {
        const runs = gameState.runs.filter(r => r.length >= 3);
        if (runs.length < 2) return null;

        for (let i = 0; i < runs.length; i++) {
            for (let j = i + 1; j < runs.length; j++) {
                const result = this.tryRearrangeTwoRuns(runs[i], runs[j], rack);
                if (result) return result;
            }
        }

        return null;
    }

    tryRearrangeTwoRuns(run1, run2, rack) {
        const allTiles = [...run1, ...run2, ...rack];
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

        const handTilesPlayed = newRuns.reduce((count, run) =>
            count + run.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        if (handTilesPlayed >= 1 && newRuns.length >= 2) {
            return {
                action: 'multiSetRearrange',
                newSets: newRuns
            };
        }

        return null;
    }

    tryMultipleGroupManipulation(gameState, rack) {
        const groups = gameState.groups.filter(g => g.length >= 3);
        if (groups.length < 2) return null;

        for (let i = 0; i < groups.length; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const result = this.tryRearrangeTwoGroups(groups[i], groups[j], rack);
                if (result) return result;
            }
        }

        return null;
    }

    tryRearrangeTwoGroups(group1, group2, rack) {
        const allTiles = [...group1, ...group2, ...rack];
        const byNumber = {};

        allTiles.forEach(tile => {
            if (!byNumber[tile.number]) byNumber[tile.number] = [];
            byNumber[tile.number].push(tile);
        });

        const newGroups = [];
        Object.values(byNumber).forEach(tiles => {
            const uniqueColors = [];
            const seenColors = new Set();

            for (const tile of tiles) {
                if (!seenColors.has(tile.color)) {
                    uniqueColors.push(tile);
                    seenColors.add(tile.color);
                }
            }

            if (uniqueColors.length >= 3) {
                newGroups.push(uniqueColors.slice(0, Math.min(4, uniqueColors.length)));
            }
        });

        const handTilesPlayed = newGroups.reduce((count, group) =>
            count + group.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
        );

        if (handTilesPlayed >= 1 && newGroups.length >= 2) {
            return {
                action: 'multiSetRearrange',
                newSets: newGroups
            };
        }

        return null;
    }

    trySingleSetManipulations(gameState, rack) {
        for (let i = 0; i < gameState.runs.length; i++) {
            const run = gameState.runs[i];
            if (run.length < 3) continue;

            for (const tile of rack) {
                if (tile.color === run[0].color) {
                    if (tile.number === run[0].number - 1 || tile.number === run[run.length - 1].number + 1) {
                        return {
                            action: 'playMultiple',
                            manipulations: [{
                                type: 'extendRun',
                                targetIndex: i,
                                tiles: [tile]
                            }]
                        };
                    }
                }
            }
        }

        return null;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
