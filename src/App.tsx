import React, { useState } from 'react';
import { Calendar, MapPin, Clock, CreditCard, Upload, CheckCircle, XCircle } from 'lucide-react';
import DateSelectionStep from './components/DateSelectionStep';
import TimeSelectionStep from './components/TimeSelectionStep';
// PaymentStep'ten hem bileşeni hem de prop arayüzünü (PaymentStepProps) içe aktarıyoruz
import PaymentStep, { PaymentStepProps } from './components/PaymentStep'; 
import AdminPanel from './components/AdminPanel';
import StepIndicator from './components/StepIndicator';

// Firebase servislerini import edin
import { db, storage } from './firebase/config'; // 'firebase' klasörünüzdeki config.js dosyasından
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ReservationData {
  date: string;
  field: string;
  timeSlot: string;
  paymentProof?: File;
  customerName: string; // Örnek olarak ekledim
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
    timeSlot: '',
    customerName: '',
  });
  const [fieldOwner, setFieldOwner] = useState<FieldOwner | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ortam değişkeni testini buraya taşıdım. Konsolu kontrol etmeyi unutmayın.
  // console.log("STORAGE BUCKET OKUNDU MU?", process.env.REACT_APP_FIREBASE_STORAGE_BUCKET);

  const handleNextStep = () => {
    // Mevcut adımda gerekli veri var mı kontrol edebilirsiniz
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

  const handleSubmitReservation = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let downloadURL: string | undefined = undefined;

      // 1. DEKONTU FIREBASE STORAGE'A YÜKLE
      if (reservationData.paymentProof) {
        const file = reservationData.paymentProof;
        const storageRef = ref(storage, `payment_proofs/${Date.now()}_${file.name}`);
        
        // uploadBytes, dosyayı yükler
        const snapshot = await uploadBytes(storageRef, file); 
        
        // getDownloadURL, yüklenen dosyanın indirme linkini alır
        downloadURL = await getDownloadURL(snapshot.ref); 
      }

      // 2. VERİYİ FIRESTORE'A KAYDET
      const reservationDoc = {
        date: reservationData.date,
        field: reservationData.field,
        timeSlot: reservationData.timeSlot,
        customerName: reservationData.customerName,
        paymentProofURL: downloadURL, // Yüklenen dosyanın URL'sini ekle
        status: 'Beklemede',
        createdAt: new Date(),
      };

      // addDoc ile yeni bir doküman ekle
      await addDoc(collection(db, 'reservations'), reservationDoc);

      // Başarılı olursa
      setIsSubmitted(true);
    } catch (e) {
      console.error("Rezervasyon oluşturulurken hata:", e);
      setError("Rezervasyon oluşturulurken beklenmedik bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdminView = () => {
    setIsAdmin(!isAdmin);
  };

  // ... (Geri kalan render fonksiyonları)

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
          {/* Hata gösterimi eklendi */}
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mt-4">{error}</p>}

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
                setReservationData({ date: '', field: '', timeSlot: '', customerName: '' });
                setError(null);
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
        
        {/* Yükleniyor ve Hata Mesajları */}
        {(isLoading || error) && (
          <div className="max-w-4xl mx-auto mb-4 p-4 rounded-lg text-center shadow-md">
            {isLoading && <p className="text-blue-600">Rezervasyon gönderiliyor...</p>}
            {error && (
              <p className="text-red-600 flex items-center justify-center">
                <XCircle className="w-5 h-5 mr-2" />{error}
              </p>
            )}
          </div>
        )}

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
                isLoading={isLoading} // Yükleniyor durumunu PaymentStep'e gönderin
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

}
export default App;
