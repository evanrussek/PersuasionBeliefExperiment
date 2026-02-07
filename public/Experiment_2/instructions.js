// Advocate-focused instructions for the click-to-cover task

// Parameters (match the task in index.js)
var Max_Stick_Length = 100;
var Min_Stick_Length = 1;
var N_Sticks_Drawn = 10;
var N_Rounds = 25; // number of rounds

// Participant role from URL (?ROLE=advocate|judge), default advocate
var participant_role = (typeof getQueryVariable === 'function' && getQueryVariable('ROLE')) ? getQueryVariable('ROLE') : 'advocate';
participant_role = String(participant_role).toLowerCase();
var roleQuestionCorrectIdx = (participant_role === 'advocate') ? 0 : 1;

// Helper to build a sticks display using existing styles
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

// Helper to render what the judge sees: only uncovered sticks (ordered), no rectangles
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

// Build example stimuli dynamically (no stored images)
var example_lengths = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);

function maskFromIndices(indices, length) {
    var mask = Array(length).fill(false);
    for (var j = 0; j < indices.length; j++) mask[indices[j]] = true;
    return mask;
}

function sampleIndices(count, maxExclusive) {
    var pool = Array(maxExclusive).fill().map(function(_, i){ return i; });
    // Use jsPsych randomization if available
    if (window.jsPsych && window.jsPsych.randomization && window.jsPsych.randomization.sampleWithoutReplacement) {
        return window.jsPsych.randomization.sampleWithoutReplacement(pool, count);
    }
    // Fallback simple shuffle
    for (var i = pool.length - 1; i > 0; i--) {
        var r = Math.floor(Math.random() * (i + 1));
        var tmp = pool[i]; pool[i] = pool[r]; pool[r] = tmp;
    }
    return pool.slice(0, count);
}

var cover3_mask = maskFromIndices(sampleIndices(3, N_Sticks_Drawn), N_Sticks_Drawn);
var cover5_mask = maskFromIndices(sampleIndices(5, N_Sticks_Drawn), N_Sticks_Drawn);

var all_sticks_html = renderSticksHTML(example_lengths, []);
var cover3_html = renderSticksHTML(example_lengths, cover3_mask);
var cover5_html = renderSticksHTML(example_lengths, cover5_mask);

////////////////////////////////////
////////// Define instructions //////
////////////////////////////////////

var page1_html = `
<div class="instruction-page">
  <div class="section">
    <p>In this study, we are interested in understanding how persuasion works.</p>
    <p>This study involves two plaeyrs: a <strong>Judge</strong> and an <strong>Advocate</strong>. The study consists of ${N_Rounds} rounds. In each round, ${N_Sticks_Drawn} sticks with heights between ${Min_Stick_Length} and ${Max_Stick_Length} will be drawn. The Advocate will see the heights of all ${N_Sticks_Drawn} sticks and will choose some number of sticks to cover. The Judge will see only the heights of the uncovered sticks. They will then estimate the average height of all ten sticks, including the covered ones that they did not see.</p>
    <p>The Judge's goal is always to make an accurate estimate. The Advocate's goal changes by round and will be shown on screen: to make the Judge's estimate higher, lower, or accurate.</p>
    <p>After the task, one round will be chosen at random to determine bonuses. Both players start that round with $1.50. The Judge loses $0.02 for each point their estimate differs from the true average. If the Advocate's goal is to make the Judge’s estimate higher, they lose $0.02 for each point the Judge's estimate is below 100. If the goal is to make the Judge’s estimate lower, they lose $0.02 for each point the estimate is above 0. If the goal is for the Judge to be accurate, the Advocate loses $0.02 for each point the estimate differs from the true average (the same rule as the Judge).</p>
    <p>The number of sticks that the Advocate must cover will vary by round. When the Judge makes a guess, they will be told the Advocate's goal for that round and how many sticks were covered. They will also be told the Judge's goal for that round and the number of sticks the Advocate covered. The Judge does not see which sticks were covered and sees only the heights of the uncovered sticks.</p>
    <p><strong>You will play the role of the ${participant_role.toUpperCase()}</strong>.</p>
  </div>
</div>`;

// Example round variables
var Example_N_Cover = 5;
var example_condition = (Math.random() < 0.5) ? 'High' : 'Low';
var example_cover_mask = maskFromIndices(sampleIndices(Example_N_Cover, N_Sticks_Drawn), N_Sticks_Drawn);
var example_cover_html = renderSticksHTML(example_lengths, example_cover_mask);
var judge_view_html = renderJudgeViewHTML(example_lengths, example_cover_mask);
var mean_value = example_lengths.reduce(function(a, b){ return a + b; }, 0) / example_lengths.length;
var mean_rounded = Math.round(mean_value);
var example_guess = 65;
var judge_points_off = Math.abs(example_guess - mean_rounded);
var judge_bonus = (1.5 - 0.02 * judge_points_off).toFixed(2);
var adv_penalty_cents = (example_condition === 'High') ? Math.max(0, 100 - example_guess) : Math.max(0, example_guess - 0);
var adv_bonus = (1.5 - 0.02 * adv_penalty_cents).toFixed(2);
var adv_formula = (example_condition === 'High') ? ('100 - ' + example_guess) : (example_guess + ' - 0');

