// services/emailService.ts
import emailjs from '@emailjs/browser';

// EmailJS ayarları (.env dosyasına ekle)
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '';
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || '';

interface ReservationEmailData {
  customerName: string;
  date: string;
  field: string;
  timeSlot: string;
}

/**
 * Admin'e yeni rezervasyon bildirimi gönderir
 */
export const sendNewReservationEmail = async (data: ReservationEmailData): Promise<boolean> => {
  // Ayarlar boşsa email gönderme
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !ADMIN_EMAIL) {
    console.warn('⚠️ EmailJS ayarları eksik, email gönderilemedi.');
    return false;
  }

  try {
    // EmailJS template parametreleri
    const templateParams = {
      to_email: ADMIN_EMAIL,
      customer_name: data.customerName,
      reservation_date: data.date,
      field_name: data.field,
      time_slot: data.timeSlot.split('-').join(':00 - ') + ':00',
      admin_panel_link: `${window.location.origin}/admin`,
    };

    console.log('📧 Admin\'e email gönderiliyor...', {
      to: ADMIN_EMAIL,
      customer: data.customerName,
      date: data.date,
      field: data.field,
      time: data.timeSlot
    });

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    if (response.status === 200) {
      console.log('✅ Email başarıyla gönderildi!');
      return true;
    } else {
      console.error('❌ Email gönderilemedi:', response);
      return false;
    }
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error);
    return false;
  }
};