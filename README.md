# Responsive Layout Checker

複数の画面幅でWebページのレイアウト崩れを自動検出するツールです。Playwrightでスクリーンショットを撮影し、Cursorエージェント（AI）が画像分析を行い、結果をHTMLレポートとして出力します。

## 機能

- 📸 複数画面幅（1920px～375px）で自動スクリーンショット撮影
- 🤖 Cursorエージェントによる自動レイアウト分析（外部APIキー不要）
- 📊 見やすいHTMLレポート生成
- 🌐 レポートを自動的にブラウザで開く

## 対応画面幅

- 1920px
- 1600px
- 1400px（デスクトップ基準）
- 1200px
- 1000px
- 950px
- 800px
- 600px
- 400px
- 375px（モバイル基準）

※ 1400pxと375pxを基準画面として、他の画面幅での問題を検出します。

## 必要な環境

- Node.js 18以上
- Cursor IDE（AIエージェント機能を使用）

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Playwrightブラウザのインストール

```bash
npx playwright install chromium
```

## 使い方

### 方法1: Cursorエージェントに依頼（推奨）

1. `urls.txt` ファイルに、チェックしたいURLを1行に1つずつ記載
2. Cursorエージェントに「チェックして」または「check」と指示
3. エージェントが自動的にすべての処理を実行
4. レポートがブラウザで自動的に開きます

### 方法2: 手動実行

#### Step 1: スクリーンショット撮影

```bash
npm run build
npm start
```

これで `screenshots/` ディレクトリにスクリーンショットが保存され、
`analysis-tasks.json` が生成されます。

#### Step 2: 画像分析

Cursorエージェントに「画像を分析して」と指示すると、
エージェントが `analysis-tasks.json` を読み込み、各画像を分析して
`analysis-results.json` を生成します。

#### Step 3: レポート生成

```bash
npm run report
```

レポートが生成され、ブラウザで自動的に開きます。

## ディレクトリ構造

```
cursor-rule-responsive-visual-test/
├── .cursorrules              # Cursor AIエージェント用ルール
├── package.json              # 依存関係定義
├── tsconfig.json             # TypeScript設定
├── .gitignore                # Git除外設定
├── urls.txt                  # チェック対象URLリスト
├── src/                      # ソースコード
│   ├── capture.ts            # スクリーンショット撮影
│   ├── analyze.ts            # 分析タスク・結果管理
│   ├── report.ts             # HTMLレポート生成
│   └── main.ts               # メインエントリーポイント
├── screenshots/              # スクリーンショット保存先
├── analysis-tasks.json       # 分析タスクリスト（自動生成）
├── analysis-results.json     # 分析結果（AI生成）
└── reports/                  # HTMLレポート保存先
```

## Cursorエージェントとの連携

このプロジェクトには `.cursorrules` ファイルが含まれており、Cursorエージェントに以下のコマンドで実行を依頼できます：

### 「チェックして」コマンド
エージェントが自動的に以下を実行：
1. urls.txtの確認
2. 必要に応じてパッケージのインストール
3. TypeScriptのビルド
4. スクリーンショット撮影
5. 画像分析
6. レポート生成とブラウザ表示

### 「画像を分析して」コマンド
エージェントが画像分析のみを実行：
1. `analysis-tasks.json` を読み込み
2. 各画像を分析
3. `analysis-results.json` を生成
4. レポート生成とブラウザ表示

## 分析内容

Cursorエージェントは以下の観点でレイアウト問題を検出します：

- ✅ テキストの重なり、はみ出し、切れ
- ✅ 画像の変形、切れ、アスペクト比の異常
- ✅ ナビゲーションメニューの崩れ、重なり
- ✅ ボタンやリンクの配置異常
- ✅ コンテンツの隠れ、消失
- ✅ 著しい余白の異常

## レポート内容

生成されるHTMLレポートには以下が含まれます：

- 📊 分析サマリー（URL数、問題数、重要度別の統計）
- 🔍 問題があるページのリスト
- 📸 問題のあるスクリーンショットと基準画面の比較
- 📝 問題の具体的な説明

## ライセンス

MIT

