import { GameController } from './js/GameController.js';
import './styles/main.css';

/**
 * Main entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎲 Rummikub Game Starting...');

    // Initialize game controller
    const game = new GameController();

    // Make game accessible for debugging
    window.rummikubGame = game;

    console.log('✅ Game initialized and ready!');
});
