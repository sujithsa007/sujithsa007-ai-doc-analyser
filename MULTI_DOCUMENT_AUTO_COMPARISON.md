# 🚀 Automatic Multi-Document Intelligence

## Overview

The AI Doc Analyser now automatically detects when you upload multiple documents and uses advanced cross-document analysis **without requiring any special buttons or modes**.

## How It Works

### ✨ Seamless Multi-Document Detection

1. **Upload Multiple Documents** - Simply upload 2+ documents using the regular upload interface
2. **Ask Questions Naturally** - Use the regular chat input to ask questions about your documents
3. **Automatic Intelligence** - The system automatically detects you have multiple documents and:
   - Performs automated content similarity scanning
   - Uses specialized multi-document AI prompts
   - Provides evidence-based cross-document analysis
   - Cites specific document sources in responses

### 🎯 Real-World Use Cases

#### 1. Excel Data Comparison
```
Scenario: Upload 2 Excel files (employees.xlsx, payroll.xlsx)
Question: "What is John Smith's salary information across both files?"

Result: System automatically:
- Detects spreadsheet format
- Identifies column headers in both files
- Searches for John Smith in both documents
- Compares data and shows differences
- Cites source: [employees.xlsx, row 15] vs [payroll.xlsx, row 8]
```

#### 2. Resume Screening
```
Scenario: Upload multiple resume PDFs
Question: "Which candidates have React experience?"

Result: System automatically:
- Scans all resumes
- Identifies React mentions
- Lists matching candidates
- Cites specific resume sources
```

#### 3. Document Comparison
```
Scenario: Upload contract versions (contract_v1.pdf, contract_v2.pdf)
Question: "What are the differences between these contracts?"

Result: System automatically:
- Compares both documents
- Lists specific changes
- Quotes exact differences
- Cites document sources
```

## Technical Implementation

### Backend Flow (app.js)

```javascript
// Automatic detection at /ask endpoint
const isMultiDoc = documents && Array.isArray(documents) && documents.length > 0;

if (isMultiDoc) {
  // 1. Automated similarity scanning
  const similarityResult = analyzeContentSimilarity(documents);
  
  // 2. Smart truncation for performance
  const documentsContent = formatDocumentsOptimized(documents);
  
  // 3. Use specialized multi-document prompt
  formattedPrompt = await multiDocPrompt.format({
    documentCount: documents.length,
    documentsContent: similarityContext + '\n\n' + documentsContent,
    question: question
  });
}
```

### Frontend Integration (MessageInput.jsx)

```javascript
// Prepare documents array when multiple docs uploaded
if (documents.length > 0) {
  const docsToSend = documents.map(doc => ({
    fileName: doc.fileName,
    documentType: doc.file?.type || 'Unknown',
    content: doc.content
  }));
  
  // Call AI with multi-doc support (automatic routing)
  answer = await askQuestion(currentQuestion, null, docsToSend);
}
```

## Multi-Document AI Prompt Features

### 🔍 Automated Similarity Scanning
- Pre-analyzes content overlap between documents
- Calculates word similarity, phrase matching, shared entities
- Provides AI with objective similarity metrics
- Prevents false relationship claims

### 📊 Spreadsheet-Aware Analysis
- Detects Excel/CSV file formats automatically
- Preserves column headers and table structure
- Enables accurate data extraction and comparison
- Searches for specific rows/values across files

### 🎯 Evidence-Based Responses
The multi-document prompt enforces strict rules:
- **NEVER claim similarity without concrete evidence**
- Quote exact text, data, or values that support claims
- If no shared entities found, explicitly state documents are UNRELATED
- Every claim must cite source document with filename

### 📚 Citation Requirements
All responses include:
- Source document references: `[Document 1: filename.pdf]`
- Exact quotes for similarity claims
- Row/column references for spreadsheet data
- Clear "NOT FOUND" statements when data missing

## Example Interactions

### Scenario 1: Related Documents
```
User uploads: project_proposal.docx, budget_breakdown.xlsx
Question: "What is the total budget for this project?"

AI Response:
"The project proposal [project_proposal.docx] mentions a total budget of $250,000.
The budget breakdown [budget_breakdown.xlsx] shows:
- Personnel: $150,000 [row 2, column B]
- Equipment: $75,000 [row 3, column B]
- Overhead: $25,000 [row 4, column B]
Total: $250,000 [row 5, column B]

✅ Both documents match - total budget is $250,000."
```

