class StreamCacheManager {
  constructor() {
    this.streamPools = new Map(); // Par langue/jeu
    this.lastRefresh = new Map();
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
  }

  // Clé unique pour identifier un pool de streams
  getPoolKey(language, gameId = null, viewerRange = null) {
    return `${language}_${gameId || 'all'}_${viewerRange || 'any'}`;
  }

  // Récupérer des streams du cache en priorité
  async getStreamsFromPool(filters) {
    const { language, gameId, minViewers, maxViewers } = filters;
    
    // Déterminer la fourchette de viewers
    let viewerRange = 'any';
    if (maxViewers && maxViewers < 100) viewerRange = 'small';
    else if (minViewers && minViewers > 1000) viewerRange = 'large';
    
    const poolKey = this.getPoolKey(language, gameId, viewerRange);
    const pool = this.streamPools.get(poolKey);
    const lastRefresh = this.lastRefresh.get(poolKey);
    
    // Vérifier si le cache est encore valide
    const isExpired = !lastRefresh || (Date.now() - lastRefresh > this.refreshInterval);
    
    if (pool && !isExpired && pool.length > 0) {
      console.log(`🎯 Utilisation du cache pour ${poolKey}: ${pool.length} streams disponibles`);
      return this.filterStreamsFromPool(pool, filters);
    }
    
    return null; // Cache vide ou expiré
  }

  // Filtrer les streams du cache selon les critères exacts
  filterStreamsFromPool(streams, filters) {
    let filtered = streams;
    
    if (filters.minViewers) {
      filtered = filtered.filter(s => s.viewer_count >= filters.minViewers);
    }
    
    if (filters.maxViewers) {
      filtered = filtered.filter(s => s.viewer_count <= filters.maxViewers);
    }
    
    return filtered;
  }

  // Mettre à jour le cache avec de nouveaux streams
  updateStreamPool(filters, newStreams) {
    const { language, gameId, minViewers, maxViewers } = filters;
    
    let viewerRange = 'any';
    if (maxViewers && maxViewers < 100) viewerRange = 'small';
    else if (minViewers && minViewers > 1000) viewerRange = 'large';
    
    const poolKey = this.getPoolKey(language, gameId, viewerRange);
    
    // Mélanger avec les streams existants pour plus de diversité
    const existingPool = this.streamPools.get(poolKey) || [];
    const combinedStreams = [...existingPool, ...newStreams];
    
    // Garder seulement les streams uniques et limiter à 200
    const uniqueStreams = combinedStreams
      .filter((stream, index, arr) => 
        arr.findIndex(s => s.user_id === stream.user_id) === index
      )
      .slice(0, 200);
    
    this.streamPools.set(poolKey, uniqueStreams);
    this.lastRefresh.set(poolKey, Date.now());
    
    console.log(`💾 Cache mis à jour pour ${poolKey}: ${uniqueStreams.length} streams`);
  }

  // Nettoyer les anciens caches
  cleanExpiredCaches() {
    const now = Date.now();
    for (const [key, lastRefresh] of this.lastRefresh) {
      if (now - lastRefresh > this.refreshInterval * 2) {
        this.streamPools.delete(key);
        this.lastRefresh.delete(key);
        console.log(`🗑️ Cache expiré supprimé: ${key}`);
      }
    }
  }

  // Obtenir des statistiques du cache
  getCacheStats() {
    const stats = {
      totalPools: this.streamPools.size,
      pools: []
    };

    for (const [key, streams] of this.streamPools) {
      const lastRefresh = this.lastRefresh.get(key);
      stats.pools.push({
        key,
        streamCount: streams.length,
        lastRefresh: new Date(lastRefresh).toISOString(),
        isExpired: Date.now() - lastRefresh > this.refreshInterval
      });
    }

    return stats;
  }
}

module.exports = new StreamCacheManager();
