import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "fr" | "rw";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.about": "About",
    "nav.events": "Events",
    "nav.releases": "Releases",
    "nav.gallery": "Gallery",
    "nav.ministry": "Ministry",
    "nav.support": "Support",
    "nav.contact": "Contact",
    "nav.join": "Join Us",
    
    // Common
    "common.learnMore": "Learn More",
    "common.viewAll": "View All",
    "common.bookNow": "Book Now",
    "common.listenNow": "Listen Now",
    "common.watchNow": "Watch Now",
    "common.donate": "Donate",
    "common.subscribe": "Subscribe",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.noResults": "No results found",
    
    // Home
    "home.hero.title": "Voices United in Worship",
    "home.hero.subtitle": "Experience the power of sacred music with Serenades of Praise Choir",
    "home.events.title": "Upcoming Events",
    "home.releases.title": "Latest Releases",
    "home.ministry.title": "Our Ministry",
    
    // Events
    "events.title": "Events",
    "events.upcoming": "Upcoming Events",
    "events.past": "Past Events",
    "events.noEvents": "No upcoming events at the moment",
    "events.bookTicket": "Book Ticket",
    "events.soldOut": "Sold Out",
    "events.free": "Free Entry",
    
    // Releases
    "releases.title": "Music Releases",
    "releases.albums": "Albums",
    "releases.videos": "Music Videos",
    "releases.listenEverywhere": "Listen Everywhere",
    "releases.latestRelease": "Latest Release",
    
    // Gallery
    "gallery.title": "Gallery",
    "gallery.photos": "Photos",
    "gallery.videos": "Videos",
    "gallery.albums": "Albums",
    
    // Support
    "support.title": "Support Our Ministry",
    "support.donate.title": "Make a Donation",
    "support.donate.description": "Your generous contribution helps us continue our mission",
    
    // Contact
    "contact.title": "Contact Us",
    "contact.form.name": "Your Name",
    "contact.form.email": "Email Address",
    "contact.form.message": "Your Message",
    "contact.form.send": "Send Message",
    
    // Footer
    "footer.rights": "All rights reserved",
    "footer.followUs": "Follow Us",
    "footer.quickLinks": "Quick Links",
    "footer.newsletter": "Newsletter",
    "footer.newsletter.placeholder": "Enter your email",
  },
  
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.about": "À Propos",
    "nav.events": "Événements",
    "nav.releases": "Sorties",
    "nav.gallery": "Galerie",
    "nav.ministry": "Ministère",
    "nav.support": "Soutien",
    "nav.contact": "Contact",
    "nav.join": "Rejoignez-nous",
    
    // Common
    "common.learnMore": "En Savoir Plus",
    "common.viewAll": "Voir Tout",
    "common.bookNow": "Réserver",
    "common.listenNow": "Écouter",
    "common.watchNow": "Regarder",
    "common.donate": "Donner",
    "common.subscribe": "S'abonner",
    "common.submit": "Soumettre",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.loading": "Chargement...",
    "common.noResults": "Aucun résultat trouvé",
    
    // Home
    "home.hero.title": "Voix Unies dans l'Adoration",
    "home.hero.subtitle": "Découvrez la puissance de la musique sacrée avec la Chorale Serenades of Praise",
    "home.events.title": "Événements à Venir",
    "home.releases.title": "Dernières Sorties",
    "home.ministry.title": "Notre Ministère",
    
    // Events
    "events.title": "Événements",
    "events.upcoming": "Événements à Venir",
    "events.past": "Événements Passés",
    "events.noEvents": "Aucun événement prévu pour le moment",
    "events.bookTicket": "Réserver un Billet",
    "events.soldOut": "Complet",
    "events.free": "Entrée Gratuite",
    
    // Releases
    "releases.title": "Sorties Musicales",
    "releases.albums": "Albums",
    "releases.videos": "Clips Vidéo",
    "releases.listenEverywhere": "Écoutez Partout",
    "releases.latestRelease": "Dernière Sortie",
    
    // Gallery
    "gallery.title": "Galerie",
    "gallery.photos": "Photos",
    "gallery.videos": "Vidéos",
    "gallery.albums": "Albums",
    
    // Support
    "support.title": "Soutenez Notre Ministère",
    "support.donate.title": "Faire un Don",
    "support.donate.description": "Votre contribution généreuse nous aide à poursuivre notre mission",
    
    // Contact
    "contact.title": "Contactez-Nous",
    "contact.form.name": "Votre Nom",
    "contact.form.email": "Adresse Email",
    "contact.form.message": "Votre Message",
    "contact.form.send": "Envoyer",
    
    // Footer
    "footer.rights": "Tous droits réservés",
    "footer.followUs": "Suivez-Nous",
    "footer.quickLinks": "Liens Rapides",
    "footer.newsletter": "Newsletter",
    "footer.newsletter.placeholder": "Entrez votre email",
  },
  
  rw: {
    // Navigation
    "nav.home": "Ahabanza",
    "nav.about": "Abo Turi",
    "nav.events": "Ibikorwa",
    "nav.releases": "Indirimbo",
    "nav.gallery": "Amafoto",
    "nav.ministry": "Umurimo",
    "nav.support": "Tufashe",
    "nav.contact": "Twandikire",
    "nav.join": "Twinjire",
    
    // Common
    "common.learnMore": "Menya Byinshi",
    "common.viewAll": "Reba Byose",
    "common.bookNow": "Gufata Umwanya",
    "common.listenNow": "Umva Nonaha",
    "common.watchNow": "Reba Nonaha",
    "common.donate": "Tanga",
    "common.subscribe": "Iyandikishe",
    "common.submit": "Ohereza",
    "common.cancel": "Hagarika",
    "common.save": "Bika",
    "common.delete": "Siba",
    "common.edit": "Hindura",
    "common.loading": "Gutegereza...",
    "common.noResults": "Nta bisubizo bibonetse",
    
    // Home
    "home.hero.title": "Amajwi Yunze mu Gusingiza",
    "home.hero.subtitle": "Kumva imbaraga z'indirimbo nziza hamwe na Serenades of Praise Choir",
    "home.events.title": "Ibikorwa Bizaza",
    "home.releases.title": "Indirimbo Nshya",
    "home.ministry.title": "Umurimo Wacu",
    
    // Events
    "events.title": "Ibikorwa",
    "events.upcoming": "Ibikorwa Bizaza",
    "events.past": "Ibikorwa Byahise",
    "events.noEvents": "Nta bikorwa birateganyijwe",
    "events.bookTicket": "Gufata Ikarita",
    "events.soldOut": "Byarangiye",
    "events.free": "Kubuntu",
    
    // Releases
    "releases.title": "Indirimbo",
    "releases.albums": "Albums",
    "releases.videos": "Amashusho",
    "releases.listenEverywhere": "Umva Ahose",
    "releases.latestRelease": "Indirimbo Nshya",
    
    // Gallery
    "gallery.title": "Amafoto",
    "gallery.photos": "Amafoto",
    "gallery.videos": "Amashusho",
    "gallery.albums": "Albums",
    
    // Support
    "support.title": "Dufashe mu Murimo",
    "support.donate.title": "Tanga Impano",
    "support.donate.description": "Impano yawe idufasha gukomeza umurimo wacu",
    
    // Contact
    "contact.title": "Twandikire",
    "contact.form.name": "Izina Ryawe",
    "contact.form.email": "Email",
    "contact.form.message": "Ubutumwa Bwawe",
    "contact.form.send": "Ohereza",
    
    // Footer
    "footer.rights": "Uburenganzira bwose burabitswe",
    "footer.followUs": "Dukurikire",
    "footer.quickLinks": "Aho Ugera Vuba",
    "footer.newsletter": "Amakuru",
    "footer.newsletter.placeholder": "Andika email yawe",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as Language) || "en";
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);
    setLanguageState(lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Language names for display
export const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  rw: "Ikinyarwanda",
};

// Language flags (emoji)
export const languageFlags: Record<Language, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  rw: "🇷🇼",
};

