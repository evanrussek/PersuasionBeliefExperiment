var jsPsychStickJudge = (function (jspsych) {
    'use strict';

    // ───────────────────────────────────────────────────────────────────────────────
    // PLUGIN INFO: Defines parameters for the judge trial
    // ───────────────────────────────────────────────────────────────────────────────
    const info = {
        name: "stick-judge",
        parameters: {
            uncovered_values: {
                type: jspsych.ParameterType.ARRAY,
                pretty_name: 'Uncovered Stick Values',
                default: [],
                description: 'Heights for uncovered sticks to display to the judge (numbers).'
            },
            N_Sticks_Drawn: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Number of Sticks Drawn',
                default: 10
            },
            N_Sticks_Covered: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Number of Sticks Covered',
                default: 5
            },
            advocate_goal: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Advocate Goal',
                default: 'Accurate',
                description: 'One of "High", "Low", or "Accurate".'
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
                default: 'Submit'
            },
            trial_id: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Trial ID',
                default: ''
            },
            global_index: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Global Index in master file',
                default: null
            }
        }
    };

    // ───────────────────────────────────────────────────────────────────────────────
    // MAIN PLUGIN CLASS
    // ───────────────────────────────────────────────────────────────────────────────
    class StickJudgePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            // Normalize to numbers and sort ascending for a clean judge view
            const values = (trial.uncovered_values || [])
                .map(v => Number(v))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b);

            // Advocate goal word
            const g = (trial.advocate_goal || 'Accurate').toLowerCase();
            const goalWord = g === 'high' ? 'HIGHER' : g === 'low' ? 'LOWER' : 'ACCURATE';

            // Build top text (simplified per spec)
            const top_html =
                `<p><strong>Round ${trial.trial_number} of ${trial.total_trials}</strong></p>` +
                `<p>${trial.N_Sticks_Drawn} sticks were drawn, with heights between 1 and 100. The Advocate covered <strong>${trial.N_Sticks_Covered}</strong> of these sticks. Their goal for this round was for your estimate to be <strong>${goalWord}</strong>.</p>` +
                `<p>Shown below are the heights of the <strong>uncovered</strong> sticks.</p>`;

            // Build sticks HTML (no rectangles)
            let sticks_html = '';
            for (let i = 0; i < values.length; i++) {
                sticks_html +=
                    '<div class="stick-container">' +
                        '<div class="stick-wrapper">' +
                            '<div class="stick" style="height:' + values[i] + 'px;"></div>' +
                            '<div class="stick-length">' + values[i] + '</div>' +
                        '</div>' +
                    '</div>';
            }

            // Compose screen
            let screen_html =
                '<div id="stick-trial-container">' +
                    '<div id="instruction-text">' + top_html + '</div>' +
                    '<div id="sticks-container">' + sticks_html + '</div>' +
                    '<div id="guess-container">' +
                        `<p class="guess-prompt">Please enter your estimate of the average height of <strong>all</strong> ${trial.N_Sticks_Drawn} sticks (including the sticks you cannot see).</p>` +
                        '<label for="stick-average-guess"></label>' +
                        '<input  type="text"                              ' +
                                'id="stick-average-guess"                   ' +
                                'inputmode="decimal"                        ' +
                                'autocomplete="off"                         ' +
                                'autocorrect="off"                          ' +
                                'spellcheck="false"                         >' +
                        '<button id="submit-judge-guess-btn" class="jspsych-btn" style="display:block;margin:10px auto 0;">' + trial.button_label + '</button>' +
                    '</div>' +
                '</div>';

            display_element.innerHTML = screen_html;

            const start_time_guess = performance.now();
            let bad_guess_count = 0;

            display_element.querySelector('#submit-judge-guess-btn').addEventListener('click', () => {
                const guessInput = document.getElementById('stick-average-guess');
                const estimate = guessInput.value;

                if (!isNumber(estimate)) {
                    showWarning('Please enter a number for your guess.', () => {
                        bad_guess_count += 1;
                        document.getElementById('stick-average-guess')?.focus();
                    });
                    return;
                }

                const response_time_guess = Math.round(performance.now() - start_time_guess);
                const data_out = {
                    estimate: estimate,
                    response_time_guess: response_time_guess,
                    N_Bad_Guesses: bad_guess_count,
                    uncovered_values_sorted: values,
                    N_Sticks_Drawn: trial.N_Sticks_Drawn,
                    N_Sticks_Covered: trial.N_Sticks_Covered,
                    advocate_goal: trial.advocate_goal || 'Accurate',
                    trial_id: trial.trial_id || '',
                    global_index: (typeof trial.global_index === 'number' ? trial.global_index : null)
                };

                display_element.innerHTML = '';
                this.jsPsych.finishTrial(data_out);
            });
        }
    }

    // Export the plugin class
    StickJudgePlugin.info = info;
    return StickJudgePlugin;

})(jsPsychModule);


