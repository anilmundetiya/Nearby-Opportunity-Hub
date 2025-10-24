import { GoogleGenAI } from "@google/genai";
import type { Company, GroundingSource, GeolocationCoordinates } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function parseCompanyMarkdown(markdown: string): Company[] {
  const companies: Company[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Look for lines that start with a markdown list item
    if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
      // Extract name (bolded)
      const nameMatch = line.match(/\*\*(.*?)\*\*/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown Company';

      // Extract URL
      const urlMatch = line.match(/\[.*?\]\((.*?)\)/);
      const website = urlMatch ? urlMatch[1] : '#';

      // The rest is description
      let description = line.replace(/\*\*(.*?)\*\*/, '').replace(/\[.*?\]\(.*?\)/, '').replace(/[-*]\s*/, '');
      description = description.replace(/^:\s*/, '').trim();

      companies.push({ name, description, website });
    }
  }
  return companies;
}

export async function findCompanies(
  location: string,
  jobRole: string,
  coords: GeolocationCoordinates | null
): Promise<{ companies: Company[]; sources: GroundingSource[] }> {
  try {
    const prompt = `Find ${jobRole} companies and opportunities near ${location}. For each company, provide its name, a brief description, and a direct link to its website or careers page. Format each company as a markdown list item with the name in bold.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}, {googleMaps: {}}],
            toolConfig: coords ? {
                retrievalConfig: {
                    latLng: {
                        latitude: coords.latitude,
                        longitude: coords.longitude
                    }
                }
            } : undefined
        }
    });

    const companies = parseCompanyMarkdown(response.text);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks.map((chunk) => {
      const sourceData = chunk.web || chunk.maps;
      return {
        title: sourceData?.title || 'Source',
        uri: sourceData?.uri || '#',
      };
    }).filter(source => source.uri !== '#');

    return { companies, sources };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to fetch company data. Please try again.");
  }
}