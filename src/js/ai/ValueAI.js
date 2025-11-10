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
     * Make a move by playing the highest value set
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
            const requirement = gameState.initialMeldRequirement || 30;
            validSets = possibleSets.filter(set =>
                RummikubRules.calculateValue(set) >= requirement
            );
        }

        if (validSets.length === 0) {
            return { action: 'draw' };
        }

        // Sort by value (descending), then by number of tiles (descending) as tiebreaker
        validSets.sort((a, b) => {
            const valueA = RummikubRules.calculateValue(a);
            const valueB = RummikubRules.calculateValue(b);
            if (valueB !== valueA) {
                return valueB - valueA;
            }
            return b.length - a.length;
        });

        // Play the highest value set
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
