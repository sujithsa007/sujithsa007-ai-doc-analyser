/**
 * Multi-Document Analysis Service
 * 
 * Advanced service for cross-document analysis, filtering, comparison,
 * and structured data extraction from multiple documents.
 * 
 * Features:
 * - Resume bulk screening and filtering
 * - Excel data merging by common keys
 * - Cross-document comparison and analysis
 * - Structured data extraction and export
 * - Template-based analysis workflows
 */

import { ChatGroq } from '@langchain/groq';

// Lazy initialization of LLM to ensure env vars are loaded
let llm = null;

function getLLM() {
  if (!llm) {
    llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Lower temperature for consistent structured output
      maxTokens: 8000,
    });
  }
  return llm;
}

/**
 * Analysis Templates for different use cases
 */
const ANALYSIS_TEMPLATES = {
  RESUME_FILTER: {
    name: 'Resume Screening',
    description: 'Filter resumes based on skills, experience, and requirements',
    systemPrompt: `You are an expert HR recruiter analyzing resumes. Your task is to evaluate candidates against specific job requirements.
    
For each resume, provide:
1. Match Score (0-100): How well the candidate matches the requirements
2. Skills Found: List of relevant skills from the requirements that the candidate has
3. Missing Skills: Required skills the candidate lacks
4. Experience Level: Years of relevant experience
5. Recommendation: STRONG_MATCH, MATCH, PARTIAL_MATCH, or NO_MATCH
6. Summary: Brief 2-3 sentence explanation

Return results as structured JSON array.`,
  },
  
  EXCEL_MERGE: {
    name: 'Excel Data Merging',
    description: 'Merge data from multiple Excel files by common identifiers',
    systemPrompt: `You are a data analyst expert in merging and consolidating data from multiple sources.

Your task is to:
1. Identify common key fields (ID, email, username, etc.) across files
2. Match records based on these keys
3. Consolidate data, handling duplicates intelligently
4. Flag conflicts or missing data
5. Return merged data in structured format

Provide clear indication of:
- Source file for each data point
- Confidence level of matches
- Any conflicts found`,
  },
  
  DOCUMENT_COMPARISON: {
    name: 'Document Comparison',
    description: 'Compare multiple documents and highlight differences',
    systemPrompt: `You are an expert document analyst comparing multiple documents.

For each comparison, identify:
1. Common elements across all documents
2. Unique elements in each document
3. Contradictions or conflicts
4. Missing information
5. Data consistency issues

Provide structured comparison with clear categorization.`,
  },
  
  DATA_EXTRACTION: {
    name: 'Structured Data Extraction',
    description: 'Extract specific data fields from multiple documents',
    systemPrompt: `You are a data extraction specialist. Extract requested fields from documents with high accuracy.

For each document, extract:
- Requested fields with exact values
- Confidence score for each extraction
- Location/context of extracted data
- Any ambiguities or multiple possible values

Return as structured JSON with clear field mapping.`,
  },
};

/**
 * Screen resumes based on job requirements
 * 
 * @param {Array} resumes - Array of resume documents with content
 * @param {Object} requirements - Job requirements (skills, experience, etc.)
 * @returns {Promise<Array>} Filtered and ranked candidates
 */
