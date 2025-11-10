import { AIPlayer } from './AIPlayer.js';
import { RummikubRules } from '../RummikubRules.js';

/**
 * Value AI - maximizes points played per turn
 * Plays the highest value set to minimize penalty if opponent wins
 */
export class ValueAI extends AIPlayer {
    constructor() {
        super('Value AI', 'Plays the highest value set to reduce penalty on loss');
    }

    /**
     * Make a move by playing ALL possible sets, prioritizing highest value first
     */
    async makeMove(gameState) {
        // Add small delay to simulate thinking
        await this.delay(1000);

        const setsToPlay = [];
        let remainingRack = [...gameState.computerRack];
        const requirement = gameState.initialMeldRequirement || 30;

        // Keep finding and playing sets until we can't anymore
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(remainingRack);
            if (possibleSets.length === 0) break;

            // Sort by value (descending) - value strategy
            possibleSets.sort((a, b) => {
                const valueA = RummikubRules.calculateValue(a);
                const valueB = RummikubRules.calculateValue(b);
                if (valueB !== valueA) {
                    return valueB - valueA;
                }
                return b.length - a.length;
            });

            // Play highest value set
            const setToPlay = possibleSets[0];
            setsToPlay.push(setToPlay);

            // Remove tiles from remaining rack
            setToPlay.forEach(tile => {
                const index = remainingRack.findIndex(t => t.instanceId === tile.instanceId);
                if (index !== -1) {
                    remainingRack.splice(index, 1);
                }
            });
        }

        // Check if we can play these sets
        if (setsToPlay.length > 0) {
            // If haven't melded yet, check if total value meets requirement
            if (!gameState.computerHasMelded) {
                const totalValue = setsToPlay.reduce((sum, set) =>
                    sum + RummikubRules.calculateValue(set), 0
                );

                if (totalValue < requirement) {
                    // Not enough points to meld, draw instead
                    return { action: 'draw' };
                }
            }

            // Either already melded, or have enough points to meld
            return {
                action: 'playMultiple',
                sets: setsToPlay
            };
        }

        // No valid sets found, draw a card
        return { action: 'draw' };
    }

    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
