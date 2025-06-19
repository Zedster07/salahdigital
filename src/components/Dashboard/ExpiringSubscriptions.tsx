import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { formatDate, isExpiringSoon, getDaysUntilExpiry } from '../../utils/dateUtils';
import { getSubscriptionStatus } from '../../utils/helpers';
import { AlertTriangle, User, Calendar, Clock } from 'lucide-react';

export function ExpiringSubscriptions() {
  const { state } = useApp();
  const { subscribers, settings } = state;

  const expiringSubscriptions = React.useMemo(() => {
    return subscribers
      .filter(sub => 
        getSubscriptionStatus(sub) === 'active' && isExpiringSoon(sub.endDate, 14)
      )
      .sort((a, b) => getDaysUntilExpiry(a.endDate) - getDaysUntilExpiry(b.endDate))
      .slice(0, 5);
  }, [subscribers]);

  const getDaysText = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days === 0) return "Expire aujourd'hui";
    if (days === 1) return "Expire demain";
    return `Expire dans ${days} jours`;
  };

  const getDaysColor = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days <= 1) return 'text-red-600 bg-red-50';
    if (days <= 3) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('expiringSoon', settings.language)}
        </h3>
      </div>
      
      {expiringSubscriptions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun abonnement expire bientôt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expiringSubscriptions.map((subscriber) => (
            <div
              key={subscriber.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-orange-400"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{subscriber.name}</h4>
                  <p className="text-sm text-gray-600">{subscriber.subscriptionName}</p>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Fin: {formatDate(subscriber.endDate, settings.language)}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDaysColor(subscriber.endDate)}`}>
                  {getDaysText(subscriber.endDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}