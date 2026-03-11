// Reaction Time Test Logic


(function () {
    'use strict';

    // === DOM Elements ===
    const startButton = document.getElementById('start-btn');
    const testArea = document.getElementById('test-area');
    const triggerDiv = document.getElementById('trigger');
    const resultDiv = document.getElementById('result');
    const customDurationRadio = document.getElementById('custom-radio');
    const customDurationInput = document.getElementById('custom-duration');

    // === State Variables ===
    let isTestActive = false;
    let readyTimestamp = null;
    let attempts = [];
    let testStartTimestamp = null;
    let testDurationMs = 0;
    let inputReceived = false;
    let autoFailTimeout = null;
    let delayTimeout = null;

    // === Constants ===
    const REACTION_MIN_MS = 100;
    const REACTION_MAX_MS = 450;
    const FAIL_DISPLAY_MS = 500;
    const AUTO_FAIL_MS = 1500;
    const RANDOM_DELAY_MIN_MS = 1000;
    const RANDOM_DELAY_RANGE_MS = 8000;

    // === Event Listeners ===
    if (customDurationRadio && customDurationInput) {
        for (const radio of document.getElementsByName('duration')) {
            radio.addEventListener('change', function() {
                customDurationInput.disabled = !customDurationRadio.checked;
            });
        }
    }
    document.addEventListener('keydown', handleReactionKey);
    document.addEventListener('mousedown', handleReactionPointer);
    document.addEventListener('touchstart', handleReactionPointer);
    startButton.addEventListener('click', beginTest);

    // === Timer Helpers ===

    function clearAutoFail() {
        if (autoFailTimeout) {
            clearTimeout(autoFailTimeout);
            autoFailTimeout = null;
        }
    }

    function clearDelay() {
        if (delayTimeout) {
            clearTimeout(delayTimeout);
            delayTimeout = null;
        }
    }

    /**
     * Returns a random delay between 1 and 9 seconds (in ms)
     * @returns {number}
     */
    function getRandomDelay() {
        return RANDOM_DELAY_MIN_MS + Math.random() * RANDOM_DELAY_RANGE_MS;
    }

    /**
     * Displays a result message and schedules the next attempt
     * @param {string} message
     * @param {boolean} isSuccess
     */
    function showResult(message, isSuccess) {
        resultDiv.textContent = message;
        if (isSuccess) {
            resultDiv.classList.add('text-success');
            resultDiv.classList.remove('text-danger', 'd-none');
        } else {
            resultDiv.classList.add('text-danger');
            resultDiv.classList.remove('text-success', 'd-none');
        }
        setTimeout(scheduleNextAttempt, FAIL_DISPLAY_MS);
    }

    /**
     * Displays the READY trigger and prepares for user reaction
     */
    function showReadyTrigger() {
        triggerDiv.textContent = 'READY';
        triggerDiv.classList.remove('d-none');
        readyTimestamp = performance.now();
        inputReceived = false;
        resultDiv.textContent = '';
        resultDiv.classList.add('d-none');
        autoFailTimeout = setTimeout(() => {
            if (!inputReceived) {
                inputReceived = true;
                readyTimestamp = null;
                attempts.push({
                    timestamp: Date.now(),
                    duration: 0,
                    valid: false
                });
                showResult('FAIL: No Response', false);
            }
        }, AUTO_FAIL_MS);
    }

    /**
     * Hides the READY trigger and clears the result
     */
    function hideReadyTrigger() {
        triggerDiv.textContent = '';
        triggerDiv.classList.add('d-none');
        inputReceived = false;
        readyTimestamp = null;
        clearAutoFail();
        clearDelay();
        resultDiv.textContent = '';
        resultDiv.classList.remove('text-success', 'text-danger');
        resultDiv.classList.add('d-none');
    }

    /**
     * Returns the selected test duration in milliseconds
     * @returns {number}
     */
    function getSelectedDurationMs() {
        let durationMin = 6;
        const radios = document.getElementsByName('duration');
        for (const radio of radios) {
            if (radio.checked) {
                if (radio.value === 'custom') {
                    const customVal = parseInt(customDurationInput.value, 10);
                    if (!isNaN(customVal) && customVal > 0) durationMin = customVal;
                } else {
                    durationMin = parseInt(radio.value, 10) / 60;
                }
            }
        }
        return durationMin * 60 * 1000;
    }

    /**
     * Starts the test
     */
    function beginTest() {
        isTestActive = true;
        attempts = [];
        testStartTimestamp = Date.now();
        testDurationMs = getSelectedDurationMs();
        document.getElementById('main-container').classList.add('d-none');
        testArea.classList.remove('d-none');
        triggerDiv.textContent = '';
        resultDiv.textContent = '';
        scheduleNextAttempt();
    }

    /**
     * Ends the test, stores metrics in localStorage, and redirects to summary page
     */
    function finishTest() {
        isTestActive = false;
        const mean = calculateHarmonicMean(attempts);
        const validCount = attempts.filter(a => a.valid).length;
        const validPercentage = attempts.length > 0 ? ((validCount / attempts.length) * 100).toFixed(1) : '0.0';
        localStorage.setItem('harmonicMean', mean ? mean.toFixed(1) : '--');
        localStorage.setItem('validPercentage', validPercentage);
        window.location.href = '/test-complete/';
    }

    /**
     * Schedules the next attempt or ends the test if duration elapsed
     */
    function scheduleNextAttempt() {
        hideReadyTrigger();
        if (!isTestActive) return;
        if (Date.now() - testStartTimestamp >= testDurationMs) {
            finishTest();
            return;
        }
        delayTimeout = setTimeout(() => {
            delayTimeout = null;
            showReadyTrigger();
        }, getRandomDelay());
    }

    /**
     * Handles keyboard (spacebar) reactions
     * @param {KeyboardEvent} e
     */
    function handleReactionKey(e) {
        if (!isTestActive) return;
        if (inputReceived) return;
        if (e.code === 'Space') {
            if (e.preventDefault) e.preventDefault();
            inputReceived = true;
            clearAutoFail();
            if (readyTimestamp) {
                const reactionDuration = performance.now() - readyTimestamp;
                const valid = reactionDuration >= REACTION_MIN_MS && reactionDuration <= REACTION_MAX_MS;
                attempts.push({
                    timestamp: Date.now(),
                    duration: reactionDuration,
                    valid
                });
                readyTimestamp = null;
                if (valid) {
                    showResult(`${reactionDuration.toFixed(0)} ms`, true);
                } else {
                    showResult(`FAIL: ${reactionDuration.toFixed(0)} ms`, false);
                }
            } else {
                clearDelay();
                attempts.push({
                    timestamp: Date.now(),
                    duration: 0,
                    valid: false
                });
                showResult('FAIL: Too Early', false);
            }
        }
    }

    /**
     * Handles mouse/touch reactions as spacebar
     * @param {MouseEvent|TouchEvent} e
     */
    function handleReactionPointer(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        handleReactionKey({ code: 'Space' });
    }

    /**
     * Calculates the harmonic mean of valid attempt durations
     * @param {Array<{duration: number, valid: boolean}>} arr
     * @returns {number}
     */
    function calculateHarmonicMean(arr) {
        const validResponses = arr.filter(a => a.valid);
        if (validResponses.length === 0) return 0;
        const n = validResponses.length;
        const sumReciprocals = validResponses.reduce((sum, a) => sum + 1 / a.duration, 0);
        return n / sumReciprocals;
    }

})();
