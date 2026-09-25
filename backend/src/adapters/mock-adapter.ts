import { ModelAdapter } from "./model-adapter.js";
import {
  EnterpriseTaskContext,
  SourceDocument,
  SourceClaim,
  RoleRequirement,
  SearchExpressionSet,
  TaskRecord,
  ProjectEpisode,
  RequirementAssessment
} from "../domain/types.js";
import { EvidenceState } from "../domain/evidence-states.js";

export class MockAdapter implements ModelAdapter {
  async clarifyTask(department: string, targetRole: string, rawDescription: string): Promise<EnterpriseTaskContext> {
    return {
      department: department || "AI Application Incubation / Customer Support Experience",
      targetRole: targetRole || "Junior / Intern AI Application Product Manager",
      businessProblem: "Customer support receives 20,000 inquiries monthly; LLM copilot answers have a 25% hallucination rate; customer reps distrust bot suggestions; lack dedicated personnel to curate badcases, iterate prompt templates, and measure accuracy.",
      targetUsers: [
        "Internal customer service representatives",
        "External consumers seeking order and return support"
      ],
      deliverables: [
        "Benchmark evaluation dataset containing at least 300 verified QA pairs",
        "5 optimized and structured prompt templates across core inquiry types",
        "Weekly answer accuracy and rep adoption rate tracking dashboard"
      ],
      constraints: [
        "No model pre-training or PyTorch/CUDA algorithm code required",
        "Must possess proficient Excel/JSON data cleaning and metric analysis skills",
        "Per-query LLM API cost must not exceed $0.01; latency under 2 seconds"
      ],
      openQuestions: [
        "What is the exact target threshold for rep adoption rate after 3 months?",
        "Does the team prefer few-shot in-context learning or fine-tuning later?"
      ]
    };
  }

  async extractClaims(source: SourceDocument): Promise<SourceClaim[]> {
    if (source.type === "INTERNAL_ROUGH_JD") {
      return [
        {
          id: `CLM_${source.id}_1`,
          sourceId: source.id,
          claimType: "REQUIREMENT",
          statement: "Candidate should understand LLMs and have experience with tools like ChatGPT or Claude.",
          sourceExcerptIds: [source.id],
          quoteSnapshot: "Needs to understand LLMs, ideally has used ChatGPT or Claude."
        },
        {
          id: `CLM_${source.id}_2`,
          sourceId: source.id,
          claimType: "DELIVERABLE",
          statement: "Analyze badcase responses and tweak system prompts.",
          sourceExcerptIds: [source.id],
          quoteSnapshot: "analyzing badcase responses from our chatbot and tweaking system prompts"
        },
        {
          id: `CLM_${source.id}_3`,
          sourceId: source.id,
          claimType: "PREFERENCE",
          statement: "Basic Python or strong Excel data analysis skills.",
          sourceExcerptIds: [source.id],
          quoteSnapshot: "Basic Python or strong Excel skills required."
        }
      ];
    }

    if (source.type === "INDUSTRY_BENCHMARK") {
      return [
        {
          id: `CLM_${source.id}_1`,
          sourceId: source.id,
          claimType: "REQUIREMENT",
          statement: "Hands-on Prompt Engineering experience and structured prompt architecture design.",
          sourceExcerptIds: [source.id],
          quoteSnapshot: "Hands-on Prompt Engineering experience."
        },
        {
          id: `CLM_${source.id}_2`,
          sourceId: source.id,
          claimType: "DELIVERABLE",
          statement: "Build multi-dimensional Model Evaluation datasets with accuracy and safety criteria.",
          sourceExcerptIds: [source.id],
          quoteSnapshot: "Build multi-dimensional Model Evaluation datasets; define criteria for accuracy, relevance, and safety."
        }
      ];
    }

    // Default constraints
    return [
      {
        id: `CLM_${source.id}_1`,
        sourceId: source.id,
        claimType: "CONSTRAINT",
        statement: "Evaluate candidates on metric discipline and execution; eliminate toy users with no evaluation metrics.",
        sourceExcerptIds: [source.id],
        quoteSnapshot: "Evaluate candidates on metric discipline and execution diligence."
      },
      {
        id: `CLM_${source.id}_2`,
        sourceId: source.id,
        claimType: "CONSTRAINT",
        statement: "Algorithm micro-tuning handled by algorithm team; PMs do not need CUDA or distributed training.",
        sourceExcerptIds: [source.id],
        quoteSnapshot: "PMs do not need deep CUDA or distributed training experience."
      }
    ];
  }

  async adjudicateConflicts(claims: SourceClaim[]): Promise<{
    claims: SourceClaim[];
    contradictionsFound: Array<{ claimIdA: string; claimIdB: string; explanation: string }>;
  }> {
    return {
      claims,
      contradictionsFound: []
    };
  }

