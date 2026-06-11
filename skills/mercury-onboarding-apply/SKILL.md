---
name: mercury-onboarding-apply
description: "Complete a Mercury onboarding application: generate a blank YAML template from the CLI, fill it with the applicant's details, confirm, and submit by piping into the mercury CLI."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [onboarding:write]
  requires: [mercury-shared]
---

# Mercury Onboarding Apply

Walk a user through starting a Mercury onboarding application. This skill generates a blank, annotated `apply.yaml` template with `mercury apply --template`, fills it out with the applicant's business and beneficial-owner details, confirms the summary with the user, and submits it by piping the file into `mercury apply`. On success the API returns a `signupLink` the user opens in the browser to finish.

Auth is handled by the CLI per `mercury-shared` (`MERCURY_API_KEY` or `mercury login`). This skill never constructs auth headers. Note that `mercury apply --template` needs no auth and makes no API call — only the final submit does.

**COMPLIANCE — DO NOT FABRICATE KYC DATA.** Onboarding is a Know-Your-Customer / Know-Your-Business flow. Identity, ownership percentages, EIN/Tax ID, legal names, dates of birth, SSNs, and addresses must come from the user. **NEVER** guess, infer, auto-fill, or "reasonable-default" any of these fields. For any field that is missing, ambiguous, or low-confidence, STOP and ask the user. Submitting fabricated identity or ownership data is a real legal/compliance problem, not a formatting nit. Treat this the way `mercury-receipt-upload` treats an irreversible upload — but stricter.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `templatePath` | `apply.yaml` (cwd) | Where to write the blank template and the filled application. |
| `applicantDetails` | (required) | The business + beneficial-owner information, supplied by the user. Never synthesized. |

## Execution Strategy

### Step 1: Generate the Blank Template

```bash
mercury apply --template > apply.yaml
```

This prints a blank, annotated `apply.yaml` to stdout (no auth, no API call). Redirect it to `templatePath`.

### Step 2: Learn the Schema From the Template's Comments

Read the generated `apply.yaml`. The inline comments are the source of truth for:

```
- which fields are required vs optional
- the allowed enum values (e.g. entity / business type, role)
- the expected format of each field (date format, ID format, etc.)
```

Do not invent fields or values that the template does not document.

### Step 3: Gather Details FROM THE USER (no fabrication)

Collect every required field by asking the user. This is KYC/KYB data — see the compliance note above.

```
For each required field in the template:
    IF the user has supplied a clear, confident value:
        use it verbatim.
    ELSE (missing, ambiguous, or low-confidence):
        ASK the user. Do NOT guess, infer, or default.

NEVER auto-fill any of:
    - legal entity name / DBA
    - EIN / Tax ID
    - business and beneficial-owner addresses
    - beneficial-owner identity (name, DOB, SSN/ID numbers)
    - ownership percentages
    - any enum value not explicitly chosen by the user
```

Per `mercury-shared`, never echo full SSNs/ID numbers back — mask all but the last 4 when summarizing.

### Step 4: Fill the Template and Echo a Summary

Write the gathered values into `apply.yaml` (matching the template's structure and enum values exactly). Then show the user a summary table of the key fields so they can catch errors before anything is submitted:

```
| Field                | Value                  |
|----------------------|------------------------|
| Legal business name  | {legalName}            |
| Business type        | {entityType}           |
| EIN / Tax ID         | **{ein last4}**        |
| Business address     | {address}              |
| Beneficial owner(s)  | {name} — {ownership}%  |
| Owner ID             | ****{ssn last4}        |
| Contact email        | {email}                |
```

### Step 5: CONFIRM Before Submitting (ALWAYS)

Submitting starts a **real Mercury application**. Never skip this step.

```
Prompt: "Submit this Mercury application now? (y/N)"

IF the user does not explicitly confirm:
    STOP. Do not submit. Leave apply.yaml on disk for them to edit.
```

### Step 6: Submit and Surface the Signup Link

Submission is via stdin pipe only — there is no `-f`/`--file` flag.

```bash
mercury apply < apply.yaml
# or, equivalently:
cat apply.yaml | mercury apply
```

The CLI parses the piped body as YAML/JSON and merges it. On success the API returns a `signupLink`, which the CLI prints as a clickable link. Surface that link to the user verbatim so they can open it and finish onboarding in the browser. On a non-zero exit, show the CLI's error message to the user as-is and do not retry.

## Tips

- The template (`mercury apply --template`) is the schema. If you're unsure whether a field is required or what enum value is valid, re-read the template comments rather than guessing.
- One field at a time beats one giant form dump — ask for missing KYC fields conversationally so the user can answer accurately.
- Keep `apply.yaml` around after submit failures; the user can fix the flagged field and re-pipe without rebuilding from scratch.
- The only CLI surface this skill uses is `mercury apply --template` (generate) and `mercury apply < apply.yaml` (submit). Do not introduce other flags.
