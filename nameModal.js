/**
 * BLADE WEAVER: Name Input Modal System
 * Handles player name input and validation
 */

const NameModalSystem = {
    modal: null,
    input: null,
    startBtn: null,
    linkBtn: null,
    validationInterval: null,
    isInitialized: false,
    checkNameTimeout: null,
    isCheckingName: false,

    init: function () {
        // Always re-get elements to ensure they exist
        this.modal = document.getElementById('name-modal');
        this.input = document.getElementById('player-name-input');
        this.startBtn = document.getElementById('start-game-btn');
        this.linkBtn = document.getElementById('start-link-btn');

        if (!this.modal || !this.input || !this.startBtn) {
            console.error('NameModalSystem: Required elements not found!', {
                modal: !!this.modal,
                input: !!this.input,
                startBtn: !!this.startBtn
            });
            return false;
        }

        // Only setup listeners once
        if (!this.isInitialized) {
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('NameModalSystem: Initialized successfully');
        }

        return true;
    },

    setupEventListeners: function () {
        // Input validation listeners
        this.input.addEventListener('input', () => this.validateName());
        this.input.addEventListener('keyup', () => this.validateName());
        this.input.addEventListener('change', () => this.validateName());
        this.input.addEventListener('paste', () => {
            setTimeout(() => this.validateName(), 50);
        });

        // Enter key to submit
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.input.value.trim().length >= 2) {
                    this.handleStartGame();
                }
            }
        });

        // Start game button
        this.startBtn.addEventListener('click', () => this.handleStartGame());

        // Link account button (optional)
        if (this.linkBtn) {
            this.linkBtn.addEventListener('click', () => {
                if (window.AuthService) {
                    window.AuthService.loginWithGoogle();
                }
            });
        }

        console.log('NameModalSystem: Event listeners attached');
    },

    validateName: function () {
        const name = this.input.value.trim();
        const isValid = name.length >= 2;
        const errorMsg = document.getElementById('name-error-message');

        // Clear any existing timeout
        if (this.checkNameTimeout) {
            clearTimeout(this.checkNameTimeout);
            this.checkNameTimeout = null;
        }

        // Hide error message during normal typing
        if (errorMsg && !this.isCheckingName) {
            errorMsg.style.display = 'none';
        }

        // Visual feedback for length validation
        if (name.length > 0 && !isValid) {
            this.input.style.borderColor = '#e74c3c';
            this.startBtn.disabled = true;
        } else if (isValid) {
            // Start checking after 1 second of no typing
            this.input.style.borderColor = '#ffd700'; // Yellow while waiting
            this.startBtn.disabled = true;

            // Set timeout to check name availability
            this.checkNameTimeout = setTimeout(() => {
                this.checkNameAvailability(name);
            }, 1000);
        } else {
            this.input.style.borderColor = 'rgba(255,255,255,0.2)';
            this.startBtn.disabled = true;
        }

        console.log('Name validation:', { name, isValid });
        return isValid;
    },

    checkNameAvailability: async function (name) {
        if (!name || name.length < 2) return;

        const errorMsg = document.getElementById('name-error-message');
        this.isCheckingName = true;

        // Show checking indicator
        if (errorMsg) {
            errorMsg.textContent = '🔍 جاري التحقق من توفر الاسم...';
            errorMsg.style.color = '#ffd700';
            errorMsg.style.display = 'block';
        }
        this.input.style.borderColor = '#ffd700';

        try {
            const isTaken = await window.LeaderboardSystem.isNameTaken(name);

            // Make sure the name hasn't changed while we were checking
            if (this.input.value.trim() !== name) {
                return;
            }

            if (isTaken) {
                // Name is taken - show error
                if (errorMsg) {
                    errorMsg.textContent = '⚠️ الاسم مستخدم من قبل';
                    errorMsg.style.color = '#e74c3c';
                    errorMsg.style.display = 'block';
                }
                this.input.style.borderColor = '#e74c3c';
                this.startBtn.disabled = true;
            } else {
                // Name is available - show success
                if (errorMsg) {
                    errorMsg.textContent = '✓ الاسم متاح';
                    errorMsg.style.color = '#2ecc71';
                    errorMsg.style.display = 'block';
                }
                this.input.style.borderColor = '#2ecc71';
                this.startBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error checking name availability:', error);
            if (errorMsg) {
                errorMsg.textContent = '⚠️ خطأ في التحقق، حاول مرة أخرى';
                errorMsg.style.color = '#e74c3c';
                errorMsg.style.display = 'block';
            }
            this.input.style.borderColor = '#e74c3c';
            this.startBtn.disabled = true;
        } finally {
            this.isCheckingName = false;
        }
    },

    handleStartGame: async function () {
        const name = this.input.value.trim();
        const errorMsg = document.getElementById('name-error-message');

        if (name.length < 2) {
            this.showError('⚠️ الاسم يجب أن يكون حرفين على الأقل');
            return;
        }

        // Disable button and show loading
        this.startBtn.disabled = true;
        this.startBtn.textContent = 'جاري التحقق...';
        this.input.disabled = true;

        // Hide any previous error
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        try {
            // Check if name is taken
            const isTaken = await window.LeaderboardSystem.isNameTaken(name);

            if (isTaken) {
                // Show error message in red below input
                if (errorMsg) {
                    errorMsg.textContent = '⚠️ الاسم مستخدم من قبل';
                    errorMsg.style.display = 'block';
                }
                this.input.style.borderColor = '#e74c3c';
                this.startBtn.disabled = false;
                this.startBtn.textContent = 'ابدأ اللعب!';
                this.input.disabled = false;
                this.input.focus();
                this.input.select(); // Select the text for easy replacement
                return;
            }

            // Name is available - create player and start game
            console.log('Name is available, creating player...');
            const player = window.LeaderboardSystem.createPlayer(name);
            console.log('Player created:', player);

            if (window.setLocalPlayerName) {
                window.setLocalPlayerName(name);
            }

            // Save game state to persist player data
            if (window.saveGame) {
                window.saveGame();
                console.log('Game saved after player creation');
            }

            // Hide keyboard on mobile
            this.input.blur();

            // Close modal
            this.close();

            // Start game systems
            if (window.startGameSystems) {
                window.startGameSystems();
            }

        } catch (error) {
            console.error('Error checking name:', error);
            if (errorMsg) {
                errorMsg.textContent = '⚠️ حدث خطأ في التحقق من الاسم. يرجى المحاولة مرة أخرى.';
                errorMsg.style.display = 'block';
            }
            this.startBtn.disabled = false;
            this.startBtn.textContent = 'ابدأ اللعب!';
            this.input.disabled = false;
        }
    },

    showError: function (message) {
        const errorMsg = document.getElementById('name-error-message');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
        this.input.style.borderColor = '#e74c3c';
    },

    show: function (isChangeMode = false) {
        // Re-initialize to ensure elements are found
        if (!this.init()) {
            console.error('NameModalSystem: Cannot show modal - init failed');
            return;
        }

        // Check if player already exists AND NOT in change mode
        const existingPlayer = window.LeaderboardSystem.getPlayer();
        if (existingPlayer && !isChangeMode) {
            console.log('Player already exists:', existingPlayer.name);
            if (window.setLocalPlayerName) {
                window.setLocalPlayerName(existingPlayer.name);
            }
            this.close();
            if (window.startGameSystems) {
                window.startGameSystems();
            }
            return;
        }

        // Reset form
        this.input.value = '';
        this.input.disabled = false;
        this.input.style.borderColor = 'rgba(255,255,255,0.2)';
        this.startBtn.disabled = true;
        this.startBtn.textContent = isChangeMode ? 'تغيير الاسم' : 'ابدأ اللعب!';

        // Update Header/Text for Change Mode
        if (isChangeMode) {
            document.querySelector('.name-modal-content h3').textContent = '✏️ تغيير اسم اللاعب';
            document.querySelector('.name-prompt').textContent = 'أدخل اسمك الجديد:';
            // Hide link button just in case
            if (this.linkBtn) this.linkBtn.style.display = 'none';
        } else {
            document.querySelector('.name-modal-content h3').textContent = '⚔️ مرحباً بك في Blade Weaver!';
            document.querySelector('.name-prompt').textContent = 'أدخل اسمك ليظهر في لوحة الصدارة';
        }

        // Reset error message
        const errorMsg = document.getElementById('name-error-message');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        // Clear any pending checks
        if (this.checkNameTimeout) {
            clearTimeout(this.checkNameTimeout);
            this.checkNameTimeout = null;
        }
        this.isCheckingName = false;

        // Show modal
        this.modal.classList.remove('hidden');

        // Focus on input after a short delay
        setTimeout(() => {
            this.input.focus();
            console.log('Input focused, ready for typing');
        }, 300);

        // Start validation interval as backup
        this.startValidationInterval();
    },

    close: function () {
        this.modal.classList.add('hidden');
        this.stopValidationInterval();
    },

    startValidationInterval: function () {
        // Safety check every 500ms to catch any input issues
        this.validationInterval = setInterval(() => {
            if (!this.modal.classList.contains('hidden')) {
                this.validateName();
            }
        }, 500);
    },

    stopValidationInterval: function () {
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
    }
};

// Export for global use
window.NameModalSystem = NameModalSystem;
