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

var participant_role_ex = "advocate"; // "advocate" or "judge"
var covered_condition_ex = false;
var advocate_goal_ex = "high" // "high", "low", "accurate"
var n_trial_condition_ex = "multi" // "single", or "multi"

// grab the subject prolific ID
if (window.location.search.indexOf('ROLE') > -1) {
  var participant_role = getQueryVariable('ROLE');
}
else {
  var participant_role = participant_role_ex; // "advocate" or "judge"
}

if (window.location.search.indexOf('COVERED') > -1) {
  var covered_condition = getQueryVariable('COVERED') === "true";
}else{
  var covered_condition = covered_condition_ex; // true or false
}

if (window.location.search.indexOf('GOAL') > -1) {
  var advocate_goal = getQueryVariable('GOAL');
}else{
  var advocate_goal = advocate_goal_ex; // "high", "low", "accurate"
}

if (window.location.search.indexOf('N_TRIAL') > -1) {
  var n_trial_condition = getQueryVariable('N_TRIAL');
}else{
  var n_trial_condition = n_trial_condition_ex; // "single", or "multi"
}



////////////////////////////////////
////////// Define instructions //////
////////////////////////////////////

var page1_html = `
<div class="instruction-page">
    <div class="title"></div>
    <div class="section">
        <p>${n_trial_condition === "multi" 
            ? "In this task, you will play a series of games. For each game,"
            : "In this task,"} two participants will be paired up. One participant will be the <span class="role">advocate</span> and the other will be the <span class="role">judge</span>. Their choices will together determine each other's bonus payment.</p>
        <p>${n_trial_condition === "multi" 
            ? "Each game will work as follows:"
            : "The task will work as follows:"}</p>
        <ol>
            
                <p>First, 20 sticks will be randomly drawn (example shown below). The sticks will vary in height. The height of each stick is printed below each stick.</p>
                <img src="images/Sticks_Random.png" alt="Randomly arranged sticks" class="consistent-image">
            
                <p>The sticks will be arranged such that the shortest are on the left and the tallest are on the right.</p>
                <img src="images/Sticks_Ordered.png" alt="Ordered sticks" class="consistent-image">
            
        </ol>
    </div>
    <div class="section">
        <p>${covered_condition 
            ? "The advocate will be presented with a screen where each stick is covered by a box, as shown below. The advocate will not know the height of the sticks behind each box, but will know that the sticks are ordered with the shortest on the left and the tallest on the right. Thus, the advocate will know the sticks' order but not their height."
            : "The advocate will be presented with a screen like the one above and will see the height of each stick."}</p>
        ${covered_condition 
            ? `<img src="images/Sticks_Covered.png" alt="Sticks as seen by advocate" class="consistent-image">`
            : ''
        }
        <p>The advocate will then select 5 of the sticks to reveal to the judge by clicking on the check-boxes below each stick they want to select.</p>
    </div>
</div>
`;



var page2_html = `
<div class="instruction-page">
    <div class="title"></div>
    <div class="section">
        <p>The judge will see the results of the advocate's selections. An example is shown below:</p>
        <img src="images/Sticks_Judge_View.png" alt="Sticks as seen by judge" width="200">
        <p>The judge will then guess the average height of ALL 20 of the sticks that were in the initial draw (NOT just the ones that were revealed). They will write their guess into a prompt.</p>
    </div>
</div>
`;

var page3_html = `
<div class="instruction-page">
    <div class="title"></div>
    <div class="section">
        <p>The judge's goal is to make as accurate a guess as possible about the average height of all 20 sticks. To incentivize this, the judge will earn a higher bonus the closer their guess is to the true average of the original 20 sticks.</p>
        Bonus calculation: The judge will start with a bonus of $1. However, out of this bonus, they will lose 2¢ for each 'unit' away from the true value that they guess.</p>
    </div>
    <div class="section">
        ${n_trial_condition === "multi" 
            ? `<p>The advocate's goal will differ for the different games:</p>
               <ul>
                 <li><strong>Accurate guess games:</strong> The advocate's goal will be for the judge to make as accurate a guess as possible. In these games, they will be bonused the same as the judge.</li>
                 <li><strong>High guess games:</strong> The advocate's goal will be for the judge to make as high a guess as possible. The advocate will earn a higher bonus when the judge's guess is higher. Specifically, the advocate will not start out with a bonus, but will gain 2¢ for each unit that the judge guesses above 0.</li>
                 <li><strong>Low guess games:</strong> The advocate's goal will be for the judge to make as low a guess as possible. The advocate will earn a higher bonus when the judge's guess is lower. Specifically, the advocate will not start out with a bonus, but will gain 2¢ for each unit that the judge guesses below 100.</li>
               </ul>
               <p>Both the advocate and the judge will be told the advocate's goal prior to each game, before making any choices or guesses for that game.</p>`
            : `<p>The advocate's goal is for the judge to make as ${advocate_goal} a guess as possible.</p>
               <p>Bonus calculation: ${advocate_goal === "accurate" 
                 ? "The advocate's bonus will be equivalent to the judge's bonus."
                 : advocate_goal === "high"
                   ? "The advocate will earn a higher bonus when the judge's guess is higher. Specifically, the advocate will not start out with a bonus, but will gain 2¢ for each unit that the judge guesses above 0."
                   : "The advocate will earn a higher bonus when the judge's guess is lower. Specifically, the advocate will not start out with a bonus, but will gain 2¢ for each unit that the judge guesses below 100."
               }</p>`
        }
    </div>
