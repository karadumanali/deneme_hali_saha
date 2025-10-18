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
  Timestamp,
  writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config.js';

// Rezervasyon koleksiyonu referansı
const reservationsCollection = collection(db, 'reservations');

/**
 * Yeni rezervasyon oluşturur ve dekontu Storage'a yükler.
 * ... (Bu fonksiyon aynı kalır, null düzeltmeleri yapıldı)
 */
export const createReservation = async (reservationData, paymentProof) => {
  try {
    let paymentProofUrl = null;
    
    // Dekont dosyasını Firebase Storage'a yükle
    if (paymentProof) {
      const storageRef = ref(storage, `payment-proofs/${Date.now()}_${paymentProof.name}`);
      const snapshot = await uploadBytes(storageRef, paymentProof);
      paymentProofUrl = await getDownloadURL(snapshot.ref);
    }

    // Rezervasyon verisini Firestore'a kaydet (Null düzeltmeleri ile)
    const reservation = {
      date: reservationData.date ?? null, 
      field: reservationData.field ?? null,
      timeSlot: reservationData.timeSlot ?? null,
      customerName: reservationData.customerName ?? null,
      
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

/**
 * Rezervasyon durumunu günceller ve eğer onaylandıysa, çakışan diğer bekleyenleri reddeder.
 * ... (Bu fonksiyon aynı kalır, toplu reddetme mantığı zaten içeriyor)
 */
export const updateReservationStatus = async (reservationId, status) => {
    try {
        const batch = writeBatch(db);
        const reservationRef = doc(db, 'reservations', reservationId);

        batch.update(reservationRef, {
            status: status,
            updatedAt: Timestamp.now()
        });

        if (status === 'approved') {
            const currentDoc = await getDoc(reservationRef);
            if (currentDoc.exists()) {
                const data = currentDoc.data();
                
                // Aynı tarih, saat ve saha için BEKLEYEN rezervasyonları bul
                const q = query(
                    reservationsCollection,
                    where('date', '==', data.date),
                    where('field', '==', data.field),
                    where('timeSlot', '==', data.timeSlot),
                    where('status', '==', 'pending')
                );
                
                const conflictingSnapshot = await getDocs(q);
                
                conflictingSnapshot.docs.forEach(conflictingDoc => {
                    if (conflictingDoc.id !== reservationId) {
                        const conflictingRef = doc(db, 'reservations', conflictingDoc.id);
                        batch.update(conflictingRef, {
                            status: 'rejected',
                            updatedAt: Timestamp.now(),
                            adminNote: 'Çakışan bir rezervasyon onaylandığı için otomatik reddedildi.'
                        });
                    }
                });
            }
        }

        await batch.commit();

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


/**
 * Belirli tarih, saha ve saat için kaç tane onaylanmış ve bekleyen rezervasyon olduğunu sayar.
 * @param {string} date
 * @param {string} field
 * @param {string} timeSlot
 * @returns {Promise<{success: boolean, approvedCount: number, pendingCount: number}>}
 */
export const checkAvailability = async (date, field, timeSlot) => {
  try {
    // Aynı tarih, saha ve saat için hem 'approved' hem de 'pending' durumlarını kontrol ediyoruz
    const q = query(
      reservationsCollection,
      where('date', '==', date),
      where('field', '==', field),
      where('timeSlot', '==', timeSlot),
      where('status', 'in', ['approved', 'pending']) // Hem onaylanmış hem bekleyenleri getir
    );
    
    const querySnapshot = await getDocs(q);
    
    let approvedCount = 0;
    let pendingCount = 0;

    querySnapshot.docs.forEach((doc) => {
        const status = doc.data().status;
        if (status === 'approved') {
            approvedCount++;
        } else if (status === 'pending') {
            pendingCount++;
        }
    });

    return {
      success: true,
      approvedCount: approvedCount,
      pendingCount: pendingCount,
    };
  } catch (error) {
    console.error('Müsaitlik kontrol hatası:', error);
    return {
      success: false,
      approvedCount: 0,
      pendingCount: 0, 
    };
  }
};

// --- Diğer fonksiyonlar aynı kalır ---
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
