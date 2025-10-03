import React, { useState } from 'react';
import { Calendar, MapPin, Clock, CreditCard, Upload, CheckCircle, XCircle } from 'lucide-react';
import DateSelectionStep from './components/DateSelectionStep';
import TimeSelectionStep from './components/TimeSelectionStep';
import PaymentStep from './components/PaymentStep';
import AdminPanel from './components/AdminPanel';
import StepIndicator from './components/StepIndicator';
// App.js dosyasına şunu ekle:


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

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: '',
    field: '',
    timeSlot: ''
  });
  const [fieldOwner, setFieldOwner] = useState<FieldOwner | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateReservationData = (data: Partial<ReservationData>) => {
    setReservationData(prev => ({ ...prev, ...data }));
  };

  const handleSubmitReservation = () => {
    setIsSubmitted(true);
  };

  const toggleAdminView = () => {
    setIsAdmin(!isAdmin);
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <button
              onClick={toggleAdminView}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Rezervasyon Sayfası
            </button>
          </div>
          <AdminPanel />
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Rezervasyon Gönderildi!</h2>
          <p className="text-gray-600 mb-6">
            Rezervasyon talebiniz halı saha sahibine iletildi. Dekont incelendikten sonra size bilgi verilecektir.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600">
              <p><strong>Tarih:</strong> {reservationData.date}</p>
              <p><strong>Saha:</strong> {reservationData.field}</p>
              <p><strong>Saat:</strong> {reservationData.timeSlot}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setCurrentStep(1);
                setReservationData({ date: '', field: '', timeSlot: '' });
              }}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Yeni Rezervasyon
            </button>
            <button
              onClick={toggleAdminView}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Halı Saha Rezervasyonu</h1>
          <p className="text-gray-600">Kolayca halı saha rezervasyonu yapın</p>
          <button
            onClick={toggleAdminView}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Admin Panel
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={currentStep} />
          
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            {currentStep === 1 && (
              <DateSelectionStep
                reservationData={reservationData}
                updateReservationData={updateReservationData}
                onNext={handleNextStep}
              />
            )}
            
            {currentStep === 2 && (
              <TimeSelectionStep
                reservationData={reservationData}
                updateReservationData={updateReservationData}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
              />
            )}
            
            {currentStep === 3 && (
              <PaymentStep
                reservationData={reservationData}
                updateReservationData={updateReservationData}
                fieldOwner={fieldOwner}
                setFieldOwner={setFieldOwner}
                onPrev={handlePrevStep}
                onSubmit={handleSubmitReservation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;



