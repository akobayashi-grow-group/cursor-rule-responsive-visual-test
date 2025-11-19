import { promises as fs } from 'fs';
import { join } from 'path';
import { ScreenshotResult, SCREEN_WIDTHS } from './capture.js';

export interface LayoutIssue {
  url: string;
  slug: string;
  width: number;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  screenshotPath: string;
  baselineComparison?: {
    desktop: string; // 1400px
    mobile: string;  // 375px
  };
}

export interface AnalysisResult {
  url: string;
  slug: string;
  issues: LayoutIssue[];
  analyzedAt: Date;
}

export interface AnalysisTask {
  url: string;
  slug: string;
  targetWidth: number;
  targetScreenshot: string;
  baseline1400: string;
  baseline375: string;
}

// 基準となる画面幅
const BASELINE_WIDTHS = [1400, 375];

// 分析タスクをJSON形式で保存（Cursorエージェントが読み込む用）
export async function saveAnalysisTasks(
  screenshotResults: ScreenshotResult[],
  outputPath: string = join(process.cwd(), 'analysis-tasks.json')
): Promise<void> {
  const tasks: AnalysisTask[] = [];

  for (const result of screenshotResults) {
    if (result.error || result.screenshots.length === 0) continue;

    const baseline1400 = result.screenshots.find(s => s.width === 1400);
    const baseline375 = result.screenshots.find(s => s.width === 375);

    if (!baseline1400 || !baseline375) continue;

    const targetWidths = SCREEN_WIDTHS.filter(w => !BASELINE_WIDTHS.includes(w));

    for (const width of targetWidths) {
      const screenshot = result.screenshots.find(s => s.width === width);
      if (!screenshot) continue;

      tasks.push({
        url: result.url,
        slug: result.slug,
        targetWidth: width,
        targetScreenshot: screenshot.path,
        baseline1400: baseline1400.path,
        baseline375: baseline375.path,
      });
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(tasks, null, 2), 'utf-8');
  console.log(`\n📝 Analysis tasks saved: ${outputPath}`);
  console.log(`   Total tasks: ${tasks.length}`);
}

// 分析結果を読み込み
export async function loadAnalysisResults(
  inputPath: string = join(process.cwd(), 'analysis-results.json')
): Promise<AnalysisResult[]> {
  try {
    const content = await fs.readFile(inputPath, 'utf-8');
    const results = JSON.parse(content);
    
    // DateオブジェクトをDateに変換
    return results.map((r: any) => ({
      ...r,
      analyzedAt: new Date(r.analyzedAt)
    }));
  } catch (error) {
    throw new Error(`Failed to load analysis results: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 分析結果を保存
export async function saveAnalysisResults(
  results: AnalysisResult[],
  outputPath: string = join(process.cwd(), 'analysis-results.json')
): Promise<void> {
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n💾 Analysis results saved: ${outputPath}`);
}

