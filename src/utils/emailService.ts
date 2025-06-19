import { EmailVerificationRequest, User } from '../types';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export const emailService = {
  // Créer le template d'email de vérification
  createVerificationEmailTemplate(
    user: User, 
    verificationToken: string, 
    companyName: string = 'Digital Manager'
  ): EmailTemplate {
    const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;
    
    const subject = `Confirmez votre inscription à ${companyName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation d'inscription</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .security-info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Confirmation d'inscription</h1>
            <p>Bienvenue chez ${companyName}</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${user.username},</h2>
            
            <p>Merci de vous être inscrit sur notre plateforme de gestion d'abonnements digitaux !</p>
            
            <p>Pour activer votre compte et commencer à utiliser nos services, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                ✅ Activer mon compte
              </a>
            </div>
            
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <div class="security-info">
              <h3>🛡️ Informations de sécurité :</h3>
              <ul>
                <li>Ce lien expire dans 24 heures</li>
                <li>Votre email : ${user.email}</li>
                <li>Date d'inscription : ${new Date().toLocaleDateString('fr-FR')}</li>
                <li>Si vous n'avez pas créé ce compte, ignorez cet email</li>
              </ul>
            </div>
            
            <p>Une fois votre compte activé, vous pourrez :</p>
            <ul>
              <li>📊 Gérer vos produits digitaux</li>
              <li>👥 Suivre votre base de clients</li>
              <li>💰 Analyser vos ventes et bénéfices</li>
              <li>📈 Générer des rapports détaillés</li>
            </ul>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>L'équipe ${companyName}</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Confirmez votre inscription à ${companyName}

Bonjour ${user.username},

Merci de vous être inscrit sur notre plateforme de gestion d'abonnements digitaux !

Pour activer votre compte, cliquez sur ce lien :
${verificationUrl}

Ce lien expire dans 24 heures.

Informations de sécurité :
- Votre email : ${user.email}
- Date d'inscription : ${new Date().toLocaleDateString('fr-FR')}
- Si vous n'avez pas créé ce compte, ignorez cet email

Cordialement,
L'équipe ${companyName}
    `;
    
    return { subject, htmlContent, textContent };
  },

  // Simuler l'envoi d'email (pour la démo)
  async sendVerificationEmail(
    user: User, 
    verificationToken: string, 
    companyName: string = 'Digital Manager'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const emailTemplate = this.createVerificationEmailTemplate(user, verificationToken, companyName);
      
      // Simulation de l'envoi d'email
      console.log('📧 Email de vérification envoyé (simulation)');
      console.log('Destinataire:', user.email);
      console.log('Sujet:', emailTemplate.subject);
      console.log('Token de vérification:', verificationToken);
      console.log('Contenu HTML:', emailTemplate.htmlContent);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Stocker l'email dans le localStorage pour la démo
      const sentEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
      sentEmails.push({
        id: Date.now().toString(),
        to: user.email,
        subject: emailTemplate.subject,
        content: emailTemplate.htmlContent,
        token: verificationToken,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem('sentEmails', JSON.stringify(sentEmails));
      
      return {
        success: true,
        message: `Email de vérification envoyé à ${user.email}`,
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de vérification',
      };
    }
  },

  // Créer un email de bienvenue après vérification
  createWelcomeEmailTemplate(user: User, companyName: string = 'Digital Manager'): EmailTemplate {
    const subject = `Bienvenue sur ${companyName} ! Votre compte est activé`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #10B981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue ${user.username} !</h1>
            <p>Votre compte ${companyName} est maintenant activé</p>
          </div>
          
          <div class="content">
            <h2>Félicitations ! 🚀</h2>
            
            <p>Votre compte a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme.</p>
            
            <h3>🔧 Fonctionnalités disponibles :</h3>
            
            <div class="feature">
              <h4>📦 Gestion de Stock</h4>
              <p>Gérez vos produits digitaux, suivez vos stocks et recevez des alertes automatiques.</p>
            </div>
            
            <div class="feature">
              <h4>👥 Base de Données Clients</h4>
              <p>Organisez vos clients avec leurs informations de contact et réseaux sociaux.</p>
            </div>
            
            <div class="feature">
              <h4>💰 Suivi Financier</h4>
              <p>Analysez vos ventes, calculez vos bénéfices et générez des rapports détaillés.</p>
            </div>
            
            <div class="feature">
              <h4>📊 Rapports et Statistiques</h4>
              <p>Obtenez des insights précieux sur votre activité avec nos outils d'analyse.</p>
            </div>
            
            <h3>🎯 Prochaines étapes :</h3>
            <ol>
              <li>Connectez-vous à votre compte</li>
              <li>Configurez vos paramètres dans la section "Paramètres"</li>
              <li>Ajoutez vos premiers produits digitaux</li>
              <li>Importez votre base de clients existante</li>
              <li>Commencez à enregistrer vos ventes</li>
            </ol>
            
            <p>Si vous avez besoin d'aide, consultez notre documentation ou contactez notre support.</p>
            
            <p>Bonne gestion ! 💪</p>
            
            <p>L'équipe ${companyName}</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Bienvenue sur ${companyName} !

Bonjour ${user.username},

Félicitations ! Votre compte a été vérifié avec succès.

Fonctionnalités disponibles :
- Gestion de Stock
- Base de Données Clients  
- Suivi Financier
- Rapports et Statistiques

Prochaines étapes :
1. Connectez-vous à votre compte
2. Configurez vos paramètres
3. Ajoutez vos premiers produits
4. Importez votre base de clients
5. Commencez à enregistrer vos ventes

L'équipe ${companyName}
    `;
    
    return { subject, htmlContent, textContent };
  },

  // Envoyer l'email de bienvenue
  async sendWelcomeEmail(user: User, companyName: string = 'Digital Manager'): Promise<{ success: boolean; message: string }> {
    try {
      const emailTemplate = this.createWelcomeEmailTemplate(user, companyName);
      
      console.log('📧 Email de bienvenue envoyé (simulation)');
      console.log('Destinataire:', user.email);
      console.log('Sujet:', emailTemplate.subject);
      
      return {
        success: true,
        message: `Email de bienvenue envoyé à ${user.email}`,
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de bienvenue',
      };
    }
  },
};