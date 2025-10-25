import { auth } from "../firebase/config.js";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

// Yönetici Giriş Fonksiyonu
export const loginAdmin = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
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

// Şu anki kullanıcıyı getir (Email almak için)
export const getCurrentUser = () => {
    return auth.currentUser;
};

// Yönetici Durumunu İzleme
export const onAuthStateChange = (callback) => {
    return auth.onAuthStateChanged(callback);
};