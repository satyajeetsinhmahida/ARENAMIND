/**
 * ArenaMind — TF-IDF Similarity Search Engine
 *
 * Implements a lightweight, local term frequency-inverse document frequency
 * search module to retrieve relevant knowledge base passages without external dependencies.
 */

export interface TFIDFIndex {
  documents: { id: string; terms: Map<string, number>; magnitude: number }[];
  idf: Map<string, number>;
}

/**
 * Tokenizes text by downcasing, stripping punctuation, and splitting on spaces.
 * 
 * @param text Raw text input
 * @returns Array of lowercase tokens
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Builds a TF-IDF index from a set of documents.
 * 
 * @param docs Array of items with id and text content
 * @returns Built TFIDFIndex
 */
export function buildTFIDF(docs: { id: string; text: string }[]): TFIDFIndex {
  const numDocs = docs.length;
  const docTermFreqs: { id: string; terms: Map<string, number> }[] = [];
  const docCounts = new Map<string, number>();

  // Count term frequencies per document
  for (const doc of docs) {
    const tokens = tokenize(doc.text);
    const terms = new Map<string, number>();
    const seen = new Set<string>();

    for (const token of tokens) {
      terms.set(token, (terms.get(token) || 0) + 1);
      if (!seen.has(token)) {
        seen.add(token);
        docCounts.set(token, (docCounts.get(token) || 0) + 1);
      }
    }
    docTermFreqs.push({ id: doc.id, terms });
  }

  // Calculate inverse document frequency (IDF)
  const idf = new Map<string, number>();
  for (const [term, count] of docCounts.entries()) {
    idf.set(term, Math.log((numDocs + 1) / (count + 1)) + 1);
  }

  // Calculate document magnitudes for normalization
  const documents: TFIDFIndex['documents'] = [];
  for (const doc of docTermFreqs) {
    let sumSq = 0;
    const tfidfTerms = new Map<string, number>();

    for (const [term, tf] of doc.terms.entries()) {
      const termIdf = idf.get(term) || 0;
      const tfidf = tf * termIdf;
      tfidfTerms.set(term, tfidf);
      sumSq += tfidf * tfidf;
    }

    documents.push({
      id: doc.id,
      terms: tfidfTerms,
      magnitude: Math.sqrt(sumSq)
    });
  }

  return { documents, idf };
}

/**
 * Searches the TF-IDF index for a query string.
 * 
 * @param query Query string
 * @param index TFIDFIndex to search against
 * @param topK Number of results to return (default 5)
 * @returns Array of document IDs and scores
 */
export function searchTFIDF(
  query: string,
  index: TFIDFIndex,
  topK: number = 5
): { id: string; score: number }[] {
  const queryTokens = tokenize(query);
  const queryTerms = new Map<string, number>();

  for (const token of queryTokens) {
    queryTerms.set(token, (queryTerms.get(token) || 0) + 1);
  }

  // Compute query TF-IDF vector
  const queryVector = new Map<string, number>();
  let querySumSq = 0;

  for (const [term, tf] of queryTerms.entries()) {
    const termIdf = index.idf.get(term) || 0;
    const tfidf = tf * termIdf;
    queryVector.set(term, tfidf);
    querySumSq += tfidf * tfidf;
  }
  const queryMagnitude = Math.sqrt(querySumSq);

  if (queryMagnitude === 0) {
    return [];
  }

  const results: { id: string; score: number }[] = [];

  // Compute cosine similarity for each document
  for (const doc of index.documents) {
    if (doc.magnitude === 0) continue;

    let dotProduct = 0;
    for (const [term, queryTfidf] of queryVector.entries()) {
      const docTfidf = doc.terms.get(term) || 0;
      dotProduct += queryTfidf * docTfidf;
    }

    const similarity = dotProduct / (queryMagnitude * doc.magnitude);
    if (similarity > 0) {
      results.push({ id: doc.id, score: similarity });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}
