document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentMode = 'forex';
    let tradeHistory = JSON.parse(localStorage.getItem('tradeHistory')) || [];

    // Elements
    const inputs = {
        balance: document.getElementById('account-balance'),
        risk: document.getElementById('risk-percent'),
        sl: document.getElementById('stop-loss'),
        entry: document.getElementById('entry-price'),
        target: document.getElementById('exit-price')
    };

    const outputs = {
        size: document.getElementById('res-pos-size'),
        riskAmt: document.getElementById('res-risk-amt'),
        rewardAmt: document.getElementById('res-reward-amt'),
        rr: document.getElementById('res-rr-ratio'),
        winProb: document.getElementById('res-win-prob')
    };

    const visuals = {
        rewardBar: document.querySelector('.rr-bar-segment.reward'),
        riskBar: document.querySelector('.rr-bar-segment.risk'),
        historyBody: document.getElementById('history-body'),
        tickerItems: document.querySelectorAll('.ticker-item')
    };

    const buttons = {
        calculate: document.getElementById('calculate-btn'),
        save: document.getElementById('save-trade-btn'),
        clear: document.getElementById('clear-history'),
        switches: document.querySelectorAll('.switch-btn')
    };

    // --- Core Logic ---

    function calculate() {
        const balance = parseFloat(inputs.balance.value) || 0;
        const riskP = parseFloat(inputs.risk.value) || 0;
        const sl = parseFloat(inputs.sl.value) || 0;
        const entry = parseFloat(inputs.entry.value) || 0;
        const target = parseFloat(inputs.target.value) || 0;

        // 1. Risk Amount
        const riskAmount = balance * (riskP / 100);
        outputs.riskAmt.innerText = `$${riskAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

        // 2. Position Size (Based on Mode)
        let size = 0;
        let sizeUnit = 'Lot';

        if (sl > 0) {
            if (currentMode === 'forex') {
                size = riskAmount / (sl * 10);
                sizeUnit = 'Lot';
            } else if (currentMode === 'crypto') {
                // If they gave entry, size = risk / (entry - sl_price)
                // Since they gave SL in 'pips/points', we assume unit risk
                size = riskAmount / sl;
                sizeUnit = 'Units';
            } else {
                size = riskAmount / sl;
                sizeUnit = 'Shares';
            }
        }
        outputs.size.innerText = `${size.toFixed(2)} ${sizeUnit}`;

        // 3. Reward & RR
        let rr = 2.0;
        let reward = riskAmount * rr;

        if (entry > 0 && target > 0) {
            const distEntryTarget = Math.abs(target - entry);
            // Rough mapping of SL pips to price distance
            // Assuming 1 pip = 0.0001 for Forex, 1 unit for Crypto
            const pipValue = currentMode === 'forex' ? 0.0001 : 1;
            const slDist = sl * pipValue;
            
            if (slDist > 0) {
                rr = distEntryTarget / slDist;
                reward = riskAmount * rr;
            }
        }

        outputs.rewardAmt.innerText = `$${reward.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        outputs.rr.innerText = `1:${rr.toFixed(1)}`;
        
        const winProb = (1 / (1 + rr)) * 100;
        outputs.winProb.innerText = `${winProb.toFixed(0)}%`;

        // Update Visuals
        const totalHeight = 100;
        const riskH = (1 / (1 + rr)) * totalHeight;
        const rewardH = (rr / (1 + rr)) * totalHeight;

        visuals.rewardBar.style.height = `${Math.min(rewardH, 85)}%`;
        visuals.riskBar.style.height = `${Math.max(riskH, 15)}%`;
    }

    // --- History Management ---

    function saveTrade() {
        const trade = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            pair: currentMode === 'forex' ? 'EUR/USD' : (currentMode === 'crypto' ? 'BTC/USD' : 'TSLA'),
            size: outputs.size.innerText,
            risk: outputs.riskAmt.innerText,
            reward: outputs.rewardAmt.innerText,
            rr: outputs.rr.innerText
        };

        tradeHistory.unshift(trade);
        if (tradeHistory.length > 5) tradeHistory.pop();
        
        localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));
        renderHistory();
        
        // Success animation
        buttons.save.innerText = 'Saved!';
        setTimeout(() => buttons.save.innerText = 'Save to Journal', 1500);
    }

    function renderHistory() {
        visuals.historyBody.innerHTML = tradeHistory.map(t => `
            <tr>
                <td>${t.date}</td>
                <td><span class="pill reward">${t.pair}</span></td>
                <td>${t.size}</td>
                <td>${t.risk}</td>
                <td>${t.reward}</td>
                <td>${t.rr}</td>
                <td><button class="btn-text delete" onclick="deleteTrade(${t.id})">Delete</button></td>
            </tr>
        `).join('');
    }

    window.deleteTrade = (id) => {
        tradeHistory = tradeHistory.filter(t => t.id !== id);
        localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));
        renderHistory();
    };

    // --- Utilities ---

    function updateMarketInfo() {
        const priceEl = document.querySelector('.price-val');
        const currentPrice = parseFloat(priceEl.innerText);
        const change = (Math.random() - 0.5) * 0.0002;
        const newPrice = currentPrice + change;
        priceEl.innerText = newPrice.toFixed(4);
        priceEl.className = `price-val ${change >= 0 ? 'up' : 'down'}`;
    }

    function updateTickers() {
        visuals.tickerItems.forEach(item => {
            const span = item.querySelector('span');
            let currentVal = parseFloat(span.innerText);
            const change = (Math.random() - 0.5) * 0.15;
            const newVal = currentVal + change;
            span.innerText = `${newVal >= 0 ? '+' : ''}${newVal.toFixed(2)}%`;
            span.className = newVal >= 0 ? 'up' : 'down';
        });
    }

    // --- Listeners ---

    buttons.switches.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.switches.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            
            // Update UI context based on mode
            const slLabel = document.querySelector('label[for="stop-loss"]') || document.querySelector('.input-group label:nth-child(1)'); // Fixed selection
            // Find the SL label specifically
            const labels = document.querySelectorAll('label');
            labels.forEach(l => {
                if(l.innerText.includes('Stop Loss')) {
                    l.innerText = currentMode === 'forex' ? 'Stop Loss (Pips)' : 'Stop Loss (Points)';
                }
            });

            calculate();
        });
    });

    // Add listeners to ALL inputs for instant dynamism
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', calculate);
        input.addEventListener('change', calculate);
    });

    buttons.calculate.addEventListener('click', () => {
        calculate();
        // Add a "calculating" ripple effect
        buttons.calculate.style.opacity = '0.7';
        setTimeout(() => buttons.calculate.style.opacity = '1', 200);
    });

    buttons.save.addEventListener('click', saveTrade);
    buttons.clear.addEventListener('click', () => {
        if(confirm('Are you sure you want to clear your trade journal?')) {
            tradeHistory = [];
            localStorage.removeItem('tradeHistory');
            renderHistory();
        }
    });

    // Init
    setInterval(updateTickers, 2500);
    setInterval(updateMarketInfo, 1500);
    calculate();
    renderHistory();
});
