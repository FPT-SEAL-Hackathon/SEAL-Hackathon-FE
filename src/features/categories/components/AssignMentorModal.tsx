import { useState, useEffect } from "react";
import { X, Search, UserCheck, Loader } from "lucide-react";
import { Button, COLORS } from "@/components/shared/UIComponents";
import { categoryService } from "@/features/categories/api/categoryService";
import { userService } from "@/features/users/api/userService";
import { ROLES } from "@/auth/rbac/roles";

interface AssignMentorModalProps {
  categoryId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignMentorModal({ categoryId, onClose, onAssigned }: AssignMentorModalProps) {
  const [mentors, setMentors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    userService.getUsers({ role: ROLES.MENTOR })
      .then(res => setMentors(res.content || []))
      .catch(() => setError("Failed to load mentors"))
      .finally(() => setLoading(false));
  }, []);

  const filteredMentors = mentors.filter(m => 
    (m.email || "").toLowerCase().includes(search.toLowerCase()) || 
    (m.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleMentor = (id: string) => {
    setSelectedMentorIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedMentorIds.length === 0) {
      setError("Please select at least one mentor");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      await categoryService.assignMentors(categoryId, selectedMentorIds);
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign mentors");
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: COLORS.border }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>Assign Mentors to Category</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} color={COLORS.textSecondary} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search mentors by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderColor: COLORS.border }}
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center p-8"><Loader size={24} className="animate-spin text-primary" /></div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center p-8 text-sm text-gray-500">No mentors found</div>
            ) : (
              filteredMentors.map(mentor => (
                <div 
                  key={mentor.userId}
                  onClick={() => toggleMentor(mentor.userId)}
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-primary/30"
                  style={{ 
                    borderColor: selectedMentorIds.includes(mentor.userId) ? COLORS.primary : COLORS.border,
                    background: selectedMentorIds.includes(mentor.userId) ? `${COLORS.primary}05` : "transparent"
                  }}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedMentorIds.includes(mentor.userId) ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {selectedMentorIds.includes(mentor.userId) && <UserCheck size={14} color="white" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                      {mentor.fullName}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{mentor.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
          <Button variant="ghost" onClick={onClose} disabled={assigning}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleAssign} 
            disabled={assigning || selectedMentorIds.length === 0}
            icon={assigning ? <Loader size={16} className="animate-spin" /> : <UserCheck size={16} />}
          >
            Assign Selected ({selectedMentorIds.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
