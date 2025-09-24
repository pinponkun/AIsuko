# アプリケーション セットアップガイド

## 準備するもの

- **Git**: ソースコードの管理を行います
- **Docker / Docker Compose**: バックエンドとデータベースの起動を行います
- **Node.js**: フロントエンドの起動を行います

## 環境変数の設定

`server` フォルダ配下に `.env` ファイルを作成し、以下の変数を設定してください。

### Docker環境用（変更不要）
```env
DB_NAME=appdb
DB_USER=appuser
DB_PASSWORD=apppass
DB_HOST=localhost
DB_PORT=3306
```

### 要変更項目
```env
GEMINI_API_KEY=ここにあなたのAPIキーを貼り付けてください
```

## アプリケーションの起動

### バックエンド側（APIサーバとデータベース）

```bash
# Dockerコンテナの起動
cd server
docker-compose up --build
```

### フロントエンド側（アプリケーション）

```bash
# アプリの起動
cd client
npm install
npm start
```

上記を完了すると、自動的にブラウザが立ち上がりアプリケーションが表示されます。
ブラウザが立ち上がらない場合は、[http://localhost:3000](http://localhost:3000) にアクセスしてください。

## MySQLコンテナへのアクセス

```bash
cd server
docker compose exec db mysql -u appuser -papppass appdb
```