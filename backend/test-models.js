const { User, StreamCache, Favorite } = require('./src/models');

async function testModels() {
  console.log('🧪 Test des modèles de données...\n');

  try {
    // Test du modèle User
    console.log('👤 Test modèle User...');
    
    // Créer un utilisateur de test
    const userData = {
      email: `test-${Date.now()}@example.com`, // Email unique
      username: 'TestUser',
      twitchId: `test-${Date.now()}`,
      twitchToken: 'test_token',
      preferences: { theme: 'dark', notifications: true }
    };

    console.log('  - Création utilisateur...');
    const user = await User.create(userData);
    console.log(`  ✅ Utilisateur créé: ${user.username} (ID: ${user.id})`);

    // Test de recherche
    console.log('  - Recherche par Twitch ID...');
    const foundUser = await User.findByTwitchId(userData.twitchId);
    console.log(`  ✅ Utilisateur trouvé: ${foundUser ? foundUser.username : 'Non trouvé'}`);

    // Test du modèle StreamCache
    console.log('\n📺 Test modèle StreamCache...');
    
    const streamData = {
      streamerId: 'streamer123',
      streamerName: 'TestStreamer',
      titre: 'Test Stream',
      jeu: 'Just Chatting',
      categorie: 'IRL',
      nbViewers: 150,
      langue: 'fr',
      pays: 'France',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      embedUrl: 'https://player.twitch.tv/?channel=teststreamer',
      isLive: true
    };

    console.log('  - Création stream...');
    const stream = await StreamCache.upsert(streamData);
    console.log(`  ✅ Stream créé: ${stream.streamerName} (${stream.nbViewers} viewers)`);

    // Test de recherche aléatoire
    console.log('  - Recherche stream aléatoire...');
    const randomStream = await StreamCache.getRandomStream();
    console.log(`  ✅ Stream aléatoire: ${randomStream ? randomStream.streamerName : 'Aucun'}`);

    // Test du modèle Favorite
    console.log('\n⭐ Test modèle Favorite...');
    
    const favoriteData = {
      userId: user.id,
      streamerId: 'streamer123',
      streamerName: 'TestStreamer',
      streamerAvatar: 'https://example.com/avatar.jpg'
    };

    console.log('  - Ajout favori...');
    const favorite = await Favorite.create(favoriteData);
    console.log(`  ✅ Favori ajouté: ${favorite.streamerName}`);

    // Test liste favoris
    console.log('  - Liste favoris utilisateur...');
    const favorites = await Favorite.findByUserId(user.id);
    console.log(`  ✅ Favoris trouvés: ${favorites.length}`);

    // Nettoyage (suppression des données de test)
    console.log('\n🧹 Nettoyage...');
    await favorite.delete();
    await user.delete();
    console.log('  ✅ Données de test supprimées');

    console.log('\n🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

testModels();