async function screenResumes(resumes, requirements) {
  console.log(`📋 Screening ${resumes.length} resumes against requirements...`);
  
  const { requiredSkills, preferredSkills, minExperience, jobTitle } = requirements;
  
  // Build analysis prompt
  const prompt = `${ANALYSIS_TEMPLATES.RESUME_FILTER.systemPrompt}

JOB REQUIREMENTS:
Position: ${jobTitle || 'Not specified'}
Required Skills: ${requiredSkills?.join(', ') || 'Not specified'}
Preferred Skills: ${preferredSkills?.join(', ') || 'None'}
Minimum Experience: ${minExperience || 0} years

RESUMES TO ANALYZE (${resumes.length} total):
${resumes.map((resume, idx) => `
--- RESUME ${idx + 1}: ${resume.fileName} ---
${resume.content.substring(0, 3000)}
${resume.content.length > 3000 ? '...(truncated)' : ''}
`).join('\n')}

INSTRUCTIONS:
1. Analyze each resume carefully
2. Check for the required skills: ${requiredSkills?.join(', ')}
3. Assign match scores based on skill coverage and experience
4. Return results as a JSON array with this structure:
[
  {
    "resumeIndex": 1,
    "fileName": "resume_name.pdf",
    "matchScore": 85,
    "skillsFound": ["React", "JavaScript"],
    "missingSkills": ["Node.js"],
    "experienceYears": 5,
    "recommendation": "STRONG_MATCH",
    "summary": "Candidate has excellent React experience..."
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const startTime = Date.now();
    const response = await getLLM().invoke(prompt);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Resume screening completed in ${processingTime}ms`);
    
    // Parse JSON response
    let results;
    try {
      // Extract JSON from response
      const content = response.content || response;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse structured response, using fallback:', parseError);
      results = resumes.map((resume, idx) => ({
        resumeIndex: idx + 1,
        fileName: resume.fileName,
        matchScore: 0,
        skillsFound: [],
        missingSkills: requiredSkills || [],
        experienceYears: 0,
        recommendation: 'ERROR',
        summary: 'Failed to parse analysis results',
        rawResponse: response.content
      }));
    }
    
    // Sort by match score (highest first)
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    
    console.log(`📊 Screening results: ${results.filter(r => r.recommendation === 'STRONG_MATCH').length} strong matches`);
    
    return {
      success: true,
      totalResumes: resumes.length,
      results,
      summary: {
        strongMatches: results.filter(r => r.recommendation === 'STRONG_MATCH').length,
        matches: results.filter(r => r.recommendation === 'MATCH').length,
        partialMatches: results.filter(r => r.recommendation === 'PARTIAL_MATCH').length,
        noMatches: results.filter(r => r.recommendation === 'NO_MATCH').length,
      },
      processingTime,
    };
    
  } catch (error) {
    console.error('❌ Resume screening failed:', error);
    throw new Error(`Resume screening failed: ${error.message}`);
  }
}

/**
 * Merge Excel data from multiple files by common key
 * 
 * @param {Array} excelFiles - Array of Excel file data
 * @param {Object} mergeConfig - Configuration for merging (key field, fields to include)
 * @returns {Promise<Object>} Merged data with conflict resolution
 */
async function mergeExcelData(excelFiles, mergeConfig) {
  console.log(`📊 Merging ${excelFiles.length} Excel files...`);
  
  const { keyField, fieldsToInclude, conflictResolution } = mergeConfig;
  
  const prompt = `${ANALYSIS_TEMPLATES.EXCEL_MERGE.systemPrompt}

MERGE CONFIGURATION:
Key Field: ${keyField || 'Auto-detect common identifier'}
Fields to Include: ${fieldsToInclude?.join(', ') || 'All fields'}
Conflict Resolution: ${conflictResolution || 'Keep first value'}

EXCEL FILES TO MERGE (${excelFiles.length} total):
${excelFiles.map((file, idx) => `
--- FILE ${idx + 1}: ${file.fileName} ---
${file.content.substring(0, 2000)}
${file.content.length > 2000 ? '...(truncated)' : ''}
`).join('\n')}

INSTRUCTIONS:
1. Identify the common key field (ID, email, username, etc.) across all files
2. For each unique key value, consolidate data from all files
3. Handle conflicts by ${conflictResolution || 'keeping the first occurrence'}
4. Track which file each data point came from
5. Return merged data as JSON:
{
  "keyField": "detected_key_name",
  "totalRecords": 100,
  "mergedRecords": [
    {
      "key": "unique_id",
      "data": {
        "field1": "value1",
        "field2": "value2"
      },
      "sources": ["file1.xlsx", "file2.xlsx"],
      "conflicts": []
    }
  ],
  "summary": {
    "totalUniqueKeys": 100,
    "filesProcessed": 5,
    "conflictsResolved": 10
  }
}

Return ONLY the JSON object, no other text.`;

  try {
    const startTime = Date.now();
    const response = await getLLM().invoke(prompt);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Excel merge completed in ${processingTime}ms`);
    
    // Parse JSON response
    let results;
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse merge results:', parseError);
      throw new Error('Failed to parse structured merge results');
    }
    
    return {
      success: true,
      ...results,
      processingTime,
    };
    
  } catch (error) {
    console.error('❌ Excel merge failed:', error);
    throw new Error(`Excel merge failed: ${error.message}`);
  }
}

/**
 * Compare multiple documents and identify differences
 * 
 * @param {Array} documents - Array of documents to compare
 * @param {Object} comparisonConfig - Configuration for comparison
 * @returns {Promise<Object>} Comparison results with differences highlighted
 */
async function compareDocuments(documents, comparisonConfig = {}) {
  console.log(`🔍 Comparing ${documents.length} documents...`);
  
  const { focusAreas, comparisonType } = comparisonConfig;
  
  const prompt = `${ANALYSIS_TEMPLATES.DOCUMENT_COMPARISON.systemPrompt}

COMPARISON CONFIGURATION:
Focus Areas: ${focusAreas?.join(', ') || 'General comparison'}
Comparison Type: ${comparisonType || 'Full content comparison'}

DOCUMENTS TO COMPARE (${documents.length} total):
${documents.map((doc, idx) => `
--- DOCUMENT ${idx + 1}: ${doc.fileName} ---
${doc.content.substring(0, 2500)}
${doc.content.length > 2500 ? '...(truncated)' : ''}
`).join('\n')}

INSTRUCTIONS:
Provide a comprehensive comparison with:
1. Common elements found in ALL documents
2. Unique elements per document
3. Contradictions or conflicts between documents
4. Missing information (present in some but not others)
5. Consistency analysis

Return as structured JSON:
{
  "commonElements": ["element1", "element2"],
  "uniquePerDocument": [
    {
      "documentIndex": 1,
      "fileName": "doc1.pdf",
      "uniqueElements": ["element1"]
    }
  ],
  "contradictions": [
    {
      "topic": "pricing",
      "values": [
        { "document": "doc1.pdf", "value": "$100" },
        { "document": "doc2.pdf", "value": "$150" }
      ]
    }
  ],
  "consistencyScore": 85,
  "summary": "Brief overall comparison summary"
}

Return ONLY the JSON object, no other text.`;

  try {
    const startTime = Date.now();
    const response = await getLLM().invoke(prompt);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Document comparison completed in ${processingTime}ms`);
    
    // Parse JSON response
    let results;
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse comparison results:', parseError);
      throw new Error('Failed to parse structured comparison results');
    }
    
    return {
      success: true,
      ...results,
      processingTime,
    };
    
  } catch (error) {
    console.error('❌ Document comparison failed:', error);
    throw new Error(`Document comparison failed: ${error.message}`);
  }
}

