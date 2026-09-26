"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ImageUploader } from "@/components/product/image-uploader";

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
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { discountPct: 0, stock: 1 },
  });

  const price = watch("price") ?? 0;
  const discountPct = watch("discountPct") ?? 0;
  const finalPrice = price * (1 - discountPct / 100);

  async function uploadAll(): Promise<string[]> {
    const urls: string[] = [];
    for (const img of newFiles) {
      const fd = new FormData();
      fd.append("file", img.file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) { const d = await res.json(); urls.push(d.url); }
      else { showError("Failed to upload one image"); }
    }
    return urls;
  }

  async function onSubmit(data: FormData) {
    if (newFiles.length === 0) { showError("Please add at least one product photo"); return; }
    setUploading(true);
    const imageUrls = await uploadAll();
    setUploading(false);
    if (imageUrls.length === 0) { showError("Image upload failed — please retry"); return; }

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

        <Card>
          <CardHeader><CardTitle>Product Photos * <span className="text-sm font-normal text-[var(--color-sage)]">(up to 4)</span></CardTitle></CardHeader>
          <CardBody>
            <ImageUploader
              existingUrls={[]}
              newFiles={newFiles}
              onAddFiles={(files) => setNewFiles((p) => [...p, ...files].slice(0, 4))}
              onRemoveExisting={() => {}}
              onRemoveNew={(i) => setNewFiles((p) => { URL.revokeObjectURL(p[i].preview); return p.filter((_, j) => j !== i); })}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Product Name" placeholder="Monstera Deliciosa" error={errors.name?.message} required {...register("name")} />
            <Select label="Category" options={categories} placeholder="Select a category" error={errors.categoryId?.message} required {...register("categoryId")} />
            <Textarea label="Description" placeholder="Describe this plant — its story, care needs, what makes it special…" error={errors.description?.message} required className="min-h-[120px]" {...register("description")} />
          </CardBody>
        </Card>

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
