import React, { useState, useEffect } from 'react';
import { Lock, Trash2, Plus, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';
import { createBlock, getAllBlocks, deleteBlock } from '../services/blockService';

interface Block {
  id: string;
  startDate: string;
  endDate: string;
  field: string;
  timeSlot: string;
  reason: string;
}

const fields = [
  { id: 'all', name: 'Tüm Sahalar' },
  { id: 'Etlik Halı Saha', name: 'Etlik Kampüsü Halı Saha' },
  { id: 'Esenboğa Halı Saha', name: 'Esenboğa Kampüsü Halı Saha' },
  { id: 'saha-3', name: 'Halı Saha 3' },
];

const timeSlots = [
  { id: 'all', label: 'Tüm Saatler' },
  { id: '16-17', label: '16:00 - 17:00' },
  { id: '17-18', label: '17:00 - 18:00' },
  { id: '18-19', label: '18:00 - 19:00' },
  { id: '19-20', label: '19:00 - 20:00' },
  { id: '20-21', label: '20:00 - 21:00' },
  { id: '21-22', label: '21:00 - 22:00' },
];

function BlockManager() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    field: 'all',
    timeSlot: 'all',
    reason: ''
  });

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const result = await getAllBlocks();
      if (result.success) {
        setBlocks(result.data);
      }
    } catch (error) {
      console.error('Kilitlemeleri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Tarih kontrolü
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('Bitiş tarihi başlangıç tarihinden önce olamaz!');
      return;
    }

    try {
      const result = await createBlock(formData);
      if (result.success) {
        alert('Kilitleme başarıyla oluşturuldu');
        setShowForm(false);
        setFormData({
          startDate: '',
          endDate: '',
          field: 'all',
          timeSlot: 'all',
          reason: ''
        });
        loadBlocks();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Kilitleme oluşturma hatası:', error);
      alert('Beklenmeyen bir hata oluştu');
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!window.confirm('Bu kilitlemeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const result = await deleteBlock(blockId);
      if (result.success) {
        alert('Kilitleme başarıyla silindi');
        loadBlocks();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Kilitleme silme hatası:', error);
      alert('Beklenmeyen bir hata oluştu');
    }
  };

  const getFieldName = (fieldId: string) => {
    return fields.find(f => f.id === fieldId)?.name || fieldId;
  };

  const getTimeSlotLabel = (timeSlotId: string) => {
    return timeSlots.find(t => t.id === timeSlotId)?.label || timeSlotId;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Yeni Kilitleme Butonu */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Lock className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Tarih/Saha Kilitleme</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Kilitleme
        </button>
      </div>

      {/* Açıklama Kutusu */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Kilitleme Hakkında:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Belirli tarih, saha veya saatleri rezervasyona kapatabilirsiniz</li>
              <li>"Tüm Sahalar" seçeneği ile tüm sahaları aynı anda kilitleyebilirsiniz</li>
              <li>"Tüm Saatler" seçeneği ile günün tüm saatlerini kilitleyebilirsiniz</li>
              <li>Kilitleme sebebi kullanıcılara gösterilecektir</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Kilitleme Formu */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Yeni Kilitleme Oluştur</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlangıç Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitiş Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saha
                </label>
                <select
                  value={formData.field}
                  onChange={(e) => setFormData({...formData, field: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saat Dilimi
                </label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {timeSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>{slot.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilitleme Sebebi *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Örn: Bahar Şenlikleri nedeniyle 1-7 Aralık arası rezervasyon alınmayacaktır"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu mesaj kullanıcılara gösterilecektir
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Kilitlemeyi Oluştur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kilitleme Listesi */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Aktif Kilitlemeler ({blocks.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {blocks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-1">Henüz kilitleme bulunmuyor</p>
              <p className="text-sm">Yeni kilitleme eklemek için yukarıdaki butona tıklayın</p>
            </div>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Kilitli
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Tarih Aralığı</p>
                          <p className="text-gray-700 font-medium">
                            {formatDate(block.startDate)}
                          </p>
                          <p className="text-gray-500">↓</p>
                          <p className="text-gray-700 font-medium">
                            {formatDate(block.endDate)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Saha</p>
                          <p className="text-gray-700 font-medium">{getFieldName(block.field)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Saat Dilimi</p>
                          <p className="text-gray-700 font-medium">{getTimeSlotLabel(block.timeSlot)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Kilitleme Sebebi:</p>
                        <p className="text-sm text-yellow-700">{block.reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Kilitlemeyi Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BlockManager;