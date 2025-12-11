import React, { useState } from 'react';
import { CheckCircle, XCircle, Calendar, Clock, User, FileText, Eye, Lock } from 'lucide-react';
import { getAllReservations, updateReservationStatus } from '../services/reservationService';
import BlockManager from './BlockManager';

interface Reservation {
  id: string;
  date: string;
  field: string;
  timeSlot: string;
  customerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'Beklemede';
  paymentProof: string;
  paymentProofName?: string;
  paymentProofUrl?: string;
  submittedAt: string;
  createdAt?: any;
}

function AdminPanel() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'blocks'>('reservations');

  React.useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const result = await getAllReservations();
      if (result.success) {
        setReservations(result.data);
      } else {
        console.error('Rezervasyonları yükleme hatası:', result.error);
      }
    } catch (error) {
      console.error('Rezervasyonları yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const result = await updateReservationStatus(id, 'approved');
      if (result.success) {
        setReservations(prev =>
          prev.map(res =>
            res.id === id ? { ...res, status: 'approved' as const } : res
          )
        );
      } else {
        alert('Onaylama işlemi başarısız: ' + result.error);
      }
    } catch (error) {
      console.error('Onaylama hatası:', error);
      alert('Beklenmeyen bir hata oluştu.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const result = await updateReservationStatus(id, 'rejected');
      if (result.success) {
        setReservations(prev =>
          prev.map(res =>
            res.id === id ? { ...res, status: 'rejected' as const } : res
          )
        );
      } else {
        alert('Reddetme işlemi başarısız: ' + result.error);
      }
    } catch (error) {
      console.error('Reddetme hatası:', error);
      alert('Beklenmeyen bir hata oluştu.');
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (filter === 'all') return true;
    if (filter === 'pending') return res.status === 'pending' || res.status === 'Beklemede';
    return res.status === filter;
  });

  const getStatusBadge = (status: Reservation['status']) => {
    if (status === 'pending' || status === 'Beklemede') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Bekliyor</span>;
    }
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Onaylandı</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">Reddedildi</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'Beklemede').length;

  if (loading && activeTab === 'reservations') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Rezervasyonlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Menüsü */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'reservations'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          Rezervasyonlar
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'blocks'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Lock className="w-5 h-5" />
          Tarih/Saha Kilitleme
        </button>
      </div>

      {/* Rezervasyonlar Tab */}
      {activeTab === 'reservations' && (
        <>
          {/* İstatistikler */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 lg:p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Toplam</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{reservations.length}</p>
                </div>
                <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 lg:p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Bekleyen</p>
                  <p className="text-xl lg:text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 lg:p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Onaylanan</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">
                    {reservations.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 lg:p-6 border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Reddedilen</p>
                  <p className="text-xl lg:text-2xl font-bold text-red-600">
                    {reservations.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Bilgi Mesajı - Otomatik Reddetme */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Otomatik Reddetme Sistemi Aktif</p>
                <p>
                  Rezervasyon saatinden 24 saat sonra hala beklemede olan rezervasyonlar otomatik olarak reddedilir.
                  Sistem her 30 dakikada bir kontrol yapar.
                </p>
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tümü ({reservations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bekleyen ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Onaylanan ({reservations.filter(r => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Reddedilen ({reservations.filter(r => r.status === 'rejected').length})
            </button>
          </div>

          {/* Rezervasyon Listesi - MOBİL İÇİN YATAY KAYDIRMA */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 lg:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base lg:text-lg font-semibold text-gray-800">Rezervasyonlar</h2>
            </div>
            
            {/* Mobil için yatay kaydırma wrapper */}
            <div className="overflow-x-auto">
              <div className="divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <div key={reservation.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors" style={{ minWidth: '700px' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-sm lg:text-base">{reservation.customerName}</span>
                          </div>
                          {getStatusBadge(reservation.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 text-xs lg:text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Tarih:</span> {reservation.date}
                          </div>
                          <div>
                            <span className="font-medium">Saha:</span> {reservation.field}
                          </div>
                          <div>
                            <span className="font-medium">Saat:</span> {reservation.timeSlot}
                          </div>
                          <div>
                            <span className="font-medium">Başvuru:</span> {reservation.submittedAt}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-xs lg:text-sm text-gray-600">
                            Dekont: {reservation.paymentProofName || 'dekont.pdf'}
                          </span>
                          {reservation.paymentProofUrl && (
                          <a 
                            href={reservation.paymentProofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 text-xs lg:text-sm flex items-center gap-1 whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            Görüntüle
                          </a>
                          )}
                        </div>
                      </div>
                      
                      {(reservation.status === 'pending' || reservation.status === 'Beklemede') && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs lg:text-sm whitespace-nowrap"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Onayla</span>
                          </button>
                          <button
                            onClick={() => handleReject(reservation.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs lg:text-sm whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reddet</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredReservations.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Bu filtreye uygun rezervasyon bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Kilitleme Tab */}
      {activeTab === 'blocks' && <BlockManager />}
    </div>
  );
}

export default AdminPanel;