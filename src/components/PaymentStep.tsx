import React, { useState } from 'react';
import { CreditCard, Upload, User, ChevronLeft, CheckCircle } from 'lucide-react';
import { createReservation } from '../services/reservationService';

interface ReservationData {
  date: string;
  field: string;
  timeSlot: string;
  paymentProof?: File;
}

interface FieldOwner {
  name: string;
  surname: string;
  iban: string;
}

interface PaymentStepProps {
  reservationData: ReservationData;
  updateReservationData: (data: Partial<ReservationData>) => void;
  fieldOwner: FieldOwner | null;
  setFieldOwner: (owner: FieldOwner) => void;
  onPrev: () => void;
  onSubmit: () => void;
}

// Mock field owners data
const fieldOwnersData: { [key: string]: FieldOwner } = {
  'saha-1': { name: 'Ahmet', surname: 'Yılmaz', iban: 'TR33 0006 1005 1978 6457 8413 26' },
  'saha-2': { name: 'Mehmet', surname: 'Demir', iban: 'TR33 0006 1005 1978 6457 8413 27' },
  'saha-3': { name: 'Ali', surname: 'Kaya', iban: 'TR33 0006 1005 1978 6457 8413 28' },
};

function PaymentStep({ reservationData, updateReservationData, fieldOwner, setFieldOwner, onPrev, onSubmit }: PaymentStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(reservationData.paymentProof || null);
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set field owner based on selected field
  React.useEffect(() => {
    if (reservationData.field && fieldOwnersData[reservationData.field]) {
      setFieldOwner(fieldOwnersData[reservationData.field]);
    }
  }, [reservationData.field, setFieldOwner]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        updateReservationData({ paymentProof: file });
      } else {
        alert('Lütfen sadece PDF dosyası yükleyin.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        updateReservationData({ paymentProof: file });
      } else {
        alert('Lütfen sadece PDF dosyası yükleyin.');
      }
    }
  };

  const handleSubmit = async () => {
    if (uploadedFile && customerName.trim()) {
      setIsSubmitting(true);
      
      try {
        const result = await createReservation(
          {
            ...reservationData,
            customerName: customerName.trim()
          },
          uploadedFile
        );
        
        if (result.success) {
          onSubmit();
        } else {
          alert('Rezervasyon oluşturulurken hata oluştu: ' + result.error);
        }
      } catch (error) {
        console.error('Rezervasyon hatası:', error);
        alert('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ödeme ve Dekont Yükleme</h2>
        <p className="text-gray-600">Ödeme bilgilerini inceleyin ve dekontunuzu yükleyin</p>
      </div>

      {/* Rezervasyon Özeti */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <h3 className="font-semibold text-gray-700 mb-4">Rezervasyon Özeti</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tarih:</span>
            <div className="font-medium">{reservationData.date}</div>
          </div>
          <div>
            <span className="text-gray-500">Saha:</span>
            <div className="font-medium">{reservationData.field}</div>
          </div>
          <div>
            <span className="text-gray-500">Saat:</span>
            <div className="font-medium">{reservationData.timeSlot}</div>
          </div>
        </div>
      </div>

      {/* Saha Sahibi Bilgileri */}
      {fieldOwner && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-700">Saha Sahibi Bilgileri</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {fieldOwner.name} {fieldOwner.surname}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN Numarası
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border font-mono text-sm">
                  {fieldOwner.iban}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Önemli:</strong> Ödemeyi yukarıdaki IBAN'a yaptıktan sonra dekontunuzu PDF olarak yükleyin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Bilgileri */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-700">Kişi Bilgileri</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Soyad *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Adınızı ve soyadınızı girin"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Dosya Yükleme */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-700">Dekont Yükleme</h3>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50'
              : uploadedFile
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="font-medium text-emerald-700">{uploadedFile.name}</p>
                <p className="text-sm text-emerald-600">Dosya başarıyla yüklendi</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">Dekont dosyanızı yükleyin</p>
                <p className="text-sm text-gray-500">
                  PDF dosyasını sürükleyin veya tıklayın
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigasyon Butonları */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!uploadedFile || !customerName.trim() || isSubmitting}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            uploadedFile && customerName.trim() && !isSubmitting
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Gönderiliyor...' : 'Rezervasyonu Tamamla'}
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PaymentStep;