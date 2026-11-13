// Report issue metadata only. Tokens and source snippets must never appear in output.
async function report({ token, pr, branch = 'dev', fetchImpl = fetch, log = console.log }) {
  if (!token) throw new Error('SONAR_TOKEN is required for authenticated quality diagnostics.');
  const project = 'higherkey_board-game-hub';
  const headers = { Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}` };
  const scopes = pr ? [{ pullRequest: pr }, { branch: 'dev' }] : [{ branch }];
  for (const scope of scopes) {
    const get = async (endpoint, params) => {
      const response = await fetchImpl(`https://sonarcloud.io/api/${endpoint}?${new URLSearchParams({ ...params, ...scope })}`, {
        headers, signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) throw new Error(`Sonar diagnostics request failed (HTTP ${response.status}).`);
      return response.json();
    };
    const gate = await get('qualitygates/project_status', { projectKey: project });
    log(JSON.stringify({ scope, gate: gate.projectStatus?.status, conditions: gate.projectStatus?.conditions }));
    const result = await get('issues/search', { componentKeys: project, types: 'BUG', resolved: 'false', sinceLeakPeriod: 'true', ps: '100' });
    log(JSON.stringify({ scope, reliabilityIssues: result.total, issues: result.issues?.map(issue => ({
      key: issue.key, rule: issue.rule, severity: issue.severity, component: issue.component,
      line: issue.line, message: issue.message
    })) }));
  }
}
module.exports = { report };
if (require.main === module) report({ token: process.env.SONAR_TOKEN, pr: process.env.SONAR_PR,
  branch: process.env.SONAR_BRANCH }).catch(error => { console.error(error.message); process.exitCode = 1; });
