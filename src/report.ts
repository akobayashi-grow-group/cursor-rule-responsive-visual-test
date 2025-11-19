import { promises as fs } from 'fs';
import { join } from 'path';
import { AnalysisResult, LayoutIssue } from './analyze.js';

// 画像をData URIに変換
async function imageToDataUri(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    return '';
  }
}

// Severity に応じた色
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#dc2626';
    case 'major':
      return '#ea580c';
    case 'minor':
      return '#d97706';
    default:
      return '#6b7280';
  }
}

// Severity に応じたラベル
function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'critical':
      return '重大';
    case 'major':
      return '重要';
    case 'minor':
      return '軽微';
    default:
      return '不明';
  }
}

// HTMLレポートを生成
export async function generateReport(
  analysisResults: AnalysisResult[],
  outputDir: string = join(process.cwd(), 'reports')
): Promise<string> {
  // 出力ディレクトリを作成
  await fs.mkdir(outputDir, { recursive: true });

  // 統計情報を計算
  const totalUrls = analysisResults.length;
  const urlsWithIssues = analysisResults.filter(r => r.issues.length > 0).length;
  const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0);
  const criticalIssues = analysisResults.reduce(
    (sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length,
    0
  );
  const majorIssues = analysisResults.reduce(
    (sum, r) => sum + r.issues.filter(i => i.severity === 'major').length,
    0
  );
  const minorIssues = analysisResults.reduce(
    (sum, r) => sum + r.issues.filter(i => i.severity === 'minor').length,
    0
  );

  // 問題のあるURLのみをフィルタ
  const urlsWithProblems = analysisResults.filter(r => r.issues.length > 0);

  // 各問題の詳細セクションを生成
  let issueDetailsHtml = '';

  for (const result of urlsWithProblems) {
    issueDetailsHtml += `
      <div class="url-section">
        <h2 class="url-title">
          <a href="${result.url}" target="_blank">${result.url}</a>
        </h2>
        <div class="issue-count">検出された問題: ${result.issues.length}件</div>
    `;

    for (const issue of result.issues) {
      const screenshotDataUri = await imageToDataUri(issue.screenshotPath);
      const baseline1400DataUri = issue.baselineComparison
        ? await imageToDataUri(issue.baselineComparison.desktop)
        : '';
      const baseline375DataUri = issue.baselineComparison
        ? await imageToDataUri(issue.baselineComparison.mobile)
        : '';

      issueDetailsHtml += `
        <div class="issue-detail">
          <div class="issue-header">
            <span class="issue-severity" style="background-color: ${getSeverityColor(issue.severity)}">
              ${getSeverityLabel(issue.severity)}
            </span>
            <span class="issue-width">${issue.width}px</span>
          </div>
          <div class="issue-description">${issue.description}</div>
          
          <div class="screenshot-comparison">
            <div class="screenshot-item">
              <div class="screenshot-label">問題のある画面 (${issue.width}px)</div>
              ${screenshotDataUri ? `<img src="${screenshotDataUri}" alt="${issue.width}px screenshot">` : '<p>画像が見つかりません</p>'}
            </div>
            
            <div class="screenshot-item">
              <div class="screenshot-label">基準画面 (デスクトップ: 1400px)</div>
              ${baseline1400DataUri ? `<img src="${baseline1400DataUri}" alt="1400px baseline">` : '<p>画像が見つかりません</p>'}
            </div>
            
            <div class="screenshot-item">
              <div class="screenshot-label">基準画面 (モバイル: 375px)</div>
              ${baseline375DataUri ? `<img src="${baseline375DataUri}" alt="375px baseline">` : '<p>画像が見つかりません</p>'}
            </div>
          </div>
        </div>
      `;
    }

    issueDetailsHtml += `</div>`;
  }

  // 問題がない場合のメッセージ
  if (urlsWithProblems.length === 0) {
    issueDetailsHtml = `
      <div class="no-issues">
        <h2>🎉 問題は検出されませんでした</h2>
        <p>すべてのURLで、すべての画面幅において明らかなレイアウト崩れは見つかりませんでした。</p>
      </div>
    `;
  }

  // HTMLテンプレート
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>レスポンシブレイアウトチェック - レポート</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      padding: 2rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .header .subtitle {
      font-size: 1rem;
      opacity: 0.9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-item {
      background-color: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .summary-item .label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .summary-item .value {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
    }

    .summary-item.critical .value {
      color: #dc2626;
    }

    .summary-item.major .value {
      color: #ea580c;
    }

    .summary-item.minor .value {
      color: #d97706;
    }

    .content {
      padding: 2rem;
    }

    .url-section {
      margin-bottom: 3rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .url-title {
      background-color: #f3f4f6;
      padding: 1rem 1.5rem;
      font-size: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .url-title a {
      color: #4f46e5;
      text-decoration: none;
    }

    .url-title a:hover {
      text-decoration: underline;
    }

    .issue-count {
      padding: 0.75rem 1.5rem;
      background-color: #fef3c7;
      border-bottom: 1px solid #fcd34d;
      font-weight: 600;
      color: #92400e;
    }

    .issue-detail {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .issue-detail:last-child {
      border-bottom: none;
    }

    .issue-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .issue-severity {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .issue-width {
      font-weight: 600;
      color: #4b5563;
    }

    .issue-description {
      margin-bottom: 1.5rem;
      font-size: 1rem;
      line-height: 1.75;
      color: #374151;
    }

    .screenshot-comparison {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .screenshot-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background-color: #f9fafb;
    }

    .screenshot-label {
      padding: 0.75rem 1rem;
      background-color: #374151;
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .screenshot-item img {
      width: 100%;
      height: auto;
      display: block;
    }

    .no-issues {
      text-align: center;
      padding: 4rem 2rem;
    }

    .no-issues h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #059669;
    }

    .no-issues p {
      font-size: 1.125rem;
      color: #6b7280;
    }

    .footer {
      padding: 2rem;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 レスポンシブレイアウトチェック</h1>
      <div class="subtitle">自動分析レポート - ${new Date().toLocaleString('ja-JP')}</div>
    </div>

    <div class="summary">
      <div class="summary-item">
        <div class="label">チェックしたURL</div>
        <div class="value">${totalUrls}</div>
      </div>
      <div class="summary-item">
        <div class="label">問題のあるURL</div>
        <div class="value">${urlsWithIssues}</div>
      </div>
      <div class="summary-item">
        <div class="label">総問題数</div>
        <div class="value">${totalIssues}</div>
      </div>
      <div class="summary-item critical">
        <div class="label">重大な問題</div>
        <div class="value">${criticalIssues}</div>
      </div>
      <div class="summary-item major">
        <div class="label">重要な問題</div>
        <div class="value">${majorIssues}</div>
      </div>
      <div class="summary-item minor">
        <div class="label">軽微な問題</div>
        <div class="value">${minorIssues}</div>
      </div>
    </div>

    <div class="content">
      ${issueDetailsHtml}
    </div>

    <div class="footer">
      Generated by Responsive Layout Checker
    </div>
  </div>
</body>
</html>`;

  // ファイル名を生成（タイムスタンプ付き）
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `report-${timestamp}.html`;
  const filePath = join(outputDir, filename);

  // ファイルに書き込み
  await fs.writeFile(filePath, html, 'utf-8');

  console.log(`\n📄 Report generated: ${filePath}\n`);

  return filePath;
}

