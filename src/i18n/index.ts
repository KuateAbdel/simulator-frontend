// src/i18n/index.ts
//
// Vocabulaire du LOADER, bilingue FR/EN (exigence JJB). FR par defaut.
// Toute chaine visible passe par t() — rien en dur dans les composants.

export type Lang = 'fr' | 'en'

export const translations = {
  fr: {
    // Marque
    app_name: 'FinZuu Loader',
    app_tagline: 'Pilotage du simulateur',

    // Nav — les 6 epopees (+ accueil)
    nav_dashboard: 'Tableau de bord',
    nav_configuration: 'Configuration',
    nav_group_referentiels: 'Référentiels',
    nav_geographie: 'Géographie',
    nav_pays_monnaies: 'Pays & Monnaies',
    nav_telcos: 'Telcos',
    nav_catalogue: 'Catalogue',
    nav_group_entites: 'Entités',
    nav_company: 'Company',
    nav_produit: 'Produit',
    nav_groupe: 'Groupe / Rôle',
    nav_group_runs: 'Runs',
    nav_runs_preparer: 'Préparer & lancer',
    nav_runs_progression: 'Progression',
    nav_runs_historique: 'Historique & recette',
    nav_ecosysteme: 'Écosystème',
    nav_population: 'Population',
    nav_inventaire: 'Inventaire',
    nav_tracabilite: 'Traçabilité',
    nav_purge: 'Purge',

    // Auth (US-A1/A2)
    login_title: 'Connexion Super-Admin',
    login_subtitle: 'Le cockpit du Loader — accès réservé',
    email: 'Email',
    password: 'Mot de passe',
    login_action: 'Se connecter',
    login_in_progress: 'Connexion…',
    change_password_title: 'Nouveau mot de passe requis',
    change_password_subtitle:
      'Première connexion : choisissez un mot de passe durable (12 caractères minimum).',
    old_password: 'Mot de passe actuel',
    new_password: 'Nouveau mot de passe',
    new_password_confirm: 'Confirmer le nouveau mot de passe',
    change_password_action: 'Changer le mot de passe',
    passwords_differ: 'Les deux saisies du nouveau mot de passe diffèrent.',
    password_too_short: 'Le mot de passe doit faire au moins 12 caractères.',
    show_password: 'Afficher le mot de passe',
    hide_password: 'Masquer le mot de passe',
    forgot_password: 'Mot de passe oublié ?',
    forgot_password_info:
      'Par sécurité, il n’existe pas de réinitialisation par email en v1 : elle se fait par l’opérateur, directement sur le serveur (scripts/reinitialiser_admin.py). Contactez l’administrateur de la plateforme — un mot de passe provisoire à usage unique vous sera remis.',
    session_expires_in: 'Session',
    session_expired: 'Session expirée — reconnectez-vous.',
    logout: 'Se déconnecter',

    // Etats (aucun etat muet)
    loading: 'Chargement…',
    error_backend_unreachable: 'Backend injoignable — vérifiez la connexion.',
    error_named: 'Le backend a refusé :',
    empty_no_data: 'Rien à afficher — et c’est normal ici.',
    retry: 'Réessayer',

    // Sante backend (tableau de bord, phase 1)
    backend_health: 'Santé du backend',
    backend_ok: 'Backend en ligne',
    backend_down: 'Backend hors ligne',
    backend_checking: 'Vérification…',

    // Pages en construction (phases 2→7)
    under_construction: 'En construction',
    delivered_in_phase: 'Livré en phase',
    phase1_done:
      'La fondation (auth, navigation, PWA) est en place — cet écran arrive dans la phase indiquée.',

    // PWA
    pwa_update_available: 'Nouvelle version disponible',
    pwa_reload: 'Recharger',
    pwa_offline_ready: 'Coquille installée — les données restent en direct.',

    // Communs
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    search: 'Rechercher',
    language: 'Langue',
  },
  en: {
    // Brand
    app_name: 'FinZuu Loader',
    app_tagline: 'Simulator control room',

    // Nav — the 6 epics (+ home)
    nav_dashboard: 'Dashboard',
    nav_configuration: 'Configuration',
    nav_group_referentiels: 'Reference data',
    nav_geographie: 'Geography',
    nav_pays_monnaies: 'Countries & Currencies',
    nav_telcos: 'Telcos',
    nav_catalogue: 'Catalog',
    nav_group_entites: 'Entities',
    nav_company: 'Company',
    nav_produit: 'Product',
    nav_groupe: 'Group / Role',
    nav_group_runs: 'Runs',
    nav_runs_preparer: 'Prepare & launch',
    nav_runs_progression: 'Progress',
    nav_runs_historique: 'History & acceptance',
    nav_ecosysteme: 'Ecosystem',
    nav_population: 'Population',
    nav_inventaire: 'Inventory',
    nav_tracabilite: 'Traceability',
    nav_purge: 'Purge',

    // Auth (US-A1/A2)
    login_title: 'Super-Admin sign-in',
    login_subtitle: 'The Loader cockpit — restricted access',
    email: 'Email',
    password: 'Password',
    login_action: 'Sign in',
    login_in_progress: 'Signing in…',
    change_password_title: 'New password required',
    change_password_subtitle:
      'First sign-in: choose a durable password (12 characters minimum).',
    old_password: 'Current password',
    new_password: 'New password',
    new_password_confirm: 'Confirm new password',
    change_password_action: 'Change password',
    passwords_differ: 'The two new-password entries differ.',
    password_too_short: 'The password must be at least 12 characters long.',
    show_password: 'Show password',
    hide_password: 'Hide password',
    forgot_password: 'Forgot password?',
    forgot_password_info:
      'For security, there is no email reset in v1: it is done by the operator, directly on the server (scripts/reinitialiser_admin.py). Contact the platform administrator — a one-time temporary password will be issued to you.',
    session_expires_in: 'Session',
    session_expired: 'Session expired — please sign in again.',
    logout: 'Sign out',

    // States (no silent state)
    loading: 'Loading…',
    error_backend_unreachable: 'Backend unreachable — check the connection.',
    error_named: 'The backend refused:',
    empty_no_data: 'Nothing to show — and that is expected here.',
    retry: 'Retry',

    // Backend health (dashboard, phase 1)
    backend_health: 'Backend health',
    backend_ok: 'Backend online',
    backend_down: 'Backend offline',
    backend_checking: 'Checking…',

    // Under-construction pages (phases 2→7)
    under_construction: 'Under construction',
    delivered_in_phase: 'Delivered in phase',
    phase1_done:
      'The foundation (auth, navigation, PWA) is in place — this screen ships in the phase shown.',

    // PWA
    pwa_update_available: 'New version available',
    pwa_reload: 'Reload',
    pwa_offline_ready: 'Shell installed — data always stays live.',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    language: 'Language',
  },
} as const

export type TranslationKey = keyof (typeof translations)['fr']
