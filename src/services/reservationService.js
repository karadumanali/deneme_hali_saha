// services/reservationService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config.js';

// Rezervasyon koleksiyonu referansı
const reservationsCollection = collection(db, 'reservations');

// Yeni rezervasyon oluştur
export const createReservation = async (reservationData, paymentProof) => {
  try {
    let paymentProofUrl = null;
    
    // Dekont dosyasını Firebase Storage'a yükle
    if (paymentProof) {
      const storageRef = ref(storage, `payment-proofs/${Date.now()}_${paymentProof.name}`);
      const snapshot = await uploadBytes(storageRef, paymentProof);
      paymentProofUrl = await getDownloadURL(snapshot.ref);
    }

    // Rezervasyon verisini Firestore'a kaydet
    const reservation = {
      date: reservationData.date,
      field: reservationData.field,
      timeSlot: reservationData.timeSlot,
      customerName: reservationData.customerName,
      status: 'pending',
      paymentProofUrl: paymentProofUrl,
      paymentProofName: paymentProof ? paymentProof.name : null,
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(reservationsCollection, reservation);

    return {
      success: true,
      id: docRef.id,
      data: reservation,
      message: 'Rezervasyon başarıyla oluşturuldu'
    };
  } catch (error) {
    console.error('Rezervasyon oluşturma hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Tüm rezervasyonları getir
export const getAllReservations = async () => {
  try {
    const q = query(reservationsCollection, orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const reservations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reservations.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toLocaleString('tr-TR') || data.submittedAt
      });
    });

    return {
      success: true,
      data: reservations
    };
  } catch (error) {
    console.error('Rezervasyonları getirme hatası:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Belirli rezervasyonu getir (LLM’den eklenen GET fonksiyonu)
export const getReservationById = async (reservationId) => {
  try {
    const docRef = doc(db, 'reservations', reservationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        data: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } else {
      return {
        success: false,
        error: 'Rezervasyon bulunamadı'
      };
    }
  } catch (error) {
    console.error('Rezervasyon getirme hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Rezervasyon durumunu güncelle (onayla/reddet)
export const updateReservationStatus = async (reservationId, status) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: status,
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      message: `Rezervasyon ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`
    };
  } catch (error) {
    console.error('Rezervasyon güncelleme hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Belirli tarih ve saha için rezervasyonları kontrol et
export const checkAvailability = async (date, field, timeSlot) => {
  try {
    const q = query(
      reservationsCollection,
      where('date', '==', date),
      where('field', '==', field),
      where('timeSlot', '==', timeSlot),
      where('status', 'in', ['pending', 'approved'])
    );
    
    const querySnapshot = await getDocs(q);
    
    return {
      success: true,
      available: querySnapshot.empty
    };
  } catch (error) {
    console.error('Müsaitlik kontrol hatası:', error);
    return {
      success: false,
      available: true // Hata durumunda rezervasyona izin ver
    };
  }
};
