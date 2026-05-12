#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL using Node.js + Sequelize (no extra deps needed)
for i in $(seq 1 30); do
  if node -e "
    const { Sequelize } = require('sequelize');
    const s = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USERNAME,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: false
      }
    );
    s.authenticate()
      .then(() => { s.close(); process.exit(0); })
      .catch(() => { process.exit(1); });
  " 2>/dev/null; then
    echo "✅ PostgreSQL is ready!"
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "❌ PostgreSQL did not become ready in 30 seconds. Exiting."
    exit 1
  fi

  echo "  Attempt $i/30 — DB not ready, retrying in 1s..."
  sleep 1
done

echo ""
echo "🔄 Running database migrations..."
npx sequelize-cli db:migrate

echo ""
echo "🌱 Running database seeders..."
npx sequelize-cli db:seed:all

echo ""
echo "🚀 Starting server..."
exec "$@"
