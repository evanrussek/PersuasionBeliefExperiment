// Demo: branch between Advocate (select) and Judge conditions

// Firebase + Firestore helpers (match index_censored_inference_task.js)
import { db, authReady } from './firebaseSetup.js';
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js';

// Local parameters for the demo
const Max_Stick_Length = 100;
const Min_Stick_Length = 1;
const N_Sticks_Drawn = 10;
// const Trial_N_Sticks_Covered = 5; // no longer used; trials now iterate 1..9

// Firebase save config (same approach as index_censored_inference_task.js)
let docRef; // will hold the Firestore document reference, global scope
const saveInterval = 3; // Save every 3 trials

// Subject identifiers (from URL or random fallback)
const PROLIFIC_PID = window.location.search.includes('PROLIFIC_PID') ? getQueryVariable('PROLIFIC_PID') : Math.floor(Math.random() * 2000001);
const STUDY_ID     = window.location.search.includes('STUDY_ID')     ? getQueryVariable('STUDY_ID')     : Math.floor(Math.random() * 2000001);
const SESSION_ID   = window.location.search.includes('SESSION_ID')   ? getQueryVariable('SESSION_ID')   : Math.floor(Math.random() * 2000001);

async function saveDataset(trialNumber = null) {
  const allData = JSON.parse(jsPsych.data.get().json());
  await setDoc(
    docRef,
    {
      PROLIFIC_PID: PROLIFIC_PID,
      STUDY_ID: STUDY_ID,
      SESSION_ID: SESSION_ID,
      experiment_data_cumulative: allData,
      last_saved_trial: trialNumber,
      timestamp: new Date().toISOString()
    },
    { merge: true }
  );
}

// Build timeline
var timeline = [];
let timelineReadyPromise = Promise.resolve();

// Add instructions first
timeline = timeline.concat(instruction_timeline);

// Optionally, you can enable fullscreen or preload here if desired
// timeline.push({ type: jsPsychFullscreen, fullscreen_mode: true });

// Determine participant role from URL (?ROLE=advocate|judge); default advocate
const roleParam = (window.getQueryVariable && window.getQueryVariable('ROLE')) ? String(window.getQueryVariable('ROLE')).toLowerCase() : 'advocate';

// Post-task note-taking question (Yes/No) + optional description, before end screen
var wrote_notes_screen = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<p>Did you write anything down during the experiment?</p><p>Your answer to the following question will not impact your bonus, but is important for our analysis of the data.</p>',
  html: '<div style="text-align:left;margin:0 auto;max-width:600px;">' +
        '<p><label><input type="radio" name="wrote_notes" value="Yes" required> Yes</label> ' +
        '<label style="margin-left:16px;"><input type="radio" name="wrote_notes" value="No" required> No</label></p>' +
        '<p><label>If yes, please describe what you wrote down:</label><br>' +
        '<textarea name="wrote_notes_description" rows="3" style="width:100%;"></textarea></p>' +
        '</div>',
  data: { version: 'post_task', survey: 'wrote_notes' },
  on_finish: function(data) {
    var r = data.response || {};
    data.wrote_notes = r.wrote_notes || '';
    data.wrote_notes_description = r.wrote_notes_description || '';
  }
};

// Simple end screen with final save guard and Prolific redirect
var end_screen = {
  type: jsPsychHtmlButtonResponse,
  choices: ['Finish'],
  is_html: true,
  stimulus: function(){
    if (roleParam === 'judge') {
      return '<p>Thanks! You completed the judge demo trials.</p>';
    } else {
      return '<p>Thanks! You have completed the task. Please click the button below to submit the task to Prolific. Your bonus will depend on the choices of a future participant that will complete the task within the next two weeks.</p>';
    }
  },
  on_start: async function () {
    try {
      await saveDataset('final');
      console.log('✓ Final data saved');
    } catch (err) {
      console.error('Final save failed:', err);
      alert('We’re retrying to save your data—please wait a moment.');
    }
  },
  on_finish: function(){
    window.location = 'https://app.prolific.com/submissions/complete?cc=C1379C4O';
  }
};

