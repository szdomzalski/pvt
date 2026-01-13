// Reaction Time Test Logic
const startBtn = document.getElementById('start-btn');
const testArea = document.getElementById('test-area');
const trigger = document.getElementById('trigger');
const resultDiv = document.getElementById('result');
const timerDiv = document.getElementById('timer');
const summaryDiv = document.getElementById('summary');

let testActive = false;
let startTime = null;
let timeoutId = null;
let responses = [];
let testStartTimestamp = null;
let testDuration = 0;
let minTestDuration = 6 * 60 * 1000; // 6 minutes
let maxTestDuration = 10 * 60 * 1000; // 10 minutes

function randomDelay() {
    return 1000 + Math.random() * 8000; // 1s to 9s
}

function showTrigger() {
    trigger.textContent = 'READY';
    trigger.style.color = '#00e676';
    trigger.style.display = 'flex';
    trigger.style.justifyContent = 'center';
    trigger.style.alignItems = 'center';
    trigger.style.height = '80vh';
    trigger.style.fontWeight = 'bold';
    trigger.style.fontSize = '6vw';
    trigger.style.textAlign = 'center';
    startTime = performance.now();
    resultDiv.textContent = '';
}

function hideTrigger() {
    trigger.textContent = '';
    trigger.style.display = 'flex';
}

function startTest() {
    testActive = true;
    responses = [];
    testStartTimestamp = Date.now();
    testDuration = minTestDuration + Math.random() * (maxTestDuration - minTestDuration);
    document.getElementById('main-container').style.display = 'none';
    testArea.classList.remove('hidden');
    summaryDiv.classList.add('hidden');
    // Clear all test area content for blank page
    trigger.textContent = '';
    resultDiv.textContent = '';
    nextAttempt();
}

function endTest() {
    document.getElementById('main-container').style.display = '';
    testArea.classList.add('hidden');
    showSummary();
}

function nextAttempt() {
    hideTrigger();
    if (!testActive) return;
    if (Date.now() - testStartTimestamp >= testDuration) {
        endTest();
        return;
    }
    timeoutId = setTimeout(() => {
        showTrigger();
    }, randomDelay());
}

function handleKeydown(e) {
    if (!testActive || !startTime) return;
    if (e.code === 'Space') {
        const responseTime = performance.now() - startTime;
        const valid = responseTime >= 100 && responseTime <= 450;
        responses.push({
            timestamp: Date.now(),
            responseTime,
            valid
        });
        resultDiv.textContent = valid ? `Good! Reaction: ${responseTime.toFixed(0)} ms` : `Fail! Reaction: ${responseTime.toFixed(0)} ms`;
        startTime = null;
        setTimeout(nextAttempt, 500);
    }
}

document.addEventListener('keydown', handleKeydown);
startBtn.addEventListener('click', startTest);

function harmonicMean(arr) {
    const validResponses = arr.filter(r => r.valid);
    if (validResponses.length === 0) return 0;
    const n = validResponses.length;
    const sumReciprocals = validResponses.reduce((sum, r) => sum + 1 / r.responseTime, 0);
    return n / sumReciprocals;
}

function showSummary() {
    const mean = harmonicMean(responses);
    let html = `<h2>Test Complete</h2>`;
    html += `<p>Attempts: ${responses.length}</p>`;
    html += `<p>Harmonic Mean (valid): ${mean ? mean.toFixed(1) : 'N/A'} ms</p>`;
    html += `<table style="margin:0 auto;"><tr><th>#</th><th>Time (ms)</th><th>Valid</th></tr>`;
    responses.forEach((r, i) => {
        html += `<tr><td>${i+1}</td><td>${r.responseTime.toFixed(0)}</td><td>${r.valid ? '✔️' : '❌'}</td></tr>`;
    });
    html += `</table>`;
    summaryDiv.innerHTML = html;
    summaryDiv.classList.remove('hidden');
    // TODO: Send data to backend via fetch
}
