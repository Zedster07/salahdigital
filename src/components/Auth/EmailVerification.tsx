import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  Shield,
  User
} from 'lucide-react';

interface EmailVerificationProps {
  onBack: () => void;
  userEmail: string;
  userName: string;
}

export function EmailVerification({ onBack, userEmail, userName }: EmailVerificationProps) {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Compte créé avec succès ! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Votre compte <strong>{userName}</strong> a été créé et est maintenant en attente de validation.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Prochaines étapes</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Compte créé avec succès
                  </li>
                  <li className="flex items-center">
                    <Clock className="w-4 h-4 text-orange-600 mr-2" />
                    En attente de validation par l'administrateur
                  </li>
                  <li className="flex items-center">
                    <User className="w-4 h-4 text-blue-600 mr-2" />
                    Accès autorisé après approbation
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-green-900 mb-2">📧 Informations de votre compte</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p><strong>Nom d'utilisateur:</strong> {userName}</p>
              <p><strong>Email:</strong> {userEmail}</p>
              <p><strong>Statut:</strong> En attente de validation</p>
              <p><strong>Date de création:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">⏳ Temps d'attente</h4>
            <p className="text-sm text-yellow-800">
              L'administrateur sera notifié de votre demande d'inscription. 
              La validation se fait généralement sous 24-48 heures.
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la connexion
          </button>

          {/* Message pour l'administrateur */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">👨‍💼 Pour l'administrateur</h4>
            <p className="text-xs text-gray-600">
              Un nouveau compte utilisateur a été créé et attend votre validation dans la section 
              "Paramètres → Gestion des Utilisateurs".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}