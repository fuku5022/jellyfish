# BLUE JELLY AQUARIUM

GitHub Pagesで動く、青い3D文字クラゲと自由計測型の勉強記録サイト。

## 公開方法

このフォルダ内の `index.html`、`style.css`、`main.js`、`app.js` をGitHubリポジトリのルートにアップロードし、Settings → Pages → Deploy from a branch → main / (root) に設定してください。以前の `study.js` は不要です。

## 仕様

- 自由計測ストップウォッチ（開始・一時停止・再開・終了）
- 科目別の勉強記録、画像で保存できる水族館チケット
- 累計時間による生き物の解放、1セッション30分につき1回の出会い抽選
- 3D文字クラゲ（Three.js、CDNへの接続が必要）
- Web Audio APIで生成するホワイトノイズ・水中風の合成音。ユーザーが押すまで鳴りません。
- 記録はlocalStorageに保存。別端末との同期・バックアップはありません。
- ブラウザを閉じると計測中の未確定セッションは保存されません。
