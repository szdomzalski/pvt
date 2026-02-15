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
    let readyTimestamp = null; // Absolute time when READY is shown (Date.now())
    let attempts = [];
    let testStartTimestamp = null; // Absolute time when test starts (Date.now())
    let testDurationMs = 0;
    let inputReceived = false; // Debounce flag: only allow first input after READY

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
            return 1000 + Math.random() * 8000;
        }

        /**
         * Displays the READY trigger and prepares for user reaction
         */
        function showReadyTrigger() {
            triggerDiv.textContent = 'READY';
            triggerDiv.classList.add('trigger-ready');
            readyTimestamp = Date.now();
            inputReceived = false;
            resultDiv.textContent = '';
            resultDiv.style.display = 'block';
            resultDiv.classList.remove('result-success', 'result-fail');
        }

        /**
         * Hides the READY trigger and clears the result
         */
        function hideReadyTrigger() {
            triggerDiv.textContent = '';
            triggerDiv.classList.remove('trigger-ready');
            inputReceived = false;
            resultDiv.textContent = '';
            resultDiv.classList.remove('result-success', 'result-fail');
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
            document.getElementById('main-container').style.display = 'none';
            testArea.classList.remove('hidden');
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
                if (readyTimestamp) {
                    const reactionDuration = Date.now() - readyTimestamp;
                    const valid = reactionDuration >= 100 && reactionDuration <= 450;
                    attempts.push({
                        timestamp: Date.now(),
                        duration: reactionDuration,
                        valid
                    });
                    if (valid) {
                        resultDiv.textContent = `${reactionDuration.toFixed(0)} ms`;
                        resultDiv.classList.add('result-success');
                        resultDiv.classList.remove('result-fail');
                    } else {
                        resultDiv.textContent = `FAIL: ${reactionDuration.toFixed(0)} ms`;
                        resultDiv.classList.add('result-fail');
                        resultDiv.classList.remove('result-success');
                    }
                    readyTimestamp = null;
                    setTimeout(scheduleNextAttempt, 500);
                } else {
                    attempts.push({
                        timestamp: Date.now(),
                        duration: 0,
                        valid: false
                    });
                    resultDiv.textContent = `FAIL: Too Early`;
                    resultDiv.classList.add('result-fail');
                    resultDiv.classList.remove('result-success');
                    setTimeout(scheduleNextAttempt, 500);
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

})();
