// define condition here

// https://spinproject-39dd6.web.app/version_1/?ROLE=advocate&COVERED=false&GOAL=high&N_TRIAL=multi

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}


// TODO -- DISCUSS BONUS w/ TOM

var initial_bonus = 5;
var penalty_cents = 1;

// ENTER PARAMETERS FOR TASK - SHOULD THESE BE PRE-DRAWN?
var Max_Stick_Length = 100
var Min_Stick_Length = 0 

// condition is 
var N_Trials = 10;
var N_Sticks_Drawn = 10
var N_Sticks_Selected = 4;
var censored_direction = "high";
include_instructions = false;


// https://spinproject-39dd6.web.app/Experiment_1/?include_instructions=false&N_Sticks_Drawn=10&N_Sticks_Selected=4&CENSORED_DIRECTION=high

// grab each of these variables from the URL

// grab include instructions from the URL
if (window.location.search.indexOf('include_instructions') > -1) {
    include_instructions_in = getQueryVariable('include_instructions');
    include_instructions = include_instructions_in === 'true' ? true : false;
}

if (window.location.search.indexOf('N_Sticks_Drawn') > -1) {
  var N_Sticks_Drawn = getQueryVariable('N_Sticks_Drawn');
}

if (window.location.search.indexOf('N_Sticks_Selected') > -1) {
  var N_Sticks_Selected = getQueryVariable('N_Sticks_Selected');
}

if (window.location.search.indexOf('CENSORED_DIRECTION') > -1) {
  var censored_direction = getQueryVariable('CENSORED_DIRECTION');
}

// create first bit of text that depends on the condition
if (censored_direction == "high"){
    var condition_text = `Instead, we'll show you only the ${N_Sticks_Selected} tallest sticks in that group.`;
} else if (censored_direction == "low"){
    var condition_text = `Instead, we'll show you only the ${N_Sticks_Selected} shortest sticks in that group.`;
}
else if (censored_direction == "random"){
    var condition_text = `Instead, we'll show you only ${N_Sticks_Selected} randomly selected sticks from that group.`;
}

// create instruction pages...
var page1_html = `
<div class="instruction-page">
    <div class="title"></div>
    <div class="section">
        <p>Welcome to the study. In this study, you'll go through ${N_Trials} rounds. In each round, we'll start with ${N_Sticks_Drawn} sticks, each with a random height between 0 and 100.</p>
        <p>You won't see all ${N_Sticks_Drawn} sticks. ${condition_text}</p>
    </div>
    <div class="section">
        <ol>
            <p>Based on those ${N_Sticks_Selected}, your task is to guess the average height of all ${N_Sticks_Drawn} sticks that were originally drawn, including the ones you don't see.</p>
        </ol>
    </div>
    <div class="section">
        <p>For your payment, you'll start with a $${initial_bonus} bonus. This bonus will be reduced by ${penalty_cents} cent for every point (rounded down) that your guess is away from the correct answer.</p>
        <p>The closer your guess is to the true average, the higher your final bonus will be.</p>
    </div>
</div>`;


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

var original_stick_values_for_selection = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);

var complete_sticks_HTML = '';
complete_sticks_HTML = display_sticks(complete_sticks_HTML, original_stick_values_for_selection, false, false);

// Assuming you'll want to show only a subset of sticks for the second display
// You'll need to modify this based on how you want to select the visible sticks
var visible_sticks_HTML = '';
var visible_sticks = original_stick_values_for_selection.slice(-4); // showing only X tallest sticks
visible_sticks_HTML = display_sticks(visible_sticks_HTML, visible_sticks, false, false);

// Calculate mean for the example
var mean = original_stick_values_for_selection.reduce((a, b) => a + b) / original_stick_values_for_selection.length;
var example_guess = 65; // You can set this to whatever value you want
var bonus_reduction = Math.round(Math.abs(mean - example_guess));

var page2_html = `
<div class="instruction-page">
    <div class="title"></div>
    <div class="section">
        <p>Here's an example to help you understand how it works:</p>
        <p>Imagine these are the heights of the 10 sticks that are drawn:</p>
    </div>
    <div class="section">
        <div class="sticks-display">
            ${complete_sticks_HTML}
        </div>
    </div>
    <div class="section">
        <p>The mean of this pile is ${mean.toFixed(0)}.</p>
        <p>Then these would be the sticks shown to you:</p>
    </div>
    <div class="section">
        <div class="sticks-display">
            ${visible_sticks_HTML}
        </div>
    </div>
    <div class="section">
        <p>Then you would be asked to guess the average of the 10 originally drawn sticks (including the ${N_Sticks_Drawn-N_Sticks_Selected} you didn't see).</p>
        <p>Suppose you guess ${example_guess}. Recall, the correct mean was ${mean.toFixed(0)}. Therefore, your bonus would be reduced by ${bonus_reduction} cents.</p>
    </div>
        <div class="section">
        <p>You will need to pass a quiz on these instructions before beginning the task.</p>
    </div>
</div>
`;

var instruction_pages = [page1_html, page2_html];

