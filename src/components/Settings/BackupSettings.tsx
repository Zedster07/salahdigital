import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { pdfExportUtils, PDFReportFilters } from '../../utils/pdfExportUtils';
import { Download, FileText, Calendar, Filter, CheckCircle, AlertTriangle } from 'lucide-react';

export function BackupSettings() {
  const { state } = useApp();
  const { stockSales, stockPurchases, subscribers, settings } = state;
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [filters, setFilters] = useState<PDFReportFilters>({
    type: 'complete',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Premier jour du mois
    endDate: new Date().toISOString().split('T')[0], // Aujourd'hui
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportMessage('');
    setExportStatus('idle');

    try {
      // Filtrer les données
      const filteredData = pdfExportUtils.filterData(
        stockSales,
        stockPurchases,
        subscribers,
        filters
      );
      
      // Ajouter les paramètres
      filteredData.settings = settings;

      // Vérifier s'il y a des données
      const hasData = 
        (filters.type === 'sales' && filteredData.sales.length > 0) ||
        (filters.type === 'purchases' && filteredData.purchases.length > 0) ||
        (filters.type === 'subscribers' && filteredData.subscribers.length > 0) ||
        (filters.type === 'complete' && (filteredData.sales.length > 0 || filteredData.purchases.length > 0 || filteredData.subscribers.length > 0));

      if (!hasData) {
        setExportStatus('error');
        setExportMessage('Aucune donnée trouvée pour la période et le type sélectionnés');
        setIsExporting(false);
        return;
      }

      // Générer le PDF
      const result = await pdfExportUtils.exportToPDF(filteredData);
      
      if (result.success) {
        setExportStatus('success');
        setExportMessage(result.message);
      } else {
        setExportStatus('error');
        setExportMessage(result.message);
      }

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setExportStatus('error');
      setExportMessage('Erreur lors de la génération du rapport');
    }

    setIsExporting(false);
    setTimeout(() => {
      setExportMessage('');
      setExportStatus('idle');
    }, 5000);
  };

  const getDataCount = () => {
    const filteredData = pdfExportUtils.filterData(stockSales, stockPurchases, subscribers, filters);
    
    switch (filters.type) {
      case 'sales':
        return `${filteredData.sales.length} vente(s)`;
      case 'purchases':
        return `${filteredData.purchases.length} achat(s)`;
      case 'subscribers':
        return `${filteredData.subscribers.length} abonné(s)`;
      case 'complete':
        return `${filteredData.sales.length} vente(s), ${filteredData.purchases.length} achat(s), ${filteredData.subscribers.length} abonné(s)`;
      default:
        return '';
    }
  };

  const getPreviewTotals = () => {
    const filteredData = pdfExportUtils.filterData(stockSales, stockPurchases, subscribers, filters);
    filteredData.settings = settings;
    return pdfExportUtils.calculateTotals(filteredData);
  };

  const previewTotals = getPreviewTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Sauvegarde & Export
            </h3>
            <p className="text-gray-600 mt-1">
              Exportez vos rapports détaillés au format PDF
            </p>
          </div>
          {exportMessage && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              exportStatus === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {exportStatus === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="text-sm">{exportMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Export PDF Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Exportation de Rapport PDF
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Filtres */}
          <div className="space-y-6">
            <h5 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filtres du rapport
            </h5>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de données *
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="complete">📊 Rapport Complet (Ventes + Achats + Abonnés)</option>
                <option value="sales">💰 Transactions de Vente Uniquement</option>
                <option value="purchases">🛒 Transactions d'Achat Uniquement</option>
                <option value="subscribers">👥 Liste des Nouveaux Abonnés</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Date de début *
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Raccourcis de période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raccourcis de période
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setFilters(prev => ({
                      ...prev,
                      startDate: today.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    }));
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setFilters(prev => ({
                      ...prev,
                      startDate: firstDay.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    }));
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ce mois
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    setFilters(prev => ({
                      ...prev,
                      startDate: lastMonth.toISOString().split('T')[0],
                      endDate: lastDayOfLastMonth.toISOString().split('T')[0]
                    }));
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mois dernier
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), 0, 1);
                    setFilters(prev => ({
                      ...prev,
                      startDate: firstDay.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    }));
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cette année
                </button>
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="space-y-6">
            <h5 className="text-sm font-medium text-gray-700 mb-4">
              📋 Aperçu du rapport
            </h5>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h6 className="text-sm font-medium text-gray-900 mb-3">Données incluses:</h6>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Période:</strong> Du {new Date(filters.startDate).toLocaleDateString('fr-FR')} au {new Date(filters.endDate).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Contenu:</strong> {getDataCount()}
              </p>
              
              {/* Totaux prévisualisés */}
              {(filters.type === 'sales' || filters.type === 'complete') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ventes payées:</span>
                    <span className="font-medium text-green-600">
                      {previewTotals.totalSalesPaid.toLocaleString('fr-FR')} {settings.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ventes non payées:</span>
                    <span className="font-medium text-red-600">
                      {previewTotals.totalSalesUnpaid.toLocaleString('fr-FR')} {settings.currency}
                    </span>
                  </div>
                </div>
              )}
              
              {(filters.type === 'purchases' || filters.type === 'complete') && (
                <div className="flex justify-between text-sm">
                  <span>Total achats:</span>
                  <span className="font-medium text-blue-600">
                    {previewTotals.totalPurchases.toLocaleString('fr-FR')} {settings.currency}
                  </span>
                </div>
              )}
              
              {filters.type === 'complete' && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Bénéfice net:</span>
                    <span className={previewTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {previewTotals.totalProfit.toLocaleString('fr-FR')} {settings.currency}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h6 className="text-sm font-medium text-blue-900 mb-2">📄 Contenu du rapport PDF:</h6>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Présentation claire avec en-têtes et totaux</li>
                <li>• Statut de chaque transaction (Payée ✅ / Non payée ❌)</li>
                <li>• Calculs automatiques des bénéfices</li>
                <li>• Tableaux détaillés par type de données</li>
                <li>• Résumé financier avec analyses</li>
                <li>• Date d'exportation dans le nom du fichier</li>
              </ul>
            </div>
            
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Exporter un rapport PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Informations importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-yellow-900 mb-3">⚠️ Informations importantes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div>
            <h5 className="font-medium mb-2">📊 Calculs des totaux:</h5>
            <ul className="space-y-1">
              <li>• Les transactions "non payées" sont affichées mais exclues des totaux</li>
              <li>• Le bénéfice est calculé uniquement sur les ventes payées</li>
              <li>• Les marges sont calculées automatiquement</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📁 Format du fichier:</h5>
            <ul className="space-y-1">
              <li>• Nom automatique: Rapport_Type_Période_Date.pdf</li>
              <li>• Format professionnel avec logo et en-têtes</li>
              <li>• Optimisé pour l'impression A4</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistiques des données */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          📈 Statistiques des Données
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stockSales.length}</p>
            <p className="text-sm text-blue-700">Ventes totales</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stockPurchases.length}</p>
            <p className="text-sm text-green-700">Achats totaux</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{subscribers.length}</p>
            <p className="text-sm text-purple-700">Clients</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {stockSales.filter(s => s.paymentStatus === 'paid').length}
            </p>
            <p className="text-sm text-orange-700">Ventes payées</p>
          </div>
        </div>
      </div>
    </div>
  );
}