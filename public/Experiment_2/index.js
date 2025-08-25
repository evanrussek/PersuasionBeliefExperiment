// Minimal demo: one selection trial using the new click-to-cover plugin

// Local parameters for the demo
const Max_Stick_Length = 100;
const Min_Stick_Length = 1;
const N_Sticks_Drawn = 10;
const Trial_N_Sticks_Covered = 5; // demo requirement

// Build timeline
var timeline = [];

// Optionally, you can enable fullscreen or preload here if desired
// timeline.push({ type: jsPsychFullscreen, fullscreen_mode: true });

// Generate one ordered set of stick lengths
var lengths = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);

// Single selection trial
var select_trial = {
  type: jsPsychStickSelect,
  stick_lengths: lengths,
  N_Sticks_Drawn: N_Sticks_Drawn,
  N_Sticks_Covered: Trial_N_Sticks_Covered,
  trial_number: 1,
  total_trials: 1,
  data: { version: 'select_demo' }
};

// Simple end screen
var end_screen = {
  type: jsPsychHtmlButtonResponse,
  choices: ['Finish'],
  is_html: true,
  stimulus: function(){
    return '<p>Thanks! This was a single demo trial.</p>';
  }
};

timeline.push(select_trial);
timeline.push(end_screen);

jsPsych.run(timeline);