var instruction_trial = {
    type: jsPsychInstructions,
    pages: instruction_pages,
    show_clickable_nav: true
}

// Define the instruction quiz... 
var quiz_questions = [
    {
        prompt: "In each round, how many sticks will be drawn initially (prior to selection)?",
        options: [
            `${Math.round(.5*N_Sticks_Drawn)}`,
            `${N_Sticks_Drawn}`,
            `${1.5*N_Sticks_Drawn}`,
            `${2*N_Sticks_Drawn}`
        ],
        correct: 1  // Based on N_Sticks_Drawn variable
    },
    {
        prompt: "How many sticks will be selected to be shown to you, in each round?",
        options: [
            `${Math.round(.25*N_Sticks_Selected)}`,
            `${Math.round(.5*N_Sticks_Selected)}`,
            `${Math.round(N_Sticks_Selected)}`,
            `${Math.round(2*N_Sticks_Selected)}`
        ],
        correct: 2  // Based on X variable (number of sticks shown)
    },
    {
        prompt: "How will these sticks be selected?",
        options: [
            "They will be the tallest sticks",
            "They will be the shortest sticks",
            "They will be selected at random"
        ],
        correct: censored_direction === "high" ? 0 :
        censored_direction === "low" ? 1 : 2  // Based on selection_type variable
    },
    {
        prompt: "What is your task in each round?",
        options: [
            "Guess the height of the tallest stick",
            "Guess the average height of the sticks that were selected and shown to you",
            `Guess the average height of all sticks that were originally drawn, including those that weren't selected and shown to you`,
            "Count the number of sticks taller than 50"
        ],
        correct: 2  // This seems to always be correct based on task description
    },
    {
        prompt: "How does the payment work in this study?",
        options: [
            "You receive a flat payment of $5",
            "You start with a $5 bonus, which remains the same regardless of your guesses",
            `You start with a $${initial_bonus} bonus, reduced by ${penalty_cents} cent for each point your guess is off from the correct answer`,
            "You earn 1 cent for each correct answer"
        ],
        correct: 2  // This seems to always be correct based on payment structure
    },
    {
        prompt: "If the correct average height of the sticks is 60, and you guessed 75, how would this affect your bonus?",
        options: [
            "No change to your bonus",
            "10 cents would be added to your bonus",
            "15 cents would be added to your bonus",
            `${Math.abs(75 - 60)} cents would be deducted from your bonus`
        ],
        correct: 3  // This example seems fixed
    }
];

 // Define the quiz trial

 var instruction_correct = false;

 var instruction_check = { // this runs the quiz
   type: jsPsychSurveyMultiChoice,
   questions: quiz_questions,

   // on finish check which if any questions were incorrect (note - change these so they're not global vars)
   on_finish: function(quiz_data) {

       quiz_responses = quiz_data.response;
       // console.log(quiz_responses)

       total_correct = 0;

       incorrect_questions =['<br> </br'];

 
     for (let i = 0; i < quiz_questions.length; i++) {

       // start w/ an empty array then push onto this incorrect responses

       var correct_response = quiz_questions[i].options[quiz_questions[i].correct];
       var participant_response = quiz_responses['Q'+i]

       if (correct_response === participant_response) {
         total_correct++;
       }else{
           incorrect_questions.push('<br>' + quiz_questions[i].prompt)
       }
     }

     jsPsych.data.addProperties({
       incorrect_questions: incorrect_questions
     });

     if (total_correct === quiz_questions.length){
       instruction_correct = true;
     }

   } // end on finish
 }; // end quiz trial

/* define a page for the incorrect response */
var showsplash = true;
var splash_screen = { // this  is the screen if you answer incorectly
   type: jsPsychHtmlButtonResponse,
   timing_post_trial: 0,
   //    button_html: '<button class="jspsych-btn" style="display:none">%choice%</button>',
   choices: ['Click here to read the instructions again'],
   is_html: true,
   stimulus: function(){
           var incor_q = jsPsych.data.get().last(1).select('incorrect_questions').values
           var next_stimulus = 'The following questions were answered incorrectly: ' + incor_q;
           return next_stimulus
       }
}

var conditional_splash = { // 
   timeline: [splash_screen],
   conditional_function: function(data) {
     return !instruction_correct // skip if correct
     }
 }

var intro_loop = [];
intro_loop.push(instruction_trial);
intro_loop.push(instruction_check);
intro_loop.push(conditional_splash);

var intro_loop_node = {
   timeline: intro_loop,
   conditional_function: function(data) {
       return !instruction_correct // skip if correct
 },
   loop_function: function(data) {
     var action = true;
     return !instruction_correct // stop looping if correct
     }
 }

 var finish_instruc_screen = {
   type: jsPsychHtmlButtonResponse,
   timing_post_trial: 0,
   //    button_html: '<button class="jspsych-btn" style="display:none">%choice%</button>',
   choices: ['Begin the task!'],
   is_html: true,
   stimulus: 'You passed the quiz! Great work. Press the button to begin the task.'
}

var instruction_timeline = []
instruction_timeline.push(intro_loop_node)
//instruction_timeline.push(finish_instruc_screen)

