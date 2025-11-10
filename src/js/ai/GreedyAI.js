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
        let remainingRack = [...gameState.computerRack];
        const requirement = gameState.initialMeldRequirement || 30;

        // Keep finding and playing sets until we can't anymore
        while (true) {
            const possibleSets = RummikubRules.findPossibleSets(remainingRack);
            if (possibleSets.length === 0) break;

            // Sort by number of tiles (descending) - greedy strategy
            possibleSets.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return RummikubRules.calculateValue(b) - RummikubRules.calculateValue(a);
            });

            // Play largest set
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
