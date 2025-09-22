import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export const getPineconeClient = () => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is not defined');
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }

  return pineconeClient;
};

export const getPineconeIndex = async (indexName?: string) => {
  const client = getPineconeClient();
  const index = indexName || process.env.PINECONE_INDEX || 'budget-documents';

  return client.index(index);
};