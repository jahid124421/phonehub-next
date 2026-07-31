const HF_API_URL =
  'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.warn(
      'HUGGINGFACE_API_KEY not set, falling back to keyword search'
    );
    return null;
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      console.error(
        'HF API error:',
        response.status,
        await response.text()
      );
      return null;
    }

    const data = await response.json();
    // The API returns the embedding directly as a number array
    return Array.isArray(data) ? data : data[0];
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}
