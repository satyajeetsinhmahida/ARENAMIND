import fs from 'fs';
import path from 'path';
import { buildTFIDF, searchTFIDF, TFIDFIndex } from './embeddings.js';
import { KnowledgeChunk, RAGResult } from '../types/index.js';

let knowledgeIndex: TFIDFIndex;
let chunksMap = new Map<string, KnowledgeChunk>();

/**
 * Loads and chunks JSON files from knowledge-base/ and indexes them via TF-IDF.
 * 
 * @param kbDirectory Path to the knowledge-base directory
 */
export function initKnowledgeBase(kbDirectory: string): void {
  const resolvedDir = path.resolve(kbDirectory);
  const chunks: KnowledgeChunk[] = [];
  let chunkCount = 0;

  const loadJSON = (fileName: string): any => {
    const filePath = path.join(resolvedDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`Knowledge base file not found: ${filePath}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  };

  // 1. Stadium Zones
  const zones = loadJSON('stadium-zones.json');
  if (zones) {
    for (const z of zones) {
      chunks.push({
        id: `zone-${z.id}`,
        source: 'stadium-zones.json',
        category: 'zones',
        title: z.name,
        content: `Zone ID: ${z.id}. Zone Name: ${z.name}. Type: ${z.type}. Capacity: ${z.capacity}. Level: ${z.level}. Adjacent zones: ${z.adjacentZones.join(', ')}. Accessible facility: ${z.accessible ? 'Yes' : 'No'}. Coordinates: X:${z.coordinates.x} Y:${z.coordinates.y}.`,
        keywords: [z.id.toLowerCase(), z.name.toLowerCase(), z.type, 'map', 'restroom', 'gate'],
        language: 'en'
      });
    }
  }

  // 2. Gates Map
  const gates = loadJSON('gate-map.json');
  if (gates) {
    for (const g of gates) {
      chunks.push({
        id: `gate-${g.gateId}`,
        source: 'gate-map.json',
        category: 'gates',
        title: g.name,
        content: `Gate ID: ${g.gateId}. Name: ${g.name}. Location: ${g.location}. Public transit access: ${g.transit}. Accessibility services: ${g.accessibility}. Seating sections served: ${g.sectionsServed.join(', ')}. Operating hours: ${g.hours}.`,
        keywords: [g.gateId.toLowerCase(), g.name.toLowerCase(), 'gate', 'transit', 'parking', 'arrival'],
        language: 'en'
      });
    }
  }

  // 3. Concession Menus
  const concessions = loadJSON('concession-menus.json');
  if (concessions) {
    for (const c of concessions) {
      const itemsList = c.items
        .map((i: any) => `- ${i.name} ($${i.price.toFixed(2)}) [Allergens: ${i.allergens.join(', ') || 'none'}, Dietary: ${i.flags.join(', ') || 'none'}, Prep: ${i.prepTimeSeconds}s]`)
        .join('\n');
      
      chunks.push({
        id: `concession-${c.standId}`,
        source: 'concession-menus.json',
        category: 'concessions',
        title: c.name,
        content: `Concession Stand ID: ${c.standId}. Name: ${c.name}. Specialty: ${c.specialty}. Menu Items:\n${itemsList}`,
        keywords: [c.standId.toLowerCase(), c.name.toLowerCase(), c.specialty.toLowerCase(), 'food', 'drink', 'beer', 'pizza', 'burger', 'allergen', 'halal', 'vegan', 'vegetarian'],
        language: 'en'
      });
    }
  }

  // 4. Venue Policies
  const policies = loadJSON('venue-policies.json');
  if (policies) {
    // Break policy JSON into subcategory chunks
    if (policies.bagPolicy) {
      chunks.push({
        id: 'policy-bag',
        source: 'venue-policies.json',
        category: 'policies',
        title: 'Bag Policy',
        content: `Clear Bag Policy:\nPermitted bags:\n${policies.bagPolicy.permitted.map((p: string) => `- ${p}`).join('\n')}\nProhibited bags:\n${policies.bagPolicy.prohibited.map((p: string) => `- ${p}`).join('\n')}\nExceptions:\n${policies.bagPolicy.exceptions.map((p: string) => `- ${p}`).join('\n')}`,
        keywords: ['bag', 'backpack', 'purse', 'clear', 'size', 'diaper', 'clutch'],
        language: 'en'
      });
    }

    if (policies.prohibitedItems) {
      chunks.push({
        id: 'policy-prohibited',
        source: 'venue-policies.json',
        category: 'policies',
        title: 'Prohibited Items',
        content: `Prohibited Items list inside stadium:\n${policies.prohibitedItems.map((p: string) => `- ${p}`).join('\n')}`,
        keywords: ['prohibited', 'weapons', 'knife', 'umbrella', 'camera', 'can', 'water', 'bottle'],
        language: 'en'
      });
    }

    if (policies.reEntryPolicy) {
      chunks.push({
        id: 'policy-reentry',
        source: 'venue-policies.json',
        category: 'policies',
        title: 'Re-Entry Policy',
        content: `Re-entry rules:\n${policies.reEntryPolicy.general}\nEmergency exceptions: ${policies.reEntryPolicy.emergencies}`,
        keywords: ['re-entry', 'reentry', 'exit', 'leave', 'gate', 'return'],
        language: 'en'
      });
    }

    if (policies.alcoholPolicy) {
      chunks.push({
        id: 'policy-alcohol',
        source: 'venue-policies.json',
        category: 'policies',
        title: 'Alcohol Policy',
        content: `Alcohol Guidelines:\nPurchase limit: ${policies.alcoholPolicy.purchaseLimit}\nID requirements: ${policies.alcoholPolicy.idRequirement}\nCut-off time: ${policies.alcoholPolicy.cutoffTime}\nRule violations: ${policies.alcoholPolicy.prohibitions}`,
        keywords: ['alcohol', 'beer', 'wine', 'id', 'license', 'age', 'drinking', 'cutoff'],
        language: 'en'
      });
    }

    if (policies.smokingPolicy) {
      chunks.push({
        id: 'policy-smoking',
        source: 'venue-policies.json',
        category: 'policies',
        title: 'Smoking Policy',
        content: `Smoking Rules:\nGeneral: ${policies.smokingPolicy.general}\nDesignated areas: ${policies.smokingPolicy.designatedAreas}`,
        keywords: ['smoke', 'vape', 'smoking', 'cigarette', 'electronic'],
        language: 'en'
      });
    }
  }

  // 5. Accessibility Services
  const accessibility = loadJSON('accessibility-services.json');
  if (accessibility) {
    for (const [key, val] of Object.entries(accessibility)) {
      const detail = val as any;
      chunks.push({
        id: `accessibility-${key}`,
        source: 'accessibility-services.json',
        category: 'accessibility',
        title: `Accessibility: ${key.replace(/([A-Z])/g, ' $1')}`,
        content: Object.entries(detail)
          .map(([subKey, subVal]) => `${subKey.toUpperCase()}: ${subVal}`)
          .join('\n'),
        keywords: ['accessibility', 'ada', 'wheelchair', 'deaf', 'interpreter', 'sensory', 'animal', 'relief', 'quiet', 'braille', 'tactile', key.toLowerCase()],
        language: 'en'
      });
    }
  }

  // 6. FAQs
  const faqs = loadJSON('faq.json');
  if (faqs) {
    for (const faq of faqs) {
      chunks.push({
        id: `faq-${chunkCount++}`,
        source: 'faq.json',
        category: 'faq',
        title: faq.question,
        content: `Q: ${faq.question}\nA: ${faq.answer}`,
        keywords: faq.keywords.concat(['faq', 'question', 'answer']),
        language: 'en'
      });
    }
  }

  // Map chunk indices and index documents via TF-IDF
  chunksMap.clear();
  const docVectors: { id: string; text: string }[] = [];

  for (const chunk of chunks) {
    chunksMap.set(chunk.id, chunk);
    docVectors.push({
      id: chunk.id,
      text: `${chunk.title} ${chunk.content} ${chunk.keywords.join(' ')}`
    });
  }

  knowledgeIndex = buildTFIDF(docVectors);
  console.log(`Knowledge Base loaded: ${chunks.length} chunks indexed via TF-IDF.`);
}

/**
 * Searches the loaded knowledge base.
 * 
 * @param query Query text
 * @param topK Number of results to return
 * @returns Array of RAG results
 */
export function searchKnowledge(query: string, topK: number = 4): RAGResult[] {
  if (!knowledgeIndex) {
    console.warn('Knowledge base not initialized.');
    return [];
  }

  const matches = searchTFIDF(query, knowledgeIndex, topK);

  return matches.map(match => ({
    chunk: chunksMap.get(match.id)!,
    score: match.score
  }));
}
