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
    const result = await get('issues/search', { componentKeys: project, types: 'BUG,VULNERABILITY', resolved: 'false', sinceLeakPeriod: 'true', ps: '100' });
    log(JSON.stringify({ scope, findings: result.total, issues: result.issues?.map(issue => ({
      key: issue.key, rule: issue.rule, severity: issue.severity, component: issue.component,
      line: issue.line, message: issue.message
    })) }));
    const duplication = await get('measures/component_tree', { component: project,
      metricKeys: 'new_duplicated_lines,new_lines', qualifiers: 'FIL', ps: '500' });
    const files = duplication.components?.map(file => ({ path: file.path,
      duplicatedLines: Number(file.measures?.find(m => m.metric === 'new_duplicated_lines')?.period?.value
        ?? file.measures?.find(m => m.metric === 'new_duplicated_lines')?.periods?.[0]?.value ?? 0) }))
      .filter(file => file.duplicatedLines > 0).sort((a, b) => b.duplicatedLines - a.duplicatedLines).slice(0, 10);
    log(JSON.stringify({ scope, duplicatedFiles: files }));
  }
}
module.exports = { report };
if (require.main === module) report({ token: process.env.SONAR_TOKEN, pr: process.env.SONAR_PR,
  branch: process.env.SONAR_BRANCH }).catch(error => { console.error(error.message); process.exitCode = 1; });
