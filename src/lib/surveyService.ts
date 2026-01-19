import { addAuditLog, type AdminUser } from "./adminService";

export type QuestionType = "text" | "rating" | "multi";

export interface SurveyQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[]; // for multi
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
  answers: Record<string, string | number | string[]>; // keyed by question id
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

export function getSurveys() {
  return getSurveysInternal();
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

export function deleteSurvey(id: string, actor?: AdminUser) {
  saveSurveys(getSurveysInternal().filter(s => s.id !== id));
  if (actor) addAuditLog(actor, "DELETE", `Deleted survey ${id}`);
}

export function submitSurveyResponse(input: Omit<SurveyResponse, "id" | "submittedAt">) {
  const response: SurveyResponse = { ...input, id: generateId("resp_"), submittedAt: new Date().toISOString() };
  const list = getResponsesInternal();
  list.push(response);
  saveResponses(list);
  return response;
}

export function getResponses(surveyId?: string) {
  const list = getResponsesInternal();
  if (!surveyId) return list;
  return list.filter(r => r.surveyId === surveyId);
}

