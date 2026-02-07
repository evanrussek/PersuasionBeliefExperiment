// Single-trial Advocate instructions (parametrized by GOAL and N_COVERED)

// Parameters (match the task scripts)
var Max_Stick_Length = 100;
var Min_Stick_Length = 1;
var N_Sticks_Drawn = 10;

// Read URL parameters
function readGoalParam() {
  var raw = (typeof getQueryVariable === 'function' && getQueryVariable('GOAL')) ? String(getQueryVariable('GOAL')).toLowerCase() : 'high';
  if (raw === 'high' || raw === 'higher' || raw === 'increase' || raw === 'up') return 'High';
  if (raw === 'low' || raw === 'lower' || raw === 'decrease' || raw === 'down') return 'Low';
  return 'Accurate';
}

function readCoveredParam() {
  var raw = (typeof getQueryVariable === 'function' && getQueryVariable('N_COVERED')) ? parseInt(getQueryVariable('N_COVERED'), 10) : 8;
  if (isNaN(raw)) raw = 8;
  // Clamp to [1, N_Sticks_Drawn - 1] so the task is meaningful
  if (raw < 1) raw = 1;
  if (raw > N_Sticks_Drawn - 1) raw = N_Sticks_Drawn - 1;
  return raw;
}

var single_goal = readGoalParam(); // 'High' | 'Low' | 'Accurate'
var single_goal_text = (single_goal === 'High') ? 'HIGH' : (single_goal === 'Low' ? 'LOW' : 'ACCURATE');
var single_n_cover = readCoveredParam();

// Helpers to build displays (reuse utils.js generateRandomStickLengths)
function renderSticksHTML(stickLengths, coveredMask) {
  var html = '';
  var showMask = Array.isArray(coveredMask) && coveredMask.length === stickLengths.length;
  for (var i = 0; i < stickLengths.length; i++) {
    html += '<div class="stick-container">' +
              '<div class="stick-wrapper">' +
                '<div class="stick" style="height:' + stickLengths[i] + 'px;"></div>' +
                '<div class="stick-length">' + stickLengths[i] + '</div>' +
                '<div class="rectangle" style="' + (showMask && coveredMask[i] ? 'display: block;' : 'display: none;') + '"></div>' +
              '</div>' +
            '</div>';
  }
  return html;
}

function renderJudgeViewHTML(stickLengths, coveredMask) {
  var html = '';
  for (var i = 0; i < stickLengths.length; i++) {
    if (coveredMask && coveredMask[i]) continue; // skip covered
    html += '<div class="stick-container">' +
              '<div class="stick-wrapper">' +
                '<div class="stick" style="height:' + stickLengths[i] + 'px;"></div>' +
                '<div class="stick-length">' + stickLengths[i] + '</div>' +
              '</div>' +
            '</div>';
  }
  return html;
}

function maskFromIndices(indices, length) {
  var mask = Array(length).fill(false);
  for (var j = 0; j < indices.length; j++) mask[indices[j]] = true;
  return mask;
}

function sampleIndices(count, maxExclusive) {
  var pool = Array(maxExclusive).fill().map(function(_, i){ return i; });
  if (window.jsPsych && window.jsPsych.randomization && window.jsPsych.randomization.sampleWithoutReplacement) {
    return window.jsPsych.randomization.sampleWithoutReplacement(pool, count);
  }
  for (var i = pool.length - 1; i > 0; i--) {
    var r = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[r]; pool[r] = tmp;
  }
  return pool.slice(0, count);
}

// Build example stimuli dynamically using the chosen parameters
var example_lengths_single = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);
var example_cover_mask_single = maskFromIndices(sampleIndices(single_n_cover, N_Sticks_Drawn), N_Sticks_Drawn);
var all_sticks_html_single = renderSticksHTML(example_lengths_single, []);
var example_cover_html_single = renderSticksHTML(example_lengths_single, example_cover_mask_single);
var judge_view_html_single = renderJudgeViewHTML(example_lengths_single, example_cover_mask_single);

