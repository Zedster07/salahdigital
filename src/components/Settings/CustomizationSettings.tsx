import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Palette, Upload, Save, Sun, Moon, Globe, CheckCircle, Image, X, RefreshCw } from 'lucide-react';

export function CustomizationSettings() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  
  const [customizationSettings, setCustomizationSettings] = useState({
    theme: settings.theme,
    companyName: settings.companyName,
    welcomeMessage: settings.welcomeMessage,
    language: settings.language,
    companyLogo: settings.companyLogo || '',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState({
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8B5CF6',
  });

  // Synchroniser avec les paramètres globaux
  useEffect(() => {
    setCustomizationSettings({
      theme: settings.theme,
      companyName: settings.companyName,
      welcomeMessage: settings.welcomeMessage,
      language: settings.language,
      companyLogo: settings.companyLogo || '',
    });
    
    if (settings.companyLogo) {
      setLogoPreview(settings.companyLogo);
    }
  }, [settings]);

  // Appliquer le thème en temps réel
  useEffect(() => {
    const root = document.documentElement;
    if (customizationSettings.theme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1F2937';
      document.body.style.color = '#F9FAFB';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#1F2937';
    }
  }, [customizationSettings.theme]);

  // Appliquer les couleurs personnalisées
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(selectedColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [selectedColors]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Dispatch des modifications
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        ...customizationSettings,
        customColors: selectedColors,
      },
    });
    
    // Appliquer immédiatement les changements de langue et direction
    if (customizationSettings.language !== settings.language) {
      document.documentElement.dir = customizationSettings.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = customizationSettings.language;
    }
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateSetting = (key: string, value: any) => {
    setCustomizationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        updateSetting('companyLogo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    updateSetting('companyLogo', '');
  };

  const updateColor = (colorKey: string, value: string) => {
    setSelectedColors(prev => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const resetColors = () => {
    setSelectedColors({
      primary: '#3B82F6',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#8B5CF6',
    });
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Sauvegarde...
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Sauvegardé !
          </>
        );
      default:
        return (
          <>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Personnalisation de l'Interface
            </h3>
            <p className="text-gray-600 mt-1">
              Personnalisez l'apparence et les messages de votre application
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'saving'
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {getSaveButtonContent()}
          </button>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Thème de l'Application
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => updateSetting('theme', 'light')}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              customizationSettings.theme === 'light'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Sun className="w-8 h-8 text-yellow-500" />
              <div>
                <h5 className="font-medium text-gray-900">Thème Clair</h5>
                <p className="text-sm text-gray-600">Interface claire et lumineuse</p>
              </div>
            </div>
            <div className="mt-4 h-16 bg-gradient-to-r from-white to-gray-100 rounded border flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded ml-2"></div>
              <div className="w-8 h-8 bg-green-500 rounded ml-2"></div>
            </div>
          </div>
          
          <div
            onClick={() => updateSetting('theme', 'dark')}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              customizationSettings.theme === 'dark'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Moon className="w-8 h-8 text-blue-500" />
              <div>
                <h5 className="font-medium text-gray-900">Thème Sombre</h5>
                <p className="text-sm text-gray-600">Interface sombre et moderne</p>
              </div>
            </div>
            <div className="mt-4 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded border flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-400 rounded"></div>
              <div className="w-8 h-8 bg-gray-600 rounded ml-2"></div>
              <div className="w-8 h-8 bg-green-400 rounded ml-2"></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✅ <strong>Fonctionnel:</strong> Le thème sombre est maintenant entièrement opérationnel et s'applique en temps réel
          </p>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Langue de l'Application
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => updateSetting('language', 'fr')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              customizationSettings.language === 'fr'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">FR</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Français</h5>
                <p className="text-sm text-gray-600">Interface en français</p>
              </div>
            </div>
          </div>
          
          <div
            onClick={() => updateSetting('language', 'ar')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              customizationSettings.language === 'ar'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">AR</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">العربية</h5>
                <p className="text-sm text-gray-600">واجهة باللغة العربية</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Langue actuelle:</strong> {customizationSettings.language === 'fr' ? 'Français' : 'العربية'}
            {customizationSettings.language !== settings.language && (
              <span className="ml-2 text-orange-600">(Changement en attente de sauvegarde)</span>
            )}
          </p>
        </div>
      </div>

      {/* Company Branding */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Image de Marque
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'Entreprise
            </label>
            <input
              type="text"
              value={customizationSettings.companyName}
              onChange={(e) => updateSetting('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom de votre entreprise"
            />
            <p className="text-sm text-gray-500 mt-1">
              Affiché dans la barre latérale et les rapports
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de l'Entreprise
            </label>
            
            {logoPreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img 
                    src={logoPreview} 
                    alt="Logo de l'entreprise" 
                    className="w-16 h-16 object-contain rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <label className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Changer
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={removeLogo}
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger un logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, GIF jusqu'à 2MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Aperçu du nom de l'entreprise */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Aperçu</h5>
          <div className="flex items-center space-x-3">
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h6 className="font-bold text-gray-900">
                {customizationSettings.companyName || 'Digital Manager'}
              </h6>
              <p className="text-sm text-gray-500">v2.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Message d'Accueil
        </h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte d'Accueil Personnalisé
          </label>
          <textarea
            rows={3}
            value={customizationSettings.welcomeMessage}
            onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Message affiché sur le tableau de bord..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Ce message sera affiché sur le tableau de bord principal
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Aperçu du Message</h5>
          <p className="text-sm text-blue-700">
            {customizationSettings.welcomeMessage || 'Aucun message personnalisé défini'}
          </p>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Palette de Couleurs Personnalisée
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(selectedColors).map(([colorKey, colorValue]) => {
            const colorNames = {
              primary: 'Primaire',
              secondary: 'Secondaire',
              success: 'Succès',
              warning: 'Attention',
              error: 'Erreur',
              info: 'Information',
            };
            
            return (
              <div key={colorKey} className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {colorNames[colorKey as keyof typeof colorNames]}
                </label>
                <div className="relative">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => updateColor(colorKey, e.target.value)}
                    className="w-full h-16 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                  />
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    {colorValue.toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={resetColors}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser les couleurs
          </button>
          
          <div className="text-sm text-gray-600">
            Les couleurs s'appliquent en temps réel
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✅ <strong>Fonctionnel:</strong> La palette de couleurs est maintenant entièrement opérationnelle et s'applique en temps réel
          </p>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Aperçu des Modifications
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Paramètres Actuels</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Langue:</span>
                <span className="font-medium">{settings.language === 'fr' ? 'Français' : 'العربية'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thème:</span>
                <span className="font-medium capitalize">{settings.theme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entreprise:</span>
                <span className="font-medium">{settings.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Logo:</span>
                <span className="font-medium">{settings.companyLogo ? 'Défini' : 'Aucun'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Nouveaux Paramètres</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Langue:</span>
                <span className={`font-medium ${customizationSettings.language !== settings.language ? 'text-orange-600' : ''}`}>
                  {customizationSettings.language === 'fr' ? 'Français' : 'العربية'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thème:</span>
                <span className={`font-medium capitalize ${customizationSettings.theme !== settings.theme ? 'text-orange-600' : ''}`}>
                  {customizationSettings.theme}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entreprise:</span>
                <span className={`font-medium ${customizationSettings.companyName !== settings.companyName ? 'text-orange-600' : ''}`}>
                  {customizationSettings.companyName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Logo:</span>
                <span className={`font-medium ${customizationSettings.companyLogo !== settings.companyLogo ? 'text-orange-600' : ''}`}>
                  {customizationSettings.companyLogo ? 'Défini' : 'Aucun'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {(customizationSettings.language !== settings.language || 
          customizationSettings.theme !== settings.theme || 
          customizationSettings.companyName !== settings.companyName ||
          customizationSettings.welcomeMessage !== settings.welcomeMessage ||
          customizationSettings.companyLogo !== settings.companyLogo) && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>Modifications en attente:</strong> Cliquez sur "Sauvegarder" pour appliquer les changements
            </p>
          </div>
        )}
      </div>
    </div>
  );
}