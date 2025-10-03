import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { checkAvailability } from '../services/reservationService';

interface ReservationData {
  date: string;
  field: string;
  timeSlot: string;
  paymentProof?: File;
}

interface TimeSelectionStepProps {
  reservationData: ReservationData;
  updateReservationData: (data: Partial<ReservationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const timeSlots = [
  { id: '16-17', label: '16:00 - 17:00', available: true },
  { id: '17-18', label: '17:00 - 18:00', available: true },
  { id: '18-19', label: '18:00 - 19:00', available: false },
  { id: '19-20', label: '19:00 - 20:00', available: true },
  { id: '20-21', label: '20:00 - 21:00', available: true },
];

function TimeSelectionStep({ reservationData, updateReservationData, onNext, onPrev }: TimeSelectionStepProps) {
  const [selectedTime, setSelectedTime] = useState(reservationData.timeSlot);
  const [availableSlots, setAvailableSlots] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);

  // Müsaitlik durumunu kontrol et
  React.useEffect(() => {
    if (reservationData.date && reservationData.field) {
      checkTimeSlotAvailability();
    }
  }, [reservationData.date, reservationData.field]);

  const checkTimeSlotAvailability = async () => {
    setLoading(true);
    const availability: {[key: string]: boolean} = {};
    
    for (const slot of timeSlots) {
      try {
        const result = await checkAvailability(
          reservationData.date,
          reservationData.field,
          slot.label
        );
        availability[slot.id] = result.available;
      } catch (error) {
        console.error('Müsaitlik kontrol hatası:', error);
        availability[slot.id] = true; // Hata durumunda müsait kabul et
      }
    }
    
    setAvailableSlots(availability);
    setLoading(false);
  };

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
    updateReservationData({ timeSlot: timeId });
  };

  const handleNext = () => {
    if (selectedTime) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Saat Dilimi Seçimi</h2>
        <p className="text-gray-600">Oynamak istediğiniz saat dilimini seçin</p>
      </div>

      {/* Seçilen Bilgilerin Özeti */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h3 className="font-semibold text-gray-700 mb-2">Seçilen Bilgiler:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tarih:</span>
            <span className="ml-2 font-medium">{reservationData.date}</span>
          </div>
          <div>
            <span className="text-gray-500">Saha:</span>
            <span className="ml-2 font-medium">{reservationData.field}</span>
          </div>
        </div>
      </div>

      {/* Saat Dilimi Seçimi */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-700">Müsait Saat Dilimleri</h3>
        </div>

        <div className="grid gap-3">
          {timeSlots.map((slot) => 
            loading ? (
              <div key={slot.id} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-400">{slot.label}</span>
                  <span className="text-sm px-2 py-1 rounded bg-gray-200 text-gray-500">
                    Kontrol ediliyor...
                  </span>
                </div>
              </div>
            ) : (
              <button
                key={slot.id}
                onClick={() => availableSlots[slot.id] && handleTimeSelect(slot.id)}
                disabled={!availableSlots[slot.id]}
                className={`p-4 border-2 rounded-lg transition-all ${
                  !availableSlots[slot.id]
                    ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                    : selectedTime === slot.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{slot.label}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    !availableSlots[slot.id]
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {availableSlots[slot.id] ? 'Müsait' : 'Dolu'}
                  </span>
                </div>
              </button>
            )
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
          onClick={handleNext}
          disabled={!selectedTime}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedTime
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

export default TimeSelectionStep;