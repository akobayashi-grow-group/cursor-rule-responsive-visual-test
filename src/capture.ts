import { chromium, Browser, Page } from 'playwright';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ScreenshotResult {
  url: string;
  slug: string;
  screenshots: {
    width: number;
    path: string;
  }[];
  error?: string;
}

// 画面幅の設定
export const SCREEN_WIDTHS = [1920, 1600, 1400, 1200, 1000, 950, 800, 600, 400, 375];

// URLからファイル名に適したスラグを生成
function createSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    const slug = (urlObj.hostname + urlObj.pathname)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    return slug || 'page';
  } catch {
    return 'invalid-url';
  }
}

// スクリーンショットディレクトリを作成
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合は無視
  }
}

// 単一URLのスクリーンショットを撮影
async function captureUrl(
  browser: Browser,
  url: string,
  baseDir: string
): Promise<ScreenshotResult> {
  const slug = createSlug(url);
  const urlDir = join(baseDir, slug);
  await ensureDir(urlDir);

  const result: ScreenshotResult = {
    url,
    slug,
    screenshots: []
  };

  let page: Page | null = null;

  try {
    page = await browser.newPage();
    
    // タイムアウトを設定
    page.setDefaultTimeout(30000);
    
    // ページに移動
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 各画面幅でスクリーンショットを撮影
    for (const width of SCREEN_WIDTHS) {
      try {
        await page.setViewportSize({ width, height: 1080 });
        
        // レイアウトが安定するまで少し待つ
        await page.waitForTimeout(500);
        
        const screenshotPath = join(urlDir, `${width}px.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        
        result.screenshots.push({
          width,
          path: screenshotPath
        });
        
        console.log(`  ✓ ${width}px`);
      } catch (error) {
        console.error(`  ✗ ${width}px: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  Error: ${result.error}`);
  } finally {
    if (page) {
      await page.close();
    }
  }

  return result;
}

// urls.txtを読み込み
export async function readUrlsFile(filePath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const urls = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    return urls;
  } catch (error) {
    throw new Error(`Failed to read URLs file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// メイン関数：すべてのURLのスクリーンショットを撮影
export async function captureScreenshots(
  urls: string[],
  outputDir: string = join(process.cwd(), 'screenshots')
): Promise<ScreenshotResult[]> {
  await ensureDir(outputDir);

  console.log(`\n📸 Starting screenshot capture for ${urls.length} URLs...\n`);

  const browser = await chromium.launch({
    headless: true
  });

  const results: ScreenshotResult[] = [];

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] ${url}`);
      
      const result = await captureUrl(browser, url, outputDir);
      results.push(result);
      
      console.log('');
    }
  } finally {
    await browser.close();
  }

  const successCount = results.filter(r => !r.error).length;
  console.log(`\n✅ Capture complete: ${successCount}/${urls.length} successful\n`);

  return results;
}

