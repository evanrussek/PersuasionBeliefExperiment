/******************************************************************
 *  SET YOUR RETURN / DECLINE URL ONCE
 ******************************************************************/
const RETURN_URL =
  "https://app.prolific.com/submissions/complete?cc=RETURN";   // or MTurk return link


const decline_trial = {
  type: jsPsychHtmlKeyboardResponse,          // any simple plugin is fine
  stimulus: `
    <h2>Thank you for your time</h2>
    <p>You have indicated that you <strong>do not consent</strong> to take part in this study.</p>
    <p>Please click “Return” on the Prolific/Mturk page so the task can be reassigned.</p>
    <p>(You may now close this browser tab.)</p>
  `,
  choices: "NO_KEYS",                         // no keypresses accepted
  trial_duration: 20000                       // show for 20 s, then auto-close
};

  /******************************************************************
 *  CONSENT TRIAL  (works for both v6 and v7: change only `type:`)
 ******************************************************************/
const consent_trial = {
  type: jsPsychSurveyHtmlForm,      // replace with surveyHtmlForm if you imported the module
    css_classes: ['big-consent'],       // <─ makes the style above apply here only
  preamble: `
    <h2 style="text-align:center;margin-top:0"></h2>
    <!--  Large embedded PDF  -->
    <object id = "consent-pdf" 
            data="consent.pdf"
            type="application/pdf"
            style="border:1px solid #ccc;">
      <p>Your browser can’t display PDFs.
         <a href="consent.pdf" target="_blank">Download it here.</a>
      </p>
    </object>
    <hr>
    <p><em>Please read the form above, then indicate your choice below.</em></p>
  `,

  /* --------- radio buttons are the form HTML (“html” key) --------- */
  html: `
    <p style="margin-bottom:0.5em">
      <label>
        <input name="consent" type="radio" value="yes" required>
        I have read the information and <strong>CONSENT</strong> to participate.
      </label>
    </p>
    <p>
      <label>
        <input name="consent" type="radio" value="no">
        I have read the information and <strong>DO NOT CONSENT</strong>.
      </label>
    </p>
  `,

  button_label: "Continue",

  /* --------- decide what happens before leaving the page --------- */
    on_finish: data => {
    const agreed = data.response.consent === "yes";

    if (!agreed) {
      /* Immediately show a thank-you / return message
         and abort the rest of the timeline.            */
      jsPsych.endExperiment(`
        <h2>Thank you for your time</h2>
        <p>You have indicated that you <strong>do not consent</strong> to take part in this study.</p>
        <p>Please  Return the task on the Prolific page so the task can be reassigned.</p>
        <p>(You may now close this browser tab.)</p>
      `);
    }
  }
};