import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Lock, X, User } from 'lucide-react';
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
  approvedCustomerName?: string;
  pendingCustomerName?: string;
}

function TimeSelectionStep({ reservationData, updateReservationData, onNext, onPrev }: TimeSelectionStepProps) {
  const [selectedTime, setSelectedTime] = useState(reservationData.timeSlot);
  const [slotStatuses, setSlotStatuses] = useState<{[key: string]: SlotStatus}>({});
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [modalBlockReason, setModalBlockReason] = useState('');
  const [modalReservationInfo, setModalReservationInfo] = useState<{
    customerName: string;
    status: 'approved' | 'pending';
  } | null>(null);

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
          hasPending: availabilityResult.pendingCount > 0,
          approvedCustomerName: availabilityResult.approvedCustomerName || undefined,
          pendingCustomerName: availabilityResult.pendingCustomerName || undefined
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

  const handleTimeSelect = (timeId: string, status: SlotStatus) => {
    // Eğer kilitli ise modal aç
    if (status.isBlocked) {
      setModalBlockReason(status.blockReason || 'Bu saat yönetici tarafından kilitlenmiştir.');
      setShowBlockModal(true);
      return;
    }

    // Eğer onaylanmış rezervasyon varsa modal aç
    if (status.isApproved) {
      setModalReservationInfo({
        customerName: status.approvedCustomerName || 'Bilinmeyen Kullanıcı',
        status: 'approved'
      });
      setShowReservationModal(true);
      return;
    }

    // Normal akış - Bekleyen rezervasyon olsa bile seçilebilir
    setSelectedTime(timeId);
    updateReservationData({ timeSlot: timeId });
  };

  const handleNext = () => {
    if (selectedTime) {
      onNext();
    }
  };
  
  const getSlotDisplay = (status: SlotStatus) => {
    // Önce kilitleme kontrolü (GRİ RENK)
    if (status.isBlocked) {
      return {
        text: 'KİLİTLİ',
        badgeClass: 'bg-gray-600 text-white',
        buttonClass: 'border-gray-500 bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200',
        isDisabled: false,
        showWarning: false,
        icon: <Lock className="w-4 h-4" />
      };
    }
    
    // Onaylanmış rezervasyon varsa (DOLU - Tıklanabilir)
    if (status.isApproved) {
      return {
        text: 'DOLU',
        badgeClass: 'bg-red-600 text-white',
        buttonClass: 'border-red-500 bg-red-50 text-red-600 cursor-pointer hover:bg-red-100',
        isDisabled: false,
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

  // Seçili saat kilitli mi veya dolu mu kontrol et
  const isSelectedSlotValid = selectedTime && !currentSlotStatus.isBlocked && !currentSlotStatus.isApproved;

  return (
    <div className="space-y-8">
      {/* Kilitleme Bilgi Modalı */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowBlockModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Lock className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Saat Kilitli
                </h3>
                <p className="text-sm text-gray-600">
                  Bu saat dilimi yönetici tarafından kilitlenmiştir.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border-l-4 border-gray-600 p-4 rounded-r-lg mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Kilitleme Sebebi:</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {modalBlockReason}
              </p>
            </div>

            <button
              onClick={() => setShowBlockModal(false)}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

      {/* Rezervasyon Bilgi Modalı (DOLU SAAT İÇİN) */}
      {showReservationModal && modalReservationInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowReservationModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Saat Dolu
                </h3>
                <p className="text-sm text-gray-600">
                  Bu saat dilimi için onaylanmış bir rezervasyon bulunmaktadır.
                </p>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-6">
              <p className="text-sm font-semibold text-red-700 mb-2">Rezervasyon Sahibi:</p>
              <p className="text-base text-red-900 font-medium">
                {modalReservationInfo.customerName}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ Bu saat için rezervasyon yapılamaz. Lütfen başka bir saat seçin.
              </p>
            </div>

            <button
              onClick={() => setShowReservationModal(false)}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

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

      {/* Bekleyen Randevu Uyarısı - SADECE BEKLEYEN İÇİN */}
      {selectedTime && currentSlotStatus.hasPending && !currentSlotStatus.isApproved && !currentSlotStatus.isBlocked && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-400 text-yellow-900 rounded-lg flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-base mb-2">⚠️ Dikkat!</p>
            <p className="text-sm mb-2">
              Bu saatte <strong>{currentSlotStatus.pendingCustomerName}</strong> adlı kullanıcının bekleyen bir randevu talebi var. 
            </p>
            <p className="text-sm">
              Eğer o rezervasyon onaylanırsa, sizin randevunuz otomatik olarak reddedilecektir. Başka bir saat seçmeniz önerilir.
            </p>
          </div>
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
                  onClick={() => handleTimeSelect(slot.id, slotData)}
                  className={`w-full p-4 border-2 rounded-lg transition-all ${
                    selectedTime === slot.id && !slotData.isBlocked && !slotData.isApproved
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                      : buttonClass
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{slot.label}</span>
                    <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${badgeClass}`}>
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
          disabled={!isSelectedSlotValid}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isSelectedSlotValid
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