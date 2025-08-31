const questService = require('./src/services/questService');

async function testQuests() {
  console.log('🧪 Test du service de quêtes...');
  
  try {
    // Test de récupération des quêtes
    const quests = await questService.getUserQuests('test-user-123');
    console.log(`📋 Quêtes récupérées: ${quests.length}`);
    
    if (quests.length > 0) {
      console.log('🎯 Premières quêtes:');
      quests.slice(0, 3).forEach(quest => {
        console.log(`  - ${quest.title} (${quest.type}) - ${quest.progress}/${quest.requirement}`);
      });
    }
    
    // Test de mise à jour de progression
    console.log('\n🔄 Test de mise à jour de progression...');
    await questService.updateQuestProgress('test-user-123', 'all', {
      action: 'stream_discovered',
      viewerCount: 25,
      gameId: '123',
      language: 'fr'
    });
    
    console.log('✅ Test terminé');
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  }
  
  process.exit(0);
}

testQuests();
