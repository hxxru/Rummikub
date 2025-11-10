import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * UltraAI V4 - Hybrid Smart + Aggressive
 * Combines V3's smart rebuild conditions with V2's aggressive tile maximization
 */
export class UltraAI_V4 extends AIPlayer {
    constructor() {
        super('UltraAI V4', 'Hybrid: Smart rebuild + aggressive tile maximization');
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

        // AGGRESSIVE: Play as many tiles as possible
        const setsToPlay = [];
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(rack);
            if (possibleSets.length === 0) break;

            // Prioritize longest sets (more tiles played)
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

        // SMART: Use V3's condition evaluation
        const shouldTryCompleteRebuild = this.evaluateRebuildConditions(rack, allTableTiles);

        // Try all strategies, pick the one that plays MOST tiles (aggressive)
        const strategies = [];

        if (shouldTryCompleteRebuild) {
            strategies.push({
                name: 'rebuild',
                fn: () => this.tryCompleteRebuild(gameState, rack, allTableTiles)
            });
        }

        strategies.push(
            { name: 'multiRun', fn: () => this.tryMultipleRunManipulation(gameState, rack) },
            { name: 'multiGroup', fn: () => this.tryMultipleGroupManipulation(gameState, rack) },
            { name: 'single', fn: () => this.trySingleSetManipulations(gameState, rack) }
        );

        // AGGRESSIVE: Pick move that plays most tiles
        let bestMove = null;
        let mostTilesPlayed = 0;

        for (const strategy of strategies) {
            const result = strategy.fn();
            if (result) {
                const tilesPlayed = this.countHandTilesPlayed(result, rack);
                if (tilesPlayed > mostTilesPlayed) {
                    mostTilesPlayed = tilesPlayed;
                    bestMove = result;
                }
            }
        }

        // Last resort: try rebuild if not tried yet
        if (!bestMove && !shouldTryCompleteRebuild) {
            const result = this.tryCompleteRebuild(gameState, rack, allTableTiles);
            if (result) return result;
        }

        return bestMove;
    }

    countHandTilesPlayed(move, rack) {
        if (move.action === 'totalRebuild') {
            return move.newSets.reduce((count, set) =>
                count + set.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
            );
        }
        if (move.action === 'multiSetRearrange') {
            return move.newSets.reduce((count, set) =>
                count + set.filter(t => rack.find(r => r.instanceId === t.instanceId)).length, 0
            );
        }
        return 1;
    }

    evaluateRebuildConditions(rack, allTableTiles) {
        const handSize = rack.length;
        const tableSize = allTableTiles.length;

        // V3's heuristics
        if (handSize <= 6) return true;
        if (tableSize >= 20) return true;
        if (tableSize >= handSize * 2) return true;
        if (handSize <= 8 && tableSize >= 12) return true;

        return false;
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

                // AGGRESSIVE: Try to make largest groups possible
                while (uniqueColors.length >= 3) {
                    const group = uniqueColors.slice(0, Math.min(4, uniqueColors.length));
                    if (RummikubRules.isValidGroup(group)) {
                        newSets.push(group);
                        group.forEach(t => usedTiles.add(t.instanceId));
                        // Remove used tiles from uniqueColors
                        uniqueColors.splice(0, group.length);
                    } else {
                        break;
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
