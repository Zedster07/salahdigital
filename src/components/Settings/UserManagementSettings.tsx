import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { securityUtils } from '../../utils/securityUtils';
import { emailService } from '../../utils/emailService';
import { formatDate } from '../../utils/dateUtils';
import { User } from '../../types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Ban,
  Unlock,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  Settings as SettingsIcon,
  Save
} from 'lucide-react';

export function UserManagementSettings() {
  const { state, dispatch } = useApp();
  const { userManagement, settings } = state;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: userManagement.securitySettings.maxLoginAttempts,
    lockoutDuration: userManagement.securitySettings.lockoutDuration,
    emailVerificationRequired: userManagement.securitySettings.emailVerificationRequired,
    twoFactorRequired: userManagement.securitySettings.twoFactorRequired,
  });

  const handleUserAction = async (user: User, action: 'approve' | 'block' | 'unblock' | 'delete' | 'resend_email') => {
    setIsLoading(true);
    setMessage('');

    try {
      switch (action) {
        case 'approve':
          const approvedUser = { ...user, status: 'verified' as const };
          dispatch({ type: 'UPDATE_USER', payload: approvedUser });
          
          // Envoyer email de bienvenue
          await emailService.sendWelcomeEmail(approvedUser, settings.companyName);
          
          setMessage(`Utilisateur ${user.username} approuvé avec succès`);
          break;

        case 'block':
          const blockedUser = { ...user, status: 'blocked' as const };
          dispatch({ type: 'UPDATE_USER', payload: blockedUser });
          setMessage(`Utilisateur ${user.username} bloqué`);
          break;

        case 'unblock':
          const unblockedUser = securityUtils.resetLoginAttempts({ ...user, status: 'verified' as const });
          dispatch({ type: 'UPDATE_USER', payload: unblockedUser });
          setMessage(`Utilisateur ${user.username} débloqué`);
          break;

        case 'delete':
          if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.username} ?`)) {
            dispatch({ type: 'DELETE_USER', payload: user.id });
            setMessage(`Utilisateur ${user.username} supprimé`);
          }
          break;

        case 'resend_email':
          if (!user.emailVerified) {
            const verificationRequest = securityUtils.createEmailVerificationRequest(
              user.id,
              user.email,
              settings.emailVerificationExpiry || 24
            );

            const updatedUser = {
              ...user,
              emailVerificationToken: verificationRequest.token,
              emailVerificationExpires: verificationRequest.expiresAt,
            };

            dispatch({ type: 'UPDATE_USER', payload: updatedUser });

            const emailResult = await emailService.sendVerificationEmail(
              updatedUser,
              verificationRequest.token,
              settings.companyName
            );

            if (emailResult.success) {
              setMessage(`Email de vérification renvoyé à ${user.email}`);
            } else {
              setMessage('Erreur lors de l\'envoi de l\'email');
            }
          }
          break;
      }

      // Enregistrer l'événement de sécurité
      const securityLog = securityUtils.logSecurityEvent({
        userId: user.id,
        action: action === 'approve' ? 'email_verified' : 'login_success', // Simplification pour la démo
        details: `Action ${action} effectuée sur l'utilisateur ${user.username}`
      });

    } catch (error) {
      console.error('Erreur lors de l\'action utilisateur:', error);
      setMessage('Erreur lors de l\'exécution de l\'action');
    }

    setIsLoading(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSecuritySettingsUpdate = () => {
    dispatch({
      type: 'UPDATE_USER_MANAGEMENT',
      payload: {
        securitySettings: securitySettings,
      },
    });

    // Mettre à jour aussi les paramètres globaux
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        maxLoginAttempts: securitySettings.maxLoginAttempts,
        lockoutDuration: securitySettings.lockoutDuration,
        requireEmailVerification: securitySettings.emailVerificationRequired,
        twoFactorRequired: securitySettings.twoFactorRequired,
      },
    });

    setMessage('Paramètres de sécurité mis à jour');
    setTimeout(() => setMessage(''), 3000);
  };

  const getStatusIcon = (user: User) => {
    switch (user.status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'blocked':
        return <Ban className="w-5 h-5 text-red-600" />;
      case 'suspended':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Vérifié';
      case 'pending':
        return 'En attente';
      case 'blocked':
        return 'Bloqué';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'blocked':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'suspended':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const pendingUsers = userManagement.users.filter(user => user.status === 'pending');
  const verifiedUsers = userManagement.users.filter(user => user.status === 'verified');
  const blockedUsers = userManagement.users.filter(user => user.status === 'blocked' || user.status === 'suspended');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Gestion des Utilisateurs
            </h3>
            <p className="text-gray-600 mt-1">
              Gérez les comptes utilisateurs et les paramètres de sécurité
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{userManagement.users.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{pendingUsers.length}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Vérifiés</p>
              <p className="text-2xl font-bold text-green-600">{verifiedUsers.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Bloqués</p>
              <p className="text-2xl font-bold text-red-600">{blockedUsers.length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Paramètres de Sécurité
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tentatives de connexion max
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => setSecuritySettings(prev => ({ 
                ...prev, 
                maxLoginAttempts: parseInt(e.target.value) || 5 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée de verrouillage (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={securitySettings.lockoutDuration}
              onChange={(e) => setSecuritySettings(prev => ({ 
                ...prev, 
                lockoutDuration: parseInt(e.target.value) || 30 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailVerificationRequired"
              checked={securitySettings.emailVerificationRequired}
              onChange={(e) => setSecuritySettings(prev => ({ 
                ...prev, 
                emailVerificationRequired: e.target.checked 
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailVerificationRequired" className="ml-2 block text-sm text-gray-900">
              Vérification email obligatoire
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorRequired"
              checked={securitySettings.twoFactorRequired}
              onChange={(e) => setSecuritySettings(prev => ({ 
                ...prev, 
                twoFactorRequired: e.target.checked 
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactorRequired" className="ml-2 block text-sm text-gray-900">
              Authentification à deux facteurs obligatoire
            </label>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleSecuritySettingsUpdate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder les paramètres
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900">Liste des Utilisateurs</h4>
        </div>
        
        {userManagement.users.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur</h3>
            <p className="text-gray-500">
              Les nouveaux utilisateurs apparaîtront ici après leur inscription
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sécurité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userManagement.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="flex items-center text-sm text-gray-500">
                        {user.emailVerified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            Vérifié
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 text-orange-500 mr-1" />
                            Non vérifié
                          </>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user)}
                        <span className="ml-1">{getStatusLabel(user.status)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(user.createdAt, settings.language)}
                      </div>
                      {user.lastLogin && (
                        <div className="text-sm text-gray-500">
                          Dernière connexion: {formatDate(user.lastLogin, settings.language)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Tentatives: {user.loginAttempts}
                      </div>
                      {securityUtils.isAccountLocked(user) && (
                        <div className="text-sm text-red-600">
                          Verrouillé ({securityUtils.getLockTimeRemaining(user)}min)
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleUserAction(user, 'approve')}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {user.status === 'verified' && (
                          <button
                            onClick={() => handleUserAction(user, 'block')}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                            title="Bloquer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(user.status === 'blocked' || securityUtils.isAccountLocked(user)) && (
                          <button
                            onClick={() => handleUserAction(user, 'unblock')}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                            title="Débloquer"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!user.emailVerified && (
                          <button
                            onClick={() => handleUserAction(user, 'resend_email')}
                            disabled={isLoading}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50"
                            title="Renvoyer email"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleUserAction(user, 'delete')}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de l'utilisateur
                </h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rôle</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <div className="mt-1 flex items-center">
                      {getStatusIcon(selectedUser)}
                      <span className="ml-2 text-sm text-gray-900">
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date d'inscription</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedUser.createdAt, settings.language)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dernière connexion</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.lastLogin 
                        ? formatDate(selectedUser.lastLogin, settings.language)
                        : 'Jamais connecté'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Sécurité</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email vérifié</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.emailVerified ? 'Oui' : 'Non'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tentatives de connexion</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.loginAttempts}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">2FA activé</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.twoFactorEnabled ? 'Oui' : 'Non'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Compte verrouillé</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {securityUtils.isAccountLocked(selectedUser) 
                          ? `Oui (${securityUtils.getLockTimeRemaining(selectedUser)} min restantes)`
                          : 'Non'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}