document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentAsset = 'forex';
    let vaultData = JSON.parse(localStorage.getItem('tradeVault')) || [];
    let targets = [
        { id: 1, weight: 50, price: 0 },
        { id: 2, weight: 50, price: 0 }
    ];

    // --- Element Mapping ---
    const inputs = {
        balance: document.getElementById('balance'),
        risk: document.getElementById('risk-percent'),
        entry: document.getElementById('entry'),
        sl: document.getElementById('sl'),
        commission: document.getElementById('commission'),
        slippage: document.getElementById('slippage')
    };

    const outputs = {
        size: document.getElementById('res-size'),
        risk: document.getElementById('res-risk'),
        profit: document.getElementById('res-profit'),
        rr: document.getElementById('res-rr'),
        win: document.getElementById('res-win'),
        endBal: document.getElementById('proj-end'),
        growth: document.getElementById('proj-growth')
    };

    const components = {
        vaultBody: document.getElementById('vault-body'),
        barReward: document.getElementById('bar-reward'),
        barRisk: document.getElementById('bar-risk'),
        chartBars: document.getElementById('chart-bars'),
        correlationMatrix: document.getElementById('correlation-matrix'),
        ticker: document.getElementById('main-ticker')
    };

    // --- Core Calculation Engine ---

    function calculate() {
        const balance = parseFloat(inputs.balance.value) || 0;
        const riskP = parseFloat(inputs.risk.value) || 0;
        const slPips = parseFloat(inputs.sl.value) || 0;
        const entry = parseFloat(inputs.entry.value) || 0;
        const commission = parseFloat(inputs.commission.value) || 0;
        const slippage = parseFloat(inputs.slippage.value) || 0;

        // 1. Position Sizing
        const riskAmount = balance * (riskP / 100);
        let size = 0;
        let sizeUnit = 'Lot';

        if (slPips > 0) {
            // Adjust SL for slippage
            const effectiveSL = slPips + slippage;
            
            if (currentAsset === 'forex') {
                size = riskAmount / (effectiveSL * 10);
                sizeUnit = 'Lots';
            } else {
                size = riskAmount / effectiveSL;
                sizeUnit = currentAsset === 'crypto' ? 'Units' : 'Shares';
            }
        }

        outputs.size.innerText = `${size.toFixed(2)} ${sizeUnit}`;
        outputs.risk.innerText = `$${riskAmount.toLocaleString()}`;

        // 2. Scaling Out & Net Profit
        const tpInputs = document.querySelectorAll('.tp-price');
        let totalReward = 0;
        let weightedRR = 0;

        tpInputs.forEach((input, index) => {
            const tpPrice = parseFloat(input.value) || 0;
            if (tpPrice > 0 && entry > 0) {
                const isLong = tpPrice > entry;
                const priceDist = Math.abs(tpPrice - entry);
                
                // Convert pips to price distance (rough)
                const pipVal = currentAsset === 'forex' ? 0.0001 : 1;
                const slDist = slPips * pipVal;
                
                if (slDist > 0) {
                    const rRatio = priceDist / slDist;
                    const weight = 1 / tpInputs.length; // Simple equal split
                    const partProfit = riskAmount * rRatio * weight;
                    totalReward += partProfit;
                    weightedRR += rRatio * weight;
                }
            }
        });

        // Add default if no targets
        if (totalReward === 0) {
            totalReward = riskAmount * 2;
            weightedRR = 2.0;
        }

        // Subtract Commissions
        const totalCommission = size * commission;
        const netProfit = totalReward - totalCommission;

        outputs.profit.innerText = `$${netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        outputs.profit.className = `value ${netProfit >= 0 ? 'text-green' : 'text-red'}`;
        outputs.rr.innerText = `1:${weightedRR.toFixed(1)}`;
        
        const winProb = (1 / (1 + weightedRR)) * 100;
        outputs.win.innerText = `${winProb.toFixed(0)}%`;

        // 3. UI Visuals
        const totalH = 100;
        const riskH = (1 / (1 + weightedRR)) * totalH;
        const rewardH = (weightedRR / (1 + weightedRR)) * totalH;

        components.barReward.style.height = `${Math.min(rewardH, 80)}%`;
        components.barRisk.style.height = `${Math.max(riskH, 20)}%`;

        generateEquityProjection(balance, riskP, weightedRR);
    }

    // --- Advanced Features ---

    function generateEquityProjection(startBal, riskP, rr) {
        components.chartBars.innerHTML = '';
        let currentBal = startBal;
        const trades = 100;
        const winRate = 0.45; // Default pro winrate

        for (let i = 0; i < trades; i++) {
            const isWin = Math.random() < winRate;
            const riskAmt = currentBal * (riskP / 100);
            
            if (isWin) {
                currentBal += riskAmt * rr;
            } else {
                currentBal -= riskAmt;
            }

            const bar = document.createElement('div');
            bar.className = 'c-bar';
            const height = (currentBal / (startBal * 3)) * 100; // Relative to 3x start
            bar.style.height = `${Math.min(height, 100)}%`;
            components.chartBars.appendChild(bar);
        }

        outputs.endBal.innerText = `$${currentBal.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        const growth = ((currentBal - startBal) / startBal) * 100;
        outputs.growth.innerText = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    }

    function initCorrelation() {
        const pairs = ['EURUSD', 'BTCUSD', 'GOLD', 'TSLA', 'SPX', 'ETHUSD', 'GBPUSD', 'OIL'];
        components.correlationMatrix.innerHTML = pairs.slice(0, 8).map(p => `
            <div class="corr-item">
                <span class="corr-val">${(Math.random() * 2 - 1).toFixed(2)}</span>
                <span class="corr-pair">${p}</span>
            </div>
        `).join('');
    }

    function initTicker() {
        const assets = [
            { name: 'BTC/USD', price: 64230.50 },
            { name: 'EUR/USD', price: 1.0842 },
            { name: 'XAU/USD', price: 2341.20 },
            { name: 'AAPL', price: 172.50 },
            { name: 'ETH/BTC', price: 0.0521 }
        ];

        components.ticker.innerHTML = assets.map(a => `
            <div class="ticker-item" data-price="${a.price}">
                ${a.name} <span class="up">+0.00%</span>
            </div>
        `).join('') + components.ticker.innerHTML; // Duplicate for loop
    }

    function updateLiveMarket() {
        const items = document.querySelectorAll('.ticker-item');
        items.forEach(item => {
            const span = item.querySelector('span');
            const change = (Math.random() - 0.5) * 0.2;
            const currentVal = parseFloat(span.innerText);
            const newVal = currentVal + change;
            span.innerText = `${newVal >= 0 ? '+' : ''}${newVal.toFixed(2)}%`;
            span.className = newVal >= 0 ? 'up' : 'down';
        });

        // Update correlation occasionally
        if (Math.random() > 0.9) initCorrelation();
    }

    // --- Event Listeners ---

    document.querySelectorAll('.asset-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.asset-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentAsset = tab.dataset.asset;
            calculate();
        });
    });

    [...Object.values(inputs)].forEach(input => {
        input.addEventListener('input', calculate);
    });

    document.getElementById('add-tp').addEventListener('click', () => {
        const list = document.getElementById('tp-list');
        const count = list.children.length + 1;
        const div = document.createElement('div');
        div.className = 'tp-item';
        div.innerHTML = `<label>TP ${count}</label><input type="number" class="tp-price" placeholder="Target ${count}">`;
        list.appendChild(div);
        div.querySelector('input').addEventListener('input', calculate);
        calculate();
    });

    document.getElementById('save-btn').addEventListener('click', () => {
        const trade = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            asset: currentAsset.toUpperCase(),
            rr: outputs.rr.innerText,
            profit: outputs.profit.innerText,
            status: 'PLANNED'
        };
        vaultData.unshift(trade);
        localStorage.setItem('tradeVault', JSON.stringify(vaultData));
        renderVault();
    });

    function renderVault() {
        document.getElementById('vault-body').innerHTML = vaultData.map(v => `
            <tr>
                <td>${v.time}</td>
                <td><strong>${v.asset}</strong></td>
                <td>${v.rr}</td>
                <td class="text-green">${v.profit}</td>
                <td><span class="pill">${v.status}</span></td>
            </tr>
        `).join('');
    }

    // --- Init ---
    initTicker();
    initCorrelation();
    setInterval(updateLiveMarket, 2000);
    calculate();
    renderVault();
});