</div>
`;

var page4_html = `
<div class="instruction-page">
    <div class="title"></div>
    <div class="section">
        <p>You will play the role of the <span class="role">${participant_role.toUpperCase()}</span></p>
        ${n_trial_condition === "multi"
            ? `<p>${participant_role === "judge" 
                ? "You will play the game 4. You will receive selections from an advocate that has already played the game. Before each is shown, you will see what the advocate's goal was before they made the selection."
                : "You will play the game 4 times. You will be notified of your goal prior to each game."}</p>
               <p>Bonus calculation: The bonus that you receive will be based on a single randomly drawn game.</p>
               ${participant_role === "advocate" 
                 ? "<p>Your total earnings will be calculated after you have been paired with a judge and thus may not show up in your account for a few weeks.</p>"
                 : ""
               }`
            : ""
        }
    </div>
    <div class="section">
        <p><You will need to complete a quiz before starting the task.</p>
    </div>
</div>`;

var instruction_pages = [page1_html, page2_html, page3_html, page4_html]

var instruction_trial = {
    type: jsPsychInstructions,
    pages: instruction_pages,
    show_clickable_nav: true
}

/////////////////////////
/// Build the quiz
///////////////////////////

var role_q_correct = ((participant_role == "advocate" ) ? 0 : 1);
var covered_q_correct = (covered_condition ? 0 : 1);

if (advocate_goal === "accurate"){
    var ad_q_correct = 0;
}else if (advocate_goal === "high"){
    var ad_q_correct = 1;
}else{
    var ad_q_correct = 2;
}

if (n_trial_condition === "multi"){
  var ad_q_correct = 3;
}


var n_start_questions = 4; // edit to match... 
// guess we'll limit participants to US?
var start_questions = [
  {
    prompt: "Which of these is NOT a food usually served at a 4th of July barbecue?",
    options: ["Granola", "Hamburgers", "Hot Dogs", "Baked Beans", "Coleslaw"],
    correct: 0 // this gives the index into options which is correct - starts at 0 
  },
  {prompt: "Which of these is the term for someone in their second year of high school?",
    options: ["Eigth Grader", "Freshman", "Sophomore", "Junior", "Senior"],
    correct: 2 // this gives the index into options which is correct - starts at 0 - 
    },
    {prompt: "Which of these phone numbers connects you to emergency services?",
      options: ["112", "999", "789", "000", "911"],
      correct: 4 // this gives the index into options which is correct - starts at 0 - 
      },
      {prompt: "The pancreas’s ______ of insulin impairs the body’s ability to use up and preserve sugar.",
        options: ["inadequate production", "producing inadequately", "produces inadaquacy", "inadequate producer"],
        correct: 0 // this gives the index into options which is correct - starts at 0 - 
        }
    
  // Add more questions as needed
];

var start_quiz_correct = false;


var start_question_trial = { // this runs the quiz
    type: jsPsychSurveyMultiChoice,
    questions: start_questions,
    preamble: "Welcome to the experiment. Please answer the questions below to ensure you are not a bot.",
    on_finish: function(quiz_data) {

        quiz_responses = quiz_data.response;
        // console.log(quiz_responses)

        total_correct = 0;

        // incorrect_questions =['<br> </br'];

        for (let i = 0; i < start_questions.length; i++) {

        // start w/ an empty array then push onto this incorrect responses

            var correct_response = start_questions[i].options[start_questions[i].correct];
            var participant_response = quiz_responses['Q'+i]

            console.log(correct_response)
            console.log(participant_response)

            if (correct_response === participant_response) {
                total_correct++;
            }
        }

        if (total_correct === start_questions.length){
            start_quiz_correct = true; // will check this
        }
    } // end on finish
}

// 

var failed_start_question = {
    type: jsPsychHtmlButtonResponse,
    choices: ["Continue"],
    stimulus: `<p> Sorry, you've answered a question wrong and the experiment will now end.</p> 
    <p>If something went wrong that explains why the attention checks were not completed, please contact the researchers through the Prolific messaging system.</p>
               <p>Click 'Continue' to be redirected to Prolific.</p>`,
    on_finish: function(data) {
        jsPsych.endExperiment();
    }
}

var conditional_start_quiz_incorrect = { // 
    timeline: [failed_start_question],
    conditional_function: function(data) {
      return !start_quiz_correct // skip if correct
      }
  }


var quiz_questions = [
    {
      prompt: "What is your role in this experiment?",
      options: ["Advocate", "Judge"],
      correct: role_q_correct // this gives the index into options which is correct - starts at 0 - if advocate is correct do 0 if judge do 1
    },
    {
        prompt: "How many sticks will be randomly selected, in total, that the Advocate will get to choose from?",
        options: ["5", "15", "20", "25"],
        correct: 2 
      },
      {
        prompt: "How many sticks does the advocate get to select, to reveal to the Judge?",
        options: ["5", "15", "20", "25"],
        correct: 0 
      },
      {
        prompt: "When the advocate selects sticks, what does the advocate know?",
        options: ["The order of the sticks, in terms of their height", "The height of the selected sticks"],
        correct: covered_q_correct 
      },
      {
        prompt: "When the Advocate selects sticks to reveal to the judge, what does the judge get to see?",
        options: ["The order of the selected sticks (whether they were the shortest, tallest, etc.)", "The height of the selected sticks", "The height and the order of the selected sticks"],
        correct: 1 // correct index
      },
    {
      prompt: "What is the Judge's goal?",
      options: ["Make an accurate guess", "Make a high guess", "Make a low guess"],
      correct: 0 // correct index
    },
    {
        prompt: "What is the advocate's goal?",
        options: ["Judge to make an accurate guess", "Judge to make a high guess", "Judge to make a low guess", "This may differ for each game"],
        correct: ad_q_correct// correct index
      }
    // Add more questions as needed
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
instruction_timeline.push(finish_instruc_screen)
