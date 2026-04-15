/**
 * Модуль интернационализации (i18n)
 * Версия со встроенными переводами (без fetch, для надёжности)
 */

const I18n = (function() {
    'use strict';
    
    // Приватные переменные
    let _currentLang = 'ru';
    let _translations = {};
    let _isLoaded = false;
    let _initPromise = null;
    
    const _langIcon = document.getElementById('langIcon');
    const _toggleBtn = document.getElementById('langSwitchBtn');
    
    // ВСТРОЕННЫЕ ПЕРЕВОДЫ (чтобы не зависеть от fetch/CORS)
    const _builtinTranslations = {
        ru: {
            "target": "Цель:",
            "boss_dodge": "Уворот босса:",
            "your_acc": "Ваша точность:",
            "your_aspd": "Ваша скорость атаки:",
            "calc_formula": "Формула расчёта:",
            "formula_abs": "Абсолютная прибавка",
            "formula_rel": "Относительная прибавка",
            "formula_abs_display": "Шанс попадания = Ваша точность / (Ваша точность + Уворот босса) + 0.1",
            "formula_rel_display": "Шанс попадания = Ваша точность / (Ваша точность + Уворот босса) * 1.1",
            "warning_accuracy": "Значения уворотов боссов не окончательные, не стоит доверять им на 100 процентов, если вы считаете, что значение задано неправильно, то используйтей кастомного босса",
            "table_miss_percent": "% Промахов",
            "table_hit_percent": "% Попаданий",
            "table_miss_count": "Кол-во промахов",
            "table_accuracy": "Точность",
            "chart_x_axis": "ТОЧНОСТЬ",
            "chart_y_axis": "ШАНС ПОПАДАНИЯ",
            "chart_tooltip_acc": "Точность",
            "chart_tooltip_hit": "Попадание",
            "chart_tooltip_miss": "Промах",
            "boss_custom": "Кастомный",
            "boss_prefix": "Босс",
            "theme_toggle_light": "Переключить на светлую тему",
            "theme_toggle_dark": "Переключить на тёмную тему",
            "lang_toggle": "Switch to English"
        },
        en: {
            "target": "Target:",
            "boss_dodge": "Boss Dodge:",
            "your_acc": "Your accuracy:",
            "your_aspd": "Your attack Speed:",
            "calc_formula": "Calculation Mode:",
            "formula_abs": "Absolute Bonus",
            "formula_rel": "Relative Bonus",
            "formula_abs_display": "Hit Chance = Your accuracy / (Your accuracy + Boss dodge) + 0.1",
            "formula_rel_display": "Hit Chance = Your accuracy / (Your accuracy + Boss dodge) * 1.1",
            "warning_accuracy": "Boss dodge values are not final, you should not trust them 100 percent, if you think that the value is set incorrectly, then use a custom boss",
            "table_miss_percent": "Miss %",
            "table_hit_percent": "Hit %",
            "table_miss_count": "Miss Count",
            "table_accuracy": "Accuracy",
            "chart_x_axis": "ACCURACY",
            "chart_y_axis": "HIT CHANCE",
            "chart_tooltip_acc": "Accuracy",
            "chart_tooltip_hit": "Hit",
            "chart_tooltip_miss": "Miss",
            "boss_custom": "Custom",
            "boss_prefix": "Boss",
            "theme_toggle_light": "Switch to light theme",
            "theme_toggle_dark": "Switch to dark theme",
            "lang_toggle": "Переключить на русский"
        }
    };
    
    // Пути к иконкам
    const _langPaths = {
        ru: { icon: 'lang/ru/icon.png' },
        en: { icon: 'lang/en/icon.png' }
    };
    
    // Приватные методы
    
    function _loadTranslations(lang) {
        if (_builtinTranslations[lang]) {
            _translations = _builtinTranslations[lang];
            return true;
        }
        console.error(`Unknown language: ${lang}`);
        return false;
    }
    
    function _updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = _translations[key];
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                    element.placeholder = translation;
                } else if (element.tagName === 'OPTION') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        _updateButtonTitles();
        
        // Вызываем событие
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { lang: _currentLang, translations: _translations } 
        }));
    }
    
    function _updateButtonTitles() {
        const themeBtn = document.getElementById('themeSwitchBtn');
        
        if (themeBtn) {
            const currentTheme = ThemeManager?.getCurrentTheme() || 'light';
            const titleKey = currentTheme === 'light' ? 'theme_toggle_dark' : 'theme_toggle_light';
            themeBtn.title = _translations[titleKey] || themeBtn.title;
        }
        
        if (_toggleBtn) {
            _toggleBtn.title = _translations.lang_toggle || _toggleBtn.title;
        }
    }
    
    function _applyLanguage(lang) {
        if (!_builtinTranslations[lang]) {
            console.error(`Unsupported language: ${lang}`);
            return false;
        }
        
        _loadTranslations(lang);
        
        _currentLang = lang;
        _isLoaded = true;
        
        if (_langIcon) {
            _langIcon.src = _langPaths[lang].icon;
        }
        
        document.documentElement.lang = lang;
        _updateDOM();
        _saveLanguage(lang);
        
        console.log(`Language applied: ${lang}`);
        return true;
    }
    
    function _saveLanguage(lang) {
        try {
            localStorage.setItem('hitcalc_lang', lang);
        } catch (e) {
            console.warn('Failed to save language:', e);
        }
    }
    
    function _loadSavedLanguage() {
        try {
            const saved = localStorage.getItem('hitcalc_lang');
            if (saved && (saved === 'ru' || saved === 'en')) {
                return saved;
            }
        } catch (e) {
            console.warn('Failed to load language:', e);
        }
        return null;
    }
    
    function _getBrowserLanguage() {
        const lang = navigator.language || navigator.userLanguage || 'ru';
        return lang.toLowerCase().startsWith('en') ? 'en' : 'ru';
    }
    
    function _handleToggle() {
        const newLang = _currentLang === 'ru' ? 'en' : 'ru';
        setLanguage(newLang);
    }
    
    // Публичный API
    
    function setLanguage(lang) {
        return _applyLanguage(lang);
    }
    
    function toggleLanguage() {
        _handleToggle();
    }
    
    function getCurrentLanguage() {
        return _currentLang;
    }
    
    function t(key, params = {}) {
        let text = _translations[key] || key;
        
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
        });
        
        return text;
    }
    
    function isLoaded() {
        return _isLoaded;
    }
    
    function getTranslations() {
        return { ..._translations };
    }
    
    function init() {
        console.log('I18n init starting...');
        
        const savedLang = _loadSavedLanguage();
        const initialLang = savedLang || _getBrowserLanguage();
        
        // Синхронно применяем язык
        _applyLanguage(initialLang);
        
        if (_toggleBtn) {
            _toggleBtn.addEventListener('click', _handleToggle);
        }
        
        window.addEventListener('themeChanged', () => {
            _updateButtonTitles();
        });
        
        console.log(`I18n initialized with language: ${_currentLang}, loaded: ${_isLoaded}`);
    }
    
    // Публичное API
    return {
        init: init,
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage,
        getCurrentLanguage: getCurrentLanguage,
        t: t,
        getTranslations: getTranslations,
        isLoaded: isLoaded
    };
    
})();

// Запускаем инициализацию сразу
console.log('I18n script loaded, starting init...');
I18n.init();
