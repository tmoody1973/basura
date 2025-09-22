// Quick test to verify chunk_index logic
const chunks = ["chunk1", "chunk2", "chunk3"];
const embeddings = [[1,2,3], [4,5,6], [7,8,9]];

const chunksData = chunks.map((chunk, index) => ({
  document_id: "test-doc",
  content: chunk,
  embedding: embeddings[index],
  chunk_index: index + 1, // Start from 1, not 0
  metadata: {
    jurisdiction_type: "city",
    jurisdiction_name: "test",
  },
}));

console.log('Chunk data with indexes:');
chunksData.forEach((chunk, i) => {
  console.log(`Chunk ${i}: chunk_index = ${chunk.chunk_index}`);
});

// Verify no null values
const hasNullChunkIndex = chunksData.some(chunk => chunk.chunk_index === null || chunk.chunk_index === undefined);
console.log('Has null chunk_index:', hasNullChunkIndex);