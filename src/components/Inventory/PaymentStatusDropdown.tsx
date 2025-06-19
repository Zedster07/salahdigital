import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { StockSale } from '../../types';
import { 
  ChevronDown, 
  Check, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Calendar,
  Save,
  X
} from 'lucide-react';

interface PaymentStatusDropdownProps {
  sale: StockSale;
  onUpdate: (updatedSale: StockSale) => void;
}

export function PaymentStatusDropdown({ sale, onUpdate }: PaymentStatusDropdownProps) {
  const { state } = useApp();
  const { settings } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: sale.paymentMethod,
    notes: '',
  });

  // Calculer le montant déjà payé et le reste à payer
  const totalAmount = sale.totalPrice;
  const paidAmount = sale.paidAmount || 0;
  const remainingAmount = totalAmount - paidAmount;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'partial':
        return 'Partiel';
      default:
        return status;
    }
  };

  const handleStatusChange = (newStatus: 'paid' | 'pending' | 'partial') => {
    if (newStatus === 'paid') {
      // Marquer comme entièrement payé
      const updatedSale = {
        ...sale,
        paymentStatus: newStatus,
        paidAmount: totalAmount,
        remainingAmount: 0,
        paymentDate: new Date().toISOString(),
        paymentHistory: [
          ...(sale.paymentHistory || []),
          {
            id: Date.now().toString(),
            amount: remainingAmount,
            date: new Date().toISOString(),
            method: sale.paymentMethod,
            notes: 'Paiement complet',
          }
        ]
      };
      onUpdate(updatedSale);
      setIsOpen(false);
    } else if (newStatus === 'pending') {
      // Remettre en attente
      const updatedSale = {
        ...sale,
        paymentStatus: newStatus,
        paidAmount: 0,
        remainingAmount: totalAmount,
        paymentDate: undefined,
        paymentHistory: []
      };
      onUpdate(updatedSale);
      setIsOpen(false);
    } else if (newStatus === 'partial') {
      // Ouvrir le formulaire de paiement partiel
      setShowPaymentForm(true);
      setPaymentData({
        amount: Math.min(remainingAmount, remainingAmount),
        date: new Date().toISOString().split('T')[0],
        method: sale.paymentMethod,
        notes: '',
      });
    }
  };

  const handlePartialPayment = () => {
    if (paymentData.amount <= 0 || paymentData.amount > remainingAmount) {
      alert('Montant invalide');
      return;
    }

    const newPaidAmount = paidAmount + paymentData.amount;
    const newRemainingAmount = totalAmount - newPaidAmount;
    const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

    const paymentEntry = {
      id: Date.now().toString(),
      amount: paymentData.amount,
      date: paymentData.date + 'T00:00:00.000Z',
      method: paymentData.method,
      notes: paymentData.notes || `Paiement partiel de ${formatCurrency(paymentData.amount, settings.currency)}`,
    };

    const updatedSale = {
      ...sale,
      paymentStatus: newStatus,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      paymentDate: newStatus === 'paid' ? new Date().toISOString() : sale.paymentDate,
      paymentHistory: [
        ...(sale.paymentHistory || []),
        paymentEntry
      ]
    };

    onUpdate(updatedSale);
    setShowPaymentForm(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton principal avec statut */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${getStatusColor(sale.paymentStatus)} hover:opacity-80`}
      >
        {getStatusIcon(sale.paymentStatus)}
        <span className="ml-1">{getStatusLabel(sale.paymentStatus)}</span>
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Gestion du Paiement</h4>
            
            {/* Informations de la vente */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Montant total:</span>
                  <div className="font-semibold">{formatCurrency(totalAmount, settings.currency)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Déjà payé:</span>
                  <div className="font-semibold text-green-600">{formatCurrency(paidAmount, settings.currency)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Reste à payer:</span>
                  <div className="font-semibold text-orange-600">{formatCurrency(remainingAmount, settings.currency)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Statut actuel:</span>
                  <div className="flex items-center">
                    {getStatusIcon(sale.paymentStatus)}
                    <span className="ml-1 font-semibold">{getStatusLabel(sale.paymentStatus)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            {!showPaymentForm && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Actions rapides:</h5>
                
                {sale.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => handleStatusChange('paid')}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm">Marquer comme payé intégralement</span>
                    </div>
                    <span className="text-xs text-green-600">+{formatCurrency(remainingAmount, settings.currency)}</span>
                  </button>
                )}
                
                {remainingAmount > 0 && (
                  <button
                    onClick={() => handleStatusChange('partial')}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-sm">Enregistrer un paiement partiel</span>
                    </div>
                  </button>
                )}
                
                {sale.paymentStatus !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className="w-full flex items-center p-2 text-left hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Clock className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm">Remettre en attente</span>
                  </button>
                )}
              </div>
            )}

            {/* Formulaire de paiement partiel */}
            {showPaymentForm && (
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-700">Enregistrer un paiement</h5>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Montant reçu *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max={remainingAmount}
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {formatCurrency(remainingAmount, settings.currency)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date du paiement
                  </label>
                  <input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="cash">Espèces</option>
                    <option value="transfer">Virement</option>
                    <option value="baridimob">BaridiMob</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Remarques sur ce paiement..."
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handlePartialPayment}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Historique des paiements */}
            {sale.paymentHistory && sale.paymentHistory.length > 0 && !showPaymentForm && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Historique des paiements</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sale.paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div>
                        <div className="font-medium">{formatCurrency(payment.amount, settings.currency)}</div>
                        <div className="text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(payment.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-600">{payment.method}</div>
                        {payment.notes && (
                          <div className="text-gray-500 truncate max-w-20" title={payment.notes}>
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton fermer */}
            {!showPaymentForm && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}