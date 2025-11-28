/**
 * Internationalization (i18n) system
 * Extensible translation system for supporting multiple languages
 */

export type Language = 'en' | 'fr';

export interface Translations {
  // PDF and Shared Page Labels
  labels: {
    client: string;
    villa: string;
    arrival: string;
    departure: string;
    yourItinerary: string;
    time: string;
    event: string;
    location: string;
    noItemsForDay: string;
    cancellationAndDelaysPolicies: string;
    feeDetailsAndSpecificPolicies: string;
    forGypsea: string;
    nailsByRomane: string;
  };
  
  // PDF Policy Text
  policies: {
    generalPolicy: string;
    gypseaPolicy: string;
    nailsPolicy: string;
    establishments: {
      isola: string;
      shellona: string;
      tamarin: string;
      guerite: string;
      mamo: string;
      gypsea: string;
    };
  };
  
  // Shared Page Messages
  messages: {
    loading: string;
    errorLoading: string;
    errorInvalidLink: string;
    errorNotFound: string;
    errorMissingStay: string;
    errorUnexpected: string;
    verifyLink: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    labels: {
      client: 'CLIENT',
      villa: 'VILLA',
      arrival: 'ARRIVAL',
      departure: 'DEPARTURE',
      yourItinerary: 'YOUR ITINERARY',
      time: 'TIME',
      event: 'EVENT',
      location: 'LOCATION',
      noItemsForDay: 'No items added for this day',
      cancellationAndDelaysPolicies: 'CANCELLATION AND DELAYS POLICIES',
      feeDetailsAndSpecificPolicies: 'Fee Details and Specific Policies:',
      forGypsea: 'For GYPSEA:',
      nailsByRomane: 'NAILS by Romane:',
    },
    policies: {
      generalPolicy: 'All reservations must be canceled at least 24 to 48 hours in advance to avoid penalty fees. Some establishments also offer a courtesy delay of 15 to 30 minutes. Beyond this grace period, tables may be reassigned, and cancellation fees will apply.',
      gypseaPolicy: 'Beach beds cannot be pre-confirmed as priority is given to hotel guests. A note has been added to your reservation, and the team will contact you in the morning to reconfirm. Once confirmed, arrival must occur between 10:30 AM and 12:30 PM. If not, the chairs will be released.',
      nailsPolicy: 'Modifications or cancellations must be communicated at least 24 hours in advance of the scheduled appointment. Otherwise, a cancellation fee of 100% will apply.',
      establishments: {
        isola: 'ISOLA: €250 per person fee.',
        shellona: 'SHELLONA: €250 per person fee, with a 30-minute courtesy policy.',
        tamarin: 'TAMARIN: €150 per person fee.',
        guerite: 'LA GUÉRITE: €250 per person fee.',
        mamo: 'MAMO: €260 per person fee.',
        gypsea: 'GYPSEA: 48 HOURS CANCELLATION POLICY - €220 per person fee, with a 15-minute courtesy policy.',
      },
    },
    messages: {
      loading: 'Loading shared itinerary...',
      errorLoading: 'Error Loading Shared Itinerary',
      errorInvalidLink: 'Invalid share link. No token provided.',
      errorNotFound: 'Shared itinerary not found. The link may be invalid or expired.',
      errorMissingStay: 'Invalid itinerary: missing stay information',
      errorUnexpected: 'An unexpected error occurred. Please try again later.',
      verifyLink: 'Please verify that you copied the complete link and try again.',
    },
  },
  fr: {
    labels: {
      client: 'CLIENT',
      villa: 'VILLA',
      arrival: 'ARRIVÉE',
      departure: 'DÉPART',
      yourItinerary: 'VOTRE ITINÉRAIRE',
      time: 'HEURE',
      event: 'ÉVÉNEMENT',
      location: 'LIEU',
      noItemsForDay: 'Aucun élément ajouté pour ce jour',
      cancellationAndDelaysPolicies: 'POLITIQUE D\'ANNULATION ET DE RETARDS',
      feeDetailsAndSpecificPolicies: 'Détails des frais et politiques spécifiques :',
      forGypsea: 'Pour GYPSEA :',
      nailsByRomane: 'NAILS par Romane :',
    },
    policies: {
      generalPolicy: 'Toutes les réservations doivent être annulées au moins 24 à 48 heures à l\'avance pour éviter les frais de pénalité. Certains établissements offrent également un délai de courtoisie de 15 à 30 minutes. Au-delà de cette période de grâce, les tables peuvent être réassignées et des frais d\'annulation s\'appliqueront.',
      gypseaPolicy: 'Les lits de plage ne peuvent pas être pré-confirmés car la priorité est donnée aux clients de l\'hôtel. Une note a été ajoutée à votre réservation et l\'équipe vous contactera le matin pour reconfirmer. Une fois confirmé, l\'arrivée doit avoir lieu entre 10h30 et 12h30. Sinon, les chaises seront libérées.',
      nailsPolicy: 'Les modifications ou annulations doivent être communiquées au moins 24 heures à l\'avance du rendez-vous prévu. Sinon, des frais d\'annulation de 100% s\'appliqueront.',
      establishments: {
        isola: 'ISOLA : Frais de 250€ par personne.',
        shellona: 'SHELLONA : Frais de 250€ par personne, avec une politique de courtoisie de 30 minutes.',
        tamarin: 'TAMARIN : Frais de 150€ par personne.',
        guerite: 'LA GUÉRITE : Frais de 250€ par personne.',
        mamo: 'MAMO : Frais de 260€ par personne.',
        gypsea: 'GYPSEA : POLITIQUE D\'ANNULATION DE 48 HEURES - Frais de 220€ par personne, avec une politique de courtoisie de 15 minutes.',
      },
    },
    messages: {
      loading: 'Chargement de l\'itinéraire partagé...',
      errorLoading: 'Erreur lors du chargement de l\'itinéraire partagé',
      errorInvalidLink: 'Lien de partage invalide. Aucun jeton fourni.',
      errorNotFound: 'Itinéraire partagé introuvable. Le lien peut être invalide ou expiré.',
      errorMissingStay: 'Itinéraire invalide : informations de séjour manquantes',
      errorUnexpected: 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.',
      verifyLink: 'Veuillez vérifier que vous avez copié le lien complet et réessayer.',
    },
  },
};

/**
 * Get translations for a specific language
 * @param language - Language code ('en' or 'fr')
 * @returns Translations object for the specified language
 */
export function getTranslations(language: Language = 'en'): Translations {
  return translations[language] || translations.en;
}

/**
 * Get a translated string by key path
 * Example: t('labels.client', 'en') => 'CLIENT'
 */
export function t(key: string, language: Language = 'en'): string {
  const keys = key.split('.');
  const trans = getTranslations(language);
  
  let value: any = trans;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} for language ${language}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Get language from client or default to English
 */
export function getClientLanguage(clientLanguage?: string | null): Language {
  if (clientLanguage === 'fr' || clientLanguage === 'en') {
    return clientLanguage;
  }
  return 'en';
}


