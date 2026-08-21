# Project EYE — Agent Rules & Engineering Standards

All AI assistants, coding subagents, and automated workflows operating in this repository MUST strictly follow the Project EYE Engineering, Security & Development Standards.

## Core Directives

1. **Mandatory Standard**: Read and adhere to [.agents/rules/engineering_security_rules.md](file:///.agents/rules/engineering_security_rules.md) and [docs/ENGINEERING_SECURITY_RULES.md](file:///docs/ENGINEERING_SECURITY_RULES.md).
2. **Security First**: No feature is complete until security, validation, least privilege, error handling, logging, testing, and documentation are verified.
3. **The 15 Golden Rules**:
   - Rule 1: Never trust input.
   - Rule 2: Never expose secrets.
   - Rule 3: Never rely on frontend security.
   - Rule 4: Always authenticate and authorize sensitive operations.
   - Rule 5: Use least privilege everywhere.
   - Rule 6: Treat logs and external data as untrusted.
   - Rule 7: Treat AI output as untrusted.
   - Rule 8: Never give AI unrestricted authority.
   - Rule 9: Log important security actions.
   - Rule 10: Do not expose internal errors to users.
   - Rule 11: Validate before processing.
   - Rule 12: Fail securely.
   - Rule 13: Test security assumptions, not just functionality.
   - Rule 14: Do not automatically perform destructive actions.
   - Rule 15: Every new feature must consider its attack surface.
4. **Testing Mandatory**: Always run `python -m pytest` after making backend changes.
