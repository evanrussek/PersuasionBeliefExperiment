// various condition variables should be defined above:
// participant_role: "advocate" or "judge"
// covered_condition: true or false
// advocate_goal: "smaller", "bigger", "truthful"

// adjust 'show_rectangles' to 'covered' 

if (participant_role == "advocate"){
    var judge_condition = false
}else{
    var judge_condition = true
}

if (n_trial_condition == "single"){
    var multi_trial = false;
    var N_trials = 1;
}else{
    var multi_trial = true;
    var N_trials = 4;
}

// Initialize jsPsych
const jsPsych = initJsPsych();

// ENTER PARAMETERS FOR TASK (at some point move these to a single parameter file)
var N_Sticks = 20
var Max_Stick_Length = 120
var Min_Stick_Length = 20

// for making the instructions
//stick_length_values_ordered = [33, 38, 42, 45, 46, 52, 53, 59, 66, 82, 87, 90, 92, 98, 105, 105, 112, 117, 118, 118];
//stick_length_values = jsPsych.randomization.repeat(stick_length_values_ordered, 1);
//stick_length_values = stick_length_values_ordered//jsPsych.randomization.repeat(stick_length_values_ordered, 1);

var all_stick_vals = [[1,2,3,4,5], [6,7,8,9,10], [11,12,13,14,15], [16,17,18,19,20]];
var all_advocate_goals = ["high", "low", "accurate", "high"];

// function to make a stick_trial
// takes in selectedStickValues, advocate_goal, stick_length_values, judge_condition, show_rectangles
function make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, advocate_goal, multi_trial){
    var stick_trial = {
        type: jsPsychStickTrial,
        covered_condition: covered_condition,
        judge_condition: judge_condition,
        selected_stick_values_for_estimate: selected_stick_values_for_estimate,
        original_stick_values_for_selection: original_stick_values_for_selection,
        advocate_goal: advocate_goal,
        multi_trial: multi_trial,
        advocate_estimate_trial: false,
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

// edit these so that they start from estimate phase (or judge)
function create_advocate_estimate_trial(previous_trial_index){
    return {
        type: jsPsychStickTrial,
        advocate_estimate_trial: true,
        on_start: function(trial){
            var previous_trial_data = jsPsych.data.get().filter({trial_type: 'stick-trial'}).values()[previous_trial_index]
            trial.covered_condition = previous_trial_data.covered_condition,
            trial.judge_condition = previous_trial_data.judge_condition,
            trial.selected_stick_values_for_estimate = previous_trial_data.advocate_selected_stick_values,
            trial.original_stick_values_for_selection = previous_trial_data.original_stick_values_for_selection,
            trial.advocate_goal = previous_trial_data.advocate_goal,
            trial.multi_trial = previous_trial_data.multi_trial,
            trial.advocate_estimate_trial = true
            trial.data = {
                covered_condition: previous_trial_data.covered_condition,
                judge_condition: previous_trial_data.judge_condition,
                selected_stick_values_for_estimate: previous_trial_data.advocate_selected_stick_values,
                original_stick_values_for_selection: previous_trial_data.original_stick_values_for_selection,
                advocate_goal: previous_trial_data.advocate_goal,
                multi_trial: previous_trial_data.multi_trial,
                advocate_estimate_trial: true
            }
        }
    }
}

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
        return '<p>Thank you for that guess. </p> <p>You will now see the selections of a new advocate.</p>';
    }
}

// make a screen to show between each trial for the advocate in the multi-trial condition
var advocate_between_trial_screen = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['Continue'],
    is_html: true,
    stimulus: function(){
        return '<p>Thank you for that selection. </p> <p>You will now play a new game and select sticks for a new judge.</p> <p> Remember to check your goal before making a selection. </p>';
    }
}

var advocate_start_estimate_phase = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['Continue'],
    is_html: true,
    stimulus: function(){
        return '<p> Thank you for making those selections.</p> <p> For each set of selections you made, we actually now would like you to enter a guess for what the average stick length was in the original pile. <\p> <p> You will now see set sticks you selected on each game, in order. For each, we would like you to make a guess about the average stick length in the original pile. <\p> <p> You will be additionally bonused based on the accuracy of these guesses. </p>';
    }
}

// make a screen to show between each trial for the advocate in the multi-trial condition
var advocate_estimate_between_trial_screen = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['Continue'],
    is_html: true,
    stimulus: function(){
        return '<p>Thank you for that guess. </p> <p>You will now see the selections from the next game you played.</p>';
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

timeline.push(full_screen);
timeline.push(preload);
// timeline.push(start_question_trial)
// timeline.push(conditional_start_quiz_incorrect)
timeline.push(intro_loop_node)
timeline.push(finish_instruc_screen)

// MAKE FIRST SET OF TRIALS FOR EITHER JUDGE OR ADVOCATE
// make N trials in for loop
for (var i = 0; i < N_trials; i++) {

    // covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, advocate_goal, multi_trial

    if (judge_condition){

        // this is irrelevant for judge condition
        var original_stick_values_for_selection = [];

        // just making this up now, but we'll read it in from a sheet later based on subject number...
        var selected_stick_values_for_estimate = all_stick_vals[i];
    }
    else{
        // can also pre-generate this... 
        var original_stick_values_for_selection = generateRandomStickLengths(N_Sticks, Max_Stick_Length, Min_Stick_Length);
        var selected_stick_values_for_estimate = [];
    }

    var advocate_goal = all_advocate_goals[i]
    var stick_trial = make_stick_trial(covered_condition, judge_condition, selected_stick_values_for_estimate, original_stick_values_for_selection, advocate_goal, multi_trial)
    timeline.push(stick_trial)

    // enter inbetween message if it's not the last trial
    if (i < N_trials - 1){

        if (participant_role == "judge"){
            timeline.push(judge_between_trial_screen)
        }else{
            timeline.push(advocate_between_trial_screen)
        }
    }
}

// MAKE SECOND SET OF TRIALS FOR ADVOCATE ESTIMATES
if (!judge_condition & multi_trial){

    timeline.push(advocate_start_estimate_phase)

    for (var i = 0; i < N_trials; i++){

        var stick_trial = create_advocate_estimate_trial(i)
        timeline.push(stick_trial)

        if (i < N_trials - 1){
            timeline.push(advocate_estimate_between_trial_screen)
        }
    }
}

timeline.push(end_screen)

jsPsych.run(timeline);