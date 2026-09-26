"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ImagePlus, X } from "lucide-react";

const schema = z.object({
  name:        z.string().min(2).max(150),
  categoryId:  z.string().min(1, "Category required"),
  description: z.string().min(10),
  price:       z.coerce.number().positive(),
  discountPct: z.coerce.number().min(0).max(90).default(0),
  stock:       z.coerce.number().int().min(0),
  isActive:    z.boolean().default(true),
  age:         z.string().optional(),
  height:      z.string().optional(),
  sunlight:    z.string().optional(),
  watering:    z.string().optional(),
  soil:        z.string().optional(),
  careTips:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    discountPct: number;
    stock: number;
    categoryId: string;
    isActive: boolean;
    images: string[];
    age?: string | null;
    height?: string | null;
    sunlight?: string | null;
    watering?: string | null;
    soil?: string | null;
    careTips?: string | null;
  };
  categories: { id: string; name: string; emoji: string | null }[];
}

export function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(product.images ?? []);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const catOptions = categories.map((c) => ({ value: c.id, label: `${c.emoji ?? ""} ${c.name}` }));

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      price: product.price,
      discountPct: product.discountPct,
      stock: product.stock,
      isActive: product.isActive,
      age: product.age ?? "",
      height: product.height ?? "",
      sunlight: product.sunlight ?? "",
      watering: product.watering ?? "",
      soil: product.soil ?? "",
      careTips: product.careTips ?? "",
    },
  });

  const price = watch("price") ?? 0;
  const discountPct = watch("discountPct") ?? 0;
  const finalPrice = Number(price) * (1 - Number(discountPct) / 100);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size < 5 * 1024 * 1024);
    const imgs = valid.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages((prev) => [...prev, ...imgs].slice(0, 5 - existingImages.length));
    e.target.value = "";
  }

  async function onSubmit(data: FormData) {
    setUploading(true);
    let uploadedUrls: string[] = [];
    for (const img of newImages) {
      const fd = new FormData();
      fd.append("file", img.file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) { const d = await res.json(); uploadedUrls.push(d.url); }
    }
    setUploading(false);
    const allImages = [...existingImages, ...uploadedUrls];
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, images: allImages }),
    });
    const json = await res.json();
    if (!res.ok) { showError(json.error ?? "Failed to update"); return; }
    success("Product updated! 🌿");
    router.push("/seller/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this product? Buyers will no longer see it.")) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) { success("Product deleted"); router.push("/seller/products"); router.refresh(); }
    else { showError("Failed to delete"); setDeleting(false); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Product Photos</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {existingImages.map((url, i) => (
              <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setExistingImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                  <X className="h-3 w-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">Main</span>}
              </div>
            ))}
            {newImages.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-primary/30 bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt="New" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setNewImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] bg-success text-white px-1.5 py-0.5 rounded font-medium">New</span>
              </div>
            ))}
            {existingImages.length + newImages.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-primary/50 flex flex-col items-center justify-center gap-1 bg-cream/40 hover:bg-cream transition text-[var(--color-sage)] hover:text-primary">
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Add</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          <p className="text-xs text-[var(--color-sage)]">Click × to remove a photo. First photo is the main image.</p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Input label="Product Name" error={errors.name?.message} required {...register("name")} />
          <Select label="Category" options={catOptions} placeholder="Select a category" error={errors.categoryId?.message} required {...register("categoryId")} />
          <Textarea label="Description" error={errors.description?.message} required className="min-h-[120px]" {...register("description")} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Price (₹)" type="number" min={0} error={errors.price?.message} required {...register("price")} />
            <Input label="Discount %" type="number" min={0} max={90} {...register("discountPct")} />
            <div>
              <p className="text-sm font-medium text-primary-dark mb-1.5">Final Price</p>
              <p className="text-lg font-bold text-primary">₹{isFinite(finalPrice) ? Math.round(finalPrice) : "—"}</p>
            </div>
          </div>
          <Input label="Stock Quantity" type="number" min={0} error={errors.stock?.message} required {...register("stock")} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register("isActive")} className="h-4 w-4 accent-primary" />
            <label htmlFor="isActive" className="text-sm font-medium text-primary-dark cursor-pointer">Active (visible to buyers)</label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Care Information</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Age / Maturity" placeholder="2 years" {...register("age")} />
            <Input label="Height" placeholder="30–50 cm" {...register("height")} />
            <Input label="Sunlight" placeholder="Bright indirect" {...register("sunlight")} />
            <Input label="Watering" placeholder="Twice a week" {...register("watering")} />
          </div>
          <Input label="Soil Type" placeholder="Well-draining mix" {...register("soil")} />
          <Textarea label="Care Tips" {...register("careTips")} />
        </CardBody>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={isSubmitting || uploading}>
          {uploading ? "Uploading…" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
        <Button type="button" variant="ghost" size="lg" className="ml-auto text-error hover:bg-error/10" loading={deleting} onClick={handleDelete}>
          Delete Product
        </Button>
      </div>
    </form>
  );
}
