const LanguageSystem = {
    currentLang: 'ar', // Default to Arabic

    init: function () {
        // Check for saved language
        const savedLang = localStorage.getItem('bladeWeaver_lang');

        if (savedLang) {
            this.setLanguage(savedLang);
        } else {
            // New user, show language selection modal
            this.showLanguageModal();
        }

        // Add settings listener
        this.setupSettingsUI();
    },

    setLanguage: function (lang) {
        if (!TRANSLATIONS[lang]) return;

        this.currentLang = lang;
        localStorage.setItem('bladeWeaver_lang', lang);

        // Update direction
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.lang = lang;

        this.updateUI();

        // If modal is open, close it
        const modal = document.getElementById('language-modal');
        if (modal) modal.classList.add('hidden');
    },

    getText: function (key) {
        return TRANSLATIONS[this.currentLang][key] || key;
    },

    updateUI: function () {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (TRANSLATIONS[this.currentLang][key]) {
                el.innerText = TRANSLATIONS[this.currentLang][key];
            }
        });

        // Specifically check for dynamic elements that might need updates
        // like placeholders
        const inputs = document.querySelectorAll('[data-i18n-placeholder]');
        inputs.forEach(input => {
            const key = input.getAttribute('data-i18n-placeholder');
            if (TRANSLATIONS[this.currentLang][key]) {
                input.placeholder = TRANSLATIONS[this.currentLang][key];
            }
        });

        // Update game title based on language
        document.title = this.getText('gameTitle') + ": " + this.getText('gameSubtitle');
    },

    showLanguageModal: function () {
        // Create modal if it doesn't exist
        let modal = document.getElementById('language-modal');
        if (!modal) {
            // Check if modal already exists in HTML first
            // It will be added to index.html shortly
            // But for now, we can programmatically create if missing
            return;
        }
        modal.classList.remove('hidden');
    },

    setupSettingsUI: function () {
        const langSelect = document.getElementById('settings-language-select');
        if (langSelect) {
            langSelect.value = this.currentLang;
            langSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }
};

// Make available globally
window.LanguageSystem = LanguageSystem;

// Helper function for easier access
window.t = function (key) {
    return LanguageSystem.getText(key);
};
