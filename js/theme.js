/**
 * Модуль управления темой
 * Переключает между светлой и тёмной темой, сохраняет выбор в localStorage
 */

const ThemeManager = (function() {
    'use strict';
    
    // Приватные переменные
    let _currentTheme = 'light';
    const _stylesheet = document.getElementById('themeStylesheet');
    const _themeIcon = document.getElementById('themeIcon');
    const _toggleBtn = document.getElementById('themeSwitchBtn');
    
    // Пути к ресурсам темы
    const _themePaths = {
        light: {
            css: 'styles/themes/light/style.css',
            icon: 'styles/themes/light/icon.png'
        },
        dark: {
            css: 'styles/themes/dark/style.css',
            icon: 'styles/themes/dark/icon.png'
        }
    };
    
    // Приватные методы
    
    /**
     * Применяет тему (меняет href у stylesheet)
     */
    function _applyTheme(theme) {
        if (!_stylesheet) {
            console.error('Theme stylesheet element not found');
            return;
        }
        
        const themePath = _themePaths[theme];
        if (!themePath) {
            console.error(`Unknown theme: ${theme}`);
            return;
        }
        
        // Меняем CSS
        _stylesheet.href = themePath.css;
        
        // Меняем иконку если кнопка существует
        if (_themeIcon) {
            _themeIcon.src = themePath.icon;
        }
        
        // Обновляем title кнопки
        if (_toggleBtn) {
            const nextTheme = theme === 'light' ? 'dark' : 'light';
            _toggleBtn.title = `Переключить на ${nextTheme === 'light' ? 'светлую' : 'тёмную'} тему`;
        }
        
        _currentTheme = theme;
    
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }
    
    /**
     * Сохраняет тему в localStorage
     */
    function _saveTheme(theme) {
        try {
            localStorage.setItem('hitcalc_theme', theme);
        } catch (e) {
            console.warn('Failed to save theme to localStorage:', e);
        }
    }
    
    /**
     * Загружает тему из localStorage
     */
    function _loadSavedTheme() {
        try {
            const saved = localStorage.getItem('hitcalc_theme');
            if (saved && (saved === 'light' || saved === 'dark')) {
                return saved;
            }
        } catch (e) {
            console.warn('Failed to load theme from localStorage:', e);
        }
        return null;
    }
    
    /**
     * Определяет системную тему
     */
    function _getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    
    /**
     * Обработчик клика по кнопке переключения темы
     */
    function _handleToggle() {
        const newTheme = _currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }
    
    // Публичный API
    
    /**
     * Устанавливает указанную тему
     * @param {string} theme - 'light' или 'dark'
     */
    function setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error('Theme must be "light" or "dark"');
            return;
        }
        
        _applyTheme(theme);
        _saveTheme(theme);
    }
    
    /**
     * Переключает тему (light -> dark, dark -> light)
     */
    function toggleTheme() {
        _handleToggle();
    }
    
    /**
     * Возвращает текущую тему
     * @returns {string} 'light' или 'dark'
     */
    function getCurrentTheme() {
        return _currentTheme;
    }
    
    /**
     * Инициализация модуля
     * Вызывается при загрузке страницы
     */
    function init() {
        // Пытаемся загрузить сохранённую тему
        const savedTheme = _loadSavedTheme();
        
        // Если нет сохранённой - используем системную
        const initialTheme = savedTheme || _getSystemTheme();
        
        // Применяем тему
        _applyTheme(initialTheme);
        
        // Вешаем обработчик на кнопку
        if (_toggleBtn) {
            _toggleBtn.addEventListener('click', _handleToggle);
        }
        
        // Слушаем изменение системной темы (опционально)
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Автоматически переключаем только если пользователь явно не выбрал тему
                if (!_loadSavedTheme()) {
                    setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        console.log(`ThemeManager initialized with theme: ${_currentTheme}`);
    }
    
    // Публичное API
    return {
        init: init,
        setTheme: setTheme,
        toggleTheme: toggleTheme,
        getCurrentTheme: getCurrentTheme
    };
    
})();

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
    ThemeManager.init();
}