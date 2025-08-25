var jsPsychStickSelect = (function (jspsych) {
    'use strict';

    // ───────────────────────────────────────────────────────────────────────────────
    // PLUGIN INFO: Defines parameters for the stick selection trial
    // ───────────────────────────────────────────────────────────────────────────────
    const info = {
        name: "stick-select",
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
            }
        }
    };

    // ───────────────────────────────────────────────────────────────────────────────
    // MAIN PLUGIN CLASS: Handles the two-stage trial (selection + guessing)
    // ───────────────────────────────────────────────────────────────────────────────
    class StickSelectPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        // ───────────────────────────────────────────────────────────────────────────────
        // TRIAL EXECUTION: Main trial function that runs the selection and guessing stages
        // ───────────────────────────────────────────────────────────────────────────────
        trial(display_element, trial) {
            // ── TRIAL STATE VARIABLES ──
            const selected = Array(trial.stick_lengths.length).fill(false);
            let click_order = [];
            const start_time = performance.now();
            let selection_rt = null;
            let bad_guess_count = 0;

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

            // ───────────────────────────────────────────────────────────────────────────────
            // STAGE 1: SELECTION PHASE - User clicks sticks to cover them
            // ───────────────────────────────────────────────────────────────────────────────
            function render() {
                // Build instruction text for the selection phase
                const top =
                    `<p><strong>Round ${trial.trial_number} of ${trial.total_trials}</strong></p>
                     In this round, ${trial.N_Sticks_Drawn} new sticks were drawn, with random values between 1 and 100.
                     <br>Click on ${trial.N_Sticks_Covered} sticks you want to cover, then press Continue.`;

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

                    // Selection is valid - lock it in and move to guessing stage
                    selection_rt = Math.round(performance.now() - start_time);
                    showGuessStage();
                });
            }

            // Start the trial by rendering the selection phase
            render();

            // ───────────────────────────────────────────────────────────────────────────────
            // STAGE 2: GUESSING PHASE - User estimates the mean of all sticks
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
                
                // Fill the response area with the guess prompt and input
                response.innerHTML =
                    `<p>Please enter your guess for the average stick length of <strong>all</strong> ${trial.N_Sticks_Drawn} sticks (<strong>including</strong> the ones you just covered).</p>` +
                    '<div id="guess-container">' +
                        '<label for="stick-average-guess"></label>' +
                        '<input  type="text"                              ' +
                                'id="stick-average-guess"                   ' +
                                'inputmode="decimal"                        ' +
                                'autocomplete="off"                         ' +
                                'autocorrect="off"                          ' +
                                'spellcheck="false"                         >' +
                        '<button id="submit-guess-btn" class="jspsych-btn" style="display:block;margin:10px auto 0;">Submit</button>' +
                    '</div>';
                
                // Reveal the response area with a smooth transition
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
                        N_Sticks_Covered: trial.N_Sticks_Covered
                    };

                    // Clear display and end the trial
                    display_element.innerHTML = '';
                    this.jsPsych.finishTrial(data_out);
                });
            };
        }
    }

    // Export the plugin class
    StickSelectPlugin.info = info;
    return StickSelectPlugin;

})(jsPsychModule);


