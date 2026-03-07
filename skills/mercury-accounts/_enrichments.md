# Mercury Accounts - Enrichments

## Computational Requirements

When handling any query that requires calculations across account data:

### Triggers

Any request involving:
- Sums, totals, averages, medians, modes, ranges
- Most/least comparisons (e.g., "which account has the highest balance?")
- Aggregations across multiple accounts
- Calculations involving currency amounts
- Comparisons of financial metrics

### Mandatory Approach

You **MUST**:
1. Create an artifact that processes the data programmatically
2. Parse the JSON response and use JavaScript/Python to calculate
3. Display intermediate steps for verification
4. **Never** rely on mental arithmetic for financial calculations

### Examples

**"What's my total balance?"**

CORRECT approach:
- Create an artifact that parses accounts
- Map to balance values
- Use `reduce()` to sum
- Display the total with currency formatting

```javascript
const total = accounts
  .map(a => a.currentBalance)
  .reduce((sum, bal) => sum + bal, 0);
```

INCORRECT approach:
- Manually reading and adding up balance values from the response
- Estimating or rounding financial figures

**"Which account has the most money?"**

CORRECT approach:
- Parse all accounts programmatically
- Sort by `currentBalance` descending
- Return the top result with its balance

INCORRECT approach:
- Visually scanning the response and picking the largest number
