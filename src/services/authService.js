import { auth } from "../firebase/config.js";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

// Yönetici Giriş Fonksiyonu
export const loginAdmin = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Kullanıcı giriş yaptıktan sonra Auth nesnesinde saklanacaktır
        return userCredential.user;
    } catch (error) {
        // Hata durumlarını daha spesifik yakalayabilirsiniz (örn: wrong-password, user-not-found)
        console.error("Giriş hatası:", error.code, error.message);
        throw new Error("Giriş Başarısız: E-posta veya şifre yanlış.");
    }
};

// Yönetici Çıkış Fonksiyonu
export const logoutAdmin = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Çıkış hatası:", error);
        throw new Error("Çıkış yapılırken bir hata oluştu.");
    }
};

// Yönetici Durumunu İzleme (Opsiyonel ama çok kullanışlı)
// Kullanıcı durumunda bir değişiklik olduğunda (giriş/çıkış) tetiklenir.
export const onAuthStateChange = (callback) => {
    return auth.onAuthStateChanged(callback);
};