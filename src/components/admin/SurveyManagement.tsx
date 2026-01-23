import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Play,
  Pause,
  BarChart3,
  Star,
  MessageSquare,
  CheckSquare,
  Users,
  Calendar,
  Send,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  getSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getResponses,
  type Survey,
  type SurveyQuestion,
  type QuestionType,
} from "@/lib/surveyService";
import { getAllEvents } from "@/lib/dataService";
import { getAllMembers } from "@/lib/dataService";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function SurveyManagement() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventId: "",
    status: "draft" as Survey["status"],
    questions: [] as SurveyQuestion[],
  });
  
  // New question state
  const [newQuestion, setNewQuestion] = useState({
    prompt: "",
    type: "text" as QuestionType,
    options: [""],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSurveys(getSurveys());
    setEvents(getAllEvents().map(e => ({ id: e.id, title: e.title })));
    setMembers(getAllMembers().map(m => ({ id: m.id, name: m.name })));
  };

  const filteredSurveys = surveys.filter(survey => {
    if (filterStatus !== "all" && survey.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        survey.title.toLowerCase().includes(query) ||
        survey.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleCreateSurvey = () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Please enter a survey title.", variant: "destructive" });
      return;
    }
    if (form.questions.length === 0) {
      toast({ title: "Error", description: "Please add at least one question.", variant: "destructive" });
      return;
    }

    if (editingSurvey) {
      updateSurvey(editingSurvey.id, {
        title: form.title,
        description: form.description || undefined,
        eventId: form.eventId || undefined,
        status: form.status,
        questions: form.questions,
      }, currentUser || undefined);
      toast({ title: "Updated", description: "Survey updated successfully." });
    } else {
      createSurvey({
        title: form.title,
        description: form.description || undefined,
        eventId: form.eventId || undefined,
        status: form.status,
        questions: form.questions,
      }, currentUser || undefined);
      toast({ title: "Created", description: "Survey created successfully." });
    }

    resetForm();
    setShowCreateModal(false);
    setEditingSurvey(null);
    loadData();
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      eventId: "",
      status: "draft",
      questions: [],
    });
    setNewQuestion({ prompt: "", type: "text", options: [""] });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.prompt.trim()) {
      toast({ title: "Error", description: "Please enter a question.", variant: "destructive" });
      return;
    }

    const question: SurveyQuestion = {
      id: `q_${Date.now()}`,
      prompt: newQuestion.prompt,
      type: newQuestion.type,
      options: newQuestion.type === "multi" ? newQuestion.options.filter(o => o.trim()) : undefined,
    };

    if (newQuestion.type === "multi" && (!question.options || question.options.length < 2)) {
      toast({ title: "Error", description: "Multiple choice needs at least 2 options.", variant: "destructive" });
      return;
    }

    setForm({ ...form, questions: [...form.questions, question] });
    setNewQuestion({ prompt: "", type: "text", options: [""] });
  };

  const handleRemoveQuestion = (questionId: string) => {
    setForm({ ...form, questions: form.questions.filter(q => q.id !== questionId) });
  };

  const handleEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setForm({
      title: survey.title,
      description: survey.description || "",
      eventId: survey.eventId || "",
      status: survey.status,
      questions: survey.questions,
    });
    setShowCreateModal(true);
  };

  const handleDeleteSurvey = () => {
    if (!surveyToDelete) return;
    deleteSurvey(surveyToDelete.id, currentUser || undefined);
    toast({ title: "Deleted", description: "Survey deleted successfully." });
    setSurveyToDelete(null);
    setShowDeleteConfirm(false);
    loadData();
  };

  const handleToggleStatus = (survey: Survey) => {
    const newStatus = survey.status === "active" ? "closed" : "active";
    updateSurvey(survey.id, { status: newStatus }, currentUser || undefined);
    toast({ 
      title: newStatus === "active" ? "Activated" : "Closed", 
      description: `Survey is now ${newStatus}.` 
    });
    loadData();
  };

  const handleViewResults = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowResultsModal(true);
  };

  const handlePreview = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowPreviewModal(true);
  };

  const getSurveyLink = (surveyId: string) => {
    return `${window.location.origin}/member-portal?survey=${surveyId}`;
  };

  const copyLink = (surveyId: string) => {
    navigator.clipboard.writeText(getSurveyLink(surveyId));
    toast({ title: "Copied!", description: "Survey link copied to clipboard." });
  };

  // Get responses for results
  const getSurveyResults = (survey: Survey) => {
    const responses = getResponses(survey.id);
    return {
      totalResponses: responses.length,
      responsesByQuestion: survey.questions.map(q => {
        const questionResponses = responses.map(r => r.answers[q.id]).filter(Boolean);
        
        if (q.type === "rating") {
          const ratings = questionResponses.map(r => Number(r)).filter(n => !isNaN(n));
          const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          return {
            question: q,
            count: ratings.length,
            average: avg.toFixed(1),
            distribution: [1, 2, 3, 4, 5].map(n => ratings.filter(r => r === n).length),
          };
        }
        
        if (q.type === "multi" && q.options) {
          const counts: Record<string, number> = {};
          q.options.forEach(o => counts[o] = 0);
          questionResponses.forEach(r => {
            const selected = Array.isArray(r) ? r : [r];
            selected.forEach(s => {
              if (counts[s as string] !== undefined) counts[s as string]++;
            });
          });
          return {
            question: q,
            count: questionResponses.length,
            distribution: counts,
          };
        }
        
        return {
          question: q,
          count: questionResponses.length,
          responses: questionResponses.slice(0, 10),
        };
      }),
    };
  };

  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case "text": return MessageSquare;
      case "rating": return Star;
      case "multi": return CheckSquare;
      default: return MessageSquare;
    }
  };

  const stats = {
    total: surveys.length,
    active: surveys.filter(s => s.status === "active").length,
    draft: surveys.filter(s => s.status === "draft").length,
    closed: surveys.filter(s => s.status === "closed").length,
    totalResponses: surveys.reduce((sum, s) => sum + getResponses(s.id).length, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Total Surveys</p>
        </div>
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-500">{stats.active}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Active</p>
        </div>
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-yellow-500">{stats.draft}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Draft</p>
        </div>
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
              <Pause className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-xl font-bold text-gray-500">{stats.closed}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Closed</p>
        </div>
        <div className="card-glass rounded-xl p-3 hover:bg-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-blue-500">{stats.totalResponses}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Responses</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Button variant="gold" onClick={() => { resetForm(); setEditingSurvey(null); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search surveys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-48 bg-secondary border-primary/20"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28 bg-secondary border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="space-y-3">
        {filteredSurveys.length === 0 ? (
          <div className="card-glass rounded-xl p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No surveys found.</p>
            <Button variant="gold" className="mt-4" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Survey
            </Button>
          </div>
        ) : (
          filteredSurveys.map(survey => {
            const responseCount = getResponses(survey.id).length;
            const linkedEvent = events.find(e => e.id === survey.eventId);
            
            return (
              <div key={survey.id} className="card-glass rounded-xl p-4 hover:bg-secondary/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{survey.title}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        survey.status === "active" && "bg-green-500/20 text-green-500",
                        survey.status === "draft" && "bg-yellow-500/20 text-yellow-500",
                        survey.status === "closed" && "bg-gray-500/20 text-gray-500"
                      )}>
                        {survey.status}
                      </span>
                    </div>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground mb-2">{survey.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {survey.questions.length} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {responseCount} responses
                      </span>
                      {linkedEvent && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {linkedEvent.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(survey.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {survey.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(survey.id)}
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Link
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(survey)}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Results
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(survey)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSurvey(survey)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(survey)}>
                          {survey.status === "active" ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Close Survey
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => { setSurveyToDelete(survey); setShowDeleteConfirm(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Survey Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) { setEditingSurvey(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              {editingSurvey ? "Edit Survey" : "Create Survey"}
            </DialogTitle>
            <DialogDescription>
              {editingSurvey ? "Update survey details and questions." : "Create a new survey for choir members."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Survey Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                  placeholder="e.g., Post-Concert Feedback"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 bg-secondary border-primary/20"
                  placeholder="Brief description of the survey..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Link to Event (Optional)</Label>
                  <Select value={form.eventId || "none"} onValueChange={(v) => setForm({ ...form, eventId: v === "none" ? "" : v })}>
                    <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                      <SelectValue placeholder="Select event..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Survey["status"] })}>
                    <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div>
              <Label className="text-base font-semibold">Questions ({form.questions.length})</Label>
              
              {/* Existing Questions */}
              {form.questions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.questions.map((q, index) => {
                    const Icon = getQuestionIcon(q.type);
                    return (
                      <div key={q.id} className="p-3 rounded-lg bg-secondary/50 border border-primary/10 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-muted-foreground font-medium mt-1">#{index + 1}</span>
                          <Icon className="w-4 h-4 text-primary mt-1" />
                          <div>
                            <p className="text-sm text-foreground">{q.prompt}</p>
                            <p className="text-xs text-muted-foreground capitalize">{q.type}</p>
                            {q.options && q.options.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Options: {q.options.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveQuestion(q.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Question */}
              <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-primary/20 bg-secondary/30">
                <p className="text-sm font-medium text-foreground mb-3">Add Question</p>
                <div className="space-y-3">
                  <div>
                    <Input
                      value={newQuestion.prompt}
                      onChange={(e) => setNewQuestion({ ...newQuestion, prompt: e.target.value })}
                      className="bg-secondary border-primary/20"
                      placeholder="Enter your question..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select 
                      value={newQuestion.type} 
                      onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v as QuestionType })}
                    >
                      <SelectTrigger className="w-40 bg-secondary border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Text Answer
                          </div>
                        </SelectItem>
                        <SelectItem value="rating">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Rating (1-5)
                          </div>
                        </SelectItem>
                        <SelectItem value="multi">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4" />
                            Multiple Choice
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={handleAddQuestion}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {/* Options for multi-choice */}
                  {newQuestion.type === "multi" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Options</Label>
                      {newQuestion.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...newQuestion.options];
                              opts[i] = e.target.value;
                              setNewQuestion({ ...newQuestion, options: opts });
                            }}
                            className="bg-secondary border-primary/20 text-sm"
                            placeholder={`Option ${i + 1}`}
                          />
                          {newQuestion.options.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => {
                                const opts = newQuestion.options.filter((_, idx) => idx !== i);
                                setNewQuestion({ ...newQuestion, options: opts });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ""] })}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); setEditingSurvey(null); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleCreateSurvey}>
                {editingSurvey ? "Update Survey" : "Create Survey"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-3xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Survey Results: {selectedSurvey?.title}
            </DialogTitle>
            <DialogDescription>
              View response statistics and feedback analysis.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSurvey && (() => {
            const results = getSurveyResults(selectedSurvey);
            
            return (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-primary">{results.totalResponses}</p>
                      <p className="text-sm text-muted-foreground">Total Responses</p>
                    </div>
                  </div>
                </div>

                {/* Question Results */}
                <div className="space-y-4">
                  {results.responsesByQuestion.map((result, index) => {
                    const Icon = getQuestionIcon(result.question.type);
                    
                    return (
                      <div key={result.question.id} className="card-glass rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-xs text-muted-foreground font-medium">Q{index + 1}</span>
                          <Icon className="w-4 h-4 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{result.question.prompt}</p>
                            <p className="text-xs text-muted-foreground">{result.count} responses</p>
                          </div>
                        </div>
                        
                        {/* Rating visualization */}
                        {result.question.type === "rating" && "average" in result && (
                          <div className="mt-3">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Star
                                    key={n}
                                    className={cn(
                                      "w-5 h-5",
                                      n <= Math.round(parseFloat(result.average as string))
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-500"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-lg font-bold text-primary">{result.average}</span>
                            </div>
                            <div className="space-y-1">
                              {(result.distribution as number[]).map((count, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="w-4">{i + 1}★</span>
                                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${results.totalResponses > 0 ? (count / results.totalResponses) * 100 : 0}%` }}
                                    />
                                  </div>
                                  <span className="w-6 text-right">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Multi-choice visualization */}
                        {result.question.type === "multi" && "distribution" in result && (
                          <div className="mt-3 space-y-2">
                            {Object.entries(result.distribution as Record<string, number>).map(([option, count]) => (
                              <div key={option} className="flex items-center gap-2 text-sm">
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-foreground">{option}</span>
                                    <span className="text-muted-foreground">{count}</span>
                                  </div>
                                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${results.totalResponses > 0 ? (count / results.totalResponses) * 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Text responses */}
                        {result.question.type === "text" && "responses" in result && (
                          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                            {(result.responses as string[]).length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">No responses yet</p>
                            ) : (
                              (result.responses as string[]).map((text, i) => (
                                <div key={i} className="p-2 rounded bg-secondary/50 text-sm text-foreground">
                                  "{text}"
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {results.totalResponses === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No responses yet.</p>
                    {selectedSurvey.status === "active" && (
                      <Button variant="outline" className="mt-4" onClick={() => copyLink(selectedSurvey.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Survey Link
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-lg bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Survey Preview
            </DialogTitle>
            <DialogDescription>
              Preview how the survey will appear to members.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSurvey && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedSurvey.title}</h3>
                {selectedSurvey.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedSurvey.description}</p>
                )}
              </div>
              
              <div className="space-y-4">
                {selectedSurvey.questions.map((q, index) => {
                  const Icon = getQuestionIcon(q.type);
                  
                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Q{index + 1}</span>
                        <Icon className="w-4 h-4 text-primary" />
                        <p className="font-medium text-foreground">{q.prompt}</p>
                      </div>
                      
                      {q.type === "text" && (
                        <Textarea
                          disabled
                          placeholder="Member's answer..."
                          className="mt-2 bg-secondary border-primary/20"
                          rows={2}
                        />
                      )}
                      
                      {q.type === "rating" && (
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              disabled
                              className="w-10 h-10 rounded-lg bg-secondary border border-primary/20 flex items-center justify-center"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {q.type === "multi" && q.options && (
                        <div className="space-y-2 mt-2">
                          {q.options.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 p-2 rounded bg-secondary">
                              <input type="checkbox" disabled className="rounded" />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <Button variant="gold" disabled className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Submit Survey
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteSurvey}
        title="Delete Survey?"
        description={`Are you sure you want to delete "${surveyToDelete?.title}"? This will also delete all responses. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
