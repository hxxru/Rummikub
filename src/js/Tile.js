/**
 * Represents a single Rummikub tile
 */
export class Tile {
    static COLORS = {
        BLACK: 'black',
        BLUE: 'blue',
        ORANGE: 'orange',
        RED: 'red'
    };

    static COLOR_CODES = {
        '1': 'black', '2': 'black',
        '3': 'blue', '4': 'blue',
        '5': 'orange', '6': 'orange',
        '7': 'red', '8': 'red'
    };

    constructor(id, number, color, imagePath) {
        this.id = id;
        this.number = number;
        this.color = color;
        this.imagePath = imagePath;
    }

    /**
     * Create a tile from its ID (e.g., "1-01" = black 1)
     */
    static fromId(id) {
        const [rowStr, valueStr] = id.split('-');
        const row = rowStr;
        const value = parseInt(valueStr, 16); // hex to decimal

        const color = this.COLOR_CODES[row];
        const imagePath = `/images/${id}.svg`;

        return new Tile(id, value, color, imagePath);
    }

    /**
     * Get tile value (for scoring)
     */
    getValue() {
        return this.number;
    }

    /**
     * Check if tiles have same color
     */
    isSameColor(otherTile) {
        return this.color === otherTile.color;
    }

    /**
     * Check if tiles have same number
     */
    isSameNumber(otherTile) {
        return this.number === otherTile.number;
    }

    /**
     * Create DOM element for this tile
     */
    createDOMElement() {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'tile';
        tileDiv.dataset.tileId = this.id;
        tileDiv.draggable = true;

        const img = document.createElement('img');
        img.src = this.imagePath;
        img.alt = `${this.color} ${this.number}`;

        tileDiv.appendChild(img);
        return tileDiv;
    }

    toString() {
        return `${this.color}-${this.number}`;
    }
}
