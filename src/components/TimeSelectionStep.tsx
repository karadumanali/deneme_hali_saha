import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Lock } from 'lucide-react';
import { checkAvailability } from '../services/reservationService';
import { checkIfBlocked } from '../services/blockService';

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
  { id: '16-17', label: '16:00 - 17:00' },
  { id: '17-18', label: '17:00 - 18:00' },
  { id: '18-19', label: '18:00 - 19:00' },
  { id: '19-20', label: '19:00 - 20:00' },
  { id: '20-21', label: '20:00 - 21:00' },
  { id: '21-22', label: '21:00 - 22:00' },
];

interface SlotStatus {
  isApproved: boolean;
  hasPending: boolean;
  isBlocked: boolean;
  blockReason?: string;
}

function TimeSelectionStep({ reservationData, updateReservationData, onNext, onPrev }: TimeSelectionStepProps) {
  const [selectedTime, setSelectedTime] = useState(reservationData.timeSlot);
  const [slotStatuses, setSlotStatuses] = useState<{[key: string]: SlotStatus}>({});
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (reservationData.date && reservationData.field) {
      checkTimeSlotAvailability();
    }
  }, [reservationData.date, reservationData.field]);

  const checkTimeSlotAvailability = async () => {
    setLoading(true);
    const newStatuses: {[key: string]: SlotStatus} = {};
    
    for (const slot of timeSlots) {
      try {
        // 1. Kilitleme kontrolü
        const blockResult = await checkIfBlocked(
          reservationData.date,
          reservationData.field,
          slot.id
        );

        // 2. Rezervasyon kontrolü
        const availabilityResult = await checkAvailability(
          reservationData.date,
          reservationData.field,
          slot.id 
        );
        
        newStatuses[slot.id] = {
          isBlocked: blockResult.isBlocked,
          blockReason: blockResult.reason || undefined,
          isApproved: availabilityResult.approvedCount > 0,
          hasPending: availabilityResult.pendingCount > 0
        };
      } catch (error) {
        console.error('Kontrol hatası:', error);
        newStatuses[slot.id] = { 
          isBlocked: false, 
          isApproved: false, 
          hasPending: false 
        };
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
  
  const getSlotDisplay = (status: SlotStatus) => {
    // Önce kilitleme kontrolü (en yüksek öncelik)
    if (status.isBlocked) {
      return {
        text: 'KİTLİ',
        badgeClass: 'bg-gray-800 text-white',
        buttonClass: 'border-gray-500 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60',
        isDisabled: true,
        showWarning: false,
        icon: <Lock className="w-4 h-4" />
      };
    }
    
    // Onaylanmış rezervasyon varsa
    if (status.isApproved) {
      return {
        text: 'DOLU (Onaylanmış)',
        badgeClass: 'bg-red-100 text-red-600',
        buttonClass: 'border-red-500 bg-red-50 text-red-400 cursor-not-allowed',
        isDisabled: true,
        showWarning: false,
        icon: null
      };
    }
    
    // Bekleyen randevu varsa
    if (status.hasPending) {
      return {
        text: 'BEKLEYEN RANDEVU VAR',
        badgeClass: 'bg-yellow-100 text-yellow-600',
        buttonClass: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:border-yellow-400',
        isDisabled: false,
        showWarning: true,
        icon: null
      };
    }
    
    // Müsait
    return {
      text: 'Müsait',
      badgeClass: 'bg-emerald-100 text-emerald-600',
      buttonClass: 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50',
      isDisabled: false,
      showWarning: false,
      icon: null
    };
  };

  const currentSlotStatus = slotStatuses[selectedTime] || { 
    isBlocked: false, 
    isApproved: false, 
    hasPending: false 
  };
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

      {/* Kilitleme Uyarısı */}
      {selectedTime && currentSlotStatus.isBlocked && (
        <div className="p-4 bg-gray-800 border border-gray-700 text-white rounded-lg flex items-start gap-3">
          <Lock className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-lg mb-1">Bu Saat Kilitlenmiştir</p>
            <p className="text-gray-200">{currentSlotStatus.blockReason}</p>
          </div>
        </div>
      )}

      {/* Bekleyen Randevu Uyarısı */}
      {selectedTime && currentSlotStatus.hasPending && !currentSlotStatus.isApproved && !currentSlotStatus.isBlocked && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">
            Bu saatte bekleyen bir randevu talebi var. Onaylanırsa, sizin randevunuz otomatik reddedilecektir. Başka bir saat seçmeniz önerilir.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-700">Müsait Saat Dilimleri</h3>
        </div>

        <div className="grid gap-3">
          {timeSlots.map((slot) => {
            const slotData = slotStatuses[slot.id] || { 
              isBlocked: false, 
              isApproved: false, 
              hasPending: false 
            };
            const { text, badgeClass, buttonClass, isDisabled, icon } = getSlotDisplay(slotData);

            return (
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
                    <span className={`text-sm px-2 py-1 rounded flex items-center gap-1 ${badgeClass}`}>
                      {icon}
                      {text}
                    </span>
                  </div>
                </button>
              )
            );
          })}
        </div>
      </div>

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