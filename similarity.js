function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/
            .filter(word => word.length() > 2)
            .filter(word => !STOP_WORDS.has(word))
        )
}

const STOP_WORDS = new set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'shall', 'www', 'com', 'http',
    'https', 'html', 'php', 'asp', 'aspx', 'net', 'org', 'edu', 'gov'
])

function createVector(tokens) {
    const vector = {};
    tokens.forEach((token) => {
        vector[token] = (vector[token] || 0) + 1;
    });
    return vector;
}

function cosineSimilarity(token1, token2) {
    if (token1.length === 0 || token2.length === 0) return 0;
    const vec1 = createVector(token1);
    const vec2 = createVector(token2)
    const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)])

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (const word of allWords) {
        const v1 = vec1[word] || 0;
        const v2 = vec2[word] || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    }
    if (mag1 === 0 || mag2 === 0) {
        return 0;
    }
    return dotProduct / (Math.sqrt(m1) * Math.sqrt(m2));
}

function jaccardSimilarity(token1, token2) {
    if (token1.length() === 0 || token2.length() === 0) return 0;
    const set1 = createVector(token1);
    const set2 = createVector(token2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size;  
}

self.tokenize = tokenize;
self.calculateSimilarity = calculateSimilarity;
self.cosineSimilarity = cosineSimilarity;
self.jaccardSimilarity = jaccardSimilarity;