  async synthesizeDraftRequirements(taskContext: EnterpriseTaskContext, claims: SourceClaim[]): Promise<RoleRequirement[]> {
    return [
      {
        id: "REQ_AIPM_01",
        code: "AIPM-AP1",
        name: "Prompt Engineering & In-Context Constraint Design",
        definition: "Ability to write structured system prompts, inject few-shot examples, and enforce JSON schema outputs.",
        evidenceRequired: "Candidate materials must show authored prompt templates with explicit constraints or examples.",
        status: "CONFIRMED"
      },
      {
        id: "REQ_AIPM_02",
        code: "AIPM-AP2",
        name: "Badcase Curation & Error Taxonomy",
        definition: "Systematic collection, deduplication, and root-cause tagging of LLM hallucinations or refusal badcases.",
        evidenceRequired: "Materials must document specific badcase datasets curated or error categories established.",
        status: "CONFIRMED"
      },
      {
        id: "REQ_AIPM_03",
        code: "AIPM-AP3",
        name: "Cross-Functional Feedback Loop",
        definition: "Ability to collaborate with domain agents or engineers to deploy iterative prompt improvements.",
        evidenceRequired: "Verifiable teamwork or SOP creation educating reps or collaborating with engineering.",
        status: "CONFIRMED"
      },
      {
        id: "REQ_AIPM_04",
        code: "AIPM-AP4",
        name: "Quantitative Metric Evaluation & Iteration",
        definition: "Designing gold evaluation scorecards and tracking accuracy, adoption, or refusal metrics.",
        evidenceRequired: "Verifiable comparative scores (e.g. before/after metrics) or benchmark datasets.",
        status: "CONFIRMED"
      }
    ];
  }

  async generateSearchExpressions(standardVersionId: string, requirements: RoleRequirement[]): Promise<SearchExpressionSet> {
    return {
      id: `SE_${standardVersionId}_MOCK`,
      standardVersionId,
      titleTerms: ["AI PM", "AI Product Manager", "Prompt Engineer", "LLM Operations", "Knowledge Base PM"],
      taskTerms: ["Prompt tuning", "Badcase analysis", "Evaluation benchmark", "RAG evaluation"],
      skillTerms: ["Few-shot", "JSON schema", "Excel", "SQL", "Python", "Ragas"],
      exclusionTerms: ["CUDA", "Kernel optimization", "Hardware engineer"],
      booleanQuery: '("AI PM" OR "Prompt" OR "LLM") AND ("Evaluation" OR "Badcase" OR "Benchmark") NOT ("CUDA")',
      humanEdited: false
    };
  }

  async extractCandidateFacts(candidateId: string, rawTextLines: string[]): Promise<{
    taskRecords: TaskRecord[];
    projectEpisodes: ProjectEpisode[];
  }> {
    const textJoined = rawTextLines.join("\n");

    // Case 1: Rescued candidate (CAND_RESCUE_01)
    if (textJoined.includes("800+ benchmark QA pairs") || textJoined.includes("CAND_RESCUE_01") || textJoined.includes("Customer Operations")) {
      return {
        taskRecords: [
          {
            id: `TR_${candidateId}_1`,
            action: "Curated and labeled",
            object: "Customer support tickets and negative reviews",
            deliverable: "800+ benchmark QA pairs",
            metric: "800+ QA pairs",
            anchorIds: ["L005"]
          },
          {
            id: `TR_${candidateId}_2`,
            action: "Authored and tuned",
            object: "System prompt templates for returns and delays",
            deliverable: "3 core prompt templates with few-shot and JSON constraints",
            metric: "Raised adoption accuracy from 68% to 82%",
            anchorIds: ["L006", "L008"]
          }
        ],
        projectEpisodes: [
          {
            id: `PE_${candidateId}_1`,
            problem: "Customer support bot had high refusal and hallucination rates.",
            personalAction: "Built Excel evaluation scorecard comparing responses to gold standards; introduced few-shot and JSON schema constraints.",
            artifact: "Excel evaluation scorecard & 3 prompt templates",
            validation: "Adoption accuracy increased from 68% to 82%",
            iteration: "Iterated prompt constraints across weekly batches",
            anchorIds: ["L006", "L007", "L008"]
          }
        ]
      };
    }

    // Case 2: Buzzword candidate (CAND_BUZZWORD_02)
    if (textJoined.includes("Multi-Agent Swarm") || textJoined.includes("CAND_BUZZWORD_02")) {
      return {
        taskRecords: [
          {
            id: `TR_${candidateId}_1`,
            action: "Spearheaded macro strategic planning",
            object: "Multi-agent LLM systems and Transformer architecture",
            deliverable: "Cognitive intelligence platform",
            anchorIds: ["L005", "L006"]
          }
        ],
        projectEpisodes: [
          {
            id: `PE_${candidateId}_1`,
            problem: "Macro enterprise ecosystem scaling",
            personalAction: "Led global team empowering commercial operations",
            artifact: "AGI world model roadmap",
            validation: "Claimed 300% GMV increase without personal contribution metrics",
            anchorIds: ["L007", "L008"]
          }
        ]
      };
    }

    // Case 3: Qualified candidate (CAND_QUALIFIED_03)
    if (textJoined.includes("400 domain QA pairs") || textJoined.includes("CAND_QUALIFIED_03")) {
      return {
        taskRecords: [
          {
            id: `TR_${candidateId}_1`,
            action: "Created benchmark",
            object: "RAG knowledge base QA pairs",
            deliverable: "Gold benchmark containing 400 QA pairs",
            metric: "400 pairs, MRR@5 & Faithfulness metrics",
            anchorIds: ["L005", "L006"]
          }
        ],
        projectEpisodes: [
          {
            id: `PE_${candidateId}_1`,
            problem: "Long context truncation in RAG",
            personalAction: "Optimized chunking strategy and collaborated with engineering to deploy vector reranker",
            artifact: "Chunking logic & evaluation card",
            validation: "User satisfaction raised by 18%",
            anchorIds: ["L006", "L007", "L008"]
          }
        ]
      };
    }

    // Case 4: Default / Unqualified
    return {
      taskRecords: [],
      projectEpisodes: []
    };
  }

