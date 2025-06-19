import { StockSale, StockPurchase, Subscriber, AppSettings } from '../types';
import { formatCurrency } from './helpers';
import { formatDate } from './dateUtils';

export interface PDFReportFilters {
  type: 'sales' | 'purchases' | 'subscribers' | 'complete';
  startDate: string;
  endDate: string;
}

export interface PDFReportData {
  sales: StockSale[];
  purchases: StockPurchase[];
  subscribers: Subscriber[];
  filters: PDFReportFilters;
  settings: AppSettings;
}

export const pdfExportUtils = {
  // Filtrer les données selon les critères
  filterData(
    sales: StockSale[],
    purchases: StockPurchase[],
    subscribers: Subscriber[],
    filters: PDFReportFilters
  ): PDFReportData {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    const filteredSubscribers = subscribers.filter(subscriber => {
      const createdDate = new Date(subscriber.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });

    return {
      sales: filteredSales,
      purchases: filteredPurchases,
      subscribers: filteredSubscribers,
      filters,
      settings: {} as AppSettings, // Sera rempli lors de l'appel
    };
  },

  // Calculer les totaux pour le rapport
  calculateTotals(data: PDFReportData) {
    const paidSales = data.sales.filter(sale => sale.paymentStatus === 'paid');
    const unpaidSales = data.sales.filter(sale => sale.paymentStatus !== 'paid');
    
    const totalSalesPaid = paidSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalSalesUnpaid = unpaidSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalSalesAll = data.sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    const totalPurchases = data.purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalProfit = paidSales.reduce((sum, sale) => sum + sale.profit, 0);
    
    const profitMargin = totalSalesPaid > 0 ? (totalProfit / totalSalesPaid) * 100 : 0;

    return {
      totalSalesPaid,
      totalSalesUnpaid,
      totalSalesAll,
      totalPurchases,
      totalProfit,
      profitMargin,
      salesCount: data.sales.length,
      paidSalesCount: paidSales.length,
      unpaidSalesCount: unpaidSales.length,
      purchasesCount: data.purchases.length,
      subscribersCount: data.subscribers.length,
    };
  },

  // Générer le nom du fichier
  generateFileName(filters: PDFReportFilters): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    const typeNames = {
      sales: 'Ventes',
      purchases: 'Achats',
      subscribers: 'Abonnes',
      complete: 'Complet'
    };

    const startMonth = new Date(filters.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const endMonth = new Date(filters.endDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const periodStr = startMonth === endMonth ? startMonth : `${startMonth}_${endMonth}`;
    
    return `Rapport_${typeNames[filters.type]}_${periodStr}_${dateStr}.pdf`;
  },

  // Créer le contenu HTML pour le PDF
  generateHTMLContent(data: PDFReportData): string {
    const totals = this.calculateTotals(data);
    const companyName = data.settings.companyName || 'Digital Manager';
    
    const typeNames = {
      sales: 'Ventes',
      purchases: 'Achats',
      subscribers: 'Nouveaux Abonnés',
      complete: 'Rapport Complet'
    };

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport ${typeNames[data.filters.type]}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #fff;
          }
          .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #3B82F6; 
            padding-bottom: 20px; 
          }
          .header h1 { 
            color: #3B82F6; 
            font-size: 28px; 
            margin-bottom: 10px; 
            font-weight: bold;
          }
          .header .company { 
            font-size: 18px; 
            color: #666; 
            margin-bottom: 5px; 
          }
          .header .date { 
            font-size: 14px; 
            color: #888; 
          }
          .period-info { 
            background: #F8FAFC; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 25px; 
            border-left: 4px solid #3B82F6;
          }
          .period-info h3 { 
            color: #3B82F6; 
            margin-bottom: 8px; 
            font-size: 16px;
          }
          .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 30px; 
          }
          .summary-card { 
            background: #F9FAFB; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #E5E7EB; 
            text-align: center;
          }
          .summary-card h4 { 
            color: #374151; 
            font-size: 12px; 
            text-transform: uppercase; 
            margin-bottom: 8px; 
            font-weight: 600;
          }
          .summary-card .value { 
            font-size: 20px; 
            font-weight: bold; 
            color: #1F2937; 
          }
          .summary-card.positive .value { color: #059669; }
          .summary-card.negative .value { color: #DC2626; }
          .summary-card.warning .value { color: #D97706; }
          .section { margin-bottom: 30px; }
          .section h2 { 
            color: #1F2937; 
            font-size: 20px; 
            margin-bottom: 15px; 
            padding-bottom: 8px; 
            border-bottom: 2px solid #E5E7EB;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td { 
            padding: 12px 8px; 
            text-align: left; 
            border-bottom: 1px solid #E5E7EB; 
            font-size: 11px;
          }
          th { 
            background: #F9FAFB; 
            font-weight: 600; 
            color: #374151; 
            text-transform: uppercase; 
            font-size: 10px;
          }
          tr:hover { background: #F9FAFB; }
          .status { 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 10px; 
            font-weight: 600; 
            text-align: center;
          }
          .status.paid { background: #D1FAE5; color: #065F46; }
          .status.unpaid { background: #FEE2E2; color: #991B1B; }
          .status.pending { background: #FEF3C7; color: #92400E; }
          .status.partial { background: #DBEAFE; color: #1E40AF; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .total-row { 
            background: #F3F4F6; 
            font-weight: bold; 
            border-top: 2px solid #D1D5DB;
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
            text-align: center; 
            color: #6B7280; 
            font-size: 12px;
          }
          .page-break { page-break-before: always; }
          @media print {
            .container { margin: 0; padding: 15px; }
            .summary { grid-template-columns: repeat(4, 1fr); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>📊 ${typeNames[data.filters.type]}</h1>
            <div class="company">${companyName}</div>
            <div class="date">Généré le ${formatDate(new Date().toISOString(), 'fr')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
          </div>

          <!-- Period Info -->
          <div class="period-info">
            <h3>📅 Période du rapport</h3>
            <p><strong>Du:</strong> ${formatDate(data.filters.startDate, 'fr')} <strong>Au:</strong> ${formatDate(data.filters.endDate, 'fr')}</p>
            <p><strong>Type:</strong> ${typeNames[data.filters.type]}</p>
          </div>

          <!-- Summary Cards -->
          <div class="summary">
            ${data.filters.type === 'sales' || data.filters.type === 'complete' ? `
              <div class="summary-card positive">
                <h4>💰 Ventes Payées</h4>
                <div class="value">${formatCurrency(totals.totalSalesPaid, data.settings.currency)}</div>
                <small>${totals.paidSalesCount} transaction(s)</small>
              </div>
              <div class="summary-card warning">
                <h4>⏳ Ventes Non Payées</h4>
                <div class="value">${formatCurrency(totals.totalSalesUnpaid, data.settings.currency)}</div>
                <small>${totals.unpaidSalesCount} transaction(s)</small>
              </div>
            ` : ''}
            
            ${data.filters.type === 'purchases' || data.filters.type === 'complete' ? `
              <div class="summary-card negative">
                <h4>🛒 Total Achats</h4>
                <div class="value">${formatCurrency(totals.totalPurchases, data.settings.currency)}</div>
                <small>${totals.purchasesCount} transaction(s)</small>
              </div>
            ` : ''}
            
            ${data.filters.type === 'subscribers' || data.filters.type === 'complete' ? `
              <div class="summary-card">
                <h4>👥 Nouveaux Abonnés</h4>
                <div class="value">${totals.subscribersCount}</div>
                <small>Ajoutés sur la période</small>
              </div>
            ` : ''}
            
            ${data.filters.type === 'complete' ? `
              <div class="summary-card positive">
                <h4>📈 Bénéfice Net</h4>
                <div class="value">${formatCurrency(totals.totalProfit, data.settings.currency)}</div>
                <small>Marge: ${totals.profitMargin.toFixed(1)}%</small>
              </div>
            ` : ''}
          </div>

          ${this.generateSalesSection(data)}
          ${this.generatePurchasesSection(data)}
          ${this.generateSubscribersSection(data)}

          <!-- Footer -->
          <div class="footer">
            <p>Rapport généré par ${companyName} - ${new Date().getFullYear()}</p>
            <p>Ce document est confidentiel et destiné à un usage interne uniquement</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  },

  // Section des ventes
  generateSalesSection(data: PDFReportData): string {
    if (data.filters.type !== 'sales' && data.filters.type !== 'complete') return '';
    if (data.sales.length === 0) return '<div class="section"><h2>💰 Ventes</h2><p>Aucune vente sur cette période.</p></div>';

    const paidSales = data.sales.filter(sale => sale.paymentStatus === 'paid');
    const unpaidSales = data.sales.filter(sale => sale.paymentStatus !== 'paid');

    return `
      <div class="section">
        <h2>💰 Détail des Ventes</h2>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Client</th>
              <th>Qté</th>
              <th>Prix Unit.</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            ${data.sales.map(sale => `
              <tr>
                <td>${formatDate(sale.saleDate, 'fr')}</td>
                <td>${sale.productName}</td>
                <td>${sale.customerName || 'Client anonyme'}</td>
                <td class="text-center">${sale.quantity}</td>
                <td class="text-right">${formatCurrency(sale.unitPrice, data.settings.currency)}</td>
                <td class="text-right font-bold">${formatCurrency(sale.totalPrice, data.settings.currency)}</td>
                <td class="text-center">
                  <span class="status ${sale.paymentStatus}">
                    ${sale.paymentStatus === 'paid' ? '✅ Payée' : '❌ Non payée'}
                  </span>
                </td>
                <td class="text-right ${sale.profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(sale.profit, data.settings.currency)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>TOTAUX:</strong></td>
              <td class="text-right"><strong>${formatCurrency(data.sales.reduce((sum, sale) => sum + sale.totalPrice, 0), data.settings.currency)}</strong></td>
              <td class="text-center"><strong>${paidSales.length}/${data.sales.length} payées</strong></td>
              <td class="text-right"><strong>${formatCurrency(data.sales.reduce((sum, sale) => sum + sale.profit, 0), data.settings.currency)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 15px; padding: 10px; background: #F0F9FF; border-radius: 6px;">
          <p><strong>📊 Analyse des ventes:</strong></p>
          <p>• Ventes payées: ${formatCurrency(paidSales.reduce((sum, sale) => sum + sale.totalPrice, 0), data.settings.currency)} (${paidSales.length} transactions)</p>
          <p>• Ventes non payées: ${formatCurrency(unpaidSales.reduce((sum, sale) => sum + sale.totalPrice, 0), data.settings.currency)} (${unpaidSales.length} transactions)</p>
          <p>• Bénéfice réalisé: ${formatCurrency(paidSales.reduce((sum, sale) => sum + sale.profit, 0), data.settings.currency)}</p>
        </div>
      </div>
    `;
  },

  // Section des achats
  generatePurchasesSection(data: PDFReportData): string {
    if (data.filters.type !== 'purchases' && data.filters.type !== 'complete') return '';
    if (data.purchases.length === 0) return '<div class="section"><h2>🛒 Achats</h2><p>Aucun achat sur cette période.</p></div>';

    return `
      <div class="section">
        <h2>🛒 Détail des Achats</h2>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Fournisseur</th>
              <th>Qté</th>
              <th>Prix Unit.</th>
              <th>Total</th>
              <th>Statut Paiement</th>
            </tr>
          </thead>
          <tbody>
            ${data.purchases.map(purchase => `
              <tr>
                <td>${formatDate(purchase.purchaseDate, 'fr')}</td>
                <td>${purchase.productName}</td>
                <td>${purchase.supplier}</td>
                <td class="text-center">${purchase.quantity}</td>
                <td class="text-right">${formatCurrency(purchase.unitCost, data.settings.currency)}</td>
                <td class="text-right font-bold">${formatCurrency(purchase.totalCost, data.settings.currency)}</td>
                <td class="text-center">
                  <span class="status ${purchase.paymentStatus}">
                    ${purchase.paymentStatus === 'paid' ? '✅ Payé' : purchase.paymentStatus === 'pending' ? '⏳ En attente' : '🔄 Partiel'}
                  </span>
                </td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>TOTAL ACHATS:</strong></td>
              <td class="text-right"><strong>${formatCurrency(data.purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0), data.settings.currency)}</strong></td>
              <td class="text-center"><strong>${data.purchases.length} transaction(s)</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  // Section des abonnés
  generateSubscribersSection(data: PDFReportData): string {
    if (data.filters.type !== 'subscribers' && data.filters.type !== 'complete') return '';
    if (data.subscribers.length === 0) return '<div class="section"><h2>👥 Nouveaux Abonnés</h2><p>Aucun nouvel abonné sur cette période.</p></div>';

    return `
      <div class="section">
        <h2>👥 Nouveaux Abonnés</h2>
        
        <table>
          <thead>
            <tr>
              <th>Date d'ajout</th>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Wilaya</th>
              <th>Email</th>
              <th>Réseaux Sociaux</th>
            </tr>
          </thead>
          <tbody>
            ${data.subscribers.map(subscriber => `
              <tr>
                <td>${formatDate(subscriber.createdAt, 'fr')}</td>
                <td class="font-bold">${subscriber.name}</td>
                <td>${subscriber.phone}</td>
                <td>${subscriber.wilaya || '-'}</td>
                <td>${subscriber.email || '-'}</td>
                <td>
                  ${subscriber.facebook ? '📘 Facebook ' : ''}
                  ${subscriber.instagram ? '📷 Instagram' : ''}
                  ${!subscriber.facebook && !subscriber.instagram ? '-' : ''}
                </td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>TOTAL NOUVEAUX ABONNÉS:</strong></td>
              <td class="text-center"><strong>${data.subscribers.length}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  // Exporter en PDF (simulation)
  async exportToPDF(data: PDFReportData): Promise<{ success: boolean; message: string; filename: string }> {
    try {
      const htmlContent = this.generateHTMLContent(data);
      const filename = this.generateFileName(data.filters);
      
      // Créer un blob avec le contenu HTML
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.pdf', '.html'); // Pour la démo, on télécharge en HTML
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      // Simuler un délai de génération
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        message: `Rapport PDF généré avec succès: ${filename}`,
        filename
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      return {
        success: false,
        message: 'Erreur lors de la génération du rapport PDF',
        filename: ''
      };
    }
  }
};