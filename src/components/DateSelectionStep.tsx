import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Lock, AlertCircle } from 'lucide-react';
import { checkIfBlocked } from '../services/blockService';

interface ReservationData {
  date: string;
  field: string;
  timeSlot: string;
  paymentProof?: File;
}

interface DateSelectionStepProps {
  reservationData: ReservationData;
  updateReservationData: (data: Partial<ReservationData>) => void;
  onNext: () => void;
}

const fields = [
  { id: 'Etlik Halı Saha', name: 'Etlik Kampüsü Halı Saha', price: '100₺/saat', capacity: '7 vs 7' },
  { id: 'Esenboğa Halı Saha', name: 'Esenboğa Kampüsü Halı Saha', price: '100₺/saat', capacity: '7 vs 7' },
  { id: 'saha-3', name: 'Halı Saha 3', price: '500₺/saat', capacity: '10 vs 10' },
];

function DateSelectionStep({ reservationData, updateReservationData, onNext }: DateSelectionStepProps) {
  const [selectedDate, setSelectedDate] = useState(reservationData.date);
  const [selectedField, setSelectedField] = useState(reservationData.field);
  const [blockWarning, setBlockWarning] = useState<string | null>(null);
  const [isDateBlocked, setIsDateBlocked] = useState(false);

  // Tarih veya saha değiştiğinde kilitleme kontrolü yap
  useEffect(() => {
    if (selectedDate && selectedField) {
      checkDateBlock();
    } else {
      setBlockWarning(null);
      setIsDateBlocked(false);
    }
  }, [selectedDate, selectedField]);

  const checkDateBlock = async () => {
    if (!selectedDate || !selectedField) return;

    try {
      // 'all' time slot ile kontrol et (tüm gün kilitli mi?)
      const result = await checkIfBlocked(selectedDate, selectedField, 'all');
      
      if (result.isBlocked) {
        setBlockWarning(result.reason || 'Bu tarih için rezervasyon alınmamaktadır.');
        setIsDateBlocked(true);
      } else {
        setBlockWarning(null);
        setIsDateBlocked(false);
      }
    } catch (error) {
      console.error('Kilitleme kontrolü hatası:', error);
      setBlockWarning(null);
      setIsDateBlocked(false);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setSelectedDate(date);
    updateReservationData({ date });
  };

  const handleFieldSelect = (fieldId: string) => {
    setSelectedField(fieldId);
    updateReservationData({ field: fieldId });
  };

  const handleNext = () => {
    if (selectedDate && selectedField && !isDateBlocked) {
      onNext();
    }
  };

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tarih ve Saha Seçimi</h2>
        <p className="text-gray-600">Oynamak istediğiniz tarihi ve sahayı seçin</p>
      </div>

      {/* Kilitleme Uyarısı */}
      {blockWarning && (
        <div className="p-4 bg-gray-800 border border-gray-700 text-white rounded-lg flex items-start gap-3 animate-pulse">
          <Lock className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-lg mb-1">Bu Tarih Kilitlenmiştir</p>
            <p className="text-gray-200">{blockWarning}</p>
          </div>
        </div>
      )}

      {/* Tarih Seçimi */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-700">Tarih Seçimi</h3>
        </div>
        
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={formatDate(today)}
            max={formatDate(maxDate)}
            className={`w-full p-4 border rounded-lg focus:ring-2 focus:border-transparent text-lg ${
              isDateBlocked 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Saha Seçimi */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-700">Saha Seçimi</h3>
        </div>

        <div className="grid gap-4">
          {fields.map((field) => (
            <div
              key={field.id}
              onClick={() => handleFieldSelect(field.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedField === field.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800">{field.name}</h4>
                  <p className="text-sm text-gray-600">{field.capacity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{field.price}</p>
                  <p className="text-sm text-gray-500">saat başı</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bilgilendirme Mesajı */}
      {selectedDate && selectedField && !isDateBlocked && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Seçtiğiniz tarih ve saha için müsait saatleri görmek için ilerleyin. 
            Bazı saatler dolu veya kilitli olabilir.
          </p>
        </div>
      )}

      {/* İleri Butonu */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleNext}
          disabled={!selectedDate || !selectedField || isDateBlocked}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedDate && selectedField && !isDateBlocked
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          İlerle
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default DateSelectionStep;