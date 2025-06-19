import { User, SecurityLog, EmailVerificationRequest } from '../types';

export const securityUtils = {
  // Génération de token sécurisé
  generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Génération de token de vérification email
  generateEmailVerificationToken(): string {
    return this.generateSecureToken();
  },

  // Vérification si un compte est verrouillé
  isAccountLocked(user: User): boolean {
    if (!user.lockedUntil) return false;
    const lockTime = new Date(user.lockedUntil);
    const now = new Date();
    return now < lockTime;
  },

  // Obtenir le temps restant de verrouillage
  getLockTimeRemaining(user: User): number {
    if (!user.lockedUntil) return 0;
    const lockTime = new Date(user.lockedUntil);
    const now = new Date();
    const diffMs = lockTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60))); // en minutes
  },

  // Verrouiller un compte
  lockAccount(user: User, durationMinutes: number): User {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);
    
    return {
      ...user,
      lockedUntil: lockUntil.toISOString(),
      loginAttempts: 0, // Reset attempts after lock
    };
  },

  // Incrémenter les tentatives de connexion
  incrementLoginAttempts(user: User): User {
    return {
      ...user,
      loginAttempts: user.loginAttempts + 1,
    };
  },

  // Réinitialiser les tentatives de connexion
  resetLoginAttempts(user: User): User {
    return {
      ...user,
      loginAttempts: 0,
      lockedUntil: undefined,
    };
  },

  // Créer une demande de vérification email
  createEmailVerificationRequest(userId: string, email: string, expiryHours: number = 24): EmailVerificationRequest {
    const token = this.generateEmailVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    return {
      id: this.generateSecureToken(),
      userId,
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      verified: false,
    };
  },

  // Vérifier si un token de vérification est valide
  isVerificationTokenValid(request: EmailVerificationRequest): boolean {
    const now = new Date();
    const expiryDate = new Date(request.expiresAt);
    return now < expiryDate && !request.verified;
  },

  // Enregistrer un événement de sécurité
  logSecurityEvent(event: Omit<SecurityLog, 'id' | 'timestamp'>): SecurityLog {
    return {
      id: this.generateSecureToken(),
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // Simulation pour la démo
      userAgent: navigator.userAgent,
      ...event,
    };
  },

  // Valider la force d'un mot de passe
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des lettres minuscules');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des lettres majuscules');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des chiffres');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des caractères spéciaux');
    }

    return {
      isValid: score >= 3,
      score,
      feedback,
    };
  },

  // Générer un mot de passe sécurisé
  generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  },
};