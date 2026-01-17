// Reaction Time Test Logic
const startBtn = document.getElementById('start-btn');
const testArea = document.getElementById('test-area');
const trigger = document.getElementById('trigger');
const resultDiv = document.getElementById('result');

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
    trigger.style.flexDirection = 'column';
    trigger.style.justifyContent = 'center';
    trigger.style.alignItems = 'center';
    trigger.style.height = '80vh';
    trigger.style.fontWeight = 'bold';
    trigger.style.fontSize = '6vw';
    trigger.style.textAlign = 'center';
    startTime = performance.now();
    resultDiv.textContent = '';
    resultDiv.style.display = 'block';
}

function hideTrigger() {
    trigger.textContent = '';
    trigger.style.display = 'flex';
    resultDiv.textContent = '';
}

function startTest() {
    testActive = true;
    responses = [];
    testStartTimestamp = Date.now();
    // Get selected duration
    let durationMin = 6;
    const radios = document.getElementsByName('duration');
    for (const radio of radios) {
        if (radio.checked) {
            if (radio.value === 'custom') {
                const customVal = parseInt(document.getElementById('custom-duration').value, 10);
                if (!isNaN(customVal) && customVal > 0) durationMin = customVal;
            } else {
                durationMin = parseInt(radio.value, 10) / 60;
            }
        }
    }
    testDuration = durationMin * 60 * 1000;
    document.getElementById('main-container').style.display = 'none';
    testArea.classList.remove('hidden');
    // Clear all test area content for blank page
    trigger.textContent = '';
    resultDiv.textContent = '';
    nextAttempt();
}

// Enable/disable custom duration input
const customRadio = document.getElementById('custom-radio');
const customInput = document.getElementById('custom-duration');
if (customRadio && customInput) {
    for (const radio of document.getElementsByName('duration')) {
        radio.addEventListener('change', function() {
            customInput.disabled = !customRadio.checked;
        });
    }
}

function endTest() {
    // Calculate metrics
    const mean = harmonicMean(responses);
    const validCount = responses.filter(r => r.valid).length;
    const validPercentage = responses.length > 0 ? ((validCount / responses.length) * 100).toFixed(1) : '0.0';
    // Store metrics in localStorage for the summary page
    localStorage.setItem('harmonicMean', mean ? mean.toFixed(1) : '--');
    localStorage.setItem('validPercentage', validPercentage);
    // Redirect to summary page
    window.location.href = '/test-complete/';
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
    if (!testActive) return;
    if (e.code === 'Space') {
        if (startTime) {
            // Normal response to READY
            const responseTime = performance.now() - startTime;
            const valid = responseTime >= 100 && responseTime <= 450;
            responses.push({
                timestamp: Date.now(),
                responseTime,
                valid
            });
            if (valid) {
                resultDiv.textContent = `${responseTime.toFixed(0)} ms`;
                resultDiv.style.color = '#6cffb2'; // lighter green
            } else {
                resultDiv.textContent = `FAIL: ${responseTime.toFixed(0)} ms`;
                resultDiv.style.color = '#ff4d4d'; // red
            }
            resultDiv.style.fontSize = '2.5vw';
            resultDiv.style.fontWeight = 'bold';
            resultDiv.style.textAlign = 'center';
            resultDiv.style.marginTop = '2vh';
            startTime = null;
            setTimeout(nextAttempt, 500);
        } else {
            // Spacebar pressed when READY is not visible
            responses.push({
                timestamp: Date.now(),
                responseTime: 0,
                valid: false
            });
            resultDiv.textContent = `FAIL: Too Early`;
            resultDiv.style.color = '#ff4d4d';
            resultDiv.style.fontSize = '2.5vw';
            resultDiv.style.fontWeight = 'bold';
            resultDiv.style.textAlign = 'center';
            resultDiv.style.marginTop = '2vh';
            setTimeout(nextAttempt, 500);
        }
    }
}


function handlePointerEvent(e) {
    // Only count left mouse button or any touch
    if (e.type === 'mousedown' && e.button !== 0) return;
    // Simulate a spacebar press
    handleKeydown({ code: 'Space' });
}

document.addEventListener('keydown', handleKeydown);
document.addEventListener('mousedown', handlePointerEvent);
document.addEventListener('touchstart', handlePointerEvent);
startBtn.addEventListener('click', startTest);

function harmonicMean(arr) {
    const validResponses = arr.filter(r => r.valid);
    if (validResponses.length === 0) return 0;
    const n = validResponses.length;
    const sumReciprocals = validResponses.reduce((sum, r) => sum + 1 / r.responseTime, 0);
    return n / sumReciprocals;
}
