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

const reservationsCollection = collection(db, 'reservations');

export const createReservation = async (reservationData, paymentProof) => {
  try {
    let paymentProofUrl = null;
    
    if (paymentProof) {
      const storageRef = ref(storage, `payment-proofs/${Date.now()}_${paymentProof.name}`);
      const snapshot = await uploadBytes(storageRef, paymentProof);
      paymentProofUrl = await getDownloadURL(snapshot.ref);
    }

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
                
                const q = query(
                    reservationsCollection,
                    where('date', '==', data.date),
                    where('field', '==', data.field),
                    where('timeSlot', '==', data.timeSlot),
                    where('status', 'in', ['pending', 'Beklemede'])
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

// GÜNCELLENMİŞ FONKSİYON - Artık müşteri adını da döndürüyor
export const checkAvailability = async (date, field, timeSlot) => {
  try {
    const q = query(
      reservationsCollection,
      where('date', '==', date),
      where('field', '==', field),
      where('timeSlot', '==', timeSlot),
      where('status', 'in', ['approved', 'pending', 'Beklemede'])
    );
    
    const querySnapshot = await getDocs(q);
    
    let approvedCount = 0;
    let pendingCount = 0;
    let approvedCustomerName = null;
    let pendingCustomerName = null;

    querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const status = data.status;
        
        if (status === 'approved') {
            approvedCount++;
            if (!approvedCustomerName) {
                approvedCustomerName = data.customerName || 'Bilinmeyen Kullanıcı';
            }
        } else if (status === 'pending' || status === 'Beklemede') {
            pendingCount++;
            if (!pendingCustomerName) {
                pendingCustomerName = data.customerName || 'Bilinmeyen Kullanıcı';
            }
        }
    });

    return {
      success: true,
      approvedCount: approvedCount,
      pendingCount: pendingCount,
      approvedCustomerName: approvedCustomerName,
      pendingCustomerName: pendingCustomerName
    };
  } catch (error) {
    console.error('Müsaitlik kontrol hatası:', error);
    return {
      success: false,
      approvedCount: 0,
      pendingCount: 0,
      approvedCustomerName: null,
      pendingCustomerName: null
    };
  }
};

export const getAllReservations = async () => {
    try {
        const q = query(reservationsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const reservations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            let submittedAtFormatted = 'Bilinmiyor';
            const submittedAtField = data.submittedAt || data.createdAt;
            
            if (submittedAtField) {
                try {
                    submittedAtFormatted = submittedAtField.toDate?.()?.toLocaleString('tr-TR') || submittedAtField;
                } catch (e) {
                    console.warn('Tarih formatlanırken hata:', e);
                }
            }
            
            reservations.push({
                id: doc.id,
                date: data.date || '',
                field: data.field || '',
                timeSlot: data.timeSlot || '',
                customerName: data.customerName || '',
                status: data.status || 'pending',
                paymentProof: data.paymentProof || '',
                paymentProofName: data.paymentProofName || null,
                paymentProofUrl: data.paymentProofUrl || data.paymentProofURL || null,
                submittedAt: submittedAtFormatted
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