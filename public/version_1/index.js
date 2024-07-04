// various condition variables should be defined above:
// participant_role: "advocate" or "judge"
// covered_condition: true or false
// advocate_goal: "smaller", "bigger", "truthful"

if (participant_role == "advocate"){
    var receiver_condition = false
}else{
    var receiver_condition = true
}

const jsPsych = initJsPsych();


var stick_trial = {
    type: jsPsychStickTrial,
    button_label: 'Continue',
    show_rectangles: covered_condition, // fix these names in the trial to match the condition names....
    receiver_condition: receiver_condition, // fix these names in the trial to match the condition names...
    selectedStickValues: [1,2,6,4,10],
    on_finish: function() {
        // Save data as CSV file
        jsPsych.data.get().localSave('csv', 'experiment_data.csv');
      }
    // Add any other parameters your trial needs here
};

// Create an array to hold all trials
var timeline = [];

var preload = {
    type: jsPsychPreload,
    auto_preload: true ,
    max_load_time: 60000 // 1 minute
}

timeline.push(preload)
timeline.push(start_question_trial)
timeline.push(conditional_start_quiz_incorrect)
timeline.push(intro_loop_node)
timeline.push(finish_instruc_screen)

var N_trials = 1

for (var i = 0; i < N_trials; i++) {
    timeline.push(stick_trial);
}

jsPsych.run(timeline);