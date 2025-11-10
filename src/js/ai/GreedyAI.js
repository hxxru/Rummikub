import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * Greedy AI - maximizes the number of tiles played per turn
 * Plays the largest valid set it can find
 */
export class GreedyAI extends AIPlayer {
    constructor() {
        super('Greedy AI', 'Plays the set with the most tiles to empty rack faster');
    }

    /**
     * Make a move by playing ALL possible sets, prioritizing largest first
     */
    async makeMove(gameState) {
        // Add small delay to simulate thinking
        await this.delay(1000);

        const setsToPlay = [];
        const remainingRack = [...gameState.computerRack];
        const requirement = gameState.initialMeldRequirement || 30;

        // Keep finding and playing sets until we can't anymore
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(remainingRack);

            // Filter for initial meld requirement if needed
            let validSets = possibleSets;
            if (!gameState.computerHasMelded && setsToPlay.length === 0) {
                validSets = possibleSets.filter(set =>
                    RummikubRules.calculateValue(set) >= requirement
                );
            }

            if (validSets.length === 0) break;

            // Sort by number of tiles (descending) - greedy strategy
            validSets.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return RummikubRules.calculateValue(b) - RummikubRules.calculateValue(a);
            });

            // Play largest set
            const setToPlay = validSets[0];
            setsToPlay.push(setToPlay);

            // Remove tiles from remaining rack
            setToPlay.forEach(tile => {
                const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    remainingRack.splice(index, 1);
                }
            });
        }

        // If we found sets to play, return them all
        if (setsToPlay.length > 0) {
            return {
                action: 'playMultiple',
                sets: setsToPlay
            };
        }

        // No valid play, draw a card
        return {
            action: 'draw'
        };
    }

    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
