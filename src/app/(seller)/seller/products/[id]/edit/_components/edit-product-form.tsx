"use client";

import { useState } from "react";
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
import { ImageUploader } from "@/components/product/image-uploader";

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
    id: string; name: string; description: string; price: number;
    discountPct: number; stock: number; categoryId: string; isActive: boolean;
    images: string[];
    age?: string | null; height?: string | null; sunlight?: string | null;
    watering?: string | null; soil?: string | null; careTips?: string | null;
  };
  categories: { id: string; name: string; emoji: string | null }[];
}

export function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingUrls, setExistingUrls] = useState<string[]>(product.images ?? []);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);

  const catOptions = categories.map((c) => ({ value: c.id, label: `${c.emoji ?? ""} ${c.name}` }));

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: product.name, categoryId: product.categoryId, description: product.description,
      price: product.price, discountPct: product.discountPct, stock: product.stock,
      isActive: product.isActive,
      age: product.age ?? "", height: product.height ?? "", sunlight: product.sunlight ?? "",
      watering: product.watering ?? "", soil: product.soil ?? "", careTips: product.careTips ?? "",
    },
  });

  const price = watch("price") ?? 0;
  const discountPct = watch("discountPct") ?? 0;
  const finalPrice = Number(price) * (1 - Number(discountPct) / 100);

  async function uploadNewFiles(): Promise<string[]> {
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
    setUploading(true);
    const uploadedUrls = await uploadNewFiles();
    setUploading(false);
    const allImages = [...existingUrls, ...uploadedUrls].slice(0, 4);

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

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Product Photos <span className="text-sm font-normal text-[var(--color-sage)]">(up to 4)</span></CardTitle>
        </CardHeader>
        <CardBody>
          <ImageUploader
            existingUrls={existingUrls}
            newFiles={newFiles}
            onAddFiles={(files) => setNewFiles((p) => [...p, ...files].slice(0, 4 - existingUrls.length))}
            onRemoveExisting={(i) => setExistingUrls((p) => p.filter((_, j) => j !== i))}
            onRemoveNew={(i) => setNewFiles((p) => { URL.revokeObjectURL(p[i].preview); return p.filter((_, j) => j !== i); })}
          />
        </CardBody>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Input label="Product Name" error={errors.name?.message} required {...register("name")} />
          <Select label="Category" options={catOptions} placeholder="Select a category" error={errors.categoryId?.message} required {...register("categoryId")} />
          <Textarea label="Description" error={errors.description?.message} required className="min-h-[120px]" {...register("description")} />
        </CardBody>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Price (₹)" type="number" min={0} error={errors.price?.message} required {...register("price")} />
            <Input label="Discount %" type="number" min={0} max={90} {...register("discountPct")} />
            <div>
              <p className="text-sm font-medium text-primary-dark mb-1.5">Final Price</p>
              <p className="text-2xl font-bold text-primary">₹{isFinite(finalPrice) ? Math.round(finalPrice) : "—"}</p>
            </div>
          </div>
          <Input label="Stock Quantity" type="number" min={0} error={errors.stock?.message} required {...register("stock")} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register("isActive")} className="h-4 w-4 accent-primary" />
            <label htmlFor="isActive" className="text-sm font-medium text-primary-dark cursor-pointer">Active (visible to buyers)</label>
          </div>
        </CardBody>
      </Card>

      {/* Care Info */}
      <Card>
        <CardHeader><CardTitle>Care Information <span className="text-sm font-normal text-[var(--color-sage)]">(optional)</span></CardTitle></CardHeader>
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

      <div className="flex gap-3 pb-10">
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
