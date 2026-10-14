export interface InterestTopic { id: string; name: string }
export interface InterestArea { id: string; name: string; description: string; topics: InterestTopic[] }
export interface InterestConfiguration { areaIds: string[]; topicIds: string[] }

export function normalizeInterests(catalog: InterestArea[], config: InterestConfiguration): InterestConfiguration {
  const areaIds = Array.from(new Set(config.areaIds)).filter(id => catalog.some(area => area.id === id));
  const allowed = new Set(catalog.filter(area => areaIds.includes(area.id)).flatMap(area => area.topics.map(topic => topic.id)));
  return { areaIds, topicIds: Array.from(new Set(config.topicIds)).filter(id => allowed.has(id)) };
}

export function sameConfiguration(a: InterestConfiguration, b: InterestConfiguration): boolean {
  return a.areaIds.length === b.areaIds.length && a.topicIds.length === b.topicIds.length
    && a.areaIds.every(id => b.areaIds.includes(id)) && a.topicIds.every(id => b.topicIds.includes(id));
}
