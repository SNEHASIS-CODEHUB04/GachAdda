"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Plus, X } from "lucide-react";

export function NewRequestForm() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    plantName: "", description: "", quantity: "1",
    budgetMin: "", budgetMax: "", location: "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.plantName.trim()) { showError("Plant name is required"); return; }
    if (!form.description.trim() || form.description.length < 10) { showError("Description must be at least 10 characters"); return; }
    setSubmitting(true);
    const res = await fetch("/api/buyer-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plantName: form.plantName.trim(),
        description: form.description.trim(),
        quantity: parseInt(form.quantity) || 1,
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
        location: form.location.trim() || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { showError(data.error ?? "Failed to submit"); return; }
    success("Request sent to Suman! 🌿 He will respond with an offer.");
    setOpen(false);
    setForm({ plantName: "", description: "", quantity: "1", budgetMin: "", budgetMax: "", location: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-5 text-[var(--color-sage)] hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="h-4 w-4" /> Request a Plant from Suman
      </button>
    );
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary-dark">New Plant Request 🌱</h3>
        <button onClick={() => setOpen(false)} className="text-[var(--color-sage)] hover:text-primary-dark"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-primary-dark mb-1">Plant Name *</label>
          <input value={form.plantName} onChange={(e) => set("plantName", e.target.value)}
            placeholder="e.g. Tulsi, Money Plant, Rose..."
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-primary-dark mb-1">Description * <span className="text-[var(--color-sage)] font-normal">(min 10 chars)</span></label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Describe what you need — variety, size, purpose..."
            rows={3}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark mb-1">Quantity</label>
          <input value={form.quantity} onChange={(e) => set("quantity", e.target.value)}
            type="number" min="1"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark mb-1">Your Location</label>
          <input value={form.location} onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Kolkata, Murshidabad"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark mb-1">Budget Min (₹)</label>
          <input value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)}
            type="number" min="0" placeholder="0"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark mb-1">Budget Max (₹)</label>
          <input value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)}
            type="number" min="0" placeholder="500"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={submit} loading={submitting}>Send Request to Suman 🌿</Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