### Scenario 2: Unrelated Documents
```
User uploads: recipe_book.pdf, tax_forms.pdf
Question: "Are these documents related?"

AI Response:
"❌ **THESE DOCUMENTS ARE COMPLETELY UNRELATED**

**AUTOMATED CONTENT ANALYSIS:**
- Word Overlap: 2.3% (Threshold: 15% required)
- Phrase Matching: 0.8% (Threshold: 10% required)
- Shared Entities: 0 (Threshold: 3 required)
- Overall Similarity: 1.6%

**WHY THEY ARE UNRELATED:**
1. No shared entities (no common names, dates, IDs)
2. Different topics (cooking recipes vs tax documentation)
3. Minimal word overlap (below 15% threshold)

These documents serve entirely different purposes."
```

## Performance Optimizations

### Smart Truncation
- Large documents automatically truncated to 15,000 chars each
- Preserves beginning (most important content)
- Maintains table/spreadsheet structure
- Prevents timeout/payload issues

### Caching
- Frontend caches responses per document combination
- Cache key based on question + document IDs
- Instant responses for repeated queries
- Automatic cache invalidation when docs change

### Similarity Pre-Check
- For relationship questions ("are these related?")
- If automated scan shows <15% similarity
- System skips AI and returns instant verdict
- Saves API quota and improves speed

## Key Differences from Old Approach

| Aspect | ❌ Old "Smart Analysis" Button | ✅ New Auto-Detection |
|--------|-------------------------------|----------------------|
| **User Experience** | Required clicking separate button | Seamless - works automatically |
| **Document Upload** | Had to select docs for comparison | Just upload normally |
| **Chat Integration** | Separate modal/interface | Regular chat interface |
| **Mode Selection** | Manual selection required | Automatic routing |
| **Complexity** | Multiple workflows | Single unified workflow |

## Benefits

### 🎯 User Experience
- **Zero extra steps** - Just upload and ask
- **Natural interaction** - Use regular chat
- **No mode switching** - System is always smart
- **Consistent interface** - One way to interact

### 🧠 Intelligence
- **Automatic detection** - No manual configuration
- **Evidence-based** - All claims backed by citations
- **Similarity scanning** - Objective relationship metrics
- **Format-aware** - Handles Excel, PDFs, images, etc.

### ⚡ Performance
- **Smart truncation** - Handles large documents
- **Caching** - Instant repeated queries
- **Quota optimization** - Skips AI when unnecessary
- **Fast responses** - Automated similarity checks

## Configuration

All multi-document features are **enabled by default** with no configuration needed.

### Backend Configuration (app.js)
```javascript
// Similarity thresholds (adjustable)
const SIMILARITY_THRESHOLDS = {
  wordSimilarity: 15,     // % of words that must match
  ngramSimilarity: 10,    // % of 3-word phrases that must match
  entityCount: 3          // Minimum shared entities (names, dates, IDs)
};

// Document truncation limits
const MAX_DOC_LENGTH_SINGLE = 20000;  // Single document
const MAX_DOC_LENGTH_MULTI = 15000;   // Per document in multi-doc
```

## Future Enhancements

Potential improvements for even better multi-document intelligence:

1. **Visual Comparison Tables** - Side-by-side document comparison UI
2. **Diff Highlighting** - Show exact text differences visually
3. **Export Merged Data** - Download combined Excel with comparison results
4. **Bulk Upload** - Drag-and-drop folder of documents
5. **Smart Grouping** - Automatically cluster related documents
6. **Version Detection** - Identify which docs are version updates

## Troubleshooting

### Issue: Multi-doc not working
**Solution**: Ensure multiple documents are uploaded (check document list in sidebar)

### Issue: AI says unrelated when they seem related
**Solution**: Check if documents actually share specific content (names, dates, data). Generic topic similarity doesn't count.

### Issue: Missing data in comparison
**Solution**: For Excel files, ensure column headers are clear and data is in first 15,000 chars of each file.

### Issue: Slow responses
**Solution**: Large documents are auto-truncated. If still slow, try splitting very large files.

## Summary

The AI Doc Analyser now provides **automatic multi-document intelligence** that:
- ✅ Works seamlessly with regular chat interface
- ✅ Requires no special buttons or modes
- ✅ Provides evidence-based, cited responses
- ✅ Handles Excel data comparison automatically
- ✅ Detects unrelated documents objectively
- ✅ Optimizes performance with smart truncation
- ✅ Maintains compatibility with single-document analysis

**Just upload multiple documents and start asking questions - the system handles the rest!**
