import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  content: string;
  contentType: 'post' | 'comment';
  postId?: string;
  commentId?: string;
  companyId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType, postId, commentId, companyId }: ModerationRequest = await req.json();
    
    console.log('Moderating content:', { contentType, companyId, content: content.substring(0, 50) + '...' });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get banned words for this company
    const { data: bannedWords, error: wordsError } = await supabase
      .from('banned_words')
      .select('word, severity')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (wordsError) {
      console.error('Error fetching banned words:', wordsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch banned words' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bannedWords || bannedWords.length === 0) {
      console.log('No banned words found for company');
      return new Response(JSON.stringify({ isRestricted: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize content for checking
    const normalizedContent = normalizeText(content);
    const flaggedWords: string[] = [];
    let maxConfidence = 0;

    // Check each banned word
    for (const bannedWord of bannedWords) {
      const normalizedBannedWord = normalizeText(bannedWord.word);
      const confidence = checkWordVariations(normalizedContent, normalizedBannedWord);
      
      if (confidence > 70) { // Threshold for detection
        flaggedWords.push(bannedWord.word);
        maxConfidence = Math.max(maxConfidence, confidence);
        console.log(`Flagged word detected: ${bannedWord.word} with confidence ${confidence}%`);
      }
    }

    if (flaggedWords.length > 0) {
      // Content is flagged - mark as restricted and create report
      const tableToUpdate = contentType === 'post' ? 'posts' : 'post_interactions';
      const idField = contentType === 'post' ? 'id' : 'id';
      const targetId = contentType === 'post' ? postId : commentId;

      // Update content as restricted
      const { error: updateError } = await supabase
        .from(tableToUpdate)
        .update({
          is_restricted: true,
          auto_flagged: true,
          flagged_reason: `Conteúdo automaticamente restrito por conter palavras proibidas: ${flaggedWords.join(', ')}`,
          flagged_at: new Date().toISOString()
        })
        .eq(idField, targetId);

      if (updateError) {
        console.error('Error updating content:', updateError);
      }

      // Create moderation report
      const { error: reportError } = await supabase
        .from('moderation_reports')
        .insert({
          company_id: companyId,
          post_id: contentType === 'post' ? postId : null,
          comment_id: contentType === 'comment' ? commentId : null,
          content_type: contentType,
          original_content: content,
          flagged_words: flaggedWords,
          confidence_score: maxConfidence
        });

      if (reportError) {
        console.error('Error creating moderation report:', reportError);
      }

      console.log(`Content flagged with ${flaggedWords.length} banned words, confidence: ${maxConfidence}%`);
      
      return new Response(JSON.stringify({ 
        isRestricted: true, 
        flaggedWords,
        confidence: maxConfidence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Content passed moderation');
    return new Response(JSON.stringify({ isRestricted: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Advanced function to check word variations with confidence scoring
function checkWordVariations(content: string, bannedWord: string): number {
  let maxConfidence = 0;
  
  // Direct match
  if (content.includes(bannedWord)) {
    maxConfidence = Math.max(maxConfidence, 100);
  }
  
  // Check with spaces between letters
  const spacedWord = bannedWord.split('').join(' ');
  if (content.includes(spacedWord)) {
    maxConfidence = Math.max(maxConfidence, 95);
  }
  
  // Check with various character substitutions
  const variations = generateWordVariations(bannedWord);
  for (const variation of variations) {
    if (content.includes(variation)) {
      maxConfidence = Math.max(maxConfidence, 85);
    }
  }
  
  // Check with regex pattern for character substitutions
  const regexPattern = createFlexibleRegex(bannedWord);
  const regex = new RegExp(regexPattern, 'gi');
  if (regex.test(content)) {
    maxConfidence = Math.max(maxConfidence, 80);
  }
  
  // Check for partial matches with distance
  const partialMatch = checkPartialMatch(content, bannedWord);
  maxConfidence = Math.max(maxConfidence, partialMatch);
  
  return maxConfidence;
}

// Generate common variations of a word
function generateWordVariations(word: string): string[] {
  const variations: string[] = [];
  
  // Common character substitutions
  const substitutions: { [key: string]: string[] } = {
    'a': ['@', '4'],
    'e': ['3'],
    'i': ['1', '!'],
    'o': ['0'],
    's': ['5', '$'],
    't': ['7'],
    'l': ['1'],
    'g': ['9']
  };
  
  // Generate variations with substitutions
  for (const [char, subs] of Object.entries(substitutions)) {
    for (const sub of subs) {
      variations.push(word.replace(new RegExp(char, 'g'), sub));
    }
  }
  
  // Add version with random spaces
  variations.push(word.split('').join(' '));
  variations.push(word.split('').join('.'));
  variations.push(word.split('').join('-'));
  
  return variations;
}

// Create flexible regex pattern
function createFlexibleRegex(word: string): string {
  return word
    .split('')
    .map(char => {
      switch (char.toLowerCase()) {
        case 'a': return '[a@4]';
        case 'e': return '[e3]';
        case 'i': return '[i1!]';
        case 'o': return '[o0]';
        case 's': return '[s5$]';
        case 't': return '[t7]';
        case 'l': return '[l1]';
        case 'g': return '[g9]';
        default: return char;
      }
    })
    .join('[\\s\\-\\.]*'); // Allow spaces, hyphens, dots between characters
}

// Check partial match with edit distance
function checkPartialMatch(content: string, bannedWord: string): number {
  const words = content.split(' ');
  let maxScore = 0;
  
  for (const word of words) {
    const similarity = calculateSimilarity(word, bannedWord);
    if (similarity > 0.8) { // 80% similarity threshold
      maxScore = Math.max(maxScore, similarity * 75); // Max 75% confidence for partial matches
    }
  }
  
  return maxScore;
}

// Calculate string similarity (Jaro-Winkler inspired)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const maxDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const matches = [];
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);
  
  // Find matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - maxDistance);
    const end = Math.min(i + maxDistance + 1, str2.length);
    
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches.push(str1[i]);
      break;
    }
  }
  
  if (matches.length === 0) return 0;
  
  // Calculate transpositions
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches.length / str1.length + 
                matches.length / str2.length + 
                (matches.length - transpositions / 2) / matches.length) / 3;
  
  return jaro;
}