import React, { useState } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { formatDate } from '../../utils/dateUtils';
import { SubscriberForm } from './SubscriberForm';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  User,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Mail,
  Calendar
} from 'lucide-react';

export function SubscribersList() {
  const { state } = useApp();
  const { deleteSubscriber } = useDatabase();
  const { subscribers, settings } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    wilaya: '',
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredSubscribers = subscribers.filter(subscriber => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!subscriber.name.toLowerCase().includes(searchLower) &&
          !subscriber.phone.includes(searchTerm) &&
          !subscriber.wilaya?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.wilaya && subscriber.wilaya !== filters.wilaya) {
      return false;
    }
    
    return true;
  });

  const handleEditSubscriber = (subscriber: any) => {
    setEditingSubscriber(subscriber);
    setShowForm(true);
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      setIsDeleting(subscriberId);
      try {
        await deleteSubscriber(subscriberId);
      } catch (error) {
        console.error('Error deleting subscriber:', error);
        alert('Erreur lors de la suppression. Veuillez réessayer.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const uniqueWilayas = [...new Set(subscribers.map(s => s.wilaya).filter(Boolean))].sort();

  if (showForm) {
    return (
      <SubscriberForm
        subscriber={editingSubscriber}
        onSave={() => {
          setShowForm(false);
          setEditingSubscriber(null);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingSubscriber(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Base de Données Clients
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez vos clients et leurs informations de contact
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avec Facebook</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscribers.filter(s => s.facebook).length}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Facebook className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avec Instagram</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscribers.filter(s => s.instagram).length}
              </p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <Instagram className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou wilaya..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.wilaya}
            onChange={(e) => setFilters({ ...filters, wilaya: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les wilayas</option>
            {uniqueWilayas.map((wilaya) => (
              <option key={wilaya} value={wilaya}>
                {wilaya}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Aucun client ne correspond à vos critères de recherche'
                : 'Commencez par ajouter votre premier client'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Réseaux Sociaux
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ajouté le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subscriber.name}
                          </div>
                          {subscriber.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {subscriber.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {subscriber.phone}
                      </div>
                      {subscriber.email && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="w-4 h-4 mr-1" />
                          {subscriber.email}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {subscriber.wilaya ? (
                        <div className="text-sm text-gray-900 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {subscriber.wilaya}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non renseigné</span>
                      )}
                      {subscriber.address && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {subscriber.address}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {subscriber.facebook && (
                          <div className="flex items-center text-sm text-blue-600">
                            <Facebook className="w-4 h-4 mr-1" />
                            <span className="truncate max-w-20">{subscriber.facebook}</span>
                          </div>
                        )}
                        {subscriber.instagram && (
                          <div className="flex items-center text-sm text-pink-600">
                            <Instagram className="w-4 h-4 mr-1" />
                            <span className="truncate max-w-20">{subscriber.instagram}</span>
                          </div>
                        )}
                        {!subscriber.facebook && !subscriber.instagram && (
                          <span className="text-sm text-gray-400">Aucun</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(subscriber.createdAt, settings.language)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditSubscriber(subscriber)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          disabled={isDeleting === subscriber.id}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          {isDeleting === subscriber.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}