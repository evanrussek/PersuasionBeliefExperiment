var jsPsychStickTrial = (function (jspsych) {
    'use strict';
  
    const info = {
        name: "stick-trial",
        parameters: {
            button_label: {
              type: jspsych.ParameterType.STRING,
              pretty_name: 'Button label',
              default: 'Continue',
              description: 'Label of the button to submit responses.'
            },
            covered_condition: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: 'Show rectangles',
              default: true,
              description: 'Whether to show rectangles initially over sticks and lengths.'
            },
            judge_condition:{
                type: jspsych.ParameterType.BOOL,
                pretty_name: 'Judge Condition',
                default: false,
                description: 'Is this the judge condition (otherwise, it is the advocate condition).'
            },
            selected_stick_values_for_estimate: {
                type: jspsych.ParameterType.ARRAY,
                // array: jsPsych.ParameterType.FLOAT,
                pretty_name: 'Selected Stick Values',
                default: [],
                description: 'This is relevant for conditions where an estimate is solicited (e.g. judge or second set of advocate trials). This is what they will see to prompt an estimate.'
              },
            original_stick_values_for_selection: {
                type: jspsych.ParameterType.ARRAY,
                // array: jsPsych.ParameterType.FLOAT,
                pretty_name: 'Stick Length Values',
                default: [],
                description: 'Relevant for advocate conditions, to solicit .'
              },
            advocate_goal: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Advocate Goal',
                default: 'high',
                description: 'The goal of the advocate in the trial. For the judge case, this is what the paired advocate"s goal was'
            },
            multi_trial: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: 'Multi Trial',
                default: false,
                description: 'whether this trial is part of multiple trials, or is the only trial'
            },
            advocate_estimate_trial: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: 'Advocate Estimate Trial',
                default: false,
                description: 'whether this trial is an advocate estimate trial'
          }
        }
    };


class StickTrialPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {


        // in the non-covered condition, the stages are
        // 1) boxes over sticks, 2) show selected sticks with no boxes 3) show sticks that were clicked on, 4 enter a guess

        // in the covered condition, the stages are:
        // 1) all sticks, no boxes 2) show sticks that were clicked on alone, 3) enter a guess

        var cover_sticks = false;

        if (trial.judge_condition | trial.advocate_estimate_trial){
            var cover_sticks = false;
        }else{
            var cover_sticks = trial.covered_condition;
        }

        var stage_num = 1;

        // INITIALIZE DATA THAT WE'LL SAVE
        var trial_data = {}

        // to compute response times
        var response_time_selection = NaN;
        var response_time_guess = NaN;
        var startTimeSelection = NaN; 
        var startTimeGuess = NaN;

        // results of advocate selection
        var advocateSelectedStickValues = [];
        var advocateSelectedStickIndexes = [];

        // estimate made by either advocate or judge
        var estimate = NaN;

        function display_sticks(sticksHTML, stickLengths, cover_sticks, add_checkbox){
            for (var i = 0; i < stickLengths.length; i++) {
                // Add HTML for each stick, its length text, and checkbox
                sticksHTML += '<div class="stick-container">' +
                    '<div class="stick-wrapper">' +
                    '<div class="stick" style="height:' + stickLengths[i] + 'px;"></div>' +
                    '<div class="stick-length">' + stickLengths[i] + '</div>' +
                    '<div class="rectangle" style="' + (cover_sticks ? 'display: block;' : 'display: none;') + '"></div>' +
                    '</div>';
                if (add_checkbox) {
                    sticksHTML+= '<input type="checkbox" class="stick-checkbox" id="stick-' + i + '">'
                }  
                sticksHTML+= '</div>'
   
            }
            return sticksHTML
        }

        function gen_screen1_html(stickLengths, cover_sticks, instruction_text, add_checkbox){
            // Create HTML for sticks and rectangles
            var sticksHTML = '';

            console.log(instruction_text)

            // display the sticks
            sticksHTML = display_sticks(sticksHTML, stickLengths, cover_sticks, add_checkbox)

            var screen_html = '<div id="stick-trial-container">' +
            '<div id="instruction-text">' + instruction_text + '</div>' +
            '<div id="sticks-container">' + sticksHTML + '</div>' +
            '<button id="continue-btn" class="jspsych-btn">' + trial.button_label + '</button>' +
            '</div>';

            return screen_html

        }

