const { testConnection } = require('./src/config/database');

async function main() {
  console.log('🔌 Test de connexion à la base de données...');
  await testConnection();
  process.exit(0);
}

main();
