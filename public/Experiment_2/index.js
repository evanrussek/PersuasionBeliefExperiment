// Demo: one trial of each incentive condition type using the new click-to-cover plugin

// Local parameters for the demo
const Max_Stick_Length = 100;
const Min_Stick_Length = 1;
const N_Sticks_Drawn = 10;
const Trial_N_Sticks_Covered = 5; // demo requirement

// Build timeline
var timeline = [];

// Optionally, you can enable fullscreen or preload here if desired
// timeline.push({ type: jsPsychFullscreen, fullscreen_mode: true });

// Define the three incentive conditions to test
const incentive_conditions = ['High', 'Low', 'Accurate'];

// Create one trial for each incentive condition
incentive_conditions.forEach((condition, index) => {
  // Generate unique stick lengths for each trial
  var lengths = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);
  
  var select_trial = {
    type: jsPsychStickSelect,
    stick_lengths: lengths,
    N_Sticks_Drawn: N_Sticks_Drawn,
    N_Sticks_Covered: Trial_N_Sticks_Covered,
    incentive_condition: condition,
    trial_number: index + 1,
    total_trials: incentive_conditions.length,
    data: { 
      version: 'select_demo',
      incentive_condition: condition
    }
  };
  
  timeline.push(select_trial);
});

// Simple end screen
var end_screen = {
  type: jsPsychHtmlButtonResponse,
  choices: ['Finish'],
  is_html: true,
  stimulus: function(){
    return '<p>Thanks! You completed all three incentive condition trials.</p>';
  }
};

timeline.push(end_screen);

jsPsych.run(timeline);
