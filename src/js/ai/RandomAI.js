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
     * Make a move by playing the first possible set
     */
    async makeMove(gameState) {
        // Add small delay to simulate thinking
        await this.delay(1000);

        let possibleSets = RummikubRules.findPossibleSets(gameState.computerRack);

        // Filter for initial meld requirement if needed
        if (!gameState.computerHasMelded) {
            const requirement = gameState.initialMeldRequirement || 30;
            possibleSets = possibleSets.filter(set =>
                RummikubRules.calculateValue(set) >= requirement
            );
        }

        // Check if we can play a set
        if (possibleSets.length > 0) {
            const setToPlay = possibleSets[0];

            // Determine if it's a run or group
            const isRun = RummikubRules.isValidRun(setToPlay);
            const targetType = isRun ? 'run' : 'group';

            // Find first empty slot
            const slots = isRun ? gameState.runs : gameState.groups;
            const targetIndex = slots.findIndex(slot => slot.length === 0);

            if (targetIndex !== -1) {
                return {
                    action: 'play',
                    tiles: setToPlay,
                    targetType: targetType,
                    targetIndex: targetIndex
                };
            }
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
