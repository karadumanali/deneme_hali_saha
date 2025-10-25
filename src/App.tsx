import React, { useState, useEffect, Dispatch } from 'react';
import { User } from 'firebase/auth';
import { Calendar, MapPin, Clock, CreditCard, Upload, CheckCircle, XCircle } from 'lucide-react';
import DateSelectionStep from './components/DateSelectionStep';
import TimeSelectionStep from './components/TimeSelectionStep';
import PaymentStep, { PaymentStepProps } from './components/PaymentStep'; 
import AdminPanel from './components/AdminPanel';
import StepIndicator from './components/StepIndicator';

import AdminLogin from './components/AdminLogin'; 
import { onAuthStateChange, logoutAdmin } from './services/authService'; 
import { sendNewReservationEmail } from './services/emailService';

import { db, storage } from './firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: '',
    field: '',
    timeSlot: '',
    customerName: '',
  });
  const [fieldOwner, setFieldOwner] = useState<FieldOwner | null>(null);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean | null>(null); 
  
  const isUrlAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    // Admin sayfasında olsak da olmasak da auth durumunu izle
    const unsubscribe = onAuthStateChange((user: User | null) => { 
        setIsAdminLoggedIn(!!user);
        console.log('Auth durumu değişti:', user ? 'Giriş yapıldı' : 'Çıkış yapıldı');
    });
    
    return () => unsubscribe();
  }, []);


  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error("Çıkış hatası:", error);
      alert('Güvenli çıkış yapılırken bir hata oluştu!');
    }
  };


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

  const handleSubmitReservation = async () => {
    setError(null);
    setIsLoading(true);

    console.log('=== REZERVASYON GÖNDERİLİYOR ===');
    console.log('Rezervasyon Verisi:', reservationData);

    try {
      let downloadURL: string | undefined = undefined;

      // 1. DEKONTU FIREBASE STORAGE'A YÜKLE
      if (reservationData.paymentProof) {
        const file = reservationData.paymentProof;
        console.log('Dekont yükleniyor:', file.name);
        const storageRef = ref(storage, `payment_proofs/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file); 
        downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Dekont yüklendi:', downloadURL);
      } else {
        console.warn('⚠️ Dekont dosyası bulunamadı!');
      }

      // 2. VERİYİ FIRESTORE'A KAYDET
      const now = Timestamp.now();
      const reservationDoc = {
        date: reservationData.date || null,
        field: reservationData.field || null,
        timeSlot: reservationData.timeSlot || null,
        customerName: reservationData.customerName || null,
        paymentProofURL: downloadURL || null, 
        paymentProofUrl: downloadURL || null,
        paymentProofName: reservationData.paymentProof?.name || null,
        status: 'pending',
        createdAt: now,
        submittedAt: now,
      };

      console.log('Firestore\'a kaydedilecek veri:', reservationDoc);

      const docRef = await addDoc(collection(db, 'reservations'), reservationDoc);
      console.log('✅ Rezervasyon kaydedildi! ID:', docRef.id);

      // 3. ADMİN'E EMAİL BİLDİRİMİ GÖNDER
      try {
        console.log('📧 Admin\'e email bildirimi gönderiliyor...');
        
        const emailSent = await sendNewReservationEmail({
          customerName: reservationData.customerName,
          date: reservationData.date,
          field: reservationData.field,
          timeSlot: reservationData.timeSlot
        });

        if (emailSent) {
          console.log('✅ Admin\'e bildirim emaili gönderildi!');
        } else {
          console.warn('⚠️ Email gönderilemedi ama rezervasyon kaydedildi.');
        }
      } catch (emailError) {
        console.error('Email gönderme hatası (rezervasyon yine de kaydedildi):', emailError);
      }

      setIsSubmitted(true);
    } catch (e) {
      console.error("❌ Rezervasyon oluşturulurken hata:", e);
      setError("Rezervasyon oluşturulurken beklenmedik bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };


  const renderAdminContent = () => {
      if (isAdminLoggedIn === null) {
          return (
              <div className="flex justify-center items-center h-screen">
                  <p className="text-xl font-medium text-gray-700">Kimlik Doğrulanıyor...</p>
              </div>
          );
      }

      if (!isAdminLoggedIn) {
          return <AdminLogin onLoginSuccess={() => { /* State otomatik güncellenecek */ }} />;
      }
      
      return (
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50">
              <div className="container mx-auto px-4 py-8">
                  <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-md">
                      <h1 className="text-3xl font-bold text-gray-800">Yönetici Paneli</h1>
                      <div className="flex space-x-3">
                          <button
                              onClick={() => window.location.pathname = '/'} 
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                              Rezervasyon Sayfası
                          </button>
                          <button
                              onClick={handleLogout}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                              Güvenli Çıkış
                          </button>
                      </div>
                  </div>
                  <AdminPanel />
              </div>
          </div>
      );
  };

  if (isUrlAdmin) {
      return renderAdminContent();
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
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mt-4">{error}</p>}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600">
              <p><strong>Tarih:</strong> {reservationData.date}</p>
              <p><strong>Saha:</strong> {reservationData.field}</p>
              <p><strong>Saat:</strong> {reservationData.timeSlot}</p>
              <p><strong>Ad Soyad:</strong> {reservationData.customerName}</p>
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
              Yeni Rezervasyon Yap
            </button>
            <button
              onClick={() => window.location.pathname = '/admin'} 
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
            onClick={() => window.location.pathname = '/admin'} 
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Admin Panel
          </button>
        </div>
        
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
                isLoading={isLoading} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;