var mean_value_single = example_lengths_single.reduce(function(a, b){ return a + b; }, 0) / example_lengths_single.length;
var mean_rounded_single = Math.round(mean_value_single);
var example_guess_single = 65;
var judge_points_off_single = Math.abs(example_guess_single - mean_rounded_single);
var judge_bonus_single = (1.00 - 0.02 * judge_points_off_single).toFixed(2);
var adv_penalty_points_single = (single_goal === 'High') ? Math.max(0, 100 - example_guess_single)
                              : (single_goal === 'Low') ? Math.max(0, example_guess_single - 0)
                              : Math.abs(example_guess_single - mean_rounded_single);
var adv_bonus_single = (1.00 - 0.02 * adv_penalty_points_single).toFixed(2);
var adv_formula_single = (single_goal === 'High') ? ('100 - ' + example_guess_single)
                        : (single_goal === 'Low') ? (example_guess_single + ' - 0')
                        : ('|' + example_guess_single + ' - ' + mean_rounded_single + '|');

////////////////////////////////////
////////// Define instructions //////
////////////////////////////////////

var page1_html_single = `
<div class="instruction-page">
  <div class="section">
    <p>In this study, we are interested in understanding how persuasion works.</p>
    <p>The task involves two players: a <strong>Judge</strong> and an <strong>Advocate</strong>. The task will proceed as follows:</p>
    <p>First, ${N_Sticks_Drawn} sticks with heights between ${Min_Stick_Length} and ${Max_Stick_Length} will be drawn. The Advocate will see the heights of all ${N_Sticks_Drawn} sticks and will click to cover exactly ${single_n_cover} of them. The Judge will then see only the heights of the <em>uncovered</em> sticks (not their positions) and estimate the average height of all ${N_Sticks_Drawn} sticks. The Judge's goal is to make as ACCURATE an estimate as possible. The Advocate's goal is for the Judge's estimate to be as ${single_goal_text.toUpperCase()} as possible. You will play the role of the <strong>Advocate</strong>.</p>
    <p>Bonuses for each player are determined based on the Judge's guess. Both players start with $1.00 in bonus. The Judge loses $0.02 for each point their estimate differs from the true average. The Advocate loses $0.02 for each point ${single_goal === 'High' ? "the Judge's estimate is below 100" : (single_goal === 'Low' ? "the Judge's estimate is above 0" : "the Judge's estimate differs from the true average (the same rule as the Judge)") }.</p>
    <p>The Advocate must cover exactly ${single_n_cover} sticks. When the Judge makes a guess, they will be told the Advocate's goal as well as and how many sticks were covered. The Judge, however, will not see which sticks were covered and will only see the heights of the uncovered sticks.</p>
  </div>
</div>`;

var page2_html_single = `
<div class="instruction-page">
  <div class="title"><h2>Example</h2></div>
  <div class="section">
    <p>Here is an example:</p>
    <p>First, the Advocate will see all ${N_Sticks_Drawn} sticks and their heights:</p>
    <div class="sticks-display"><div class="example-header"><strong>Your goal:</strong> Judge to make ${single_goal_text} guess.<br><strong>Number of sticks to cover:</strong> ${single_n_cover}</div><div class="sticks-row">${all_sticks_html_single}</div></div>
  </div>
  <div class="section">
    <p>Then the Advocate will click which ${single_n_cover} sticks to cover. Suppose the Advocate covered these sticks:</p>
    <div class="sticks-display"><div class="example-header"><strong>Your goal:</strong> Judge to make ${single_goal_text} guess.<br><strong>Number of sticks to cover:</strong> ${single_n_cover}</div><div class="sticks-row">${example_cover_html_single}</div></div>
  </div>
  <div class="section">
    <p>The Judge would then sees only the <em>uncovered</em> sticks. The Judge is told how many sticks were covered and the Advocate's goal, but not which positions were covered.</p>
    <div class="sticks-display"><div class="example-header"><strong>Advocate's goal:</strong> You to make ${single_goal_text} guess.<br><strong>Number of sticks covered:</strong> ${single_n_cover}</div><div class="sticks-row">${judge_view_html_single}</div></div>
  </div>
  <div class="section">
    <p>Suppose the Judge guesses <strong>${example_guess_single}</strong>, and the true average is <strong>${mean_rounded_single}</strong>.</p>
    <p>The Judge's bonus would then be: $1.00 − $0.02 × |${example_guess_single} − ${mean_rounded_single}| = <strong>$${judge_bonus_single}</strong></p>
    <p>The Advocate's bonus would be: $1.00 − $0.02 × (${adv_formula_single}) = <strong>$${adv_bonus_single}</strong></p>
  </div>
</div>`;

