import { Platform } from '../types';
import { formatCurrency } from '../utils/helpers';
import { Notification } from './NotificationService';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  role?: 'admin' | 'manager' | 'operator';
  platformIds?: string[]; // Specific platforms this recipient should be notified about
}

export interface EmailAlertSettings {
  enabled: boolean;
  recipients: EmailRecipient[];
  companyName: string;
  companyLogo?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
}

class EmailAlertService {
  private settings: EmailAlertSettings;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  private getDefaultSettings(): EmailAlertSettings {
    return {
      enabled: false,
      recipients: [],
      companyName: 'Digital Manager',
      fromEmail: 'alerts@digitalmanager.com',
      fromName: 'Digital Manager Alerts',
      replyToEmail: 'support@digitalmanager.com'
    };
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('emailAlertSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading email alert settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('emailAlertSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving email alert settings:', error);
    }
  }

  // Settings Management
  public updateSettings(newSettings: Partial<EmailAlertSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getSettings(): EmailAlertSettings {
    return { ...this.settings };
  }

  public addRecipient(recipient: EmailRecipient): void {
    if (!this.settings.recipients.find(r => r.email === recipient.email)) {
      this.settings.recipients.push(recipient);
      this.saveSettings();
    }
  }

  public removeRecipient(email: string): void {
    this.settings.recipients = this.settings.recipients.filter(r => r.email !== email);
    this.saveSettings();
  }

  public updateRecipient(email: string, updates: Partial<EmailRecipient>): void {
    const index = this.settings.recipients.findIndex(r => r.email === email);
    if (index !== -1) {
      this.settings.recipients[index] = { ...this.settings.recipients[index], ...updates };
      this.saveSettings();
    }
  }

  // Email Template Creation
  public createLowCreditEmailTemplate(platform: Platform, threshold: number): EmailTemplate {
    const deficit = threshold - platform.creditBalance;
    const utilizationRate = (platform.creditBalance / threshold) * 100;

    const subject = `⚠️ Alerte Crédit Faible - ${platform.name}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .platform-info { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .metric:last-child { border-bottom: none; }
          .metric-label { font-weight: bold; color: #64748b; }
          .metric-value { color: #1e293b; }
          .critical { color: #dc2626; font-weight: bold; }
          .warning { color: #d97706; font-weight: bold; }
          .action-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          .progress-bar { width: 100%; height: 20px; background-color: #e2e8f0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
          .progress-fill { height: 100%; background-color: #f59e0b; transition: width 0.3s ease; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alerte Crédit Faible</h1>
            <p>Notification automatique du système ${this.settings.companyName}</p>
          </div>

          <div class="content">
            <div class="alert-box">
              <h2>⚠️ Action Requise</h2>
              <p>La plateforme <strong>${platform.name}</strong> a un solde crédit faible qui nécessite votre attention.</p>
            </div>

            <div class="platform-info">
              <h3>Détails de la Plateforme</h3>
              <div class="metric">
                <span class="metric-label">Plateforme:</span>
                <span class="metric-value">${platform.name}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Solde Actuel:</span>
                <span class="metric-value warning">${formatCurrency(platform.creditBalance, 'DZD')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Seuil d'Alerte:</span>
                <span class="metric-value">${formatCurrency(threshold, 'DZD')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Déficit:</span>
                <span class="metric-value critical">${formatCurrency(deficit, 'DZD')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Taux d'Utilisation:</span>
                <span class="metric-value">${utilizationRate.toFixed(1)}%</span>
              </div>

              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(utilizationRate, 100)}%"></div>
              </div>
            </div>

            ${platform.contactEmail ? `
            <div class="platform-info">
              <h3>Contact Plateforme</h3>
              <div class="metric">
                <span class="metric-label">Email:</span>
                <span class="metric-value">${platform.contactEmail}</span>
              </div>
              ${platform.contactName ? `
              <div class="metric">
                <span class="metric-label">Contact:</span>
                <span class="metric-value">${platform.contactName}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <p><strong>Recommandations:</strong></p>
            <ul>
              <li>Rechargez le crédit de la plateforme dès que possible</li>
              <li>Vérifiez les ventes en cours qui pourraient être affectées</li>
              <li>Contactez le fournisseur si nécessaire</li>
              <li>Ajustez les seuils d'alerte si approprié</li>
            </ul>

            <a href="${window.location.origin}/platforms/${platform.id}/add-credit" class="action-button">
              💳 Ajouter du Crédit
            </a>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.settings.companyName}. Tous droits réservés.</p>
            <p>Cette alerte a été générée automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Pour modifier vos préférences de notification, connectez-vous à votre tableau de bord.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
ALERTE CRÉDIT FAIBLE - ${platform.name}

⚠️ ACTION REQUISE

La plateforme ${platform.name} a un solde crédit faible qui nécessite votre attention.

DÉTAILS:
- Plateforme: ${platform.name}
- Solde Actuel: ${formatCurrency(platform.creditBalance, 'DZD')}
- Seuil d'Alerte: ${formatCurrency(threshold, 'DZD')}
- Déficit: ${formatCurrency(deficit, 'DZD')}
- Taux d'Utilisation: ${utilizationRate.toFixed(1)}%

${platform.contactEmail ? `CONTACT PLATEFORME:
- Email: ${platform.contactEmail}
${platform.contactName ? `- Contact: ${platform.contactName}` : ''}` : ''}

RECOMMANDATIONS:
- Rechargez le crédit de la plateforme dès que possible
- Vérifiez les ventes en cours qui pourraient être affectées
- Contactez le fournisseur si nécessaire
- Ajustez les seuils d'alerte si approprié

Pour ajouter du crédit: ${window.location.origin}/platforms/${platform.id}/add-credit

---
Cette alerte a été générée automatiquement le ${new Date().toLocaleString('fr-FR')}
© ${new Date().getFullYear()} ${this.settings.companyName}
    `;

    return { subject, htmlContent, textContent };
  }

  public createCriticalCreditEmailTemplate(platform: Platform, threshold: number): EmailTemplate {
    const deficit = threshold - platform.creditBalance;
    const utilizationRate = (platform.creditBalance / threshold) * 100;

    const subject = `🚨 CRITIQUE - Crédit Épuisé - ${platform.name}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .critical-alert { background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .platform-info { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .metric:last-child { border-bottom: none; }
          .metric-label { font-weight: bold; color: #64748b; }
          .metric-value { color: #1e293b; }
          .critical { color: #dc2626; font-weight: bold; font-size: 1.1em; }
          .urgent-action { background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .action-button { display: inline-block; background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          .blink { animation: blink 1s linear infinite; }
          @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.3; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="blink">🚨 ALERTE CRITIQUE 🚨</h1>
            <p>INTERVENTION IMMÉDIATE REQUISE</p>
          </div>

          <div class="content">
            <div class="critical-alert">
              <h2>🚨 CRÉDIT CRITIQUE - ACTION IMMÉDIATE REQUISE</h2>
              <p class="critical">La plateforme <strong>${platform.name}</strong> a un solde crédit CRITIQUE qui peut interrompre les services à tout moment.</p>
            </div>

            <div class="urgent-action">
              <h3>⏰ INTERVENTION IMMÉDIATE NÉCESSAIRE</h3>
              <p>Le service peut être interrompu à tout moment. Rechargez immédiatement le crédit.</p>
            </div>

            <div class="platform-info">
              <h3>Détails Critiques</h3>
              <div class="metric">
                <span class="metric-label">Plateforme:</span>
                <span class="metric-value">${platform.name}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Solde Actuel:</span>
                <span class="metric-value critical">${formatCurrency(platform.creditBalance, 'DZD')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Seuil Critique:</span>
                <span class="metric-value">${formatCurrency(threshold, 'DZD')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Déficit:</span>
                <span class="metric-value critical">${formatCurrency(deficit, 'DZD')}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Niveau Critique:</span>
                <span class="metric-value critical">${utilizationRate.toFixed(1)}% du seuil</span>
              </div>
            </div>

            <div class="urgent-action">
              <h3>🎯 ACTIONS IMMÉDIATES</h3>
              <ol>
                <li><strong>Rechargez le crédit MAINTENANT</strong></li>
                <li>Suspendez temporairement les nouvelles ventes si nécessaire</li>
                <li>Contactez immédiatement le fournisseur</li>
                <li>Vérifiez l'impact sur les clients existants</li>
              </ol>
            </div>

            <a href="${window.location.origin}/platforms/${platform.id}/add-credit" class="action-button">
              🚨 RECHARGER IMMÉDIATEMENT
            </a>
          </div>

          <div class="footer">
            <p style="color: #dc2626; font-weight: bold;">ALERTE CRITIQUE GÉNÉRÉE LE ${new Date().toLocaleString('fr-FR')}</p>
            <p>© ${new Date().getFullYear()} ${this.settings.companyName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
🚨🚨🚨 ALERTE CRITIQUE - CRÉDIT ÉPUISÉ 🚨🚨🚨

INTERVENTION IMMÉDIATE REQUISE

La plateforme ${platform.name} a un solde crédit CRITIQUE qui peut interrompre les services à tout moment.

⏰ LE SERVICE PEUT ÊTRE INTERROMPU À TOUT MOMENT ⏰

DÉTAILS CRITIQUES:
- Plateforme: ${platform.name}
- Solde Actuel: ${formatCurrency(platform.creditBalance, 'DZD')} ⚠️
- Seuil Critique: ${formatCurrency(threshold, 'DZD')}
- Déficit: ${formatCurrency(deficit, 'DZD')}
- Niveau Critique: ${utilizationRate.toFixed(1)}% du seuil

🎯 ACTIONS IMMÉDIATES:
1. RECHARGEZ LE CRÉDIT MAINTENANT
2. Suspendez temporairement les nouvelles ventes si nécessaire
3. Contactez immédiatement le fournisseur
4. Vérifiez l'impact sur les clients existants

LIEN DIRECT: ${window.location.origin}/platforms/${platform.id}/add-credit

---
🚨 ALERTE CRITIQUE GÉNÉRÉE LE ${new Date().toLocaleString('fr-FR')} 🚨
© ${new Date().getFullYear()} ${this.settings.companyName}
    `;

    return { subject, htmlContent, textContent };
  }

  public createDailySummaryEmailTemplate(platforms: Platform[]): EmailTemplate {
    const lowCreditPlatforms = platforms.filter(p =>
      p.isActive && p.creditBalance <= p.lowBalanceThreshold
    );

    const criticalPlatforms = lowCreditPlatforms.filter(p =>
      p.creditBalance <= p.lowBalanceThreshold * 0.1
    );

    const totalDeficit = lowCreditPlatforms.reduce((sum, p) =>
      sum + Math.max(0, p.lowBalanceThreshold - p.creditBalance), 0
    );

    const subject = `📊 Résumé Quotidien - Crédits Plateformes (${lowCreditPlatforms.length} alertes)`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .summary-box { background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .platform-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .critical-card { border-left: 4px solid #dc2626; background-color: #fef2f2; }
          .warning-card { border-left: 4px solid #f59e0b; background-color: #fef3c7; }
          .metric { display: flex; justify-content: space-between; margin: 8px 0; }
          .metric-label { font-weight: bold; color: #64748b; }
          .metric-value { color: #1e293b; }
          .critical { color: #dc2626; font-weight: bold; }
          .warning { color: #f59e0b; font-weight: bold; }
          .good { color: #059669; font-weight: bold; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
          .stat-card { background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Résumé Quotidien</h1>
            <p>État des crédits plateformes - ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          <div class="content">
            <div class="summary-box">
              <h2>📈 Vue d'Ensemble</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${platforms.filter(p => p.isActive).length}</div>
                  <div>Plateformes Actives</div>
                </div>
                <div class="stat-card">
                  <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${lowCreditPlatforms.length}</div>
                  <div>Crédit Faible</div>
                </div>
                <div class="stat-card">
                  <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${criticalPlatforms.length}</div>
                  <div>Critique</div>
                </div>
                <div class="stat-card">
                  <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${formatCurrency(totalDeficit, 'DZD')}</div>
                  <div>Déficit Total</div>
                </div>
              </div>
            </div>

            ${criticalPlatforms.length > 0 ? `
            <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #dc2626; margin-top: 0;">🚨 Plateformes Critiques (${criticalPlatforms.length})</h3>
              ${criticalPlatforms.map(platform => `
                <div class="platform-card critical-card">
                  <h4 style="margin-top: 0; color: #dc2626;">${platform.name}</h4>
                  <div class="metric">
                    <span class="metric-label">Solde:</span>
                    <span class="critical">${formatCurrency(platform.creditBalance, 'DZD')}</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Déficit:</span>
                    <span class="critical">${formatCurrency(Math.max(0, platform.lowBalanceThreshold - platform.creditBalance), 'DZD')}</span>
                  </div>
                  ${platform.contactEmail ? `
                  <div class="metric">
                    <span class="metric-label">Contact:</span>
                    <span class="metric-value">${platform.contactEmail}</span>
                  </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${lowCreditPlatforms.filter(p => !criticalPlatforms.includes(p)).length > 0 ? `
            <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #d97706; margin-top: 0;">⚠️ Plateformes avec Crédit Faible (${lowCreditPlatforms.filter(p => !criticalPlatforms.includes(p)).length})</h3>
              ${lowCreditPlatforms.filter(p => !criticalPlatforms.includes(p)).map(platform => `
                <div class="platform-card warning-card">
                  <h4 style="margin-top: 0; color: #d97706;">${platform.name}</h4>
                  <div class="metric">
                    <span class="metric-label">Solde:</span>
                    <span class="warning">${formatCurrency(platform.creditBalance, 'DZD')}</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Déficit:</span>
                    <span class="warning">${formatCurrency(Math.max(0, platform.lowBalanceThreshold - platform.creditBalance), 'DZD')}</span>
                  </div>
                  ${platform.contactEmail ? `
                  <div class="metric">
                    <span class="metric-label">Contact:</span>
                    <span class="metric-value">${platform.contactEmail}</span>
                  </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${lowCreditPlatforms.length === 0 ? `
            <div style="background-color: #f0fdf4; border: 2px solid #059669; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <h3 style="color: #059669; margin-top: 0;">✅ Excellente Nouvelle!</h3>
              <p>Toutes les plateformes actives ont des soldes crédit suffisants.</p>
              <p style="font-size: 18px;">🎉 Aucune action requise aujourd'hui!</p>
            </div>
            ` : ''}

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Actions Recommandées</h3>
              <ul>
                ${criticalPlatforms.length > 0 ? '<li><strong>URGENT:</strong> Rechargez immédiatement les plateformes critiques</li>' : ''}
                ${lowCreditPlatforms.length > 0 ? '<li>Planifiez le rechargement des plateformes avec crédit faible</li>' : ''}
                <li>Vérifiez les prévisions de consommation pour les prochains jours</li>
                <li>Contactez les fournisseurs si nécessaire</li>
                <li>Ajustez les seuils d'alerte si approprié</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/dashboard?tab=financial" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📊 Voir le Tableau de Bord
              </a>
            </div>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.settings.companyName}. Tous droits réservés.</p>
            <p>Résumé quotidien généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Prochaine vérification dans 24 heures</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
RÉSUMÉ QUOTIDIEN - CRÉDITS PLATEFORMES
${new Date().toLocaleDateString('fr-FR')}

📈 VUE D'ENSEMBLE:
- Plateformes Actives: ${platforms.filter(p => p.isActive).length}
- Crédit Faible: ${lowCreditPlatforms.length}
- Critique: ${criticalPlatforms.length}
- Déficit Total: ${formatCurrency(totalDeficit, 'DZD')}

${criticalPlatforms.length > 0 ? `
🚨 PLATEFORMES CRITIQUES (${criticalPlatforms.length}):
${criticalPlatforms.map(platform => `
- ${platform.name}
  Solde: ${formatCurrency(platform.creditBalance, 'DZD')}
  Déficit: ${formatCurrency(Math.max(0, platform.lowBalanceThreshold - platform.creditBalance), 'DZD')}
  ${platform.contactEmail ? `Contact: ${platform.contactEmail}` : ''}
`).join('')}
` : ''}

${lowCreditPlatforms.filter(p => !criticalPlatforms.includes(p)).length > 0 ? `
⚠️ PLATEFORMES AVEC CRÉDIT FAIBLE (${lowCreditPlatforms.filter(p => !criticalPlatforms.includes(p)).length}):
${lowCreditPlatforms.filter(p => !criticalPlatforms.includes(p)).map(platform => `
- ${platform.name}
  Solde: ${formatCurrency(platform.creditBalance, 'DZD')}
  Déficit: ${formatCurrency(Math.max(0, platform.lowBalanceThreshold - platform.creditBalance), 'DZD')}
  ${platform.contactEmail ? `Contact: ${platform.contactEmail}` : ''}
`).join('')}
` : ''}

${lowCreditPlatforms.length === 0 ? `
✅ EXCELLENTE NOUVELLE!
Toutes les plateformes actives ont des soldes crédit suffisants.
🎉 Aucune action requise aujourd'hui!
` : ''}

📋 ACTIONS RECOMMANDÉES:
${criticalPlatforms.length > 0 ? '- URGENT: Rechargez immédiatement les plateformes critiques' : ''}
${lowCreditPlatforms.length > 0 ? '- Planifiez le rechargement des plateformes avec crédit faible' : ''}
- Vérifiez les prévisions de consommation pour les prochains jours
- Contactez les fournisseurs si nécessaire
- Ajustez les seuils d'alerte si approprié

Tableau de bord: ${window.location.origin}/dashboard?tab=financial

---
Résumé quotidien généré automatiquement le ${new Date().toLocaleString('fr-FR')}
© ${new Date().getFullYear()} ${this.settings.companyName}
    `;

    return { subject, htmlContent, textContent };
  }

  // Email Sending Functions
  public async sendLowCreditAlert(platform: Platform, threshold: number): Promise<{ success: boolean; message: string }> {
    if (!this.settings.enabled) {
      return { success: false, message: 'Email alerts are disabled' };
    }

    const template = this.createLowCreditEmailTemplate(platform, threshold);
    const recipients = this.getRecipientsForPlatform(platform.id);

    return this.sendEmail(recipients, template);
  }

  public async sendCriticalCreditAlert(platform: Platform, threshold: number): Promise<{ success: boolean; message: string }> {
    if (!this.settings.enabled) {
      return { success: false, message: 'Email alerts are disabled' };
    }

    const template = this.createCriticalCreditEmailTemplate(platform, threshold);
    const recipients = this.getRecipientsForPlatform(platform.id);

    return this.sendEmail(recipients, template);
  }

  public async sendDailySummary(platforms: Platform[]): Promise<{ success: boolean; message: string }> {
    if (!this.settings.enabled) {
      return { success: false, message: 'Email alerts are disabled' };
    }

    const template = this.createDailySummaryEmailTemplate(platforms);
    const recipients = this.settings.recipients.filter(r =>
      r.role === 'admin' || r.role === 'manager'
    );

    return this.sendEmail(recipients, template);
  }

  private getRecipientsForPlatform(platformId: string): EmailRecipient[] {
    return this.settings.recipients.filter(recipient => {
      // Send to admins and managers always
      if (recipient.role === 'admin' || recipient.role === 'manager') {
        return true;
      }

      // Send to operators only if they're assigned to this platform
      if (recipient.role === 'operator') {
        return !recipient.platformIds || recipient.platformIds.includes(platformId);
      }

      // Send to recipients without specific platform assignments
      return !recipient.platformIds || recipient.platformIds.length === 0;
    });
  }

  private async sendEmail(recipients: EmailRecipient[], template: EmailTemplate): Promise<{ success: boolean; message: string }> {
    try {
      if (recipients.length === 0) {
        return { success: false, message: 'No recipients configured' };
      }

      // Simulate email sending (in production, integrate with actual email service)
      console.log('📧 Sending email alert (simulation)');
      console.log('Recipients:', recipients.map(r => r.email).join(', '));
      console.log('Subject:', template.subject);

      // Store sent email for demo purposes
      const sentEmail = {
        id: Date.now().toString(),
        recipients: recipients.map(r => r.email),
        subject: template.subject,
        content: template.htmlContent,
        sentAt: new Date().toISOString(),
        type: 'alert'
      };

      const sentEmails = JSON.parse(localStorage.getItem('sentAlertEmails') || '[]');
      sentEmails.push(sentEmail);
      localStorage.setItem('sentAlertEmails', JSON.stringify(sentEmails));

      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: `Email sent to ${recipients.length} recipient(s): ${recipients.map(r => r.email).join(', ')}`
      };
    } catch (error) {
      console.error('Error sending email alert:', error);
      return {
        success: false,
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Utility Functions
  public testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    const testTemplate: EmailTemplate = {
      subject: 'Test - Configuration Email Alerts',
      htmlContent: `
        <h2>Test de Configuration</h2>
        <p>Ceci est un email de test pour vérifier la configuration des alertes email.</p>
        <p>Si vous recevez cet email, la configuration fonctionne correctement.</p>
        <p>Envoyé le: ${new Date().toLocaleString('fr-FR')}</p>
      `,
      textContent: `
Test de Configuration

Ceci est un email de test pour vérifier la configuration des alertes email.
Si vous recevez cet email, la configuration fonctionne correctement.

Envoyé le: ${new Date().toLocaleString('fr-FR')}
      `
    };

    return this.sendEmail(this.settings.recipients, testTemplate);
  }

  public getSentEmailHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('sentAlertEmails') || '[]');
    } catch (error) {
      console.error('Error loading sent email history:', error);
      return [];
    }
  }

  public clearEmailHistory(): void {
    localStorage.removeItem('sentAlertEmails');
  }
}

// Export singleton instance
export const emailAlertService = new EmailAlertService();