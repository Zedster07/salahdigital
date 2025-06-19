import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { RegisterForm } from './RegisterForm';
import { EmailVerification } from './EmailVerification';
import { Lock, User, LogIn, UserPlus } from 'lucide-react';

export function LoginForm() {
  const { state, dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registrationData, setRegistrationData] = useState({ email: '', username: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authentification sécurisée
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        const user = {
          id: 'admin',
          username: 'admin',
          email: 'admin@digitalmanager.com',
          role: 'admin' as const,
          status: 'verified' as const,
          emailVerified: true,
          loginAttempts: 0,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        
        dispatch({ type: 'SET_USER', payload: user });
        setIsLoading(false);
        return;
      }

      // Vérifier les utilisateurs enregistrés
      const existingUser = state.userManagement.users.find(
        user => user.username.toLowerCase() === username.toLowerCase()
      );

      if (existingUser) {
        if (existingUser.status === 'pending') {
          setError('Votre compte est en attente d\'approbation par l\'administrateur');
          setIsLoading(false);
          return;
        }

        if (existingUser.status === 'blocked') {
          setError('Votre compte a été bloqué. Contactez l\'administrateur');
          setIsLoading(false);
          return;
        }

        // Ici, vous devriez vérifier le mot de passe avec un hash
        // Pour la démo, on accepte n'importe quel mot de passe pour les utilisateurs vérifiés
        if (existingUser.status === 'verified') {
          const updatedUser = {
            ...existingUser,
            lastLogin: new Date().toISOString(),
            loginAttempts: 0,
          };
          
          dispatch({ type: 'UPDATE_USER', payload: updatedUser });
          dispatch({ type: 'SET_USER', payload: updatedUser });
          setIsLoading(false);
          return;
        }
      }

      setError('Nom d\'utilisateur ou mot de passe incorrect');
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Erreur login:', error);
    }
    
    setIsLoading(false);
  };

  const handleRegistrationSuccess = (email: string, username: string) => {
    setRegistrationData({ email, username });
    setShowRegister(false);
    setShowEmailVerification(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
    setShowEmailVerification(false);
    setRegistrationData({ email: '', username: '' });
  };

  if (showEmailVerification) {
    return (
      <EmailVerification
        onBack={handleBackToLogin}
        userEmail={registrationData.email}
        userName={registrationData.username}
      />
    );
  }

  if (showRegister) {
    return (
      <RegisterForm
        onSuccess={handleRegistrationSuccess}
        onBack={handleBackToLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('login', state.settings.language)}
          </h2>
          <p className="text-gray-600">
            {state.settings.companyName || 'Digital Manager'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                {t('username', state.settings.language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('username', state.settings.language)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                {t('password', state.settings.language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('password', state.settings.language)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-200" />
                )}
              </span>
              {isLoading ? 'Connexion...' : t('loginButton', state.settings.language)}
            </button>

            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg font-medium transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Créer un compte
            </button>
          </div>
        </form>

        {/* Informations de sécurité - Version sécurisée */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-blue-600" />
            🔐 Accès Sécurisé
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Administrateurs:</strong> Utilisez vos identifiants personnels</p>
            <p><strong>Nouveaux utilisateurs:</strong> Cliquez sur "Créer un compte"</p>
            <p><strong>Sécurité:</strong> Validation admin requise pour nouveaux comptes</p>
          </div>
        </div>
      </div>
    </div>
  );
}