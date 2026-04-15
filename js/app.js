/**
 * Основной модуль приложения
 */
const App = (function() {
    'use strict';
    
    // DOM элементы
    let canvas, ctx;
    let bossSelect, bossIcon;
    let dodgeInput, accInput, aspdInput;
    let calcModeSelect;
    let formulaDisplay;
    
    let rowMiss, rowHit, rowMissCount, rowAcc;
    let currentMiss, currentHit, currentMissCount, currentAcc;
    
    let mouseX = -1;
    
    const bosses = [{ name: 'boss_custom', val: null, icon: 'boss_0.png' }];
    const missTargets = [0, 1, 2, 3, 4, 7, 10, 15, 20];
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    
    function initDOMElements() {
        canvas = document.getElementById('hitChart');
        ctx = canvas.getContext('2d');
        bossSelect = document.getElementById('bossSelect');
        // bossIcon = document.getElementById('bossIcon');
        dodgeInput = document.getElementById('dodgeInput');
        accInput = document.getElementById('accInput');
        aspdInput = document.getElementById('aspdInput');
        calcModeSelect = document.getElementById('calcModeSelect');
        formulaDisplay = document.getElementById('formulaDisplay');
        
        rowMiss = document.getElementById('rowMiss');
        rowHit = document.getElementById('rowHit');
        rowMissCount = document.getElementById('rowMissCount');
        rowAcc = document.getElementById('rowAcc');
        
        currentMiss = document.getElementById('currentMiss');
        currentHit = document.getElementById('currentHit');
        currentMissCount = document.getElementById('currentMissCount');
        currentAcc = document.getElementById('currentAcc');
    }
    
    function initBosses() {
        for (let i = 1; i <= 19; i++) {
            bosses.push({ 
                val: i * 50, 
                icon: `boss_${i}.png` 
            });
        }
        
        bossSelect.innerHTML = '';
        
        bosses.forEach((boss, index) => {
            const option = document.createElement('option');
            option.value = index;
            bossSelect.appendChild(option);
        });
        
        updateBossOptionsText();
    }
    
    function updateBossOptionsText() {
        const options = bossSelect.options;
        const t = I18n.t;
        
        for (let i = 0; i < options.length; i++) {
            if (i === 0) {
                options[i].textContent = t('boss_custom');
            } else {
                options[i].textContent = `${t('boss_prefix')} ${i}`;
            }
        }
    }
    
    // ========== МАТЕМАТИКА ==========
    
    function calcHitRate(accuracy, dodge) {
        const mode = calcModeSelect.value;
        if (accuracy + dodge === 0) return 0.0;
        if (mode === 'mode1') {
            return Math.max(0, Math.min(accuracy / (accuracy + dodge) + 0.1, 1.0));
        } else {
            return Math.max(0, Math.min(accuracy / (accuracy + dodge) * 1.1, 1.0));
        }
    }
    
    function calcRequiredAcc(targetRate, dodge) {
        const mode = calcModeSelect.value;
        if (mode === 'mode1') {
            if (targetRate <= 0) return 0;
            if (targetRate >= 1) return 9 * dodge;
            const k = targetRate - 0.1;
            return Math.ceil((k * dodge) / (1 - k));
        } else {
            if (targetRate <= 0) return 0;
            if (targetRate >= 1) return 10 * dodge;
            const k = targetRate / 1.1;
            return Math.ceil((k * dodge) / (1 - k));
        }
    }
    
    // ========== UI ==========
    
    function updateBossSelection() {
        const selectedIndex = parseInt(bossSelect.value);
        const selectedBoss = bosses[selectedIndex];
        
        if (selectedBoss.icon) {
            // bossIcon.src = `bosses/${selectedBoss.icon}`;
            // bossIcon.style.display = 'block';
        }
        
        if (selectedBoss.val !== null) {
            dodgeInput.value = selectedBoss.val;
            dodgeInput.disabled = true;
        } else {
            dodgeInput.disabled = false;
        }
    }
    
    function updateFormulaDisplay() {
        const mode = calcModeSelect.value;
        formulaDisplay.textContent = I18n.t(mode === 'mode1' ? 'formula_abs_display' : 'formula_rel_display');
    }
    
    function updateTable() {
        const acc = parseInt(accInput.value) || 0;
        const dodge = parseInt(dodgeInput.value) || 0;
        const aspd = parseFloat(aspdInput.value) || 0;
        const curRate = calcHitRate(acc, dodge);
        const curMissRate = 1 - curRate;
        
        currentMiss.textContent = (curMissRate * 100).toFixed(1) + '%';
        currentHit.textContent = (curRate * 100).toFixed(1) + '%';
        currentMissCount.textContent = Math.floor(curMissRate * aspd * 60);
        currentAcc.textContent = acc;
        
        clearTableRows();
        
        missTargets.forEach(missPercent => {
            const missRate = missPercent / 100;
            const hitRate = 1 - missRate;
            const requiredAcc = calcRequiredAcc(hitRate, dodge);
            
            rowMiss.appendChild(createCell(missPercent + '%'));
            rowHit.appendChild(createCell((hitRate * 100) + '%'));
            rowMissCount.appendChild(createCell(Math.floor(missRate * aspd * 60)));
            rowAcc.appendChild(createCell(requiredAcc));
        });
    }
    
    function createCell(text) {
        const cell = document.createElement('td');
        cell.textContent = text;
        return cell;
    }
    
    function clearTableRows() {
        [rowMiss, rowHit, rowMissCount, rowAcc].forEach(row => {
            if (!row) return;
            row.querySelectorAll('td:not(.current-value)').forEach(cell => cell.remove());
        });
    }
    
    // ========== ГРАФИК ==========
    
    function drawChart() {
        if (!canvas || !ctx || canvas.width === 0) return;
        
        const acc = parseInt(accInput.value) || 0;
        const dodge = parseInt(dodgeInput.value) || 0;
        const t = I18n.t;

        const computedStyle = getComputedStyle(document.documentElement);
        const textColor = computedStyle.getPropertyValue('--text').trim() || '#111827';
        const textMuted = computedStyle.getPropertyValue('--text-muted').trim() || '#6b7280';
        const gridColor = computedStyle.getPropertyValue('--border').trim() || '#d1d5db';

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        const p = 60;
        const w = canvas.width - p * 2;
        const h = canvas.height - p * 2;
        
        const startX = Math.min(acc, calcRequiredAcc(0.8, dodge));
        const endX = Math.max(Math.min(10000, calcRequiredAcc(1, dodge)), acc) + 10;
        const minY = Math.floor(calcHitRate(startX, dodge) / 0.05) * 0.05;
        const maxY = Math.max(calcHitRate(endX, dodge) + 0.02, 1.02);
        
        const mX = (x) => p + ((x - startX) / (endX - startX)) * w;
        const mY = (y) => p + h - ((y - minY) / (maxY - minY)) * h;
        const invX = (canvasX) => startX + ((canvasX - p) / w) * (endX - startX);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Сетка Y
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textMuted;
        ctx.font = '11px sans-serif';
        
        for (let val = minY; val <= maxY; val += 0.05) {
            const y = mY(val);
            ctx.beginPath();
            ctx.moveTo(p, y);
            ctx.lineTo(p + w, y);
            ctx.stroke();
            ctx.fillText(Math.round(val * 100) + '%', p - 10, y);
        }
        
        // Подписи X
        ctx.textAlign = 'center';
        ctx.fillStyle = textMuted;
        const xPointsCount = 10;
        for (let i = 0; i <= xPointsCount; i++) {
            const val = startX + (i * (endX - startX) / xPointsCount);
            ctx.fillText(Math.round(val), mX(val), p + h + 20);
        }
        
        // Кривая
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        let first = true;
        
        for (let x = startX; x <= endX; x += (endX - startX) / 200) {
            const rate = calcHitRate(x, dodge);
            if (rate < minY) continue;
            
            const px = mX(x);
            const py = mY(rate);
            
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        
        // Линия текущей точности
        if (acc >= startX) {
            const curX = mX(acc);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(curX, p);
            ctx.lineTo(curX, p + h);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Тултип
        if (mouseX > p && mouseX < p + w) {
            const hoverAcc = Math.round(invX(mouseX));
            const hoverHit = calcHitRate(hoverAcc, dodge);
            
            if (hoverHit >= minY) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(mouseX, p);
                ctx.lineTo(mouseX, p + h);
                ctx.stroke();
                
                const tipW = 160, tipH = 75;
                let tipX = mouseX + 15;
                const tipY = p + 10;
                
                if (tipX + tipW > canvas.width) tipX = mouseX - tipW - 15;
                
                ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
                ctx.fillRect(tipX, tipY, tipW, tipH);
                
                ctx.fillStyle = '#f3f4f6';
                ctx.textAlign = 'left';
                ctx.font = '12px sans-serif';
                ctx.fillText(`${t('chart_tooltip_acc')}: ${hoverAcc}`, tipX + 12, tipY + 22);
                ctx.fillText(`${t('chart_tooltip_hit')}: ${(hoverHit * 100).toFixed(1)}%`, tipX + 12, tipY + 42);
                ctx.fillText(`${t('chart_tooltip_miss')}: ${((1 - hoverHit) * 100).toFixed(1)}%`, tipX + 12, tipY + 62);
            }
        }
        
        // Подписи осей
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('chart_x_axis'), p + w / 2, p + h + 40);
        
        ctx.save();
        ctx.translate(20, p + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(t('chart_y_axis'), 0, 0);
        ctx.restore();
    }
    
    function draw() {
        updateFormulaDisplay();
        updateTable();
        drawChart();
    }
    
    // ========== ОБРАБОТЧИКИ ==========
    
    function handleBossChange() {
        updateBossSelection();
        draw();
    }
    
    function handleLanguageChange() {
        updateBossOptionsText();
        draw();
    }
    
    // ========== СТАРТ ==========
    
    function init() {
        console.log('App init');
        initDOMElements();
        initBosses();
        
        bossSelect.addEventListener('change', handleBossChange);
        dodgeInput.addEventListener('input', draw);
        accInput.addEventListener('input', draw);
        aspdInput.addEventListener('input', draw);
        calcModeSelect.addEventListener('change', draw);
        window.addEventListener('themeChanged', () => {
            setTimeout(() => draw(), 10);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX - canvas.getBoundingClientRect().left;
            draw();
        });
        canvas.addEventListener('mouseleave', () => {
            mouseX = -1;
            draw();
        });
        
        window.addEventListener('resize', draw);
        window.addEventListener('languageChanged', handleLanguageChange);
        
        updateBossSelection();
        draw();
        
        console.log('App ready');
    }
    
    return { init };
    
})();

// Запускаем когда всё готово
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}
