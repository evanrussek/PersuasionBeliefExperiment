// define condition here


var participant_role = "advocate"; // "advocate" or "judge"
var covered_condition = true;
var advocate_goal = "accurate" // "high", "low", "accurate"

////////////////////////////////////
////////// Define instructions //////
////////////////////////////////////

var page1_html = "<p> In this task, two participants, an advocate and a judge, will be paired up. " +
"Their choices will together determine each other's bonus payment. </p>"+
"<p> <b> You will be the " + participant_role + ".</b> </p>" +
"<p> The task will work as follows. </p>" +
"<p> First a handful of sticks will be randomly drawn " + (covered_condition ? "": "and presented to the advocate.") + "<\p>" +
"<p>The sticks will be arranged such that the smallest sticks are on the left and the largest sticks on the right. An example is shown below.  <\p>" +
'<br> <img src="images/Example_Sticks.png"></img>';

var page1b_boxes_covered_html = "<p> The advocate will be presented with a screen where each stick is covered by a box, as shown below. <\p>" +
"The advocate will not know what stick is behind each box, but will know that the sticks are ordered with the smallest on the left and the largest on the right.<\p>" +
'<br> <img src="images/Example_Covered_Sticks.png"></img>';

var page2_html = "The advocate will then select 5 of the sticks, like this: <br>" +
(covered_condition ? '<img src="images/Example_Covered_Selections.png"></img>' : '<img src="images/Example_Selections.png"></img>');

var page2b_boxes_covered_html = "<p> In the example, these are the selected sticks. <\p>" +
'<br> <img src="images/Example_Covered_Post_Selection.png"></img>';

var page3_html = "This is what the judge would see, given those selections: <br>" +
(covered_condition ? '<img src="images/Example_Covered_Presentation.png"></img>' : '<img src="images/Example_Presentation.png"></img>');

var page4_html = "The judge will then guess the average length of the sticks that were in in the initial draw. Their decision screen will look like this: " +
'<br> <img src="images/Example_Guess.png"></img>';

// note: add picture of just the sticks
var page5_html = "<p> The judge's goal is to make as accurate a guess as possible about the average stick value in the original pile. " +
"To incentivize this, the judge will earn a higher bonus the closer their guess is to the true average of the original pile." +
"Specifically, the judge will start with a bonus of $1. However, out of this bonus, they will lose 1¢ for each unit away from the true value that they guess. <\p>" +
"So for instance if this is the set of sticks that were initially drawn (true mean is 66), and the judge guessed 80 units, then they will get a 86¢ ($1 - (80c - 66c)) bonus."+
'<p>  <br> <img src="images/Example_Sticks.png"></img> <\p>';

var page6_start = "<p> The advocate's goal is for the judge to make as " + advocate_goal + " a guess as possible <\p>";

var incentivization_truthful = "To incentivize this, the advocate will also earn a higher bonus the closer the judge's guess is to the treu average of the original pile. Specifically, the judge will start with a bonus of $1. However, out of this bonus, they will lose 1¢ for each unit away from the true value that they guess. <\p>" +
"So for instance if this is the set of sticks that were initially drawn (true mean is 66), and the judge guessed 80 units, then the advocate will get a 86¢ ($1 - (80c - 66c)) bonus." +
'<p> <br> <img src="images/Example_Sticks.png"></img> <\p>';

var incentivization_high = "To incentivize this, the advocate will earn a higher bonus when the judge's guess is higher. Specifically, the advocate will not start out with a bonus, but will gain 2c for each unit that the judge guesses above 0." + 
"So for instance if this is the set of sticks that were initially drawn (true mean is 66), and the judge guessed 80 units, then the advocate will get an 80¢ bonus." +
'<p> <br> <img src="images/Example_Sticks.png"></img> <\p>';

var incentivization_low = "To incentivize this, the advocate will earn a higher bonus when the judge's guess is lower. Specifically, the advocate will start out with a bonus of $1.00, but will lose 2c for each unit that the judge's guess is above 0." +
"So for instance if this is the set of sticks that were initially drawn (true mean is 66), and the judge guessed 30 units, then the advocate will get a 70¢ ($1 - 30c) bonus." +
'<p> <br> <img src="images/Example_Sticks.png"></img> <\p>';

if (advocate_goal == "high"){
    var page6_html = page6_start + incentivization_high;
}else if (advocate_goal == "low"){
    var page6_html = page6_start + incentivization_low;
}else{
    var page6_html = page6_start + incentivization_truthful;
}

var page7_html = "<p> As a reminder, you will be the " + participant_role + " <\p>" + 
"<p> You will need to pass an instruction quiz before begining the task. Getting any questions wrong will require you to re-read the instructions. <\p>"

var covered_pages = [
    page1_html,
    page1b_boxes_covered_html,
    page2_html,
    page2b_boxes_covered_html,
    page3_html,
    page4_html,
    page5_html,
    page6_html,
    page7_html
];

var uncovered_pages = [
    page1_html,
    page2_html,
    page3_html,
    page4_html,
    page5_html,
    page6_html,
    page7_html
];

if (covered_condition){
    var instruction_pages = covered_pages;
}else{
    var instruction_pages = uncovered_pages;
}

// instruction_pages = []

var instruction_trial = {
    type: jsPsychInstructions,
    pages: instruction_pages,
    show_clickable_nav: true
}

/////////////////////////
/// Build the quiz
///////////////////////////

var role_q_correct = ((participant_role == "advocate" ) ? 0 : 1);

if (advocate_goal === "accurate"){
    var ad_q_correct = 0;
}else if (advocate_goal === "high"){
    var ad_q_correct = 1;
}else{
    var ad_q_correct = 2;
}


var start_questions = [
  {
    prompt: "Are you a robot?",
    options: ["yes", "no"],
    correct: 1 // this gives the index into options which is correct - starts at 0 - if advocate is correct do 0 if judge do 1
  }
  // Add more questions as needed
];


var start_question_trial = { // this runs the quiz
  type: jsPsychSurveyMultiChoice,
  questions: start_questions
}




var quiz_questions = [
    {
      prompt: "What is your role in this experiment?",
      options: ["Advocate", "Judge"],
      correct: role_q_correct // this gives the index into options which is correct - starts at 0 - if advocate is correct do 0 if judge do 1
    },
    {
      prompt: "What is the judge's goal?",
      options: ["Make an accurate guess", "Make a high guess", "Make a low guess"],
      correct: 0 // correct index
    },
    {
        prompt: "What is the advocate's goal?",
        options: ["Judge to make an accurate guess", "Judge to make a high guess", "Judge to make a low guess"],
        correct: ad_q_correct// correct index
      }
    // Add more questions as needed
  ];




  // Define the quiz trial

  var instruction_correct = false;

  var instruction_check = { // this runs the quiz
    type: jsPsychSurveyMultiChoice,
    questions: quiz_questions,

    // on finsih check which if any questions were incorrect (note - change these so they're not global vars)
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
instruction_timeline.push(finish_instruc_screen)
