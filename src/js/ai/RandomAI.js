import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * Random AI - plays the first valid set it finds
 * This is the original/basic AI strategy
 */
export class RandomAI extends AIPlayer {
    constructor() {
        super('Random AI', 'Plays the first valid set found, otherwise draws');
    }

    /**
     * Make a move by playing ALL possible sets this turn
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

            // Play first valid set
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
