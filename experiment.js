const jsPsych = initJsPsych();

// Define your facts about the person
var factsList = [
    "Has a Bachelor's degree in Computer Science.",
    "Worked as a software engineer for 3 years.",
    "Speaks three languages fluently.",
    "Has traveled to 10 different countries.",
    "Co-authored a paper on software development best practices.",
    "Devotes time to a local coding bootcamp as a mentor for aspiring developers.",
    "Received the 'Outstanding Employee of the Year' award at the previous company"
    // Add more facts as needed
];

// Define questions corresponding to each fact
var questionsList = [
    "What subject is Dave's bachelor degree in?",
    "How many years did Dave work as a software engineer?",
    "How many languages does Dave speak fluently?",
    "How many countries has Dave traveled to?",
    "What did Dave co-author a paper on?",
    "What local activity does Dave devote time to as a mentor?",
    "What award did Dave receive at the previous company?"
    // Add more questions as needed
];


// Shuffle the facts and questions for each trial
function shuffleFacts() {
    return jsPsych.randomization.shuffle(factsList.slice());
}

function shuffleQuestions() {
    return jsPsych.randomization.shuffle(questionsList.slice());
}

// Function to create a trial with a random order of facts
function createResumeTrial(facts){

    var html = '<div class="resume-container">';

    html += '<p>Please read this person\'s resume.</p>';

    html += '<div class="resume-box">';
    html += '<p class="resume-title">Dave Johnson\'s Resume</p>';
    for (var i = 0; i < facts.length; i++) {
        html += '<p class="resume-fact">' + facts[i] + '</p>';
    }
    html += '</div>';
    html += '</div>';

    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: html,
        choices: ["Next"],
        post_trial_gap: 500, // Optional gap before the next trial
    };
}

// Function to create a trial with text boxes for user input
function createTextResponseTrial(numFacts) {
    var questions = [];
    for (var i = 0; i < numFacts; i++) {

    questions.push({
        prompt: `Fact ${i+1}`,
        name: 'fact' + (i + 1),
    });
    }

    return {
    type: jsPsychSurveyText,
    preamble: `Now choose ${numFacts} facts from the resume to report to the hiring committee. Your goal is for them to hire the person.`,
    questions: questions
    };
}

// Function to create a trial with questions for user response
function createQuestionTrial(questions) {
    var textQuestions = [];
    for (var i = 0; i < questions.length; i++) {
    textQuestions.push({
        prompt: questions[i],
        name: questions[i],
        question: questions[i] // Add a property to indicate the corresponding question
    });
    }

    return {
    type: jsPsychSurveyText,
    preamble: 'Now answer questions about Dave based on the resume:',
    questions: textQuestions
    };
}

// Create an array to hold all trials
var timeline = [];

// Generate randomized resume trial
var randomizedFacts = shuffleFacts();
var resumeTrial = createResumeTrial(randomizedFacts);
timeline.push(resumeTrial);

// Add text response trial
numFacts = 3
var textResponseTrial = createTextResponseTrial(numFacts);
timeline.push(textResponseTrial);

// Shuffle the questions for each trial
var randomizedQuestions = shuffleQuestions();

// Add text response trial for questions
var questionTrial = createQuestionTrial(randomizedQuestions);
timeline.push(questionTrial);

// Add end trial to save the data locally
var endTrial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: 'Thank you for completing the experiment! Click below to save your data locally.',
    choices: ['Save Data Locally'],
    on_finish: function () {
    // Get the data as a CSV string
    var dataCSV = jsPsych.data.get().csv();

    // Save the data locally as a CSV file
    jsPsych.data.get().localSave('csv', 'experiment_data.csv');
    }
};
timeline.push(endTrial);

jsPsych.run(timeline);