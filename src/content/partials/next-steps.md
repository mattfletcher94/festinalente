- **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban:{{next_command}}{{#unless no_id}} \{id\}{{/unless}}
      ```
    - Do NOT skip this output. The user needs these commands to continue.