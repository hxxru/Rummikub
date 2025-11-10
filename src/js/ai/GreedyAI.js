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
     * Make a move by playing the largest possible set
     */
    async makeMove(gameState) {
        // Add small delay to simulate thinking
        await this.delay(1000);

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

        // Sort by number of tiles (descending), then by value (descending) as tiebreaker
        validSets.sort((a, b) => {
            if (b.length !== a.length) {
                return b.length - a.length;
            }
            return RummikubRules.calculateValue(b) - RummikubRules.calculateValue(a);
        });

        // Play the set with most tiles
        const setToPlay = validSets[0];

        // Determine if it's a run or group
        const isRun = RummikubRules.isValidRun(setToPlay);
        const targetType = isRun ? 'run' : 'group';

        // Find first empty slot
        const slots = isRun ? gameState.runs : gameState.groups;
        const targetIndex = slots.findIndex(slot => slot.length === 0);

        if (targetIndex === -1) {
            // No empty slots, draw instead
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
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
