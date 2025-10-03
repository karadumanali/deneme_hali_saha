import React, { useState } from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';

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
  { id: 'saha-1', name: 'Halı Saha 1', price: '200₺/saat', capacity: '10 vs 10' },
  { id: 'saha-2', name: 'Halı Saha 2', price: '180₺/saat', capacity: '8 vs 8' },
  { id: 'saha-3', name: 'Halı Saha 3', price: '220₺/saat', capacity: '11 vs 11' },
];

function DateSelectionStep({ reservationData, updateReservationData, onNext }: DateSelectionStepProps) {
  const [selectedDate, setSelectedDate] = useState(reservationData.date);
  const [selectedField, setSelectedField] = useState(reservationData.field);

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
    if (selectedDate && selectedField) {
      onNext();
    }
  };

  // Bugünden itibaren 30 gün sonrasına kadar tarih seçimi
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
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
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

      {/* İleri Butonu */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleNext}
          disabled={!selectedDate || !selectedField}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedDate && selectedField
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