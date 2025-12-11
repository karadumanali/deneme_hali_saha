// src/services/autoRejectService.js
import { 
  collection, 
  getDocs, 
  query, 
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * Vakti geçmiş bekleyen rezervasyonları otomatik reddet
 * KURAL: Rezervasyon saatinden 24 saat sonra hala pending ise otomatik reddet
 * @returns {Promise<{success: boolean, rejectedCount: number, message: string, error?: string}>}
 */
export const autoRejectExpiredReservations = async () => {
  try {
    console.log('🔍 Vakti geçmiş rezervasyonlar kontrol ediliyor...');
    
    const reservationsCollection = collection(db, 'reservations');
    
    // Sadece bekleyen (pending veya Beklemede) rezervasyonları getir
    const q = query(
      reservationsCollection,
      where('status', 'in', ['pending', 'Beklemede'])
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('✅ Bekleyen rezervasyon bulunamadı.');
      return {
        success: true,
        rejectedCount: 0,
        message: 'Bekleyen rezervasyon bulunamadı'
      };
    }

    const now = new Date();
    
    const batch = writeBatch(db);
    let rejectedCount = 0;

    querySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const reservationDate = data.date; // YYYY-MM-DD
      const timeSlot = data.timeSlot; // "16-17" formatında
      
      if (!reservationDate || !timeSlot) {
        console.warn(`⚠️ Eksik veri: ${docSnapshot.id}`);
        return;
      }

      // Saat diliminin bitiş saatini al (örn: "16-17" -> 17)
      const endHour = parseInt(timeSlot.split('-')[1]);
      
      // Rezervasyon bitiş tarihini oluştur (YYYY-MM-DD + bitiş saati)
      const reservationEndDate = new Date(reservationDate);
      reservationEndDate.setHours(endHour, 0, 0, 0);
      
      // 24 saat sonrası
      const deadline = new Date(reservationEndDate.getTime() + (24 * 60 * 60 * 1000));
      
      // Şu an deadline'ı geçtiyse reddet
      if (now >= deadline) {
        console.log(`❌ Reddediliyor: ${docSnapshot.id} - ${data.customerName} - ${reservationDate} ${timeSlot} (24 saat geçti)`);
        
        batch.update(docSnapshot.ref, {
          status: 'rejected',
          updatedAt: Timestamp.now(),
          adminNote: 'Rezervasyon vaktinden 24 saat sonra işlem yapılmadığı için otomatik reddedildi.'
        });
        
        rejectedCount++;
      }
    });

    if (rejectedCount > 0) {
      await batch.commit();
      console.log(`✅ ${rejectedCount} adet vakti geçmiş rezervasyon reddedildi.`);
    } else {
      console.log('✅ Reddedilecek rezervasyon bulunamadı.');
    }

    return {
      success: true,
      rejectedCount,
      message: rejectedCount > 0 
        ? `${rejectedCount} rezervasyon otomatik reddedildi`
        : 'Reddedilecek rezervasyon bulunamadı'
    };
  } catch (error) {
    console.error('❌ Otomatik reddetme hatası:', error);
    return {
      success: false,
      rejectedCount: 0,
      error: error.message
    };
  }
};

/**
 * Periyodik olarak otomatik reddetme işlemini başlat
 * @param {number} intervalMinutes - Kaç dakikada bir kontrol edilsin (varsayılan: 30)
 */
export const startAutoRejectScheduler = (intervalMinutes = 30) => {
  console.log(`🚀 Otomatik reddetme planlandı: Her ${intervalMinutes} dakikada bir`);
  
  // İlk kontrolü hemen yap
  autoRejectExpiredReservations();
  
  // Sonra belirlenen aralıklarla tekrarla
  const intervalId = setInterval(() => {
    autoRejectExpiredReservations();
  }, intervalMinutes * 60 * 1000);
  
  return intervalId;
};

/**
 * Otomatik reddetme planını durdur
 */
export const stopAutoRejectScheduler = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('⏹️ Otomatik reddetme planı durduruldu');
  }
};