/**
 * Helper class for managing UI animations
 */
export class AnimationHelper {
    /**
     * Show AI thinking indicator
     */
    static showAIThinking() {
        let indicator = document.querySelector('.ai-thinking');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'ai-thinking';
            indicator.innerHTML = '<div class="loading" style="display:inline-block; margin-right:10px;"></div> AI is thinking...';
            document.body.appendChild(indicator);
        }
        return indicator;
    }

    /**
     * Hide AI thinking indicator
     */
    static hideAIThinking() {
        const indicator = document.querySelector('.ai-thinking');
        if (indicator) {
            indicator.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => indicator.remove(), 300);
        }
    }

    /**
     * Add pop-in animation to element
     */
    static addPopInAnimation(element) {
        element.classList.add('pop-in');
        element.addEventListener('animationend', () => {
            element.classList.remove('pop-in');
        }, { once: true });
    }

    /**
     * Add slide-in animation to element
     */
    static addSlideInAnimation(element, delay = 0) {
        if (delay > 0) {
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.opacity = '1';
                element.classList.add('animating-in');
            }, delay);
        } else {
            element.classList.add('animating-in');
        }

        element.addEventListener('animationend', () => {
            element.classList.remove('animating-in');
        }, { once: true });
    }

    /**
     * Add shake animation to element
     */
    static shakeElement(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    }

    /**
     * Animate count change
     */
    static animateCountChange(element) {
        element.classList.add('count-changed');
        element.addEventListener('animationend', () => {
            element.classList.remove('count-changed');
        }, { once: true });
    }

    /**
     * Add turn transition effect to game screen
     */
    static turnTransition() {
        const gameScreen = document.getElementById('game-screen');
        gameScreen.classList.add('turn-transition');
        setTimeout(() => {
            gameScreen.classList.remove('turn-transition');
        }, 600);
    }

    /**
     * Set active player indicator
     */
    static setActivePlayer(isPlayer) {
        const playerRack = document.getElementById('player-rack');
        const computerRack = document.getElementById('computer-rack');

        if (isPlayer) {
            playerRack.classList.add('active-turn');
            computerRack.classList.remove('active-turn');
        } else {
            computerRack.classList.add('active-turn');
            playerRack.classList.remove('active-turn');
        }
    }

    /**
     * Clear active player indicator
     */
    static clearActivePlayer() {
        document.getElementById('player-rack').classList.remove('active-turn');
        document.getElementById('computer-rack').classList.remove('active-turn');
    }

    /**
     * Make button pulse (available state)
     */
    static makePulse(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('available');
        }
    }

    /**
     * Stop button pulse
     */
    static stopPulse(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('available');
        }
    }

    /**
     * Animate drawing a tile
     */
    static animateDrawTile() {
        const drawBtn = document.getElementById('draw-btn');
        drawBtn.classList.add('drawing');
        setTimeout(() => {
            drawBtn.classList.remove('drawing');
        }, 500);
    }

    /**
     * Add staggered animations to multiple elements
     */
    static staggerAnimations(elements, animationClass, delayIncrement = 50) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add(animationClass);
                element.addEventListener('animationend', () => {
                    element.classList.remove(animationClass);
                }, { once: true });
            }, index * delayIncrement);
        });
    }

    /**
     * Celebrate win
     */
    static celebrateWin(isPlayer) {
        // Add confetti or other celebration effects
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-20px';
                confetti.style.zIndex = '9999';
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';

                document.body.appendChild(confetti);

                confetti.style.animation = `confetti ${2 + Math.random() * 2}s ease-out forwards`;

                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    }

    /**
     * Flash element briefly
     */
    static flashElement(element, color = '#4CAF50') {
        const originalBg = element.style.backgroundColor;
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = color;

        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, 300);
    }

    /**
     * Smooth scroll to element
     */
    static scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Add confetti keyframe if not already in CSS
if (!document.querySelector('#confetti-keyframes')) {
    const style = document.createElement('style');
    style.id = 'confetti-keyframes';
    style.textContent = `
        @keyframes confetti {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
