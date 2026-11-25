# text-speaker-next-js-app

ブラウザー内蔵の音声合成機能を使って、入力した文章を読み上げるWebアプリケーションです。
入力テキストや読み上げ設定は保存せず、アプリから外部サービスへ送信しません。

## 技術スタック

- **Next.js 16.4.6** - React フレームワーク（App Routerを使用）
- **React 19.3.1** - ユーザーインターフェース構築
- **TypeScript** - 型安全性
- **Tailwind CSS 4** - スタイリング
- **Web Speech API** - ブラウザー内蔵の音声合成
- **ESLint** - コード品質管理

## 機能

- 最大10,000書記素クラスタのテキスト入力
- 日本語音声の選択と0.5x〜2.0xの読み上げ速度調整
- 長文を最大500書記素クラスタ単位に分割して連続読み上げ
- 再生、一時停止、再開、停止、失敗箇所からの再試行
- 読み上げ状態とチャンク進捗の表示
- テキストや読み上げ設定を保存しない
- レスポンシブデザイン対応
- ダークモード対応（手動切替機能付き）
    - ライトモードとダークモードの2つのモードを手動で切り替え可能
    - ユーザーの選択はローカルストレージに保存され、ページ再読み込み時も維持されます
- TypeScriptによる型安全性
- モダンなUI/UXデザイン

## 始め方

### 前提条件

- Node.js 26.x以上
- npm、yarn、またはpnpm

### インストール

1. リポジトリをクローン：
    ```bash
    git clone https://github.com/TakuyaFukumura/text-speaker-next-js-app.git
    ```
    ```bash
    cd text-speaker-next-js-app
    ```

2. 依存関係をインストール：
    ```bash
    npm install
    ```
   または
    ```bash
    yarn install
    ```
   または
    ```bash
    pnpm install
    ```

### 開発サーバーの起動

```bash
npm run dev
```

または

```bash
yarn dev
```

または

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて
アプリケーションを確認してください。

### ビルドと本番デプロイ

本番用にアプリケーションをビルドする：

```bash
npm run build
```

```bash
npm start
```

または

```bash
yarn build
```

```bash
yarn start
```

または

```bash
pnpm build
```

```bash
pnpm start
```

## プロジェクト構造

```
├── src/
│   ├── app/
│   │   ├── components/      # Reactコンポーネント
│   │   │   ├── DarkModeProvider.tsx  # ダークモードProvider
│   │   │   ├── Header.tsx   # ヘッダーコンポーネント
│   │   │   └── SpeechReader.tsx # 読み上げ画面
│   │   ├── globals.css      # グローバルスタイル
│   │   ├── layout.tsx       # アプリケーションレイアウト
│   │   └── page.tsx         # メインページコンポーネント
│   └── lib/speech/
│       ├── text.ts              # 書記素クラスタ計測・チャンク分割
│       └── useSpeechSynthesis.ts # 音声合成制御
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## プライバシーと音声合成

アプリは入力テキストや音声設定を保存せず、外部サービスへ送信しません。ただし、ブラウザーまたは端末の音声合成処理がネットワーク通信を伴うかは保証できません。

日本語音声はブラウザーまたは端末にインストールされている必要があります。利用可能な音声がない場合、画面に案内が表示されます。

## スタイルの変更

スタイルは Tailwind CSS を使用しています。
`src/app/components/SpeechReader.tsx` ファイル内のクラス名を変更することで、外観をカスタマイズできます。

## 開発

### テスト

このプロジェクトはJestを使用したテストが設定されています。

#### テストの実行

```bash
npm test
```

または

```bash
yarn test
```

または

```bash
pnpm test
```

#### テストの監視モード

```bash
npm run test:watch
```

#### カバレッジレポートの生成

```bash
npm run test:coverage
```

#### テストファイルの構成

- `__tests__/src/lib/speech/text.test.ts`: 文字数計測とチャンク分割のテスト
- `__tests__/src/lib/speech/useSpeechSynthesis.test.ts`: 音声合成制御のテスト
- `__tests__/src/app/components/SpeechReader.test.tsx`: 読み上げ画面のテスト
- `__tests__/src/app/components/DarkModeProvider.test.tsx`: ダークモードProvider のテスト
- `__tests__/src/app/components/Header.test.tsx`: ヘッダーコンポーネントのテスト

#### テストの特徴

- **Reactコンポーネントテスト**: React Testing Library を使用したコンポーネントのレンダリングとインタラクションのテスト
- **音声合成テスト**: ブラウザーAPIをモックして再生制御を検証
- **モッキング**: localStorage やブラウザーAPIのモック
- **カバレッジ**: コードカバレッジの測定と報告

### リンティング

```bash
npm run lint
```

または

```bash
yarn lint
```

または

```bash
pnpm lint
```

### 型チェック

TypeScriptの型チェックは、ビルド時またはIDEで自動的に実行されます。

## CI/CD

このプロジェクトはGitHub Actionsを使用した継続的インテグレーション（CI）を設定しています。

### 自動テスト

以下の条件でCIが実行されます：

- `main`ブランチへのプッシュ時
- プルリクエストの作成・更新時

CIでは以下のチェックが行われます：

- ESLintによる静的解析
- TypeScriptの型チェック
- Jestを使用したユニットテストとインテグレーションテスト
- アプリケーションのビルド検証
- Node.js 26.x での動作確認

## 自動依存関係更新（Dependabot）

このプロジェクトでは、依存関係の安全性と最新化のために[Dependabot](https://docs.github.com/ja/code-security/dependabot)
を利用しています。

- GitHub Actionsおよびnpmパッケージの依存関係は**月次（月曜日 09:00 JST）**で自動チェック・更新されます。
- 更新内容は自動でプルリクエストとして作成されます。
- 詳細な設定は `.github/dependabot.yml` を参照してください。

## トラブルシューティング

### ポート競合

デフォルトのポート3000が使用中の場合：

```bash
npm run dev -- --port 3001
```
