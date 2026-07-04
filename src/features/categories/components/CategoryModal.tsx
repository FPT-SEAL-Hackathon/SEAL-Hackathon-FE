import { useState } from "react";
import { X, Save, Loader } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { ApiError } from "@/lib/api/apiClient";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  eventId: string;
  category?: CategoryResponse | null;
  onClose: () => void;
  onSaved: (cat: CategoryResponse) => void;
}

export function CategoryModal({ eventId, category, onClose, onSaved }: Props) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    categoryName: category?.categoryName ?? "",
    description: category?.description ?? "",
    sortOrder: String(category?.sortOrder ?? 0),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.categoryName.trim()) { setError("Category name is required."); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        categoryName: form.categoryName,
        description: form.description || "",
        sortOrder: parseInt(form.sortOrder) || 0,
      };
      const result = isEdit
        ? await categoryService.update(category!.categoryId, payload)
        : await categoryService.create(eventId, payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full rounded-2xl overflow-hidden"
          style={{ maxWidth: 480, background: COLORS.bg, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>
              {isEdit ? "Edit Category" : "New Category"}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: COLORS.textSecondary }} /></button>
          </div>

          <div className="p-6 space-y-4">
            {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}30`, color: COLORS.error }}>{error}</div>}

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>CATEGORY NAME *</label>
              <input value={form.categoryName} onChange={e => setForm(p => ({ ...p, categoryName: e.target.value }))}
                placeholder="AI / Machine Learning"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>DESCRIPTION</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Describe the competition category..."
                className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>SORT ORDER</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
