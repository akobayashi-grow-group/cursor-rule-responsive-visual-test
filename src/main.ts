#!/usr/bin/env node

import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { readUrlsFile, captureScreenshots } from './capture.js';
import { saveAnalysisTasks, loadAnalysisResults } from './analyze.js';
import { generateReport } from './report.js';

const execAsync = promisify(exec);

// ブラウザでファイルを開く（macOS）
async function openInBrowser(filePath: string): Promise<void> {
  try {
    await execAsync(`open "${filePath}"`);
  } catch (error) {
    console.error('Failed to open browser:', error);
    console.log(`Please open the report manually: ${filePath}`);
  }
}

// 分析結果が存在するかチェック
async function checkAnalysisResultsExist(): Promise<boolean> {
  try {
    await fs.access(join(process.cwd(), 'analysis-results.json'));
    return true;
  } catch {
    return false;
  }
}

// メイン処理
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Responsive Layout Checker                        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  const mode = process.argv[2] || 'capture';

  try {
    if (mode === 'capture') {
      // URLリストファイルのパス
      const urlsFilePath = join(process.cwd(), 'urls.txt');

      // Step 1: URLリストを読み込み
      console.log('📋 Step 1: Reading URLs from urls.txt...');
      const urls = await readUrlsFile(urlsFilePath);
      console.log(`   Found ${urls.length} URLs\n`);

      if (urls.length === 0) {
        console.error('❌ No URLs found in urls.txt');
        process.exit(1);
      }

      // Step 2: スクリーンショット撮影
      console.log('📸 Step 2: Capturing screenshots...');
      const screenshotResults = await captureScreenshots(urls);

      const successfulCaptures = screenshotResults.filter(r => !r.error);
      if (successfulCaptures.length === 0) {
        console.error('❌ No successful screenshot captures');
        process.exit(1);
      }

      // Step 3: 分析タスクを保存
      console.log('📝 Step 3: Saving analysis tasks...');
      await saveAnalysisTasks(successfulCaptures);

      console.log('');
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║   ✅ Screenshots Captured!                        ║');
      console.log('╚════════════════════════════════════════════════════╝');
      console.log('');
      console.log('次のステップ:');
      console.log('Cursorエージェントに「画像を分析して」と指示してください。');
      console.log('');

    } else if (mode === 'report') {
      // 分析結果が存在するかチェック
      const hasResults = await checkAnalysisResultsExist();
      if (!hasResults) {
        console.error('❌ analysis-results.json が見つかりません');
        console.error('   Cursorエージェントに画像分析を依頼してください');
        process.exit(1);
      }

      // Step 1: 分析結果を読み込み
      console.log('📖 Step 1: Loading analysis results...');
      const analysisResults = await loadAnalysisResults();

      // Step 2: レポート生成
      console.log('📄 Step 2: Generating HTML report...');
      const reportPath = await generateReport(analysisResults);

      // Step 3: ブラウザで開く
      console.log('🌐 Step 3: Opening report in browser...');
      await openInBrowser(reportPath);

      // サマリー表示
      const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0);
      const urlsWithIssues = analysisResults.filter(r => r.issues.length > 0).length;

      console.log('');
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║   ✅ Report Generated!                            ║');
      console.log('╚════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`  URLs checked:        ${analysisResults.length}`);
      console.log(`  URLs with issues:    ${urlsWithIssues}`);
      console.log(`  Total issues found:  ${totalIssues}`);
      console.log('');
      console.log(`  Report: ${reportPath}`);
      console.log('');
    } else {
      console.error(`❌ Unknown mode: ${mode}`);
      console.error('   Usage: npm start [capture|report]');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    process.exit(1);
  }
}

// プログラム実行
main();

