import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Express tiplerini içe aktar
import { Request, Response } from 'express'; 

// --- GLOBAL AYARLAR ---
functions.setGlobalOptions({ maxInstances: 10 });

// 🔥 DÜZELTİLMİŞ BAŞLATMA 🔥
// Firebase App nesnesini açıkça tanımla ve Firestore'u ondan al.
// Bu, admin.firestore.FieldValue nesnesinin doğru yüklenmesini sağlar.
const app = admin.initializeApp();
const db = app.firestore(); 

// --- TEK BİR HTTP API FONKSİYONU ---
export const rezervasyonAPI = functions.https.onRequest(async (req: Request, res: Response): Promise<void> => {
    
    // --- CORS BAŞLIKLARI ---
    res.set("Access-Control-Allow-Origin", "*"); 
    
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send(); 
        return;
    }

    try {
        if (req.method === "POST") {
            // --- REZERVASYON OLUŞTURMA (POST) İŞLEMİ ---
            
            const data = req.body;
            
            // Veri doğrulama
            //if (!data || !data.saat || !data.tarih) -> eski kodum hata alırsan gel değiş
            if (!data || !data.saat || !data.tarih || !data.sahaAdi || !data.adSoyad) {
                functions.logger.warn("Eksik alan uyarısı", data);
                res.status(400).send({ success: false, message: "Eksik alan: Saat, Tarih ve diğer rezervasyon detayları gereklidir." });
                return;
            }

            const docRef = await db.collection("rezervasyonlar").add({
                // Gelen veriler
                ...data,
                status: "pending", 
 
                //createdAt: admin.firestore.FieldValue.serverTimestamp(), -> bu iki kod Firestore sunucusu saati → Firestore'a Timestamp olarak kaydolur. Ama new Date() Node.js saati → Firestore'a Timestamp olarak kaydolur.
                //timestamp: admin.firestore.FieldValue.serverTimestamp(), 

                createdAt: new Date(), 
                timestamp: new Date(),
            });

            // Başarılı yanıt
            res.status(201).send({ success: true, id: docRef.id, message: "Rezervasyon başarıyla oluşturuldu." });
            return;

        } else if (req.method === "GET") {
            // --- REZERVASYON LİSTELEME (GET) İŞLEMİ ---
            
            const snapshot = await db.collection("rezervasyonlar").orderBy('createdAt', 'desc').get();
            const rezervasyonListesi = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Başarılı yanıt
            res.status(200).json({ success: true, data: rezervasyonListesi });
            return;

        } else {
            // Desteklenmeyen metotlar için hata
            res.status(405).send({ success: false, message: "Desteklenmeyen HTTP Metodu. Sadece GET ve POST desteklenir." });
            return;
        }
    } catch (error) {
        // Hata durumunda loglama ve 500 yanıtı
        if (error instanceof Error) {
            functions.logger.error("API Hatası:", error.message);
            res.status(500).send({ success: false, message: "Sunucu hatası oluştu.", error: error.message });
        } else {
            functions.logger.error("Bilinmeyen API Hatası:", error);
            res.status(500).send({ success: false, message: "Bilinmeyen bir sunucu hatası oluştu." });
        }
        return;
    }
});