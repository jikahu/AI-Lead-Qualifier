import { z } from "zod";

export const INDUSTRIES = [
  "SaaS / Tech",
  "Finance",
  "Healthcare",
  "Retail / E-commerce",
  "Manufacturing",
  "Education",
  "Media / Entertainment",
  "Other",
] as const;

export const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–1,000",
  "1,001–5,000",
  "5,000+",
] as const;

export const BUDGET_RANGES = [
  "Under $10K",
  "$10K – $50K",
  "$50K – $250K",
  "$250K – $1M",
  "$1M+",
  "Not disclosed",
] as const;

export const TIMELINES = [
  "Immediate (< 1 month)",
  "1 – 3 months",
  "3 – 6 months",
  "6 – 12 months",
  "12+ months",
  "Just exploring",
] as const;

export const LeadInputSchema = z.object({
  // Company profile
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  company: z.string().min(1, "Company is required"),
  title: z.string().optional(),
  industry: z.enum(INDUSTRIES).optional(),
  companySize: z.enum(COMPANY_SIZES).optional(),

  // Qualification criteria (mandatory)
  budgetRange: z.enum(BUDGET_RANGES, {
    message: "Annual budget range is required",
  }),
  timeline: z.enum(TIMELINES, {
    message: "Timeline / urgency is required",
  }),
  painPoint: z.string().min(1, "Primary pain point is required"),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;
export type Industry = (typeof INDUSTRIES)[number];
export type CompanySize = (typeof COMPANY_SIZES)[number];
export type BudgetRange = (typeof BUDGET_RANGES)[number];
export type Timeline = (typeof TIMELINES)[number];

export const QualificationSchema = z.object({
  score: z.number().min(0).max(100),
  tier: z.enum(["hot", "warm", "cold"]),
  reasoning: z.string(),
  signals: z.object({
    positives: z.array(z.string()),
    concerns: z.array(z.string()),
  }),
  suggestedNextStep: z.string(),
});

export type Qualification = z.infer<typeof QualificationSchema>;
export type Tier = Qualification["tier"];
