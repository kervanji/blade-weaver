/**
 * BLADE WEAVER: Tutorial System
 * Shows game instructions to new players
 */

const TUTORIAL_KEY = 'bladeWeaver_tutorial';

const TutorialSystem = {
    steps: [
        {
            id: 'welcome',
            title: 'مرحباً بك في Blade Weaver!',
            content: 'أنت حداد أسطوري، مهمتك صناعة أقوى السيوف وهزيمة الوحوش.',
            icon: '⚔️',
            highlight: null
        },
        {
            id: 'smithing',
            title: 'الحدادة',
            content: 'انقر على السندان لجمع نقاط الحدادة. كلما نقرت أكثر، جمعت نقاط أكثر!',
            icon: '🔨',
            highlight: '.anvil'
        },
        {
            id: 'crafting',
            title: 'صناعة السيوف',
            content: 'عندما تجمع 100 نقطة، يمكنك صناعة سيف جديد. السيوف لها ندرة مختلفة!',
            icon: '🗡️',
            highlight: '.craft-btn'
        },
        {
            id: 'battle',
            title: 'القتال',
            content: 'محاربك يقاتل تلقائياً! جهز سيفاً قوياً لهزيمة الأعداء بسرعة.',
            icon: '👹',
            highlight: '.battle-arena'
        },
        {
            id: 'materials',
            title: 'المواد',
            content: 'اهزم الأعداء للحصول على الذهب والمواد. المواد تُحسّن السيوف!',
            icon: '💎',
            highlight: '.materials-display'
        },
        {
            id: 'upgrades',
            title: 'الترقيات',
            content: 'استخدم الذهب لشراء ترقيات من المتجر لتصبح أقوى!',
            icon: '🏪',
            highlight: '.bottom-menu'
        },
        {
            id: 'missions',
            title: 'المهام اليومية',
            content: 'أكمل المهام اليومية للحصول على مكافآت إضافية!',
            icon: '📋',
            highlight: null
        },
        {
            id: 'done',
            title: 'ابدأ مغامرتك!',
            content: 'أنت جاهز الآن! اصنع سيوفاً أسطورية وتصدر لوحة الصدارة!',
            icon: '🎮',
            highlight: null
        }
    ],

    // Check if tutorial was completed
    isCompleted: function () {
        return localStorage.getItem(TUTORIAL_KEY) === 'completed';
    },

    // Mark tutorial as completed
    complete: function () {
        localStorage.setItem(TUTORIAL_KEY, 'completed');
    },

    // Reset tutorial
    reset: function () {
        localStorage.removeItem(TUTORIAL_KEY);
    },

    // Current step index
    currentStep: 0,

    // Show tutorial modal
    show: function (onComplete) {
        if (this.isCompleted()) {
            if (onComplete) onComplete();
            return;
        }

        this.currentStep = 0;
        this.onComplete = onComplete;
        this.renderStep();
    },

    // Render current step
    renderStep: function () {
        const step = this.steps[this.currentStep];
        const isLast = this.currentStep === this.steps.length - 1;

        // Remove existing modal
        const existing = document.getElementById('tutorial-modal');
        if (existing) existing.remove();

        // Clear previous highlight
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        // Add highlight
        if (step.highlight) {
            const el = document.querySelector(step.highlight);
            if (el) el.classList.add('tutorial-highlight');
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'tutorial-modal';
        modal.className = 'tutorial-modal';
        modal.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-icon">${step.icon}</div>
                <h3 class="tutorial-title">${step.title}</h3>
                <p class="tutorial-text">${step.content}</p>
                <div class="tutorial-progress">
                    ${this.steps.map((_, i) => `<div class="progress-dot ${i <= this.currentStep ? 'active' : ''}"></div>`).join('')}
                </div>
                <div class="tutorial-actions">
                    ${this.currentStep > 0 ? '<button class="tutorial-btn prev-btn">السابق</button>' : ''}
                    <button class="tutorial-btn next-btn">${isLast ? 'ابدأ اللعب!' : 'التالي'}</button>
                </div>
                <button class="tutorial-skip">تخطي التعليمات</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.next-btn').addEventListener('click', () => this.nextStep());
        const prevBtn = modal.querySelector('.prev-btn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        modal.querySelector('.tutorial-skip').addEventListener('click', () => this.skipTutorial());
    },

    // Next step
    nextStep: function () {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.finishTutorial();
        }
    },

    // Previous step
    prevStep: function () {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    },

    // Skip tutorial
    skipTutorial: function () {
        this.finishTutorial();
    },

    // Finish tutorial
    finishTutorial: function () {
        this.complete();

        // Remove modal
        const modal = document.getElementById('tutorial-modal');
        if (modal) modal.remove();

        // Clear highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        if (this.onComplete) this.onComplete();
    }
};

// Export for use
window.TutorialSystem = TutorialSystem;
