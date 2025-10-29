/**
 * Analysis Slice
 * Manages document analysis, templates, insights, and advanced features
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Auto-generated summaries
  summaries: {}, // {documentId: {summary, keyPoints, entities, actionItems}}
  
  // Question templates
  templates: {
    // LEGAL & COMPLIANCE
    legal: {
      name: 'Legal Document Review',
      icon: '⚖️',
      category: 'Legal & Compliance',
      questions: [
        'What are the key terms and conditions?',
        'What are the parties involved and their obligations?',
        'What are the important dates and deadlines?',
        'Are there any liability clauses or limitations?',
        'What are the termination conditions?',
      ],
    },
    contract: {
      name: 'Contract Analysis',
      icon: '📜',
      category: 'Legal & Compliance',
      questions: [
        'What is the contract duration and renewal terms?',
        'What are the payment terms and pricing structure?',
        'What are the warranties and representations?',
        'What are the confidentiality and non-disclosure provisions?',
        'What dispute resolution mechanisms are specified?',
      ],
    },
    nda: {
      name: 'NDA Review',
      icon: '🤐',
      category: 'Legal & Compliance',
      questions: [
        'What information is considered confidential?',
        'What is the confidentiality period?',
        'What are the permitted disclosures?',
        'What are the consequences of breach?',
        'What are the return or destruction obligations?',
      ],
    },
    compliance: {
      name: 'Compliance Document Check',
      icon: '✅',
      category: 'Legal & Compliance',
      questions: [
        'What regulations or standards are referenced?',
        'What compliance requirements are specified?',
        'What are the audit or verification procedures?',
        'What penalties or sanctions are mentioned?',
        'What is the reporting or documentation requirements?',
      ],
    },
    privacy: {
      name: 'Privacy Policy Analysis',
      icon: '🔒',
      category: 'Legal & Compliance',
      questions: [
        'What personal data is collected?',
        'How is the data used and shared?',
        'What are the user rights regarding their data?',
        'What security measures are in place?',
        'Is this GDPR/CCPA compliant?',
      ],
    },
    
    // BUSINESS & STRATEGY
    business: {
      name: 'Business Report Review',
      icon: '💼',
      category: 'Business & Strategy',
      questions: [
        'What are the key performance metrics?',
        'What are the main recommendations?',
        'What are the identified risks and opportunities?',
        'What action items are mentioned?',
        'What is the financial impact or budget?',
      ],
    },
    businessPlan: {
      name: 'Business Plan Evaluation',
      icon: '📊',
      category: 'Business & Strategy',
      questions: [
        'What is the business model and value proposition?',
        'What is the market size and target audience?',
        'What is the competitive advantage?',
        'What are the revenue projections?',
        'What are the key risks and mitigation strategies?',
      ],
    },
    swot: {
      name: 'SWOT Analysis',
      icon: '🎯',
      category: 'Business & Strategy',
      questions: [
        'What are the main strengths identified?',
        'What weaknesses or challenges are mentioned?',
        'What opportunities exist in the market?',
        'What threats or risks are present?',
        'What strategic recommendations are proposed?',
      ],
    },
    marketResearch: {
      name: 'Market Research Analysis',
      icon: '📈',
      category: 'Business & Strategy',
      questions: [
        'What are the market trends and insights?',
        'Who are the key competitors and their positioning?',
        'What are the customer demographics and preferences?',
        'What is the market size and growth potential?',
        'What are the key market barriers and opportunities?',
      ],
    },
    proposal: {
      name: 'Business Proposal Review',
      icon: '📋',
      category: 'Business & Strategy',
      questions: [
        'What is the scope of work being proposed?',
        'What are the deliverables and timelines?',
        'What is the total cost and payment schedule?',
        'What qualifications and experience are highlighted?',
        'What are the terms and conditions?',
      ],
    },

    // FINANCIAL
    financial: {
      name: 'Financial Document Analysis',
      icon: '💰',
      category: 'Financial',
      questions: [
        'What are the key financial figures?',
        'What is the revenue and profit trend?',
        'What are the major expenses?',
        'Are there any red flags or concerns?',
        'What is the overall financial health?',
      ],
    },
    financialStatement: {
      name: 'Financial Statement Review',
      icon: '📊',
      category: 'Financial',
      questions: [
        'What are the total assets and liabilities?',
        'What is the cash flow situation?',
        'What is the debt-to-equity ratio?',
        'What are the trends in key financial ratios?',
        'Are there any unusual or concerning items?',
      ],
    },
    budget: {
      name: 'Budget Analysis',
      icon: '💵',
      category: 'Financial',
      questions: [
        'What is the total budget allocation?',
        'What are the major budget categories and amounts?',
        'What are the budget assumptions?',
        'Are there any budget constraints or limitations?',
        'What is the variance from previous budgets?',
      ],
    },
    invoice: {
      name: 'Invoice Verification',
      icon: '🧾',
      category: 'Financial',
      questions: [
        'What is the invoice number and date?',
        'What items or services are being billed?',
        'What is the total amount due?',
        'What are the payment terms and due date?',
        'Are there any discounts or special conditions?',
      ],
    },
    investment: {
      name: 'Investment Opportunity Analysis',
      icon: '📈',
      category: 'Financial',
      questions: [
        'What is the investment opportunity and amount required?',
        'What is the expected return on investment?',
        'What are the associated risks?',
        'What is the investment timeline?',
        'What is the exit strategy?',
      ],
    },

    // ACADEMIC & RESEARCH
    academic: {
      name: 'Research Paper Analysis',
      icon: '🎓',
      category: 'Academic & Research',
      questions: [
        'What is the main research question or hypothesis?',
        'What methodology was used in this study?',
        'What are the key findings and conclusions?',
        'What are the limitations mentioned?',
        'What future research directions are suggested?',
      ],
    },
    thesis: {
      name: 'Thesis/Dissertation Review',
      icon: '📚',
      category: 'Academic & Research',
      questions: [
        'What is the research problem being addressed?',
        'What theoretical framework is used?',
        'What data collection methods were employed?',
        'What are the main contributions to the field?',
        'What are the implications for practice or policy?',
      ],
    },
    literature: {
      name: 'Literature Review',
      icon: '📖',
      category: 'Academic & Research',
      questions: [
        'What are the main themes in the literature?',
        'What gaps in research are identified?',
        'What theoretical perspectives are discussed?',
        'What methodological approaches are common?',
        'What consensus or debates exist in the field?',
      ],
    },
    labReport: {
      name: 'Lab Report Analysis',
      icon: '🔬',
      category: 'Academic & Research',
      questions: [
        'What was the experimental objective?',
        'What materials and methods were used?',
        'What were the key observations and data?',
        'What conclusions were drawn?',
        'Were there any experimental errors or limitations?',
      ],
    },
    
    // HR & RECRUITMENT
    hr: {
      name: 'Resume Screening',
      icon: '👤',
      category: 'HR & Recruitment',
      questions: [
        'What is the candidate\'s work experience?',
        'What are the key skills and qualifications?',
        'What is their educational background?',
        'Are there any notable achievements or certifications?',
        'Does the candidate meet our requirements?',
      ],
    },
    jobDescription: {
      name: 'Job Description Analysis',
      icon: '💼',
      category: 'HR & Recruitment',
      questions: [
        'What are the key responsibilities?',
        'What qualifications and experience are required?',
        'What skills are essential vs. preferred?',
        'What is the reporting structure?',
        'What benefits and compensation are mentioned?',
      ],
    },
    performance: {
      name: 'Performance Review Analysis',
      icon: '⭐',
      category: 'HR & Recruitment',
      questions: [
        'What are the employee\'s key achievements?',
        'What areas need improvement?',
        'What goals were set and met?',
        'What training or development needs are identified?',
        'What is the overall performance rating?',
      ],
    },
    policy: {
      name: 'HR Policy Review',
      icon: '📋',
      category: 'HR & Recruitment',
      questions: [
        'What is the policy scope and applicability?',
        'What are the key procedures outlined?',
        'What are employee rights and responsibilities?',
        'What are the consequences of non-compliance?',
        'When was this policy last updated?',
      ],
    },

    // TECHNICAL & IT
    technical: {
      name: 'Technical Documentation Review',
      icon: '⚙️',
      category: 'Technical & IT',
      questions: [
        'What is the technical architecture described?',
        'What are the system requirements?',
        'What are the implementation steps?',
        'What security measures are documented?',
        'What troubleshooting procedures are provided?',
      ],
    },
    api: {
      name: 'API Documentation Analysis',
      icon: '🔌',
      category: 'Technical & IT',
      questions: [
        'What endpoints are available?',
        'What authentication methods are required?',
        'What are the request and response formats?',
        'What rate limits or restrictions apply?',
        'What error codes and handling are documented?',
      ],
    },
    requirements: {
      name: 'Requirements Document Review',
      icon: '📝',
      category: 'Technical & IT',
      questions: [
        'What are the functional requirements?',
        'What are the non-functional requirements?',
        'What are the acceptance criteria?',
        'What dependencies or constraints exist?',
        'What are the priority levels?',
      ],
    },
    bugReport: {
      name: 'Bug Report Analysis',
      icon: '🐛',
      category: 'Technical & IT',
      questions: [
        'What is the bug description and severity?',
        'What are the steps to reproduce?',
        'What is the expected vs. actual behavior?',
        'What environment or configuration is affected?',
        'What workarounds are available?',
      ],
    },
    security: {
      name: 'Security Assessment Review',
      icon: '🛡️',
      category: 'Technical & IT',
      questions: [
        'What vulnerabilities were identified?',
        'What is the risk severity and impact?',
        'What remediation steps are recommended?',
        'What security standards are referenced?',
        'What is the timeline for fixes?',
      ],
    },

    // MARKETING & SALES
    marketing: {
      name: 'Marketing Plan Analysis',
      icon: '📢',
      category: 'Marketing & Sales',
      questions: [
        'What is the target audience and positioning?',
        'What marketing channels will be used?',
        'What is the marketing budget and ROI expectations?',
        'What are the key messages and value propositions?',
        'What metrics will measure success?',
      ],
    },
    campaign: {
      name: 'Campaign Performance Review',
      icon: '🎯',
      category: 'Marketing & Sales',
      questions: [
        'What were the campaign objectives?',
        'What channels and tactics were used?',
        'What were the key performance metrics?',
        'What was the conversion rate and ROI?',
        'What lessons learned or improvements are suggested?',
      ],
    },
    salesReport: {
      name: 'Sales Report Analysis',
      icon: '💹',
      category: 'Marketing & Sales',
      questions: [
        'What are the total sales figures?',
        'What are the top-performing products or services?',
        'What are the sales trends over time?',
        'What is the customer acquisition cost?',
        'What opportunities for growth are identified?',
      ],
    },
    customerFeedback: {
      name: 'Customer Feedback Analysis',
      icon: '💬',
      category: 'Marketing & Sales',
      questions: [
        'What are the main customer sentiments?',
        'What are the most common complaints or issues?',
        'What do customers appreciate most?',
        'What improvements are suggested?',
        'What is the overall satisfaction level?',
      ],
    },

    // PROJECT MANAGEMENT
    projectPlan: {
      name: 'Project Plan Review',
      icon: '🗂️',
      category: 'Project Management',
      questions: [
        'What are the project objectives and scope?',
        'What are the key milestones and deliverables?',
        'What is the project timeline?',
        'What resources are required?',
        'What are the identified risks?',
      ],
    },
    statusReport: {
      name: 'Project Status Report',
      icon: '📊',
      category: 'Project Management',
      questions: [
        'What is the current project status?',
        'What tasks were completed this period?',
        'What are the upcoming tasks and priorities?',
        'Are there any blockers or issues?',
        'Is the project on track for timeline and budget?',
      ],
    },
    riskAssessment: {
      name: 'Risk Assessment Review',
      icon: '⚠️',
      category: 'Project Management',
      questions: [
        'What risks have been identified?',
        'What is the likelihood and impact of each risk?',
        'What mitigation strategies are proposed?',
        'Who is responsible for risk management?',
        'What contingency plans exist?',
      ],
    },
    changeRequest: {
      name: 'Change Request Analysis',
      icon: '🔄',
      category: 'Project Management',
      questions: [
        'What change is being requested?',
        'What is the justification for the change?',
        'What is the impact on scope, time, and cost?',
        'What are the alternative options?',
        'What approvals are required?',
      ],
    },

    // MEDICAL & HEALTHCARE
    medical: {
      name: 'Medical Report Analysis',
      icon: '🏥',
      category: 'Medical & Healthcare',
      questions: [
        'What is the patient diagnosis or condition?',
        'What tests or procedures were performed?',
        'What are the findings and results?',
        'What treatment is recommended?',
        'What follow-up is required?',
      ],
    },
    prescription: {
      name: 'Prescription Review',
      icon: '💊',
      category: 'Medical & Healthcare',
      questions: [
        'What medications are prescribed?',
        'What are the dosage and administration instructions?',
        'What are the potential side effects?',
        'Are there any drug interactions mentioned?',
        'What is the duration of treatment?',
      ],
    },
    clinical: {
      name: 'Clinical Trial Document',
      icon: '🔬',
      category: 'Medical & Healthcare',
      questions: [
        'What is the trial purpose and hypothesis?',
        'What is the participant inclusion/exclusion criteria?',
        'What interventions or treatments are being tested?',
        'What safety measures are in place?',
        'What outcomes are being measured?',
      ],
    },

    // REAL ESTATE
    realEstate: {
      name: 'Property Document Review',
      icon: '🏠',
      category: 'Real Estate',
      questions: [
        'What property is being described?',
        'What is the purchase price or rent?',
        'What are the property specifications?',
        'What conditions or contingencies apply?',
        'What fees or additional costs are mentioned?',
      ],
    },
    lease: {
      name: 'Lease Agreement Analysis',
      icon: '📄',
      category: 'Real Estate',
      questions: [
        'What is the lease term and rent amount?',
        'What are the tenant responsibilities?',
        'What are the landlord obligations?',
        'What are the termination conditions?',
        'Are pets or subletting allowed?',
      ],
    },

    // EDUCATIONAL
    syllabus: {
      name: 'Course Syllabus Review',
      icon: '📚',
      category: 'Educational',
      questions: [
        'What are the course objectives and outcomes?',
        'What topics will be covered?',
        'What is the grading breakdown?',
        'What are the required materials?',
        'What is the attendance and participation policy?',
      ],
    },
    assignment: {
      name: 'Assignment Instructions',
      icon: '✏️',
      category: 'Educational',
      questions: [
        'What is the assignment objective?',
        'What are the specific requirements?',
        'What is the submission deadline?',
        'What is the grading rubric?',
        'What resources are allowed?',
      ],
    },

    // GOVERNMENT & PUBLIC
    government: {
      name: 'Government Document Analysis',
      icon: '🏛️',
      category: 'Government & Public',
      questions: [
        'What policy or regulation is being addressed?',
        'What are the key provisions?',
        'Who does this affect?',
        'What is the effective date?',
        'What are the compliance requirements?',
      ],
    },
    grant: {
      name: 'Grant Application Review',
      icon: '💸',
      category: 'Government & Public',
      questions: [
        'What is the grant purpose and funding amount?',
        'What are the eligibility requirements?',
        'What is the application deadline?',
        'What documentation is required?',
        'What are the evaluation criteria?',
      ],
    },

    // GENERAL PURPOSE
    summary: {
      name: 'Quick Summary',
      icon: '📄',
      category: 'General Purpose',
      questions: [
        'What is the main purpose of this document?',
        'What are the key points or highlights?',
        'Who is the intended audience?',
        'What actions or decisions are required?',
        'What is the overall conclusion or recommendation?',
      ],
    },
    meeting: {
      name: 'Meeting Minutes Analysis',
      icon: '📝',
      category: 'General Purpose',
      questions: [
        'What were the main topics discussed?',
        'What decisions were made?',
        'What action items were assigned?',
        'Who are the responsible parties?',
        'When is the next meeting?',
      ],
    },
    email: {
      name: 'Email Analysis',
      icon: '📧',
      category: 'General Purpose',
      questions: [
        'What is the main purpose of this email?',
        'What action is being requested?',
        'What is the deadline or urgency level?',
        'Who needs to be involved?',
        'What attachments or references are mentioned?',
      ],
    },
    presentation: {
      name: 'Presentation Review',
      icon: '🎤',
      category: 'General Purpose',
      questions: [
        'What is the main message or theme?',
        'What are the key slides or sections?',
        'What data or evidence is presented?',
        'What recommendations are made?',
        'What is the call to action?',
      ],
    },
  },
  
  customTemplates: [], // User-created templates
  
  // Document intelligence
  insights: {}, // {documentId: {sentiment, topics, complexity, readingTime}}
  
  // Search and filtering
  searchHistory: [],
  savedSearches: {},
  
  // Comparison results
  comparisons: [], // {id, documentIds, results, timestamp}
  
  // Export history
  exports: [], // {id, type, timestamp, filename}
  
  // Active analysis state
  activeTemplate: null,
  isAnalyzing: false,
  analysisProgress: 0,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Summary management
    setSummary: (state, action) => {
      const { documentId, summary } = action.payload;
      state.summaries[documentId] = summary;
    },
    
    // Template management
    setActiveTemplate: (state, action) => {
      state.activeTemplate = action.payload;
    },
    
    addCustomTemplate: (state, action) => {
      state.customTemplates.push({
        id: `template-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
    },
    
    removeCustomTemplate: (state, action) => {
      state.customTemplates = state.customTemplates.filter(
        t => t.id !== action.payload
      );
    },
    
    updateCustomTemplate: (state, action) => {
      const { id, updates } = action.payload;
      const template = state.customTemplates.find(t => t.id === id);
      if (template) {
        Object.assign(template, updates);
      }
    },
    
    // Insights management
    setInsights: (state, action) => {
      const { documentId, insights } = action.payload;
      state.insights[documentId] = insights;
    },
    
    // Search management
    addSearchHistory: (state, action) => {
      state.searchHistory.unshift({
        query: action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 searches
      if (state.searchHistory.length > 50) {
        state.searchHistory = state.searchHistory.slice(0, 50);
      }
    },
    
    saveSearch: (state, action) => {
      const { name, query, filters } = action.payload;
      const id = `search-${Date.now()}`;
      state.savedSearches[id] = {
        id,
        name,
        query,
        filters,
        createdAt: new Date().toISOString(),
      };
    },
    
    removeSavedSearch: (state, action) => {
      delete state.savedSearches[action.payload];
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    
    // Comparison management
    addComparison: (state, action) => {
      state.comparisons.unshift({
        id: `comparison-${Date.now()}`,
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 20 comparisons
      if (state.comparisons.length > 20) {
        state.comparisons = state.comparisons.slice(0, 20);
      }
    },
    
    removeComparison: (state, action) => {
      state.comparisons = state.comparisons.filter(
        c => c.id !== action.payload
      );
    },
    
    // Export management
    addExport: (state, action) => {
      state.exports.unshift({
        id: `export-${Date.now()}`,
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 exports
      if (state.exports.length > 50) {
        state.exports = state.exports.slice(0, 50);
      }
    },
    
    // Analysis state
    setAnalyzing: (state, action) => {
      state.isAnalyzing = action.payload;
    },
    
    setAnalysisProgress: (state, action) => {
      state.analysisProgress = action.payload;
    },
    
    // Batch operations
    clearAllAnalysis: (state) => {
      state.summaries = {};
      state.insights = {};
      state.comparisons = [];
    },
  },
});

export const {
  setSummary,
  setActiveTemplate,
  addCustomTemplate,
  removeCustomTemplate,
  updateCustomTemplate,
  setInsights,
  addSearchHistory,
  saveSearch,
  removeSavedSearch,
  clearSearchHistory,
  addComparison,
  removeComparison,
  addExport,
  setAnalyzing,
  setAnalysisProgress,
  clearAllAnalysis,
} = analysisSlice.actions;

export default analysisSlice.reducer;
