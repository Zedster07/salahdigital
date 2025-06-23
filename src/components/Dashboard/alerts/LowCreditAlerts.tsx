import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/helpers';
import { 
  AlertTriangle, 
  CreditCard, 
  Plus, 
  Eye, 
  X,
  Zap,
  Clock,
  TrendingDown
} from 'lucide-react';
import { Platform } from '../../../types';

interface LowCreditAlertsProps {
  platforms: Platform[];
}

export function LowCreditAlerts({ platforms }: LowCreditAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const visiblePlatforms = platforms.filter(platform => 
    !dismissedAlerts.has(platform.id)
  );

  const dismissAlert = (platformId: string) => {
    setDismissedAlerts(prev => new Set([...prev, platformId]));
  };

  const getAlertSeverity = (platform: Platform) => {
    const ratio = platform.creditBalance / platform.lowBalanceThreshold;
    if (ratio <= 0.1) return 'critical'; // 10% or less
    if (ratio <= 0.5) return 'high'; // 50% or less
    return 'medium';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        };
      case 'high':
        return {
          container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-900 dark:text-orange-100',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
        };
      default:
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-100',
          text: 'text-yellow-700 dark:text-yellow-300',
          badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
        };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'CRITIQUE';
      case 'high': return 'ÉLEVÉ';
      default: return 'MOYEN';
    }
  };

  if (visiblePlatforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Alertes Crédit Faible ({visiblePlatforms.length})
        </h2>
        {dismissedAlerts.size > 0 && (
          <button
            onClick={() => setDismissedAlerts(new Set())}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Afficher toutes les alertes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visiblePlatforms.map((platform) => {
          const severity = getAlertSeverity(platform);
          const styles = getSeverityStyles(severity);
          const isExpanded = expandedAlert === platform.id;
          const utilizationPercentage = (platform.creditBalance / platform.lowBalanceThreshold) * 100;

          return (
            <div
              key={platform.id}
              className={`rounded-lg border p-4 ${styles.container} transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <CreditCard className={`h-5 w-5 ${styles.icon}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className={`text-sm font-semibold ${styles.title} truncate`}>
                        {platform.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badge}`}>
                        {getSeverityLabel(severity)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${styles.text}`}>Solde actuel:</span>
                        <span className={`text-sm font-medium ${styles.title}`}>
                          {formatCurrency(platform.creditBalance, 'DZD')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${styles.text}`}>Seuil d'alerte:</span>
                        <span className={`text-sm font-medium ${styles.text}`}>
                          {formatCurrency(platform.lowBalanceThreshold, 'DZD')}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            severity === 'critical' ? 'bg-red-500' :
                            severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className={styles.text}>
                          {utilizationPercentage.toFixed(1)}% du seuil
                        </span>
                        {severity === 'critical' && (
                          <span className="flex items-center text-red-600 dark:text-red-400">
                            <Zap className="h-3 w-3 mr-1" />
                            Action requise
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={`block ${styles.text}`}>Contact:</span>
                            <span className={`font-medium ${styles.title}`}>
                              {platform.contactName || 'Non défini'}
                            </span>
                          </div>
                          <div>
                            <span className={`block ${styles.text}`}>Email:</span>
                            <span className={`font-medium ${styles.title} truncate`}>
                              {platform.contactEmail || 'Non défini'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className={`h-4 w-4 ${styles.icon}`} />
                          <span className={`text-sm ${styles.text}`}>
                            Dernière mise à jour: {new Date(platform.updatedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2 pt-2">
                          <button className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter Crédit
                          </button>
                          <button className="flex items-center px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <Eye className="h-3 w-3 mr-1" />
                            Voir Détails
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => setExpandedAlert(isExpanded ? null : platform.id)}
                    className={`p-1 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors ${styles.text}`}
                    title={isExpanded ? 'Réduire' : 'Développer'}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => dismissAlert(platform.id)}
                    className={`p-1 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors ${styles.text}`}
                    title="Ignorer cette alerte"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {platforms.filter(p => getAlertSeverity(p) === 'critical').length} Critique
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {platforms.filter(p => getAlertSeverity(p) === 'high').length} Élevé
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {platforms.filter(p => getAlertSeverity(p) === 'medium').length} Moyen
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total à recharger: {formatCurrency(
              platforms.reduce((sum, p) => sum + Math.max(0, p.lowBalanceThreshold - p.creditBalance), 0),
              'DZD'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
