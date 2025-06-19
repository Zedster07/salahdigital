import React, { useState, useEffect } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { Subscriber } from '../../types';
import { ArrowLeft, Save, X, User, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

interface SubscriberFormProps {
  subscriber?: Subscriber | null;
  onSave: () => void;
  onCancel: () => void;
}

export function SubscriberForm({ subscriber, onSave, onCancel }: SubscriberFormProps) {
  const { state } = useApp();
  const { addSubscriber, updateSubscriber } = useDatabase();
  const { settings } = state;
  const isEditing = !!subscriber;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wilaya: '',
    facebook: '',
    instagram: '',
    email: '',
    address: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subscriber) {
      setFormData({
        name: subscriber.name,
        phone: subscriber.phone,
        wilaya: subscriber.wilaya || '',
        facebook: subscriber.facebook || '',
        instagram: subscriber.instagram || '',
        email: subscriber.email || '',
        address: subscriber.address || '',
        notes: subscriber.notes || '',
      });
    }
  }, [subscriber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const subscriberData: Subscriber = {
        id: subscriber?.id || generateId(),
        name: formData.name,
        phone: formData.phone,
        wilaya: formData.wilaya || undefined,
        facebook: formData.facebook || undefined,
        instagram: formData.instagram || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
        createdAt: subscriber?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateSubscriber(subscriberData);
      } else {
        await addSubscriber(subscriberData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving subscriber:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', 'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le client' : 'Ajouter un client'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client à votre base de données'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations de base */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informations personnelles
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom et prénom du client"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 0555123456"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Wilaya
              </label>
              <select
                value={formData.wilaya}
                onChange={(e) => handleInputChange('wilaya', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une wilaya</option>
                {wilayas.map((wilaya) => (
                  <option key={wilaya} value={wilaya}>
                    {wilaya}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@exemple.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adresse complète du client"
              />
            </div>
          </div>

          {/* Réseaux sociaux et notes */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Réseaux sociaux et notes
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Facebook className="w-4 h-4 mr-1 text-blue-600" />
                Facebook
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom d'utilisateur ou lien Facebook"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Instagram className="w-4 h-4 mr-1 text-pink-600" />
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="@nom_utilisateur ou lien Instagram"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes et remarques
              </label>
              <textarea
                rows={6}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notes personnelles, préférences du client, historique des interactions..."
              />
            </div>
            
            {/* Informations supplémentaires */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Conseils d'utilisation</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Utilisez cette base pour sélectionner vos clients lors des ventes</li>
                <li>• Les réseaux sociaux facilitent le contact et le marketing</li>
                <li>• Les notes vous aident à personnaliser le service</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 inline mr-2" />
            {t('cancel', settings.language)}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
            ) : (
              <Save className="w-4 h-4 inline mr-2" />
            )}
            {isLoading ? 'Sauvegarde...' : t('save', settings.language)}
          </button>
        </div>
      </form>
    </div>
  );
}