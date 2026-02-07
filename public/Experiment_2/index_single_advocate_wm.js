// Single-trial Advocate version with interposed digit-span WM task

// Firebase + Firestore helpers (reuse setup from main index.js)
import { db, authReady } from './firebaseSetup.js';
import {
  doc, setDoc
} from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js';

// Task parameters
const Max_Stick_Length = 100;
const Min_Stick_Length = 1;
const N_Sticks_Drawn = 10;

// Firestore document reference (set after auth)
let docRef;

// Read URL parameters for GOAL and N_COVERED
function readGoalParam() {
  const raw = (typeof getQueryVariable === 'function' && getQueryVariable('GOAL')) ? String(getQueryVariable('GOAL')).toLowerCase() : 'high';
  if (raw === 'high' || raw === 'higher' || raw === 'increase' || raw === 'up') return 'High';
  if (raw === 'low' || raw === 'lower' || raw === 'decrease' || raw === 'down') return 'Low';
  return 'Accurate';
}

function readCoveredParam() {
  let raw = (typeof getQueryVariable === 'function' && getQueryVariable('N_COVERED')) ? parseInt(getQueryVariable('N_COVERED'), 10) : 8;
  if (isNaN(raw)) raw = 8;
  if (raw < 1) raw = 1;
  if (raw > N_Sticks_Drawn - 1) raw = N_Sticks_Drawn - 1;
  return raw;
}

const single_goal = readGoalParam(); // 'High' | 'Low' | 'Accurate'
const single_n_cover = readCoveredParam();

// Subject identifiers (from URL or random fallback)
const PROLIFIC_PID = window.location.search.includes('PROLIFIC_PID') ? getQueryVariable('PROLIFIC_PID') : Math.floor(Math.random() * 2000001);
const STUDY_ID     = window.location.search.includes('STUDY_ID')     ? getQueryVariable('STUDY_ID')     : Math.floor(Math.random() * 2000001);
const SESSION_ID   = window.location.search.includes('SESSION_ID')   ? getQueryVariable('SESSION_ID')   : Math.floor(Math.random() * 2000001);

async function saveDataset(tag = null) {
  const allData = JSON.parse(jsPsych.data.get().json());
  await setDoc(
    docRef,
    {
      PROLIFIC_PID: PROLIFIC_PID,
      STUDY_ID: STUDY_ID,
      SESSION_ID: SESSION_ID,
      experiment_data_cumulative: allData,
      last_saved_tag: tag,
      timestamp: new Date().toISOString(),
      goal: single_goal,
      n_covered: single_n_cover
    },
    { merge: true }
  );
}

// Build timeline
var timeline = [];

// Add the single-trial instructions first
// (temporarily disabled for testing)
// timeline = timeline.concat(instruction_timeline_single);

// Post-task note-taking question (Yes/No) + optional description
var wrote_notes_screen_single = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<p>Did you write anything down during the trial?</p><p>Your answer will not impact your bonus, but helps our analysis.</p>',
  html: '<div style="text-align:left;margin:0 auto;max-width:600px;">' +
        '<p><label><input type="radio" name="wrote_notes" value="Yes" required> Yes</label> ' +
        '<label style="margin-left:16px;"><input type="radio" name="wrote_notes" value="No" required> No</label></p>' +
        '<p><label>If yes, please describe what you wrote down:</label><br>' +
        '<textarea name="wrote_notes_description" rows="3" style="width:100%;"></textarea></p>' +
        '</div>',
  data: { version: 'post_task_single_wm', survey: 'wrote_notes_single_wm' },
  on_finish: function(data) {
    var r = data.response || {};
    data.wrote_notes = r.wrote_notes || '';
    data.wrote_notes_description = r.wrote_notes_description || '';
  }
};

// Simple end screen with final save and Prolific redirect
var end_screen_single = {
  type: jsPsychHtmlButtonResponse,
  choices: ['Finish'],
  is_html: true,
  stimulus: '<p>Thanks! You have completed the task. Please click the button below to submit the task to Prolific.</p>',
  on_start: async function () {
    try {
      await saveDataset('final');
      console.log('✓ Final data saved');
    } catch (err) {
      console.error('Final save failed:', err);
    }
  },
  on_finish: function(){
    window.location = 'https://app.prolific.com/submissions/complete?cc=C1379C4O';
  }
};

// Build the single Advocate+WM trial
var lengths_single = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);

var single_trial = {
  type: jsPsychStickAdvocateWM,
  stick_lengths: lengths_single,
  N_Sticks_Drawn: N_Sticks_Drawn,
  N_Sticks_Covered: single_n_cover,
  incentive_condition: single_goal,
  trial_number: 1,
  total_trials: 1,
  data: {
    version: 'single_advocate_wm',
    incentive_condition: single_goal,
    N_Sticks_Covered: single_n_cover,
    stick_lengths: lengths_single
  },
  on_finish: async function () {
    try {
      await saveDataset('after_single_trial');
      console.log('✓ Data saved after single trial');
    } catch (e) {
      console.error('Save failed', e);
    }
  }
};

// Assemble full timeline: instructions -> single trial -> survey -> end
timeline.push(single_trial);
timeline.push(wrote_notes_screen_single);
timeline.push(end_screen_single);

// Start after Firebase auth is ready
authReady
  .then(async uid => {
    docRef = doc(db, 'spin_task', 'experiment2_single_advocate_wm', 'subjects', uid);
    window.jsPsych.run(timeline);
  })
  .catch(err => {
    console.error('Firebase authentication failed:', err);
    document.body.innerHTML =
      '<h2 style="color:red;text-align:center;margin-top:40vh">' +
      'Authentication error—please reload.</h2>';
  });

// Popup otherwise-silent errors (optional)
window.addEventListener('error', e => {
  alert(`A script error occurred:\n${e.message}\nSee console for details.`);
});