        if (trial.judge_condition){

            // JUDGE CONDITION

            if (trial.multi_trial){
                var judge_preamble = `<p>Here, the advocate's goal was for you to make as ${trial.advocate_goal.toUpperCase()} a guess as possible. </p> <p> These are the sticks that they selected.</p>`
            }else{
                var judge_preamble = `<p>The advocate's goal was for you to make as ${trial.advocate_goal.toUpperCase()} a guess as possible. </p> <p> These are the sticks that they selected.</p>`
            }

            var add_checkbox = false;
            display_element.innerHTML = gen_screen1_html(trial.selected_stick_values_for_estimate, cover_sticks, judge_preamble, add_checkbox);

            // MOVE STRAIGHT TO ESTIMATE STAGE
            stage_num = 3;

        }else if (trial.advocate_estimate_trial){

            var advocate_estimate_preamble = `<p>Here, the your goal was for the judge to make as ${trial.advocate_goal.toUpperCase()} a guess as possible. </p> <p> These are the sticks that you selected.</p>`;
            
            var add_checkbox = false;
            display_element.innerHTML = gen_screen1_html(trial.selected_stick_values_for_estimate, cover_sticks, advocate_estimate_preamble, add_checkbox);
            
            // MOVE STRAIGHT TO ESTIMATE STAGE
            stage_num = 3;

        }else{

            // ADVOCATE CONDITION
            var advocate_goal = trial.advocate_goal.toUpperCase();

            if (trial.multi_trial){
                var instruc_text = `<p>For this game, you goal is for the judge to make as ${advocate_goal} a guess as possible. <\p> <p>Sticks are ordered with smallest on the left and largest on the right. <\p> <p>Please select 5 sticks to present to the judge.</p>`;
            }else{
                var instruc_text = `<p>Your goal is for the judge to make as ${advocate_goal} a guess as possible.<\p> <p>Sticks are ordered with smallest on the left and largest on the right. <\p> <p><strong>Please select 5 sticks to present to the judge.</strong></p>`;
            }

            var add_checkbox = true;
            display_element.innerHTML = gen_screen1_html(trial.original_stick_values_for_selection, cover_sticks, instruc_text, add_checkbox);

            startTimeSelection = performance.now(); // GET THE TIME THAT STICKS ARE DISPLAYED

            // STAY ON STAGE 1 - GET SELECTIONS
        }

