<step name="directive_compliance">
  <note>Verify compliance with all loaded directives</note>

  <action>For each directive loaded in load_directives step:</action>
  <action>Re-read the directive XML file</action>

  <action>Run each `<validation>` check:</action>

  <branch condition="check type=command">
    <command>{content of <run> element}</command>
    <validate>{content of <expect> element}</validate>
  </branch>

  <branch condition="check type=pattern">
    <action>For each file matching `files` glob that was modified:</action>
    <action>Check content against `<forbidden>` regex</action>
  </branch>

  <branch condition="check type=checklist">
    <action>Self-assess each `<item>` as Y/N</action>
  </branch>

  <branch condition="any check fails">
    <output>Directive violation: {check id} - {reason}</output>
    <action>Find `<example>` elements where ref matches failed check</action>
    <action>Show violation examples to illustrate the problem</action>
    <action>Show correct examples to illustrate the fix</action>
    <action>Use AskUserQuestion tool with:
      - header: "Violation"
      - question: "Directive check failed. How would you like to proceed?"
      - options:
        - label: "Fix now", description: "Address the violation before continuing"
        - label: "Continue anyway", description: "Acknowledge and proceed despite violation"
      - multiSelect: false
    </action>
    <branch condition="user selects Fix now">
      <action>Attempt remediation for the violation</action>
      <action>Re-run the failed validation checks (only the ones that failed, not all checks)</action>
      <branch condition="checks now pass">
        <output>Violation resolved.</output>
      </branch>
      <branch condition="still failing after remediation">
        <output>Violation persists after fix attempt: {check id} - {reason}. Continuing.</output>
      </branch>
    </branch>
  </branch>
</step>