var instruction_pages_single = [page1_html_single, page2_html_single];

var instruction_trial_single = {
  type: jsPsychInstructions,
  pages: instruction_pages_single,
  show_clickable_nav: true
};

/////////////////////////
/// Comprehension quiz ///
/////////////////////////

var quiz_questions_single = [
  {
    prompt: "What role will you play in this study?",
    options: ["Advocate", "Judge"],
    correct: 0
  },
  {
    prompt: "What is your goal?",
    options: [
      "Make the Judge's estimate higher",
      "Make the Judge's estimate lower",
      "Make the Judge's estimate accurate"
    ],
    correct: (single_goal === 'High') ? 0 : (single_goal === 'Low' ? 1 : 2)
  },
  {
    prompt: "How many sticks must you cover?",
    options: [
      "Exactly " + single_n_cover,
      "Any number you choose"
    ],
    correct: 0
  },
  {
    prompt: "What should the Judge estimate?",
    options: [
      "The average height of all " + N_Sticks_Drawn + " sticks, including those that were covered",
      "The average height of the uncovered sticks only",
      "The number of sticks covered"
    ],
    correct: 0
  },
  {
    prompt: "What does the Judge see before making a guess?",
    options: [
      "Only the heights of uncovered sticks (not the positions of covered sticks)",
      "All " + N_Sticks_Drawn + " sticks and their heights",
      "Which positions were covered but not their heights"
    ],
    correct: 0
  }
];

var instruction_correct_single = false;

var instruction_check_single = {
  type: jsPsychSurveyMultiChoice,
  questions: quiz_questions_single,
  preamble: "You will need to pass a short quiz before beginning the single round.",
  on_finish: function(quiz_data) {
    var quiz_responses = quiz_data.response || {};
    var total_correct = 0;
    var incorrect_questions = ['<br> </br'];
    for (var i = 0; i < quiz_questions_single.length; i++) {
      var correct_response = quiz_questions_single[i].options[quiz_questions_single[i].correct];
      var participant_response = quiz_responses['Q'+i];
      if (correct_response === participant_response) {
        total_correct++;
      } else {
        incorrect_questions.push('<br>' + quiz_questions_single[i].prompt);
      }
    }
    window.incorrect_questions_single = incorrect_questions;
    if (total_correct === quiz_questions_single.length) {
      instruction_correct_single = true;
    }
  }
};

var splash_screen_single = {
  type: jsPsychHtmlButtonResponse,
  timing_post_trial: 0,
  choices: ['Click here to read the instructions again'],
  is_html: true,
  stimulus: function(){
    var incor_q = window.incorrect_questions_single || ['No questions available'];
    return 'The following questions were answered incorrectly: ' + incor_q;
  }
};

var conditional_splash_single = {
  timeline: [splash_screen_single],
  conditional_function: function() { return !instruction_correct_single; }
};

var intro_loop_single = [];
intro_loop_single.push(instruction_trial_single);
intro_loop_single.push(instruction_check_single);
intro_loop_single.push(conditional_splash_single);

var intro_loop_node_single = {
  timeline: intro_loop_single,
  conditional_function: function() { return !instruction_correct_single; },
  loop_function: function() { return !instruction_correct_single; }
};

var finish_instruc_screen_single = {
  type: jsPsychHtmlButtonResponse,
  timing_post_trial: 0,
  choices: ['Begin the task!'],
  is_html: true,
  stimulus: 'You passed the quiz! Press the button to begin the task.'
};

var instruction_timeline_single = [];
instruction_timeline_single.push(intro_loop_node_single);
instruction_timeline_single.push(finish_instruc_screen_single);


