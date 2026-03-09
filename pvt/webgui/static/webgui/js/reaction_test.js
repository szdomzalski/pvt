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

    // === Error Handling ===
    function checkDomElements() {
        const missing = [];
        if (!startButton) missing.push('start-btn');
        if (!testArea) missing.push('test-area');
        if (!triggerDiv) missing.push('trigger');
        if (!resultDiv) missing.push('result');
        if (!customDurationRadio) missing.push('custom-radio');
        if (!customDurationInput) missing.push('custom-duration');
        if (missing.length > 0) {
            console.error('Missing DOM elements:', missing.join(', '));
            alert('Critical error: Missing DOM elements: ' + missing.join(', '));
            return false;
        }
        return true;
    }

    if (!checkDomElements()) {
        // Prevent further execution if critical elements are missing
        return;
    }

    // === State Variables ===
    let isTestActive = false;
    let readyTimestamp = null; // Absolute time when READY is shown (Date.now())
    let attempts = [];
    let testStartTimestamp = null; // Absolute time when test starts (Date.now())
    let testDurationMs = 0;
    let inputReceived = false; // Debounce flag: only allow first input after READY
    let autoFailTimeout = null; // Timer for auto-fail

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

    /**
     * Returns a random delay between 1 and 9 seconds (in ms)
     * @returns {number} Delay in milliseconds
     */
    function getRandomDelay() {
        return RANDOM_DELAY_MIN_MS + Math.random() * RANDOM_DELAY_RANGE_MS;
    }

    // === Accessibility Improvements: Keyboard Only ===
    triggerDiv.setAttribute('tabindex', '-1');
    resultDiv.setAttribute('tabindex', '-1');
    testArea.setAttribute('tabindex', '-1');

    /**
     * Displays the READY trigger and prepares for user reaction
     */
    function showReadyTrigger() {
        triggerDiv.textContent = 'READY';
        triggerDiv.classList.remove('d-none');
        readyTimestamp = Date.now();
        inputReceived = false;
        resultDiv.textContent = '';
        // resultDiv.style.display = 'block';
        // resultDiv.classList.remove('text-success', 'text-danger');
        resultDiv.classList.add('d-none')
        // Accessibility: focus trigger
        // triggerDiv.focus();
        // Start auto-fail timer
        autoFailTimeout = setTimeout(() => {
            if (!inputReceived) {
                attempts.push({
                    timestamp: Date.now(),
                    duration: 0,
                    valid: false
                });
                showFailResult('FAIL: No Response');
            }
        }, AUTO_FAIL_MS);
    }

    /**
     * Hides the READY trigger and clears the result
     */
    function hideReadyTrigger() {
        triggerDiv.textContent = '';  // It looks like there a problem with these classes on the page (bad styling)
        triggerDiv.classList.add('d-none');
        inputReceived = false;
        // Clear auto-fail timer if still running
        if (autoFailTimeout) {
            clearTimeout(autoFailTimeout);
            autoFailTimeout = null;
        }
        resultDiv.textContent = '';
        // resultDiv.classList.remove('text-success', 'text-danger');
        resultDiv.classList.add('d-none');
    }

    /**
     * Starts the test, sets the duration, and initializes state
     */
    function beginTest() {
        isTestActive = true;
        attempts = [];
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
        testDurationMs = durationMin * 60 * 1000;
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
        setTimeout(() => {
            showReadyTrigger();
        }, getRandomDelay());
    }

    /**
     * Handles keyboard (spacebar) reactions
     * @param {KeyboardEvent} e
     */
    function handleReactionKey(e) {
        if (!isTestActive) return;
        if (inputReceived) return; // Debounce: ignore subsequent inputs
        if (e.code === 'Space') {
            inputReceived = true;
            // Clear auto-fail timer
            if (autoFailTimeout) {
                clearTimeout(autoFailTimeout);
                autoFailTimeout = null;
            }
            if (readyTimestamp) {
                const reactionDuration = Date.now() - readyTimestamp;
                const valid = reactionDuration >= REACTION_MIN_MS && reactionDuration <= REACTION_MAX_MS;
                attempts.push({
                    timestamp: Date.now(),
                    duration: reactionDuration,
                    valid
                });
                if (valid) {
                    resultDiv.textContent = `${reactionDuration.toFixed(0)} ms`;
                    resultDiv.classList.add('text-success');
                    resultDiv.classList.remove('text-danger', 'd-none');
                } else {
                    showFailResult(`FAIL: ${reactionDuration.toFixed(0)} ms`);
                }
                readyTimestamp = null;
                setTimeout(scheduleNextAttempt, FAIL_DISPLAY_MS);
            } else {
                attempts.push({
                    timestamp: Date.now(),
                    duration: 0,
                    valid: false
                });
                showFailResult('FAIL: Too Early');
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

    // Event listeners for user input
    document.addEventListener('keydown', handleReactionKey);
    document.addEventListener('mousedown', handleReactionPointer);
    document.addEventListener('touchstart', handleReactionPointer);
    startButton.addEventListener('click', beginTest);

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

    /**
     * Shows FAIL result and schedules next attempt
     * @param {string} message - The fail message to display
     */
    function showFailResult(message) {
        resultDiv.textContent = message;
        resultDiv.classList.add('text-danger');
        resultDiv.classList.remove('text-success', 'd-none');
        // Accessibility: focus result
        // resultDiv.focus();  # Focus causes some problems with white frame when using spacebar
        // TODO: there is a problem with logic as well - sometimes fail messages appear and are counted as fails however there should be no fail
        setTimeout(scheduleNextAttempt, FAIL_DISPLAY_MS);
    }

})();