        // WHAT TO DO WHEN THE BUTTON IS CLICKED, FOR ALL STAGES
        display_element.querySelector('#continue-btn').addEventListener('click', () => {
            
    
            // HANDLE STAGE 1 - STICKS ARE SELECTED
            if (stage_num == 1){

                console.log("Starting Stage 1")

                // Compute the response time
                var currentTime = performance.now();
                response_time_selection = Math.round(currentTime - startTimeSelection);

                // RESET SELECTED STICKS
                advocateSelectedStickValues = [];
                advocateSelectedStickIndexes = [];

                // RECORD SELECTED STICKS
                var checkboxes = display_element.querySelectorAll('.stick-checkbox');
                var rectangles = display_element.querySelectorAll('.rectangle');
                checkboxes.forEach(function (checkbox, index) {

                    if (checkbox.checked){
                        advocateSelectedStickValues.push(trial.original_stick_values_for_selection[index]);
                        advocateSelectedStickIndexes.push(index);                
                    }
                });

                // CHECK IF 5 STICKS WERE SELECTED
                if (advocateSelectedStickValues.length !== 5) {

                    alert('Please select 5 sticks before continuing.');

                } else {
                    // REMOVE RECTANGLES AND UPDATE STAGE NUMBER
                    stage_num = 2;

                    checkboxes.forEach(function (checkbox, index) {
                        if (checkbox.checked) {
                            rectangles[index].style.display = 'none';
                        }
                    });

                    // IF IN NO COVER CONDITION, DO ANOTHER CLICK
                    if (!cover_sticks){
                        document.getElementById('continue-btn').click();
                    }
                }

            } // end if stage == 1

            else if (stage_num == 2){

                // HERE WE SHOW THE STICKS THAT WERE SELECTED

                // IN MUTL_TRIAL ADVOCATE CONDITION (selection part), END THE TRIAL AND RECORD DATA
                if (!trial.judge_condition & trial.multi_trial){

                    trial_data = {
                        advocate_selected_stick_values: advocateSelectedStickValues,
                        advocate_selected_stick_indexes: advocateSelectedStickIndexes,
                        response_time_selection: response_time_selection
                    }
                    this.jsPsych.finishTrial(trial_data)

                }else{ // IF SIGNLE TRIAL ADVOCATE CONDITION - NOTE NOT JUDGE CONDITION, BECAUSE THAT IS HANDLED ABOVE AND SKIPS TO STAGE 3

                    // SHOW THE STICKS THAT WERE SELECTED AND MOVE TO STAGE 3

                    console.log("Starting Stage 2")

                    stage_num = 3;


                    document.getElementById('instruction-text').innerHTML = 'These are the sticks that you selected to be shown to the judge.'

                    var sticksHTML = '';
                    var cover_sticks = false;
                    var add_checkbox = false;
                    sticksHTML = display_sticks(sticksHTML, advocateSelectedStickValues, cover_sticks, add_checkbox)
                    document.getElementById('sticks-container').innerHTML= sticksHTML;
                }
            } // end if stage == 2

            else if (stage_num == 3){

                console.log("Starting Stage 3")

                // ENTER A ESTIMATE AS TO THE MEAN
                startTimeGuess = performance.now();
                
                if (trial.judge_condition){
                    if (trial.multi_trial){
                        var guess_preamble = '<p> Please enter a guess for the average stick length in the original pile from which those sticks were selected. <\p> <p> Please enter a number. You will be bonused based on the ACCURACY of this guess. <\p>';
                    }else{
                        var guess_preamble = '<p> Please enter a guess for the average stick length in the original pile from which those sticks were selected. <\p> <p> Please enter a number. You will be bonused based on the ACCURACY of this guess. <\p>';
                    }
                }else{
                    if (trial.multi_trial){ // this corresponds to the advocate_estimate_trial condition
                        var guess_preamble = '<p> Please enter a guess for the average stick length in the original pile that from which those sticks were selected. <\p> <p> Please enter a number. You will be bonused based on the ACCURACY of this guess. <\p>';
                    }else{
                        var guess_preamble = '<p> Thank you for selecting sticks for the judge.</p> <p> We actually now would like you to also enter a guess for the average stick length in the original pile. <\p> <p> Please enter a number. You will be additionally bonused based on the ACCURACY of this guess. <\p>';
                    }
                }

                document.getElementById('instruction-text').innerHTML = guess_preamble;
                document.getElementById('sticks-container').innerHTML = '<div id="guess-container">' +
                '<label for="stick-average-guess"></label>' +
                '<input type="text" id="stick-average-guess" name="stick-average-guess">' +
                '</div>';

                stage_num = 4;
            }
            
            else if (stage_num == 4){
                
                currentTime = performance.now();
                response_time_guess = Math.round(currentTime - startTimeGuess);

                // grab the text data
                var guessInput = document.getElementById('stick-average-guess');
                estimate = guessInput.value;    

                // CHECK IF A NUMBER WAS ENTERED - IF NOT RETURN TO STAGE 3
                if (isNumber(estimate)){
    
                    trial_data = {
                        advocate_selected_stick_values: advocateSelectedStickValues,
                        advocate_selected_stick_indexes: advocateSelectedStickIndexes,
                        response_time_selection: response_time_selection,
                        average_stick_guess: estimate,
                        response_time_guess: response_time_guess            
                    }
    
                    // record the data and end the trial
                    this.jsPsych.finishTrial(trial_data)

                }else{

                    alert('Please enter a number for your guess.');
                    stage_num = 3;
                    document.getElementById('continue-btn').click();

                }
            }
      });
    }
  }

  StickTrialPlugin.info = info;

  return StickTrialPlugin;

})(jsPsychModule);