if (roleParam === 'judge') {
  // ── Judge route: load ALL trials and present them to this single participant ──
  function hashStringToInt(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < String(s).length; i++) {
      h ^= String(s).charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      h >>>= 0;
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, seedStr) {
    const seed = hashStringToInt(seedStr);
    const rng = mulberry32(seed);
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  timelineReadyPromise = fetch('judge_trials.json')
    .then(r => r.json())
    .then(master => {
      if (!Array.isArray(master)) throw new Error('judge_trials.json did not parse to an array');

      // Optional: deterministic shuffle with fixed seed
      const trials = seededShuffle(master, 'judge-v1-order');
      const total = trials.length;

      trials.forEach((t, idx) => {
        timeline.push({
          type: jsPsychStickJudge,
          uncovered_values: (t.uncovered_values || []).slice().sort((a,b)=>a-b),
          N_Sticks_Drawn: t.N_Sticks_Drawn || 10,
          N_Sticks_Covered: t.N_Sticks_Covered,
          advocate_goal: t.advocate_goal || 'Accurate',
          trial_number: idx + 1,
          total_trials: total,
          trial_id: (t.source_subject ? `${t.source_subject}#${t.source_row_index}` : ''),
          global_index: idx,
          data: {
            version: 'judge_real_all25',
            advocate_goal: t.advocate_goal || 'Accurate',
            source_subject: t.source_subject || null,
            source_row_index: (typeof t.source_row_index === 'number' ? t.source_row_index : null),
            advocate_prolific_pid: (typeof t.prolific_pid === 'string' ? t.prolific_pid : null),
            global_index: idx
          },
          on_finish: async function () {
            const trialNumber = this.trial_number;
            if (trialNumber % saveInterval === 0) {
              try { await saveDataset(trialNumber); }
              catch (e) { console.error('Autosave failed', e); }
            }
            if (trialNumber === total) {
              try { await saveDataset('final'); console.log('✓ Final data saved (last trial)'); }
              catch (e) { console.error('Final save failed', e); }
            }
          }
        });
      });
      // Append post-task survey and end screen after all judge trials
      timeline.push(wrote_notes_screen);
      timeline.push(end_screen);
    })
    .catch(err => {
      console.error('Failed to load judge_trials.json:', err);
      alert('There was a problem loading the judge trials. Please reload.');
    });
} else {
  // ── Advocate route: iterate N_Sticks_Covered = 1..9 across all incentive goals ──
  const advocate_goals = ['High', 'Low', 'Accurate'];
  const N_Covered_values = [1, 3, 5, 7, 9];
  const totalTrials = advocate_goals.length * N_Covered_values.length; // 15
  const N_Trials = totalTrials;

  // Build all trials first
  var advocate_trials = [];
  N_Covered_values.forEach((nCovered) => {
    advocate_goals.forEach((goal) => {
      // Generate unique stick lengths for each trial (0..100)
      var lengths = generateRandomStickLengths(N_Sticks_Drawn, Max_Stick_Length, Min_Stick_Length);

      var select_trial = {
        type: jsPsychStickAdvocate,
        stick_lengths: lengths,
        N_Sticks_Drawn: N_Sticks_Drawn,
        N_Sticks_Covered: nCovered,
        incentive_condition: goal,
        trial_number: 0, // placeholder; set after shuffle
        total_trials: totalTrials,
        data: {
          version: 'advocate_task',
          incentive_condition: goal,
          N_Sticks_Covered: nCovered,
          stick_lengths: lengths
        },
        on_finish: async function () {
          const trialNumber = this.trial_number;
          if (trialNumber % saveInterval === 0) {
            try { await saveDataset(trialNumber); }
            catch (e) { console.error('Autosave failed', e); }
          }
          if (trialNumber === N_Trials) {
            try {
              await saveDataset('final');
              console.log('✓ Final data saved (last trial)');
            } catch (e) {
              console.error('Final save failed', e);
            }
          }
        }
      };

      advocate_trials.push(select_trial);
    });
  });

  // Shuffle trial order
  if (window.jsPsych && window.jsPsych.randomization && window.jsPsych.randomization.shuffle) {
    advocate_trials = window.jsPsych.randomization.shuffle(advocate_trials);
  } else {
    for (var i = advocate_trials.length - 1; i > 0; i--) {
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = advocate_trials[i];
      advocate_trials[i] = advocate_trials[r];
      advocate_trials[r] = tmp;
    }
  }

  // Reindex trial numbers and append to main timeline
  for (var idx = 0; idx < advocate_trials.length; idx++) {
    advocate_trials[idx].trial_number = idx + 1;
    if (!advocate_trials[idx].data) advocate_trials[idx].data = {};
    advocate_trials[idx].data.trial_number = idx + 1;
    advocate_trials[idx].total_trials = totalTrials;
  }

  timeline = timeline.concat(advocate_trials);
  // Append post-task survey and end screen after advocate trials
  timeline.push(wrote_notes_screen);
  timeline.push(end_screen);
}

// Start after Firebase auth is ready
authReady
  .then(async uid => {
    docRef = doc(db, 'spin_task', 'experiment2_judge_pilot', 'subjects', uid);
    try {
      await timelineReadyPromise; // ensure judge trials (if any) have been loaded
    } catch(e) {
      console.warn('Timeline assembly encountered an error, proceeding with what is available.');
    }
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
