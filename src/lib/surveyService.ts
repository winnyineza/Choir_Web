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

function generateId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getSurveysInternal(): Survey[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.SURVEYS);
  return raw ? JSON.parse(raw) : [];
}

function saveSurveys(list: Survey[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.SURVEYS, JSON.stringify(list));
}

function getResponsesInternal(): SurveyResponse[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.RESPONSES);
  return raw ? JSON.parse(raw) : [];
}

function saveResponses(list: SurveyResponse[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.RESPONSES, JSON.stringify(list));
}

export function getSurveys(): Survey[] {
  return getSurveysInternal();
}

export function getSurveyById(id: string): Survey | null {
  return getSurveysInternal().find(s => s.id === id) || null;
}

export function getActiveSurveysForMembers(): Survey[] {
  return getSurveysInternal().filter(s => s.status === "active");
}

export function hasRespondedToSurvey(surveyId: string, memberId: string): boolean {
  const responses = getResponsesInternal();
  return responses.some(r => r.surveyId === surveyId && r.memberId === memberId);
}

export function getMemberSurveyResponse(surveyId: string, memberId: string): SurveyResponse | null {
  const responses = getResponsesInternal();
  return responses.find(r => r.surveyId === surveyId && r.memberId === memberId) || null;
}

export function createSurvey(input: Omit<Survey, "id" | "createdAt">, actor?: AdminUser): Survey {
  const survey: Survey = { ...input, id: generateId("svy_"), createdAt: new Date().toISOString() };
  const list = getSurveysInternal();
  list.push(survey);
  saveSurveys(list);
  if (actor) addAuditLog(actor, "CREATE", `Created survey ${survey.title}`);
  return survey;
}

export function updateSurvey(id: string, updates: Partial<Survey>, actor?: AdminUser): Survey | null {
  const list = getSurveysInternal();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates };
  saveSurveys(list);
  if (actor) addAuditLog(actor, "UPDATE", `Updated survey ${id}`);
  return list[idx];
}

export function deleteSurvey(id: string, actor?: AdminUser): void {
  saveSurveys(getSurveysInternal().filter(s => s.id !== id));
  if (actor) addAuditLog(actor, "DELETE", `Deleted survey ${id}`);
}

export function submitSurveyResponse(input: Omit<SurveyResponse, "id" | "submittedAt">): SurveyResponse {
  const response: SurveyResponse = { ...input, id: generateId("resp_"), submittedAt: new Date().toISOString() };
  const list = getResponsesInternal();
  list.push(response);
  saveResponses(list);
  return response;
}

export function getResponses(surveyId?: string): SurveyResponse[] {
  const list = getResponsesInternal();
  if (!surveyId) return list;
  return list.filter(r => r.surveyId === surveyId);
}

export function getSurveyResults(surveyId: string) {
  const survey = getSurveyById(surveyId);
  if (!survey) return null;

  const responses = getResponses(surveyId);

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
