/**
 * Validates Rummikub game rules
 */
export class RummikubRules {
    /**
     * Check if tiles form a valid run
     * Run = 3+ consecutive numbers of same color
     */
    static isValidRun(tiles) {
        if (!tiles || tiles.length < 3) return false;

        // Check all same color
        const firstColor = tiles[0].color;
        if (!tiles.every(tile => tile.color === firstColor)) {
            return false;
        }

        // Sort by number
        const sorted = [...tiles].sort((a, b) => a.number - b.number);

        // Check consecutive
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].number !== sorted[i - 1].number + 1) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if tiles form a valid group
     * Group = 3-4 same numbers of different colors
     */
    static isValidGroup(tiles) {
        if (!tiles || tiles.length < 3 || tiles.length > 4) return false;

        // Check all same number
        const firstNumber = tiles[0].number;
        if (!tiles.every(tile => tile.number === firstNumber)) {
            return false;
        }

        // Check all different colors
        const colors = new Set(tiles.map(tile => tile.color));
        if (colors.size !== tiles.length) {
            return false;
        }

        return true;
    }

    /**
     * Check if tiles form a valid set (run or group)
     */
    static isValidSet(tiles) {
        return this.isValidRun(tiles) || this.isValidGroup(tiles);
    }

    /**
     * Calculate total value of tiles
     */
    static calculateValue(tiles) {
        return tiles.reduce((sum, tile) => sum + tile.getValue(), 0);
    }

    /**
     * Check if initial meld is valid (30+ points)
     */
    static isValidInitialMeld(sets) {
        const totalValue = sets.reduce((sum, set) => {
            return sum + this.calculateValue(set);
        }, 0);
        return totalValue >= 30;
    }

    /**
     * Find all valid sets a player can make from their tiles
     */
    static findPossibleSets(tiles) {
        const sets = [];

        // Try to find runs
        const byColor = {};
        tiles.forEach(tile => {
            if (!byColor[tile.color]) byColor[tile.color] = [];
            byColor[tile.color].push(tile);
        });

        Object.values(byColor).forEach(colorTiles => {
            const sorted = colorTiles.sort((a, b) => a.number - b.number);
            for (let i = 0; i < sorted.length - 2; i++) {
                for (let j = i + 3; j <= sorted.length; j++) {
                    const potential = sorted.slice(i, j);
                    if (this.isValidRun(potential)) {
                        sets.push(potential);
                    }
                }
            }
        });

        // Try to find groups
        const byNumber = {};
        tiles.forEach(tile => {
            if (!byNumber[tile.number]) byNumber[tile.number] = [];
            byNumber[tile.number].push(tile);
        });

        Object.values(byNumber).forEach(numberTiles => {
            if (numberTiles.length >= 3) {
                // Try all combinations of 3-4 tiles
                for (let size = 3; size <= Math.min(4, numberTiles.length); size++) {
                    const combinations = this._getCombinations(numberTiles, size);
                    combinations.forEach(combo => {
                        if (this.isValidGroup(combo)) {
                            sets.push(combo);
                        }
                    });
                }
            }
        });

        return sets;
    }

    /**
     * Helper: Get all combinations of size k from array
     */
    static _getCombinations(array, k) {
        if (k === 1) return array.map(item => [item]);

        const combinations = [];
        for (let i = 0; i <= array.length - k; i++) {
            const head = array[i];
            const tailCombs = this._getCombinations(array.slice(i + 1), k - 1);
            tailCombs.forEach(tailComb => {
                combinations.push([head, ...tailComb]);
            });
        }
        return combinations;
    }
}
