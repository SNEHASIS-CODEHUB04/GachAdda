"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Upload, X, ImagePlus } from "lucide-react";

const schema = z.object({
  name:        z.string().min(2, "Name required").max(150),
  categoryId:  z.string().min(1, "Category required"),
  description: z.string().min(10, "Description too short"),
  price:       z.coerce.number().positive("Enter a valid price"),
  discountPct: z.coerce.number().min(0).max(90).default(0),
  stock:       z.coerce.number().int().min(1, "Stock must be at least 1"),
  age:         z.string().optional(),
  height:      z.string().optional(),
  sunlight:    z.string().optional(),
  watering:    z.string().optional(),
  soil:        z.string().optional(),
  careTips:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AddProductPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) =>
        setCategories(
          d.categories?.map((c: { id: string; name: string; emoji: string }) => ({
            value: c.id,
            label: `${c.emoji ?? ""} ${c.name}`,
          })) ?? []
        )
      );
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { discountPct: 0, stock: 1 },
  });

  const price = watch("price") ?? 0;
  const discountPct = watch("discountPct") ?? 0;
  const finalPrice = price * (1 - discountPct / 100);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size < 5 * 1024 * 1024);
    if (valid.length < files.length) showError("Some files skipped (must be images under 5MB)");
    const newImages = valid.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5)); // max 5 images
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    for (const img of images) {
      const fd = new FormData();
      fd.append("file", img.file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        urls.push(data.url);
      }
    }
    setUploading(false);
    return urls;
  }

  async function onSubmit(data: FormData) {
    if (images.length === 0) {
      showError("Please add at least one product photo");
      return;
    }
    const imageUrls = await uploadImages();
    if (imageUrls.length === 0) {
      showError("Image upload failed. Please try again.");
      return;
    }
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, images: imageUrls }),
    });
    const json = await res.json();
    if (!res.ok) { showError(json.error ?? "Failed to create product"); return; }
    success("Product listed successfully! 🌿");
    router.push("/seller/products");
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-primary-dark">Add New Product</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

        {/* IMAGE UPLOAD */}
        <Card>
          <CardHeader><CardTitle>Product Photos *</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {/* Preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">Main</span>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-primary/50 flex flex-col items-center justify-center gap-1 bg-cream/40 hover:bg-cream transition text-[var(--color-sage)] hover:text-primary"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                )}
              </div>
            )}

            {/* Drop zone (shown when no images) */}
            {images.length === 0 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--border)] hover:border-primary/60 rounded-xl py-10 flex flex-col items-center gap-3 bg-cream/30 hover:bg-cream/60 transition text-[var(--color-sage)] hover:text-primary"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Click to upload photos</p>
                  <p className="text-xs mt-0.5">JPG, PNG, WebP — max 5MB each · up to 5 photos</p>
                </div>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-[var(--color-sage)]">First photo is the main image shown in marketplace. Add up to 5 photos.</p>
          </CardBody>
        </Card>

        {/* BASIC INFO */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Product Name" placeholder="Monstera Deliciosa" error={errors.name?.message} required {...register("name")} />
            <Select
              label="Category"
              options={categories}
              placeholder="Select a category"
              error={errors.categoryId?.message}
              required
              {...register("categoryId")}
            />
            <Textarea
              label="Description"
              placeholder="Describe this plant — its story, care needs, what makes it special…"
              error={errors.description?.message}
              required
              className="min-h-[120px]"
              {...register("description")}
            />
          </CardBody>
        </Card>

        {/* PRICING */}
        <Card>
          <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Price (₹)" type="number" placeholder="299" min={0} error={errors.price?.message} required {...register("price")} />
              <Input label="Discount %" type="number" placeholder="0" min={0} max={90} error={errors.discountPct?.message} {...register("discountPct")} />
              <div>
                <p className="text-sm font-medium text-primary-dark mb-1.5">Final Price</p>
                <p className="text-2xl font-bold text-primary">₹{isFinite(finalPrice) && finalPrice > 0 ? finalPrice.toFixed(0) : "—"}</p>
              </div>
            </div>
            <Input label="Stock Quantity" type="number" placeholder="10" min={1} error={errors.stock?.message} required {...register("stock")} />
          </CardBody>
        </Card>

        {/* CARE INFO */}
        <Card>
          <CardHeader><CardTitle>Care Information <span className="text-sm font-normal text-[var(--color-sage)]">(optional)</span></CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Age / Maturity" placeholder="2 years" {...register("age")} />
              <Input label="Height" placeholder="30–50 cm" {...register("height")} />
              <Input label="Sunlight" placeholder="Bright indirect" {...register("sunlight")} />
              <Input label="Watering" placeholder="Twice a week" {...register("watering")} />
            </div>
            <Input label="Soil Type" placeholder="Well-draining potting mix" {...register("soil")} />
            <Textarea label="Care Tips" placeholder="Additional care notes…" {...register("careTips")} />
          </CardBody>
        </Card>

        <div className="flex gap-3 pb-10">
          <Button type="submit" size="lg" loading={isSubmitting || uploading}>
            {uploading ? "Uploading photos…" : "Publish Product 🌿"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
