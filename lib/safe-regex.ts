/**
 * Guards against ReDoS (Regular Expression Denial of Service) attacks.
 *
 * Strategy: two layers of protection.
 *  1. Static heuristic — reject patterns with known dangerous constructs
 *     (nested quantifiers, alternation inside repetition).
 *  2. Execution timing — test the compiled regex against a pathological
 *     string and reject if it takes too long.
 */

const MAX_PATTERN_LENGTH = 200;
const MAX_EXEC_MS = 50; // reject any regex that takes longer than this

/**
 * Patterns that indicate catastrophic backtracking potential.
 * These cover the most common ReDoS shapes:
 *   (a+)+   (a*)* etc.  — nested quantifiers
 *   (a|aa)+ — overlapping alternation under repetition
 */
const DANGEROUS_PATTERNS = [
  /\([^)]*[+*?][^)]*\)[+*?{]/, // quantifier inside group, group under quantifier
  /\([^)]*\|[^)]*\)[+*?{]/,    // alternation inside repeated group
  /[+*?]\s*[+*?]/,              // consecutive quantifiers (e.g. a++ or a+*)
];

/**
 * Returns true if the pattern is safe to compile and execute.
 * Throws a descriptive error if the pattern is rejected.
 */
export function assertSafeRegex(pattern: string): void {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Pattern too long (max ${MAX_PATTERN_LENGTH} characters)`);
  }

  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      throw new Error(
        "Pattern contains constructs that could cause excessive backtracking. " +
          "Simplify the pattern or use CONTAINS/EXACT match instead."
      );
    }
  }

  // Compile first — throws SyntaxError on invalid regex
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, "i");
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Execution timing check against a pathological input
  const probe = "aaaaaaaaaaaaaaaaaaaaab"; // 21 chars — exposes exponential backtracking fast
  const start = Date.now();
  regex.test(probe);
  if (Date.now() - start > MAX_EXEC_MS) {
    throw new Error(
      "Pattern causes excessive backtracking and has been rejected for safety."
    );
  }
}

/**
 * Returns true if a pattern is safe, false otherwise.
 * Use assertSafeRegex() when you want the error message.
 */
export function isSafeRegex(pattern: string): boolean {
  try {
    assertSafeRegex(pattern);
    return true;
  } catch {
    return false;
  }
}
