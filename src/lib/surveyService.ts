import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, generateId } from './supabaseDB';
import { addAuditLog, type AdminUser } from "./adminService";

export type QuestionType = "text" | "rating" | "multi";

export interface SurveyQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  eventId?: string;
  questions: SurveyQuestion[];
  status: "draft" | "active" | "closed";
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  memberId: string;
  answers: Record<string, string | number | string[]>;
  submittedAt: string;
}

const KEYS = {
  SURVEYS: "serenades_surveys",
  RESPONSES: "serenades_survey_responses",
};

export async function getSurveys(): Promise<Survey[]> {
  return dbGetAll<Survey>(KEYS.SURVEYS);
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  return dbGetById<Survey>(KEYS.SURVEYS, id);
}

export async function getActiveSurveysForMembers(): Promise<Survey[]> {
  const surveys = await getSurveys();
  return surveys.filter(s => s.status === "active");
}

export async function hasRespondedToSurvey(surveyId: string, memberId: string): Promise<boolean> {
  const responses = await dbGetAll<SurveyResponse>(KEYS.RESPONSES);
  return responses.some(r => r.surveyId === surveyId && r.memberId === memberId);
}

export async function getMemberSurveyResponse(surveyId: string, memberId: string): Promise<SurveyResponse | null> {
  const responses = await dbGetAll<SurveyResponse>(KEYS.RESPONSES);
  const found = responses.find(r => r.surveyId === surveyId && r.memberId === memberId);
  return found || null;
}

export async function createSurvey(input: Omit<Survey, "id" | "createdAt">, actor?: AdminUser): Promise<Survey> {
  const survey = await dbInsert<Survey>(KEYS.SURVEYS, {
    ...input,
    id: `svy_${generateId()}`,
    createdAt: new Date().toISOString(),
  });
  if (actor) await addAuditLog(actor, "CREATE", `Created survey ${survey.title}`);
  return survey;
}

export async function updateSurvey(id: string, updates: Partial<Survey>, actor?: AdminUser): Promise<Survey | null> {
  const existing = await dbGetById<Survey>(KEYS.SURVEYS, id);
  if (!existing) return null;

  const updated = await dbUpdate<Survey>(KEYS.SURVEYS, id, updates);
  if (actor) await addAuditLog(actor, "UPDATE", `Updated survey ${id}`);
  return updated;
}

export async function deleteSurvey(id: string, actor?: AdminUser): Promise<void> {
  await dbDelete(KEYS.SURVEYS, id);
  if (actor) await addAuditLog(actor, "DELETE", `Deleted survey ${id}`);
}

export async function submitSurveyResponse(input: Omit<SurveyResponse, "id" | "submittedAt">): Promise<SurveyResponse> {
  return dbInsert<SurveyResponse>(KEYS.RESPONSES, {
    ...input,
    id: `resp_${generateId()}`,
    submittedAt: new Date().toISOString(),
  });
}

export async function getResponses(surveyId?: string): Promise<SurveyResponse[]> {
  if (!surveyId) return dbGetAll<SurveyResponse>(KEYS.RESPONSES);
  return dbQuery<SurveyResponse>(KEYS.RESPONSES, "survey_id", surveyId);
}

export async function getSurveyResults(surveyId: string): Promise<{
  survey: Survey;
  totalResponses: number;
  questionResults: Record<string, {
    prompt: string;
    type: QuestionType;
    options?: string[];
    counts: Record<string, number>;
    average?: number;
    textResponses?: string[];
  }>;
} | null> {
  const survey = await getSurveyById(surveyId);
  if (!survey) return null;

  const responses = await getResponses(surveyId);

  const questionResults: Record<string, {
    prompt: string;
    type: QuestionType;
    options?: string[];
    counts: Record<string, number>;
    average?: number;
    textResponses?: string[];
  }> = {};

  survey.questions.forEach(q => {
    questionResults[q.id] = {
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      counts: {},
    };
    if (q.type === "text") {
      questionResults[q.id].textResponses = [];
    }
  });

  responses.forEach(response => {
    for (const qId in response.answers) {
      const answer = response.answers[qId];
      const result = questionResults[qId];

      if (result) {
        if (result.type === "text") {
          result.textResponses?.push(answer as string);
        } else if (result.type === "rating") {
          const rating = answer as number;
          result.counts[rating.toString()] = (result.counts[rating.toString()] || 0) + 1;
        } else if (result.type === "multi") {
          const selectedOptions = Array.isArray(answer) ? answer : [answer];
          selectedOptions.forEach(opt => {
            result.counts[opt.toString()] = (result.counts[opt.toString()] || 0) + 1;
          });
        }
      }
    }
  });

  for (const qId in questionResults) {
    const result = questionResults[qId];
    if (result.type === "rating") {
      let total = 0;
      let count = 0;
      for (const ratingStr in result.counts) {
        const rating = parseInt(ratingStr);
        const numResponses = result.counts[ratingStr];
        total += rating * numResponses;
        count += numResponses;
      }
      result.average = count > 0 ? parseFloat((total / count).toFixed(1)) : undefined;
    }
  }

  return {
    survey,
    totalResponses: responses.length,
    questionResults,
  };
}
