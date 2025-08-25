// Initialize jsPsych
const jsPsych = initJsPsych();

// ENTER PARAMETERS FOR TASK - SHOULD THESE BE PRE-DRAWN?
//var Max_Stick_Length = 100
//var Min_Stick_Length = 0 

// This potentially varies accross subjects, but not accross trial... 
//var N_Trials = 10;

// Specific parameters for stick trial for this experiment
var covered_condition = false
var judge_condition = true
var multi_trial = true // check again what this means... 


var end_screen = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['End Task'],
    is_html: true,
    stimulus: function(){
        var task_data = jsPsych.data.get().json()
        jsPsych.data.get().localSave('csv', 'experiment_data.csv');

        //var random_total_points = jsPsych.randomization.sampleWithoutReplacement(total_points_arr, 1);

        var string = 'You have finished the task. Thank you for your contribution to science! \
            <p> Your bonus will depend on responses from other participants. You will recieve it within 2 weeks. </p> \
            <p> <b> PLEASE CLICK END TASK TO SUBMIT THE TASK TO PROLIFIC </b> </p>';

        //db.collection('featuretask').doc(run_name).collection('subjects').doc(uid).collection('taskdata').doc('data').set({
        //bonus_points: random_total_points,
        //data:  task_data
       // })
    return string;
    },
    on_finish: function(){
        // window.location =  "https://app.prolific.co/submissions/complete?cc=E3FCD9EE" # add prolific completion link!
    }
}

// make a screen to show between each trial for the judge in the multi-trial condition
var judge_between_trial_screen = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['Continue'],
    is_html: true,
    stimulus: function(){
        return `<p>Thank you for that guess. ${N_Sticks_Drawn} are now being drawn out of which ${N_Sticks_Selected} will be selected. </p> You will now see these selections.`
    }
}

// Create an array to hold all trials
var timeline = [];

var full_screen = { // this plugin will prompt the full screen
    type: jsPsychFullscreen,
    fullscreen_mode: true
};

var preload = {
    type: jsPsychPreload,
    auto_preload: true ,
    max_load_time: 60000 // 1 minute
}

// timeline.push(full_screen);
timeline.push(preload);

if (include_instructions){
    timeline.push(intro_loop_node)
    timeline.push(finish_instruc_screen)
}

timeline.push(instruction_trial);
// timeline.push(start_question_trial)
// timeline.push(conditional_start_quiz_incorrect)
// timeline.push(instruction_timeline)
// timeline.push(finish_instruc_screen)


// MAKE FIRST SET OF TRIALS FOR EITHER JUDGE OR ADVOCATE
// make N trials in for loop

// make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, advocate_goal, multi_trial){

var covered_condition = false
var judge_condition = true


// function to make a stick_trial
// takes in selectedStickValues, advocate_goal, stick_length_values, judge_condition, show_rectangles
function make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, advocate_goal, multi_trial, trial_number){
    var stick_trial = {
        type: jsPsychStickTrial,
        covered_condition: covered_condition,
        judge_condition: judge_condition,
        selected_stick_values_for_estimate: selected_stick_values_for_estimate,
        original_stick_values_for_selection: original_stick_values_for_selection,
        advocate_goal: advocate_goal, // this is also the censored direction for automatic trials
        multi_trial: multi_trial,
        advocate_estimate_trial: false,
        automatic_selection: true,
        N_Sticks_Drawn: N_Sticks_Drawn,
        N_Sticks_Selected: N_Sticks_Selected,
        trial_number: trial_number,
        total_trials: N_Trials,
        data:{
            covered_condition: covered_condition,
            judge_condition: judge_condition,
            selected_stick_values_for_estimate: selected_stick_values_for_estimate,
            original_stick_values_for_selection: original_stick_values_for_selection,
            advocate_goal: advocate_goal,
            multi_trial: multi_trial,
            advocate_estimate_trial: false,
        }
    };
    return stick_trial
}

// N_Sticks should vary... 
// create N_Trials trials with different N_Sticks values and different N_Sticks_Selected values
for (var i = 0; i < N_Trials; i++){

    // draw sticks for this trial
    var original_stick_values_for_selection = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);
    
    // get number sticks selected for this trial
    var Trial_N_Sticks_Selected = N_Sticks_Selected;

    // if the censored condition is high select the top 5 values
    if (censored_direction == "high"){
        
        var selected_stick_values_for_estimate = original_stick_values_for_selection.slice(-Trial_N_Sticks_Selected);
        var stick_trial = make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, censored_direction, multi_trial, i+1)

    } else if (censored_direction == "low"){
        var selected_stick_values_for_estimate = original_stick_values_for_selection.slice(0,Trial_N_Sticks_Selected);
        var stick_trial = make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, censored_direction, multi_trial, i+1)
    }
    else if (censored_direction == "random"){
        var selected_stick_values_for_estimate = jsPsych.randomization.sampleWithoutReplacement(original_stick_values_for_selection, Trial_N_Sticks_Selected);
        // sort the selected stick values
        selected_stick_values_for_estimate.sort(function(a, b){return a - b});
        
        var stick_trial = make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, censored_direction, multi_trial, i+1)
    }

    timeline.push(stick_trial)
    //if (i < N_Trials - 1){
     //   timeline.push(judge_between_trial_screen)
   // }
}


timeline.push(end_screen)

jsPsych.run(timeline);