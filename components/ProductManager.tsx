'use client';

import { useState, useRef } from 'react';
import { useProductManagement } from '@/lib/api-hooks';

interface ProductManagerProps {
  productId: string;
  productName: string;
  currentPrice: number;
  currentImageUrl?: string;
  onSuccess?: () => void;
}

export function ProductManager({
  productId,
  productName,
  currentPrice,
  currentImageUrl,
  onSuccess,
}: ProductManagerProps) {
  const { loading, error, uploadImage, updatePricing } = useProductManagement();
  const [pricePerKg, setPricePerKg] = useState(currentPrice);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Hanya format JPG, PNG, dan WebP yang diizinkan');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file tidak boleh lebih dari 5MB');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadSuccess(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadImage(productId, selectedFile);
      if (result.ok && result.data?.imageUrl) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setPreviewUrl(result.data.imageUrl);
        setTimeout(() => setUploadSuccess(false), 3000);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleUpdatePrice = async () => {
    try {
      const result = await updatePricing(productId, pricePerKg);
      if (result.ok) {
        setPriceSuccess(true);
        setTimeout(() => setPriceSuccess(false), 3000);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Price update error:', err);
    }
  };

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-800">{productName}</h2>

      {error && (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Image Upload Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">Upload Gambar Produk</h3>

        {previewUrl && (
          <div className="mb-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 max-w-48 rounded-lg object-cover"
            />
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
            title="Pilih file gambar produk"
            aria-label="File input gambar produk"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-center font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50"
          >
            {selectedFile ? selectedFile.name : 'Pilih Gambar'}
          </button>
          {selectedFile && (
            <button
              onClick={handleUploadImage}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Mengupload...' : 'Upload'}
            </button>
          )}
        </div>

        {uploadSuccess && (
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-sm text-green-700">✓ Gambar berhasil diupload</p>
          </div>
        )}

        <p className="text-xs text-gray-500">Format: JPG, PNG, WebP | Maksimal 5MB</p>
      </div>

      {/* Pricing Section */}
      <div className="space-y-3 border-t pt-6">
        <h3 className="font-semibold text-gray-700">Atur Harga per Kg</h3>

        <div className="space-y-2">
          <label className="block text-sm text-gray-600">Harga per Kg (Rp)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Contoh: 15000"
              min="0"
            />
            <button
              onClick={handleUpdatePrice}
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        {priceSuccess && (
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-sm text-green-700">✓ Harga berhasil diperbarui</p>
          </div>
        )}

        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Harga saat ini:</span> Rp {currentPrice.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}