var page2_html = `
<div class="instruction-page">
  <div class="title"><h2>Example round</h2></div>
  <div class="section">
    <p>Below is an example round where the advocate needs to cover ${Example_N_Cover} sticks and their goal is for the judge to make a ${example_condition} guess.</p>
    <p>First, the advocate will be shown all ${N_Sticks_Drawn} sticks that were drawn along with their heights:</p>
    <div class="sticks-display"><div class="example-header"><strong>Your goal:</strong> Judge to make <strong>${example_condition === 'High' ? 'HIGHER' : 'LOWER'}</strong> guess.<br><strong>Number of sticks to cover:</strong> ${Example_N_Cover}</div><div class="sticks-row">${all_sticks_html}</div></div>
  </div>
  <div class="section">
    <p>Then the advocate will click on which sticks they want to cover. Suppose the advocate covered these sticks:</p>
    <div class="sticks-display"><div class="example-header"><strong>Your goal:</strong> Judge to make <strong>${example_condition === 'High' ? 'HIGHER' : 'LOWER'}</strong> guess.<br><strong>Number of sticks to cover:</strong> ${Example_N_Cover}</div><div class="sticks-row">${example_cover_html}</div></div>
  </div>
  <div class="section">
    <p>The display below shows what the judge would then see. The judge will see the heights of the <em>uncovered</em> sticks. They will be told how many sticks were covered, as well as the Advocate's goal. However, they will <em>not</em> see which positions were uncovered.</p>
    <div class="sticks-display"><div class="example-header"><strong>Advocate's goal:</strong> You to make <strong>${example_condition === 'High' ? 'HIGHER' : 'LOWER'}</strong> guess.<br><strong>Number of sticks they covered:</strong> ${Example_N_Cover}</div><div class="sticks-row">${judge_view_html}</div></div>
  </div>
  <div class="section">
    <p>The judge will then make a guess about the average of the ${N_Sticks_Drawn} sticks that were originally drawn. Suppose they guess <strong>${example_guess}</strong>. In this round, the true average of the original sticks is <strong>${mean_rounded}</strong>.</p>
    <p>Judge bonus: $1.50 − $0.02 × |${example_guess} − ${mean_rounded}| = <strong>$${judge_bonus}</strong></p>
    <p>Because the advocate’s goal for this round is <strong>${example_condition}</strong>, their bonus is:</p>
    <p>Advocate bonus: $1.50 − $0.02 × (${adv_formula}) = <strong>$${adv_bonus}</strong></p>
  </div>
</div>`;

var instruction_pages = [page1_html, page2_html];

var instruction_trial = {
    type: jsPsychInstructions,
    pages: instruction_pages,
    show_clickable_nav: true
};

/////////////////////////
/// Comprehension quiz ///
/////////////////////////

var quiz_questions = [
    {
        prompt: "What role will you play in this study?",
        options: [
            "Advocate",
            "Judge"
        ],
        correct: roleQuestionCorrectIdx
    },
    {
        prompt: "What should the Judge estimate?",
        options: [
            "The average height of all 10 sticks, including those that were covered",
            "The average height of the uncovered sticks only",
            "The number of sticks covered"
        ],
        correct: 0
    },
    {
        prompt: "What does the Judge see before making a guess?",
        options: [
            "Only the heights of uncovered sticks (not positions of covered sticks)",
            "All 10 sticks and their heights",
            "Which positions were covered but not their heights"
        ],
        correct: 0
    },
    {
        prompt: "How many sticks should the Advocate cover each round?",
        options: [
            "Any number they choose",
            "Exactly the number shown for that round"
        ],
        correct: 1
    },
    {
        prompt: "Before the Judge makes a guess, are the Advocate's goal and the number of covered sticks shown?",
        options: [
            "Shown",
            "Not shown"
        ],
        correct: 0
    },
    {
        prompt: "What does the Judge's bonus depend on?",
        options: [
            "How close the Judge's estimate is to the true average",
            "Whether the estimate matches the Advocate's goal",
            "How many sticks were uncovered"
        ],
        correct: 0
    }
];

var instruction_correct = false;

var instruction_check = {
    type: jsPsychSurveyMultiChoice,
    questions: quiz_questions,
    preamble: "You will need to pass a quiz on the instructions before beginning the task. Getting a single question incorrect will require you to re-read the instructions.",
    on_finish: function(quiz_data) {
        var quiz_responses = quiz_data.response;
        var total_correct = 0;
        var incorrect_questions = ['<br> </br'];
        for (var i = 0; i < quiz_questions.length; i++) {
            var correct_response = quiz_questions[i].options[quiz_questions[i].correct];
            var participant_response = quiz_responses['Q'+i];
            if (correct_response === participant_response) {
                total_correct++;
            } else {
                incorrect_questions.push('<br>' + quiz_questions[i].prompt);
            }
        }
        // Store incorrect questions for display
        window.incorrect_questions = incorrect_questions;
        if (total_correct === quiz_questions.length) {
            instruction_correct = true;
        }
    }
};

var splash_screen = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['Click here to read the instructions again'],
    is_html: true,
    stimulus: function(){
        var incor_q = window.incorrect_questions || ['No questions available'];
        var next_stimulus = 'The following questions were answered incorrectly: ' + incor_q;
        return next_stimulus;
    }
};

var conditional_splash = {
    timeline: [splash_screen],
    conditional_function: function() {
        return !instruction_correct;
    }
};

var intro_loop = [];
intro_loop.push(instruction_trial);
intro_loop.push(instruction_check);
intro_loop.push(conditional_splash);

var intro_loop_node = {
    timeline: intro_loop,
    conditional_function: function() { return !instruction_correct; },
    loop_function: function() { return !instruction_correct; }
};

var finish_instruc_screen = {
    type: jsPsychHtmlButtonResponse,
    timing_post_trial: 0,
    choices: ['Begin the task!'],
    is_html: true,
    stimulus: 'You passed the quiz! Great work. Press the button to begin the task.'
};

var instruction_timeline = [];
instruction_timeline.push(intro_loop_node);
instruction_timeline.push(finish_instruc_screen);
