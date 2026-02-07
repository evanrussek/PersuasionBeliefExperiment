var jsPsychStickAdvocateWM = (function (jspsych) {
    'use strict';

    // ───────────────────────────────────────────────────────────────────────────────
    // PLUGIN INFO: Defines parameters for the stick selection + WM trial
    // ───────────────────────────────────────────────────────────────────────────────
    const info = {
        name: "stick-advocate-wm",
        parameters: {
            stick_lengths: {
                type: jspsych.ParameterType.ARRAY,
                pretty_name: 'Stick Length Values',
                default: [],
                description: 'Heights for each stick, already ordered ascending.'
            },
            N_Sticks_Drawn: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Number of Sticks Drawn',
                default: 10
            },
            N_Sticks_Covered: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Number of Sticks to Cover',
                default: 5
            },
            trial_number: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Trial Number',
                default: 1
            },
            total_trials: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Total Trials',
                default: 1
            },
            button_label: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Button label',
                default: 'Continue'
            },
            incentive_condition: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Incentive Condition',
                default: 'Accurate',
                description: 'One of "High", "Low", or "Accurate".'
            }
        }
    };

    // ───────────────────────────────────────────────────────────────────────────────
    // MAIN PLUGIN CLASS: Handles the three-stage trial (selection + WM + guessing)
    // ───────────────────────────────────────────────────────────────────────────────
    class StickAdvocateWMPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        // ───────────────────────────────────────────────────────────────────────────────
        // TRIAL EXECUTION: Main trial function that runs the selection, WM task, and guessing stages
        // ───────────────────────────────────────────────────────────────────────────────
        trial(display_element, trial) {
            // ── TRIAL STATE VARIABLES ──
            const selected = Array(trial.stick_lengths.length).fill(false);
            let click_order = [];
            const start_time = performance.now();
            let selection_rt = null;
            let bad_guess_count = 0;
            let wm_task_data = null;

            // ───────────────────────────────────────────────────────────────────────────────
            // HELPER FUNCTIONS
            // ───────────────────────────────────────────────────────────────────────────────

            // Generate HTML for all sticks with their current selection state
            function sticksHTML() {
                let html = '';
                for (let i = 0; i < trial.stick_lengths.length; i++) {
                    html +=
                        '<div class="stick-container">' +
                            '<div class="stick-wrapper" data-idx="' + i + '">' +
                                '<div class="stick" style="height:' + trial.stick_lengths[i] + 'px;"></div>' +
                                '<div class="stick-length">' + trial.stick_lengths[i] + '</div>' +
                                '<div class="rectangle" style="' + (selected[i] ? 'display: block;' : 'display: none;') + '"></div>' +
                            '</div>' +
                        '</div>';
                }
                return html;
            }

            // Count how many sticks are currently selected/covered
            function selectedCount() {
                return selected.reduce((a, b) => a + (b ? 1 : 0), 0);
            }

            // Build concise condition reminder about the judge and the goal
            function conditionReminderHTML() {
                const c = (trial.incentive_condition || 'Accurate').toLowerCase();
                let goalLine;
                if (c === 'high') {
                    goalLine = 'Judge to make <strong>HIGHER</strong> guess';
                } else if (c === 'low') {
                    goalLine = 'Judge to make <strong>LOWER</strong> guess';
                } else {
                    goalLine = 'Judge to make <strong>ACCURATE</strong> guess';
                }
                return (
                    '<p><strong>Your goal:</strong> ' + goalLine + '.<br>' +
                    '<strong>Number of sticks to cover:</strong> ' + trial.N_Sticks_Covered + '</p>'
                );
            }

            // ───────────────────────────────────────────────────────────────────────────────
            // STAGE 1: SELECTION PHASE - User clicks sticks to cover them
            // ───────────────────────────────────────────────────────────────────────────────
            function render() {
                // Build instruction text for the selection phase
                const roundHeader = (trial.total_trials && trial.total_trials > 1)
                    ? `<p><strong>Round ${trial.trial_number} of ${trial.total_trials}</strong></p>`
                    : '';

                const top =
                    `${roundHeader}
                     ${conditionReminderHTML()}
                     <p>${trial.N_Sticks_Drawn} new sticks were drawn, with random values between 1 and 100. You need to cover ${trial.N_Sticks_Covered} of these sticks.</p>
                     <p>Your goal is to select sticks that will cause the judge to make a <strong>${trial.incentive_condition === 'High' ? 'HIGHER' : trial.incentive_condition === 'Low' ? 'LOWER' : 'MORE ACCURATE'}</strong> guess about the mean of all the drawn sticks.</p>
                     <p>The judge will guess the mean of all the drawn sticks (including the ones you choose to cover). They will only see the heights of the sticks that you don't cover. They will not see the sticks that you cover, or the relative position of the uncovered sticks.</p>
                     <p>Click below on the sticks you want to cover.</p>`;

                // Build the complete selection screen HTML
                // Note: response-area is reserved but hidden to prevent layout shift later
                let screen_html =
                    '<div id="stick-trial-container">' +
                        '<div id="instruction-text">' + top + '</div>' +
                        '<div id="sticks-container">' + sticksHTML() + '</div>' +
                        `<p id="select-counter">Selected ${selectedCount()} of ${trial.N_Sticks_Covered} to cover.</p>` +
                        '<button id="continue-btn" class="jspsych-btn">' + trial.button_label + '</button>' +
                        // reserve the space for the response area so layout does not shift later
                        '<div id="response-area" class="hidden-response"></div>' +
                    '</div>';

                display_element.innerHTML = screen_html;

                // ── SET UP STICK CLICK HANDLERS ──
                // Each stick can be clicked to toggle its covered state
                Array.from(display_element.querySelectorAll('.stick-wrapper')).forEach(el => {
                    el.addEventListener('click', () => {
                        const idx = parseInt(el.getAttribute('data-idx'));
                        selected[idx] = !selected[idx];

                        // Track the order in which sticks were clicked
                        if (selected[idx]) {
                            click_order.push(idx);
                        } else {
                            click_order = click_order.filter(i => i !== idx);
                        }

                        // Update visual state and counter
                        el.querySelector('.rectangle').style.display = selected[idx] ? 'block' : 'none';
                        display_element.querySelector('#select-counter').textContent =
                            `Selected ${selectedCount()} of ${trial.N_Sticks_Covered} to cover.`;
                    });
                });

                // ── CONTINUE BUTTON VALIDATION ──
                // Only proceed if exactly the required number of sticks are covered
                display_element.querySelector('#continue-btn').addEventListener('click', () => {
                    const n = selectedCount();
                    if (n !== trial.N_Sticks_Covered) {
                        showWarning(`Please cover exactly ${trial.N_Sticks_Covered} sticks. You have selected ${n}.`);
                        return;
                    }

                    // Freeze stick interactions immediately and record selection RT
                    const container = display_element.querySelector('#stick-trial-container');
                    container.classList.add('no-pointer');

                    selection_rt = Math.round(performance.now() - start_time);

                    // Run the surprise digit-span block, then reveal the guessing stage
                    showDigitSpanStage(() => showGuessStage());
                });
            }

            // Start the trial by rendering the selection phase
            render();

            // ───────────────────────────────────────────────────────────────────────────────
            // STAGE 2: SURPRISE DIGIT-SPAN WM TASK
            // ───────────────────────────────────────────────────────────────────────────────
            const showDigitSpanStage = (doneCb) => {
                const response = display_element.querySelector('#response-area');

                response.classList.remove('hidden-response');
                response.classList.add('visible-response');

                const N_ROUNDS = 3;
                const SPAN = 5;           // 6–8 typical
                const SHOW_MS = 7000;
                const MASK_MS = 600;
                const BACKWARDS = true;   // set false for forward span

                const rounds = [];
                let r = 0;
                let t0 = null;

                const randDigits = (k) => {
                    let s = '';
                    for (let i = 0; i < k; i++) s += String(Math.floor(Math.random() * 10));
                    return s;
                };

                const renderIntro = () => {
                    response.innerHTML =
                        '<div style="max-width:700px;margin:0 auto;text-align:center;">' +
                            '<p>We now would actually like you to complete a very quick working memory task.</p>' +
                            '<p>When you press continue, we will show you 5 digits for 7 seconds. We would like you to remember these numbers.</p>' +
                            '<button id="ds-start" class="jspsych-btn" style="margin-top:12px;">Continue</button>' +
                        '</div>';

                    response.querySelector('#ds-start').onclick = () => {
                        renderShow();
                    };
                };

                const renderShow = () => {
                    if (t0 === null) {
                        t0 = performance.now();
                    }
                    const digits = randDigits(SPAN);
                    const target = BACKWARDS ? digits.split('').reverse().join('') : digits;
                    response.innerHTML =
                        '<div style="max-width:700px;margin:0 auto;text-align:center;">' +
                            '<p><strong>Quick memory task</strong></p>' +
                            `<p>Round ${r+1} / ${N_ROUNDS}</p>` +
                            `<div style="font-size:56px;font-weight:700;letter-spacing:6px;margin:16px 0;">${digits}</div>` +
                            `<p>Memorize these digits.</p>` +
                        '</div>';
                    window.setTimeout(() => {
                        renderMask(digits, target);
                    }, SHOW_MS);
                };

                const renderMask = (digits, target) => {
                    response.innerHTML =
                        '<div style="max-width:700px;margin:0 auto;text-align:center;">' +
                            '<p><strong>Quick memory task</strong></p>' +
                            `<p>Round ${r+1} / ${N_ROUNDS}</p>` +
                            `<div style="font-size:56px;font-weight:700;letter-spacing:6px;margin:16px 0;">${'•'.repeat(SPAN)}</div>` +
                        '</div>';
                    window.setTimeout(() => {
                        renderRecall(digits, target);
                    }, MASK_MS);
                };

                const renderRecall = (digits, target) => {
                    const prompt = BACKWARDS
                        ? 'Please now type these digits in <strong>reverse</strong> order:'
                        : 'Type the digits in the <strong>same order</strong>:';

                    response.innerHTML =
                        '<div style="max-width:700px;margin:0 auto;text-align:center;">' +
                            '<p><strong>Quick memory task</strong></p>' +
                            `<p>Round ${r+1} / ${N_ROUNDS}</p>` +
                            `<p>${prompt}</p>` +
                            '<input id="ds-recall" inputmode="numeric" autocomplete="off" ' +
                                   'style="font-size:28px;text-align:center;letter-spacing:6px;width:260px;" />' +
                            '<div style="margin-top:10px;">' +
                              '<button id="ds-submit" class="jspsych-btn">Submit</button>' +
                            '</div>' +
                        '</div>';

                    const start = performance.now();
                    const inp = response.querySelector('#ds-recall');
                    inp.focus();

                    response.querySelector('#ds-submit').onclick = () => {
                        const resp = (inp.value || '').replace(/\s+/g,'');
                        const rt = Math.round(performance.now() - start);
                        const correct = resp === target;

                        rounds.push({ round: r+1, digits, target, response: resp, correct, rt });
                        r += 1;

                        if (r >= N_ROUNDS) {
                            const nCorrect = rounds.filter(x => x.correct).length;
                            wm_task_data = {
                                type: BACKWARDS ? 'digit_span_backward' : 'digit_span_forward',
                                span: SPAN,
                                n_rounds: N_ROUNDS,
                                n_correct: nCorrect,
                                accuracy: nCorrect / N_ROUNDS,
                                total_time_ms: Math.round(performance.now() - t0),
                                rounds
                            };
                            doneCb();
                        } else {
                            renderShow();
                        }
                    };
                };

                renderIntro();
            };

            // ───────────────────────────────────────────────────────────────────────────────
            // STAGE 3: GUESSING PHASE - User estimates the mean of all sticks
            // ───────────────────────────────────────────────────────────────────────────────
            const showGuessStage = () => {
                // Calculate which sticks were selected (for data recording)
                const selected_indices_sorted = selected
                    .map((v, i) => v ? i : null)
                    .filter(i => i !== null);

                // ── FREEZE SELECTION AND REVEAL GUESS INPUT ──
                // Instead of re-rendering the whole screen (which would cause layout shift),
                // we fill the pre-reserved response area and disable stick interactions
                const container = display_element.querySelector('#stick-trial-container');
                container.classList.add('no-pointer');
                const response = display_element.querySelector('#response-area');

                // Build the guess prompt text (always use the "surprise" text)
                const guessPrompt = `We actually now would like you to make a guess for the average length of <strong>all</strong> ${trial.N_Sticks_Drawn} sticks (<strong>including</strong> the ones you covered). You will be additionally bonused based on the accuracy of this guess.`;

                // Fill the response area with the guess prompt and input
                response.innerHTML =
                    '<div id="guess-container">' +
                        `<p class="guess-prompt">${guessPrompt}</p>` +
                        '<label for="stick-average-guess"></label>' +
                        '<input  type="text"                              ' +
                                'id="stick-average-guess"                   ' +
                                'inputmode="decimal"                        ' +
                                'autocomplete="off"                         ' +
                                'autocorrect="off"                          ' +
                                'spellcheck="false"                         >' +
                        '<button id="submit-guess-btn" class="jspsych-btn" style="display:block;margin:10px auto 0;">Submit</button>' +
                    '</div>';

                // Reveal the response area with a smooth transition (already visible from WM task)
                response.classList.remove('hidden-response');
                response.classList.add('visible-response');

                // Start timing the guess response
                const start_time_guess = performance.now();

                // ── GUESS SUBMISSION HANDLER ──
                // Validate input and collect final trial data
                display_element.querySelector('#submit-guess-btn').addEventListener('click', () => {
                    const guessInput = document.getElementById('stick-average-guess');
                    const estimate = guessInput.value;

                    // Ensure a valid number was entered
                    if (!isNumber(estimate)) {
                        showWarning('Please enter a number for your guess.', () => {
                            bad_guess_count += 1;
                            document.getElementById('stick-average-guess')?.focus();
                        });
                        return;
                    }

                    // Calculate response time for the guess
                    const response_time_guess = Math.round(performance.now() - start_time_guess);

                    // ── COLLECT ALL TRIAL DATA ──
                    // Package everything for jsPsych data collection
                    const data_out = {
                        selected_mask: selected,
                        selected_indices_sorted: selected_indices_sorted,
                        selected_indices_clickorder: click_order,
                        selected_values: selected_indices_sorted.map(i => trial.stick_lengths[i]),
                        response_time_select: selection_rt,
                        estimate: estimate,
                        response_time_guess: response_time_guess,
                        N_Bad_Guesses: bad_guess_count,
                        N_Sticks_Drawn: trial.N_Sticks_Drawn,
                        N_Sticks_Covered: trial.N_Sticks_Covered,
                        incentive_condition: trial.incentive_condition || 'Accurate',
                        wm_task: wm_task_data
                    };

                    // Clear display and end the trial
                    display_element.innerHTML = '';
                    this.jsPsych.finishTrial(data_out);
                });
            };
        }
    }

    // Export the plugin class
    StickAdvocateWMPlugin.info = info;
    return StickAdvocateWMPlugin;

})(jsPsychModule);


