import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, SectionHeader, Button, StatusBadge } from "@/components/shared/UIComponents";
import { appealService, type Appeal } from "@/features/appeals/api/appealService";
import { eventService } from "@/features/events/api/eventService";
import { categoryService } from "@/features/categories/api/categoryService";
import { Loader, MessageSquare, PlusCircle, Info } from "lucide-react";

export function MemberAppealsView({ activeTeamContext }: { activeTeamContext: any }) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState({ title: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const teamId = activeTeamContext?.teamId;
  const eventId = activeTeamContext?.eventId;
  const categoryId = activeTeamContext?.categoryId;
  
  const [contextNames, setContextNames] = useState({ eventName: "", categoryName: "" });

  useEffect(() => {
    let active = true;
    if (eventId) {
      eventService.getById(eventId, true).then(ev => {
        if (active && ev) setContextNames(prev => ({ ...prev, eventName: ev.eventName }));
      }).catch(console.error);
    }
    if (categoryId) {
      categoryService.getById(categoryId).then(cat => {
        if (active && cat) setContextNames(prev => ({ ...prev, categoryName: cat.categoryName }));
      }).catch(console.error);
    }
    return () => { active = false; };
  }, [eventId, categoryId]);

  const loadAppeals = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const data = await appealService.getAppealsByTeam(teamId);
      setAppeals(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load appeals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, [teamId]);

  const handleSubmit = async () => {
    if (!teamId || !eventId || !categoryId) {
      toast.error("Active team, event or category context missing.");
      return;
    }
    if (!form.title.trim() || !form.reason.trim()) {
      toast.error("Please fill all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await appealService.createAppeal({
        teamId,
        eventId,
        categoryId,
        title: form.title,
        reason: form.reason
      });
      toast.success("Appeal submitted successfully.");
      setIsFormOpen(false);
      setForm({ title: "", reason: "" });
      loadAppeals();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to submit appeal");
    } finally {
      setSubmitting(false);
    }
  };

  if (!teamId) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">You need to have an active team to submit appeals.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="My Appeals" 
        subtitle="Submit and track your complaints regarding scores or other issues."
        action={
          <Button 
            variant="primary" 
            size="sm" 
            icon={<PlusCircle size={16} />}
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? "Cancel" : "New Appeal"}
          </Button>
        }
      />

      {isFormOpen && (
        <Card className="p-5 border border-primary/20 bg-primary/5">
          <h3 className="font-bold mb-4 text-primary flex items-center gap-2">
            <MessageSquare size={18} /> Create New Appeal
          </h3>
          
          <div className="mb-5 p-4 bg-white/60 rounded border border-primary/10 text-sm">
            <h4 className="font-semibold text-gray-700 flex items-center gap-1 mb-2">
              <Info size={14} /> Appeal Context
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div><span className="text-gray-500">Team:</span> <span className="font-medium text-gray-900">{activeTeamContext?.teamName}</span></div>
              <div><span className="text-gray-500">Event:</span> <span className="font-medium text-gray-900">{contextNames.eventName || "Loading..."}</span></div>
              <div><span className="text-gray-500">Category:</span> <span className="font-medium text-gray-900">{contextNames.categoryName || "Loading..."}</span></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Your appeal will be filed under this team and category.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input 
                className="w-full p-2 border rounded" 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Brief summary of your complaint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason / Description</label>
              <textarea 
                className="w-full p-2 border rounded min-h-[100px]" 
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
                placeholder="Provide detailed explanation and any evidence..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit} 
                disabled={submitting}
                icon={submitting && <Loader className="animate-spin" size={16} />}
              >
                Submit
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>
      ) : appeals.length === 0 ? (
        <Card className="p-10 flex flex-col items-center justify-center text-gray-500">
          <MessageSquare size={40} className="mb-3 opacity-20" />
          <p>You haven't submitted any appeals.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appeals.map(appeal => (
            <Card key={appeal.appealId} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg">{appeal.title}</h4>
                <StatusBadge 
                  status={appeal.status.toLowerCase()} 
                />
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{appeal.reason}</p>
              
              {appeal.status !== 'PENDING' && appeal.resolutionNote && (
                <div className="mt-4 p-4 rounded bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Resolution Note by Organizer:
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{appeal.resolutionNote}</p>
                </div>
              )}
              <div className="mt-4 text-xs text-gray-400">
                Submitted at: {new Date(appeal.createdAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
