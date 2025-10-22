// services/blockService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

const blocksCollection = collection(db, 'blocks');

/**
 * Yeni kilitleme oluşturur
 * @param {Object} blockData - {startDate, endDate, field, timeSlot, reason}
 */
export const createBlock = async (blockData) => {
  try {
    const block = {
      startDate: blockData.startDate,
      endDate: blockData.endDate,
      field: blockData.field || 'all', // 'all' = tüm sahalar
      timeSlot: blockData.timeSlot || 'all', // 'all' = tüm saatler
      reason: blockData.reason,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(blocksCollection, block);

    return {
      success: true,
      id: docRef.id,
      message: 'Kilitleme başarıyla oluşturuldu'
    };
  } catch (error) {
    console.error('Kilitleme oluşturma hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Tüm kilitlemeleri getirir
 */
export const getAllBlocks = async () => {
  try {
    const querySnapshot = await getDocs(blocksCollection);
    
    const blocks = [];
    querySnapshot.forEach((doc) => {
      blocks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: blocks
    };
  } catch (error) {
    console.error('Kilitlemeleri getirme hatası:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Kilitlemeyi siler
 */
export const deleteBlock = async (blockId) => {
  try {
    await deleteDoc(doc(db, 'blocks', blockId));
    return {
      success: true,
      message: 'Kilitleme başarıyla silindi'
    };
  } catch (error) {
    console.error('Kilitleme silme hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Belirli tarih, saha ve saat için kilitleme kontrolü
 * @param {string} date - YYYY-MM-DD formatında
 * @param {string} field - Saha ID'si
 * @param {string} timeSlot - Saat dilimi
 * @returns {Promise<{isBlocked: boolean, reason: string}>}
 */
export const checkIfBlocked = async (date, field, timeSlot) => {
  try {
    const querySnapshot = await getDocs(blocksCollection);
    
    for (const doc of querySnapshot.docs) {
      const block = doc.data();
      
      // Tarih kontrolü
      const targetDate = new Date(date);
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      
      const isDateInRange = targetDate >= blockStart && targetDate <= blockEnd;
      
      if (!isDateInRange) continue;
      
      // Saha kontrolü (all = tüm sahalar kilitli)
      const isFieldBlocked = block.field === 'all' || block.field === field;
      
      if (!isFieldBlocked) continue;
      
      // Saat kontrolü (all = tüm saatler kilitli)
      const isTimeBlocked = block.timeSlot === 'all' || block.timeSlot === timeSlot;
      
      if (isTimeBlocked) {
        return {
          isBlocked: true,
          reason: block.reason
        };
      }
    }
    
    return {
      isBlocked: false,
      reason: null
    };
  } catch (error) {
    console.error('Kilitleme kontrolü hatası:', error);
    return {
      isBlocked: false,
      reason: null
    };
  }
};