/**
 * Extract specific structured data from multiple documents
 * 
 * @param {Array} documents - Array of documents
 * @param {Object} extractionConfig - Fields to extract and format
 * @returns {Promise<Object>} Extracted structured data
 */
async function extractStructuredData(documents, extractionConfig) {
  console.log(`📝 Extracting structured data from ${documents.length} documents...`);
  
  const { fields, outputFormat } = extractionConfig;
  
  const prompt = `${ANALYSIS_TEMPLATES.DATA_EXTRACTION.systemPrompt}

EXTRACTION CONFIGURATION:
Fields to Extract: ${fields?.join(', ') || 'All relevant fields'}
Output Format: ${outputFormat || 'JSON'}

DOCUMENTS TO PROCESS (${documents.length} total):
${documents.map((doc, idx) => `
--- DOCUMENT ${idx + 1}: ${doc.fileName} ---
${doc.content.substring(0, 2500)}
${doc.content.length > 2500 ? '...(truncated)' : ''}
`).join('\n')}

INSTRUCTIONS:
Extract the specified fields from each document:
${fields?.map(f => `- ${f}`).join('\n') || '- Extract all relevant structured data'}

Return as JSON array:
[
  {
    "documentIndex": 1,
    "fileName": "doc1.pdf",
    "extractedData": {
      "field1": "value1",
      "field2": "value2"
    },
    "confidence": {
      "field1": 95,
      "field2": 87
    },
    "notes": "Any extraction notes or ambiguities"
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const startTime = Date.now();
    const response = await getLLM().invoke(prompt);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Data extraction completed in ${processingTime}ms`);
    
    // Parse JSON response
    let results;
    try {
      const content = response.content || response;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse extraction results:', parseError);
      throw new Error('Failed to parse structured extraction results');
    }
    
    return {
      success: true,
      totalDocuments: documents.length,
      results,
      processingTime,
    };
    
  } catch (error) {
    console.error('❌ Data extraction failed:', error);
    throw new Error(`Data extraction failed: ${error.message}`);
  }
}

/**
 * Get available analysis templates
 */
function getAnalysisTemplates() {
  return Object.entries(ANALYSIS_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: template.name,
    description: template.description,
  }));
}

export {
  screenResumes,
  mergeExcelData,
  compareDocuments,
  extractStructuredData,
  getAnalysisTemplates,
  ANALYSIS_TEMPLATES,
};
