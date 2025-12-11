import React, { useState } from 'react';
import { CreditCard, Upload, User, ChevronLeft, CheckCircle } from 'lucide-react';

interface ReservationData {
  date: string;
  field: string;
  timeSlot: string;
  paymentProof?: File;
  customerName: string;
}

interface FieldOwner {
  name: string;
  surname: string;
  iban: string;
}

export interface PaymentStepProps { 
  reservationData: ReservationData;
  updateReservationData: (data: Partial<ReservationData>) => void;
  fieldOwner: FieldOwner | null;
  setFieldOwner: React.Dispatch<React.SetStateAction<FieldOwner | null>>; 
  onPrev: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

const SHARED_FIELD_OWNER: FieldOwner = {
  name: 'Ankara Yıldırım Beyazıt Üniversitesi', 
  surname: 'SKS Birimi', 
  iban: 'TR33 0006 1005 1978 6457 8413 26' 
};

function PaymentStep({ 
  reservationData, 
  updateReservationData, 
  onPrev, 
  onSubmit, 
  isLoading, 
}: PaymentStepProps) {
  
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(reservationData.paymentProof || null);
  const [customerName, setCustomerName] = useState(reservationData.customerName || '');
  
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
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setUploadedFile(file);
        updateReservationData({ paymentProof: file });
      } else {
        alert('Lütfen PDF veya resim dosyası yükleyin.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setUploadedFile(file);
        updateReservationData({ paymentProof: file });
      } else {
        alert('Lütfen PDF veya resim dosyası yükleyin.');
      }
    }
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCustomerName(name);
    updateReservationData({ customerName: name });
  };

  const handleFinalSubmit = async () => {
    const trimmedCustomerName = customerName.trim();
    
    if (!uploadedFile) {
      alert("Lütfen dekontunuzu yükleyin!");
      return;
    }
    
    if (!trimmedCustomerName) {
      alert("Lütfen adınızı ve soyadınızı girin!");
      return;
    }
    
    updateReservationData({ 
      customerName: trimmedCustomerName,
      paymentProof: uploadedFile 
    });
    
    console.log('Form gönderiliyor:', {
      customerName: trimmedCustomerName,
      fileName: uploadedFile.name,
      date: reservationData.date,
      field: reservationData.field,
      timeSlot: reservationData.timeSlot
    });

    setTimeout(async () => {
      await onSubmit();
    }, 100);
  };

  const isFormValid = uploadedFile && customerName.trim();

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
            <div className="font-medium">{reservationData.timeSlot.split('-').join('.00-')}.00</div>
          </div>
        </div>
      </div>

      {/* SAHA SAHİBİ BİLGİLERİ */}
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
                  {SHARED_FIELD_OWNER.name} {SHARED_FIELD_OWNER.surname}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN Numarası
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border font-mono text-sm">
                  {SHARED_FIELD_OWNER.iban}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Önemli:</strong> Ödemeyi yukarıdaki IBAN'a yaptıktan sonra dekontunuzu PDF veya resim olarak yükleyin.
              </p>
            </div>
          </div>
      </div>

      {/* KİŞİ BİLGİLERİ */}
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
              onChange={handleCustomerNameChange}
              placeholder="Adınızı ve soyadınızı girin"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            {customerName.trim() && (
              <p className="text-xs text-green-600 mt-1">✓ İsim kaydedildi: {customerName}</p>
            )}
          </div>
        </div>
      </div>

      {/* DOSYA YÜKLEME */}
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
            accept=".pdf,image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="font-medium text-emerald-700">{uploadedFile.name}</p>
                <p className="text-sm text-emerald-600">Dosya başarıyla yüklendi</p>
                <p className="text-xs text-gray-500 mt-1">
                  Boyut: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">Dekont dosyanızı yükleyin</p>
                <p className="text-sm text-gray-500">
                  PDF veya resim dosyasını sürükleyin veya tıklayın
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigasyon Butonları - MOBİL DÜZELTMELİ */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
        <button
          onClick={onPrev}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </button>
        
        <button
          onClick={handleFinalSubmit} 
          disabled={!isFormValid || isLoading} 
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto ${
            isFormValid && !isLoading
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Gönderiliyor...' : 'Rezervasyonu Tamamla'}
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PaymentStep;