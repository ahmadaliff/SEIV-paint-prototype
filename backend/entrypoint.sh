#!/bin/sh

# Jalankan migrasi dan seed hanya jika file penanda belum ada
if [ ! -f .medusa_initialized ]; then
  echo "🚀 Setup Database & Admin..."
  npx medusa db:migrate && \
  npm run seed:all && \
  touch .medusa_initialized
else
  echo "✅ Database sudah siap."
fi

# Jalankan perintah utama (npm run dev atau medusa start)
exec "$@"
