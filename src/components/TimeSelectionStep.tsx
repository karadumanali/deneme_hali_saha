import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
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

// Saat dilimleri listesi
const timeSlots = [
  { id: '16-17', label: '16:00 - 17:00' },
  { id: '17-18', label: '17:00 - 18:00' },
  { id: '18-19', label: '18:00 - 19:00' },
  { id: '19-20', label: '19:00 - 20:00' },
  { id: '20-21', label: '20:00 - 21:00' },
  { id: '21-22', label: '21:00 - 22:00' },
];

// Doluluk durumunu tutmak için daha karmaşık bir state yapısı
interface SlotStatus {
  isApproved: boolean; // Onaylanmış rezervasyon var mı? (Dolu)
  hasPending: boolean; // Bekleyen randevu var mı? (Uyarı)
}

function TimeSelectionStep({ reservationData, updateReservationData, onNext, onPrev }: TimeSelectionStepProps) {
  const [selectedTime, setSelectedTime] = useState(reservationData.timeSlot);
  // slotStatuses her slot için isApproved ve hasPending bilgilerini tutar
  const [slotStatuses, setSlotStatuses] = useState<{[key: string]: SlotStatus}>({});
  const [loading, setLoading] = useState(true);

  // Müsaitlik durumunu kontrol et
  React.useEffect(() => {
    // Tarih ve saha seçilmişse kontrolü başlat
    if (reservationData.date && reservationData.field) {
      checkTimeSlotAvailability();
    }
  }, [reservationData.date, reservationData.field]);

  const checkTimeSlotAvailability = async () => {
    setLoading(true);
    const newStatuses: {[key: string]: SlotStatus} = {};
    
    for (const slot of timeSlots) {
      try {
        // reservationService.js'teki checkAvailability artık approvedCount ve pendingCount döner
        const result = await checkAvailability(
          reservationData.date,
          reservationData.field,
          slot.id 
        );
        
        newStatuses[slot.id] = {
          isApproved: result.approvedCount > 0, // Onaylanmış varsa DOLU
          hasPending: result.pendingCount > 0  // Bekleyen varsa UYARI
        };
      } catch (error) {
        console.error('Müsaitlik kontrol hatası:', error);
        newStatuses[slot.id] = { isApproved: false, hasPending: false }; // Hata durumunda varsayılan olarak müsait kabul et
      }
    }
    
    setSlotStatuses(newStatuses);
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
  
  // Helper fonksiyonu: Butonun durumuna göre metin ve stil döndürür
  const getSlotDisplay = (status: SlotStatus) => {
      if (status.isApproved) {
          // Onaylanmış rezervasyon varsa: Kesin Dolu
          return {
              text: 'DOLU (Onaylanmış)',
              badgeClass: 'bg-red-100 text-red-600',
              buttonClass: 'border-red-500 bg-red-50 text-red-400 cursor-not-allowed',
              isDisabled: true, // İlerleme engellenir
              showWarning: false
          };
      }
      if (status.hasPending) {
          // Bekleyen randevu varsa: Randevu oluşturulabilir ama kullanıcı uyarılır
          return {
              text: 'BEKLEYEN RANDEVU VAR',
              badgeClass: 'bg-yellow-100 text-yellow-600',
              buttonClass: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:border-yellow-400',
              isDisabled: false, // İlerlemeye izin verilir
              showWarning: true
          };
      }
      // Hiç rezervasyon yoksa: Tamamen Müsait
      return {
          text: 'Müsait',
          badgeClass: 'bg-emerald-100 text-emerald-600',
          buttonClass: 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50',
          isDisabled: false,
          showWarning: false
      };
  };

  const currentSlotStatus = slotStatuses[selectedTime] || { isApproved: false, hasPending: false };
  const { isDisabled: isSelectedSlotDisabled } = getSlotDisplay(currentSlotStatus);


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Saat Dilimi Seçimi</h2>
        <p className="text-gray-600">Oynamak istediğiniz saat dilimini seçin</p>
      </div>

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

        {/* Uyarı Kutusu: Bekleyen Randevu varsa göster */}
        {selectedTime && currentSlotStatus.hasPending && !currentSlotStatus.isApproved && (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg flex items-center gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium text-sm">
                    Bu saatte bekleyen bir randevu talebi var. Onaylanırsa, sizin randevunuz otomatik reddedilecektir. Başka bir saat seçmeniz önerilir.
                </p>
            </div>
        )}

        <div className="grid gap-3">
          {timeSlots.map((slot) => {
            const slotData = slotStatuses[slot.id] || { isApproved: false, hasPending: false };
            const { text, badgeClass, buttonClass, isDisabled } = getSlotDisplay(slotData);

            return (
              loading ? (
                // Yükleniyor durumu
                <div key={slot.id} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-400">{slot.label}</span>
                    <span className="text-sm px-2 py-1 rounded bg-gray-200 text-gray-500">Kontrol ediliyor...</span>
                  </div>
                </div>
              ) : (
                // Normal Buton
                <button
                  key={slot.id}
                  onClick={() => !isDisabled && handleTimeSelect(slot.id)}
                  disabled={isDisabled}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    isDisabled 
                      ? buttonClass 
                      : selectedTime === slot.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                      : buttonClass
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{slot.label}</span>
                    <span className={`text-sm px-2 py-1 rounded ${badgeClass}`}>
                      {text}
                    </span>
                  </div>
                </button>
              )
            );
          })}
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
          // Seçilen zaman varsa ve onaylanmamışsa (dolu değilse) ilerlemeye izin ver
          disabled={!selectedTime || isSelectedSlotDisabled} 
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedTime && !isSelectedSlotDisabled
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
