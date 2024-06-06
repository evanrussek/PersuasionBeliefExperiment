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
            show_rectangles: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: 'Show rectangles',
              default: true,
              description: 'Whether to show rectangles initially over sticks and lengths.'
            },
            receiver_condition:{
                type: jspsych.ParameterType.BOOL,
                pretty_name: 'Receiver Condition',
                default: false,
                description: 'Is this the receiver condition (otherwise, it is the sender condition).'
            },

            selectedStickValues: {
                type: jspsych.ParameterType.ARRAY,
                // array: jsPsych.ParameterType.FLOAT,
                pretty_name: 'Selected Stick Values',
                default: [],
                description: 'Array of selected stick values (numbers).'
              },
            N_Sticks: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Number of sticks to display.',
                default: 20,
                description: 'Number of sticks to display on first screen.'
            },
            Max_Stick_Val: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Maximum stick value.',
                default: 95,
                description: 'Maximum stick value.'
            },
            Min_Stick_Val: {
                type: jspsych.ParameterType.INT,
                pretty_name: 'Minimum stick value.',
                default: 15,
                description: 'Minimum stick value.'
            }
          }
    };


class StickTrialPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

        // can you add check that a number was submitted at the end of the experiment?


        // in the show boxes condition:
            // stages are: 1) boxes over sticks, 2) show selected sticks with no boxes 3) show sticks that were clicked on, 4 enter a guess

        // in the no boxes condition it is:
            // stages are: 1) all sticks, no boxes 2) show sticks that were clicked on alone, 3) enter a guess

        var show_rectangles = false;

        if (trial.receiver_condition){
            var show_rectangles = false;
        }else{
            var show_rectangles = trial.show_rectangles;
        }

        var stage_num = 1;
        var trial_data = {}
        var endTime = 0
        var response_time_selection = 0;
        var response_time_guess = 0;
        var average_stick_guess = 0;
        var startTime = performance.now();
        if (trial.receiver_condition){
            var selectedStickValues = trial.selectedStickValues;
        }else{
            var selectedStickValues = [];
        }

        function display_sticks(sticksHTML, stickLengths, show_rectangles, add_checkbox){
            for (var i = 0; i < stickLengths.length; i++) {
                // Add HTML for each stick, its length text, and checkbox
                sticksHTML += '<div class="stick-container">' +
                    '<div class="stick-wrapper">' +
                    '<div class="stick" style="height:' + stickLengths[i] + 'px;"></div>' +
                    '<div class="stick-length">' + stickLengths[i] + '</div>' +
                    '<div class="rectangle" style="' + (show_rectangles ? 'display: block;' : 'display: none;') + '"></div>' +
                    '</div>';
                if (add_checkbox) {
                    sticksHTML+= '<input type="checkbox" class="stick-checkbox" id="stick-' + i + '">'
                }  
                sticksHTML+= '</div>'
   
            }
            return sticksHTML
        }

        function gen_screen1_html(stickLengths, show_rectangles, instruction_text, add_checkbox){
            // Create HTML for sticks and rectangles
            var sticksHTML = '';

            // display the sticks
            sticksHTML = display_sticks(sticksHTML, stickLengths, show_rectangles, add_checkbox)

            var screen_html = '<div id="stick-trial-container">' +
            '<div id="instruction-text">' + instruction_text + '</div>' +
            '<div id="sticks-container">' + sticksHTML + '</div>' +
            '<button id="continue-btn" class="jspsych-btn">' + trial.button_label + '</button>' +
            '</div>';

            return screen_html

        }

        if (trial.receiver_condition){
            display_element.innerHTML = gen_screen1_html(selectedStickValues, show_rectangles, 'These are the sticks that were selected', false);
            stage_num = 3;

        }else{

            // Generate random stick lengths for the current trial
            var stickLengths = generateRandomStickLengths(trial.N_Sticks, trial.Max_Stick_Val, trial.Min_Stick_Val);

            // print the true mean of the sticks... 
            const mean_stick_length = stickLengths.reduce((sum, num) => sum + num, 0) / stickLengths.length;

            console.log(mean_stick_length)

            // Display sticks HTML with instruction text
            display_element.innerHTML = gen_screen1_html(stickLengths, show_rectangles, 'Please select 5 sticks to present.', true);
        
        }



        // Continue button click handler -- 
        display_element.querySelector('#continue-btn').addEventListener('click', () => {
            
    
            // remove the boxes and update the screen
            if (stage_num == 1){

                console.log("Starting Stage 1")


                // Compute the response time
                endTime = performance.now();
                response_time_selection = Math.round(endTime - startTime);

                // Collect selected sticks
                var selectedSticks = [];
                selectedStickValues = [];
                var allStickValues = [];
                var selectedStickIndexes = [];
                var checkboxes = display_element.querySelectorAll('.stick-checkbox');
                var rectangles = display_element.querySelectorAll('.rectangle');
                checkboxes.forEach(function (checkbox, index) {

                    allStickValues.push(stickLengths[index]);

                    if (checkbox.checked) {
                        selectedSticks.push(stickLengths[index]);
                        selectedStickValues.push(stickLengths[index]);
                        selectedStickIndexes.push(index);                // Hide the rectangle for the checked stick
                    // rectangles[index].style.display = 'none';
                    }
                });

                // Check if exactly 5 sticks are selected
                if (selectedSticks.length !== 5) {
                    alert('Please select 5 sticks before continuing.');

                    // want the trial to re-start here?

                } else { // update stage 1 to stage 2...

                    stage_num = 2; // update the stage number

                    checkboxes.forEach(function (checkbox, index) {
                        if (checkbox.checked) {
                        //selectedSticks.push(stickLengths[index]);
                        // Hide the rectangle for the checked stick
                        rectangles[index].style.display = 'none';
                        }
                    });

                    // click the button again if we're in the no-rectange condition
                    if (!show_rectangles){
                        document.getElementById('continue-btn').click();
                    }
                }

            } // end if stage == 1

            else if (stage_num == 2){

                // for one condition, you'll want to start from here

                console.log("Starting Stage 2")

                stage_num = 3;

                // now show the selected sticks on a new screen
                var sticksHTML = '';

                // display the selected sticks
                document.getElementById('instruction-text').innerHTML = 'These are the sticks that were selected.'

                sticksHTML = display_sticks(sticksHTML, selectedStickValues, false, false)

                document.getElementById('sticks-container').innerHTML= sticksHTML;


                // display_element.innerHTML = screen_html;

            }

            else if (stage_num == 3){

                // Enter a guess as to the mean 
                startTime = performance.now();

                console.log("Starting Stage 3")
                
                // enter a guess
                document.getElementById('instruction-text').innerHTML = 'Enter your guess for the average stick length in the original pile.'
                document.getElementById('sticks-container').innerHTML = '<div id="guess-container">' +
                '<label for="stick-average-guess"></label>' +
                '<input type="text" id="stick-average-guess" name="stick-average-guess">' +
                '</div>';

                // end the task and save the data...
                stage_num = 4;
            }
            
            else if (stage_num == 4){
                
                endTime = performance.now();
                response_time_guess = Math.round(endTime - startTime);

                // grab the text data data
                var guessInput = document.getElementById('stick-average-guess');
                var average_stick_guess = guessInput.value;
                // console.log('Participant guess:', participantGuess);


                // End the task and record the key data
                trial_data = { // this need to depend on the condition...                   
                    all_stick_values: allStickValues,
                    selected_stick_values: selectedStickValues,
                    selected_stick_indexes: selectedStickIndexes,
                    rt_selection: response_time_selection,
                    rt_guess: response_time_guess,
                    average_stick_guess: average_stick_guess
                }

                // record the data and end the trial
                this.jsPsych.finishTrial(trial_data)

            }


      });
    }
  }

  StickTrialPlugin.info = info;

  return StickTrialPlugin;

})(jsPsychModule);
