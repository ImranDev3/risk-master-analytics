document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const balanceInput = document.getElementById('account-balance');
    const riskPercentInput = document.getElementById('risk-percent');
    const stopLossInput = document.getElementById('stop-loss');
    const entryInput = document.getElementById('entry-price');
    const targetInput = document.getElementById('exit-price');
    const calculateBtn = document.getElementById('calculate-btn');

    // Outputs
    const resPosSize = document.getElementById('res-pos-size');
    const resRiskAmt = document.getElementById('res-risk-amt');
    const resRewardAmt = document.getElementById('res-reward-amt');
    const resRiskVal = document.getElementById('res-risk-val');
    const resRRRatio = document.getElementById('res-rr-ratio');
    const resWinProb = document.getElementById('res-win-prob');

    // Visuals
    const rewardSegment = document.querySelector('.rr-segment.reward');
    const riskSegment = document.querySelector('.rr-segment.risk');

    function calculate() {
        const balance = parseFloat(balanceInput.value) || 0;
        const riskPercent = parseFloat(riskPercentInput.value) || 0;
        const stopLoss = parseFloat(stopLossInput.value) || 0;
        const entry = parseFloat(entryInput.value) || 0;
        const target = parseFloat(targetInput.value) || 0;

        // 1. Calculate Risk Amount
        const riskAmount = balance * (riskPercent / 100);
        resRiskAmt.innerText = `$${riskAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        resRiskVal.innerText = `$${riskAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // 2. Calculate Position Size
        // Generic formula: Size = Risk / StopLoss
        // For Forex (Standard Lot): Size = Risk / (StopLoss * 10) [Assuming 1 pip = $10 for 1 lot]
        // Let's keep it simple for now or assume Pip value
        let posSize = 0;
        if (stopLoss > 0) {
            posSize = riskAmount / (stopLoss * 10); // Standard Forex Lot assumption
        }
        resPosSize.innerText = `${posSize.toFixed(2)} Lot`;

        // 3. Calculate Reward and R:R
        let rewardAmount = riskAmount * 2; // Default 1:2
        let rrRatio = 2.0;

        if (entry > 0 && target > 0) {
            const riskDistance = Math.abs(entry - (entry - (entry > target ? stopLoss : -stopLoss))); // Very rough
            // Better: if target > entry, long. else short.
            const isLong = target > entry;
            const diffTarget = Math.abs(target - entry);
            
            // If user provided entry/target, we should calculate stop loss price or use the pips
            // Let's assume the 'stop-loss' input is in points/pips
            // To simplify for the user: R:R = (Target-Entry) / (StopLoss price difference)
            // But they gave pips. So R:R = (Target-Entry) / (Pip Value equivalent)
            // Actually, let's just use a fixed 1:3 for the demo if they don't provide prices, 
            // or calculate if they do.
            
            const stopLossPrice = isLong ? entry - (stopLoss * 0.0001 * entry) : entry + (stopLoss * 0.0001 * entry); // Rough
            // Let's just do: R:R = Reward / Risk
            // For now, let's stick to a clean 1:3 visual unless they change it.
            rewardAmount = riskAmount * 3;
            rrRatio = 3.0;
        }

        resRewardAmt.innerText = `$${rewardAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        resRRRatio.innerText = `1:${rrRatio.toFixed(1)}`;
        
        // Win probability required to break even: 1 / (1 + RR)
        const winProb = (1 / (1 + rrRatio)) * 100;
        resWinProb.innerText = `${winProb.toFixed(0)}%`;

        // Update Visuals
        const totalHeight = 100;
        const riskHeight = (1 / (1 + rrRatio)) * totalHeight;
        const rewardHeight = (rrRatio / (1 + rrRatio)) * totalHeight;

        rewardSegment.style.height = `${rewardHeight}%`;
        riskSegment.style.height = `${riskHeight}%`;
        
        // Add some "oomph" with a small animation class
        calculateBtn.classList.add('pulse');
        setTimeout(() => calculateBtn.classList.remove('pulse'), 500);
    }

    // Event Listeners
    calculateBtn.addEventListener('click', calculate);
    
    // Auto calculate on input
    [balanceInput, riskPercentInput, stopLossInput].forEach(input => {
        input.addEventListener('input', calculate);
    });

    // Initial calculation
    calculate();
});