  async linkEvidence(
    candidateId: string,
    rawTextLines: string[],
    episodes: ProjectEpisode[],
    tasks: TaskRecord[],
    requirements: RoleRequirement[]
  ): Promise<RequirementAssessment[]> {
    const textJoined = rawTextLines.join("\n");

    // Rescued candidate
    if (textJoined.includes("800+ benchmark QA pairs") || textJoined.includes("CAND_RESCUE_01")) {
      return requirements.map(req => {
        if (req.code === "AIPM-AP1") {
          return {
            requirementId: req.id,
            requirementCode: req.code,
            evidenceStatus: EvidenceState.SUPPORTED,
            level: "PROFICIENT",
            reasons: "Authored 3 prompt templates with few-shot examples and JSON constraints.",
            ruleIds: ["R-02", "R-03"],
            anchorIds: ["L006", "L008"]
          };
        }
        if (req.code === "AIPM-AP2") {
          return {
            requirementId: req.id,
            requirementCode: req.code,
            evidenceStatus: EvidenceState.SUPPORTED,
            level: "PROFICIENT",
            reasons: "Curated and labeled 800+ customer support benchmark QA pairs.",
            ruleIds: ["R-02", "R-03"],
            anchorIds: ["L005"]
          };
        }
        if (req.code === "AIPM-AP4") {
          return {
            requirementId: req.id,
            requirementCode: req.code,
            evidenceStatus: EvidenceState.SUPPORTED,
            level: "PROFICIENT",
            reasons: "Built Excel scorecard measuring hallucination and refusal rates, boosting accuracy from 68% to 82%.",
            ruleIds: ["R-02", "R-03"],
            anchorIds: ["L007", "L008"]
          };
        }
        return {
          requirementId: req.id,
          requirementCode: req.code,
          evidenceStatus: EvidenceState.PARTIAL,
          level: null,
          reasons: "Trained 15 customer support agents on AI draft tool.",
          ruleIds: ["R-07"],
          anchorIds: ["L009"]
        };
      });
    }

    // Buzzword candidate -> Trigger R-08 Overestimation Defense
    if (textJoined.includes("Multi-Agent Swarm") || textJoined.includes("CAND_BUZZWORD_02")) {
      return requirements.map(req => ({
        requirementId: req.id,
        requirementCode: req.code,
        evidenceStatus: EvidenceState.PARTIAL,
        level: null,
        reasons: "High-level buzzwords found without isolated personal task execution (Rule R-08).",
        ruleIds: ["R-07", "R-08"],
        anchorIds: ["L005", "L007"]
      }));
    }

    // Qualified candidate
    if (textJoined.includes("400 domain QA pairs") || textJoined.includes("CAND_QUALIFIED_03")) {
      return requirements.map(req => ({
        requirementId: req.id,
        requirementCode: req.code,
        evidenceStatus: EvidenceState.SUPPORTED,
        level: "PROFICIENT",
        reasons: "Verified RAG benchmark creation with MRR@5 and Faithfulness metrics.",
        ruleIds: ["R-02", "R-03"],
        anchorIds: ["L005", "L006"]
      }));
    }

    // Unqualified
    return requirements.map(req => ({
      requirementId: req.id,
      requirementCode: req.code,
      evidenceStatus: EvidenceState.NO_EVIDENCE,
      level: null,
      reasons: "No transferable AI application execution evidence found.",
      ruleIds: ["R-07"],
      anchorIds: []
    }));
  }

  async synthesizeInterviewPrompts(
    roleName: string,
    assessments: RequirementAssessment[],
    rawResumeLines: string[]
  ): Promise<string[]> {
    return [
      "In your prompt iteration project, what quantitative threshold did you establish before promoting a new prompt version to production?",
      "Can you describe how you isolated individual error categories during badcase root-cause analysis?",
      "How did you address edge cases where the LLM followed system instructions but still hallucinated subtle factual details?"
    ];
  }
}
