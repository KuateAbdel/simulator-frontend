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

    // Tableau de bord (US-E1)
    dash_services_title: 'Santé des services',
    dash_services_subtitle: '9 services FinZuu + Faker, sondés en direct par le backend',
    dash_service_down_banner: 'service(s) injoignable(s) — les runs qui en dépendent échoueront',
    dash_kpi_title: 'Compteurs du dernier run',
    dash_kpi_branches: 'Branches',
    dash_kpi_agences: 'Agences',
    dash_kpi_kiosques: 'Kiosques',
    dash_kpi_agents: 'Agents',
    dash_kpi_clients: 'Clients',
    dash_kpi_ecritures: 'Écritures au journal',
    dash_dernier_run: 'Dernier run',
    dash_aucun_run:
      'Aucun run en base — la MongoDB du serveur est vierge. Rien ne se lance sans décision explicite (rite D-01).',
    dash_checkpoints: 'paliers franchis',
    dash_alertes: 'Alertes',
    dash_rafraichir: 'Rafraîchir',
    dash_maj: 'Mis à jour',

    // Configuration (US-B1/B2/B3)
    cfg_title: 'Configuration du Loader',
    cfg_subtitle: 'Chaque valeur porte son origine — défaut CDC, surcharge ou paramétré',
    cfg_nb_clients: 'Clients à générer (total)',
    cfg_repartition: 'Répartition entre pays actifs',
    cfg_pays_actifs: 'Pays du périmètre (EF-05)',
    cfg_pays_note:
      'Activer/désactiver ne concerne QUE le Loader — aucun appel ne part vers config-service (A-08).',
    cfg_quotas_titre: 'Quotas contractuels (non paramétrables)',
    cfg_quotas_note:
      'EF-22 (2 femmes pour 1 homme) et EF-23 (80/20 particuliers/corporate) sont des exigences exactes du CDC — le backend refuse toute modification (422).',
    cfg_conforme: 'Conforme au CDC',
    cfg_ecarts: 'Écarts au CDC',
    cfg_version: 'Version',
    cfg_modifie_par: 'Modifié par',
    cfg_enregistrer: 'Enregistrer la configuration',
    cfg_enregistre: 'Configuration enregistrée — vue relue depuis la base.',
    cfg_verrou_ef55:
      'Run en cours — configuration verrouillée (EF-55). Toute écriture sera refusée en 409 tant que le run n’est pas terminé.',
    cfg_clients_cible: 'Clients (cible imposée)',
    cfg_companies: 'Companies (min – max)',
    cfg_kiosques: 'Kiosques (min – max)',
    cfg_staff: 'Personnel (min – max)',
    cfg_branches: 'Branches (plafond)',
    cfg_agences: 'Agences (plafond)',
    cfg_agents: 'Agents (plafond)',
    cfg_desactiver_motif: 'Motif de désactivation (obligatoire, il sera tracé)',
    cfg_desactiver: 'Désactiver',
    cfg_activer: 'Activer',
    cfg_inactif_motif: 'Inactif',
    cfg_fourchette_invalide: 'min ≤ max requis, entre 1 et 10 000',
    cfg_min: 'min',
    cfg_max: 'max',

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

    // Dashboard (US-E1)
    dash_services_title: 'Services health',
    dash_services_subtitle: '9 FinZuu services + Faker, probed live by the backend',
    dash_service_down_banner: 'service(s) unreachable — runs depending on them will fail',
    dash_kpi_title: 'Latest run counters',
    dash_kpi_branches: 'Branches',
    dash_kpi_agences: 'Agencies',
    dash_kpi_kiosques: 'Kiosks',
    dash_kpi_agents: 'Agents',
    dash_kpi_clients: 'Clients',
    dash_kpi_ecritures: 'Journal writes',
    dash_dernier_run: 'Latest run',
    dash_aucun_run:
      'No run in database — the server MongoDB is pristine. Nothing launches without an explicit decision (D-01 rite).',
    dash_checkpoints: 'checkpoints passed',
    dash_alertes: 'Alerts',
    dash_rafraichir: 'Refresh',
    dash_maj: 'Updated',

    // Configuration (US-B1/B2/B3)
    cfg_title: 'Loader configuration',
    cfg_subtitle: 'Every value carries its origin — CDC default, override or set',
    cfg_nb_clients: 'Clients to generate (total)',
    cfg_repartition: 'Split across active countries',
    cfg_pays_actifs: 'Scope countries (EF-05)',
    cfg_pays_note:
      'Enabling/disabling only affects the Loader — no call ever goes to config-service (A-08).',
    cfg_quotas_titre: 'Contractual quotas (not configurable)',
    cfg_quotas_note:
      'EF-22 (2 women per 1 man) and EF-23 (80/20 retail/corporate) are exact CDC requirements — the backend refuses any change (422).',
    cfg_conforme: 'CDC compliant',
    cfg_ecarts: 'Deviations from CDC',
    cfg_version: 'Version',
    cfg_modifie_par: 'Modified by',
    cfg_enregistrer: 'Save configuration',
    cfg_enregistre: 'Configuration saved — view re-read from the database.',
    cfg_verrou_ef55:
      'Run in progress — configuration locked (EF-55). Any write will be refused with 409 until the run ends.',
    cfg_clients_cible: 'Clients (imposed target)',
    cfg_companies: 'Companies (min – max)',
    cfg_kiosques: 'Kiosks (min – max)',
    cfg_staff: 'Staff (min – max)',
    cfg_branches: 'Branches (cap)',
    cfg_agences: 'Agencies (cap)',
    cfg_agents: 'Agents (cap)',
    cfg_desactiver_motif: 'Deactivation reason (required, it will be traced)',
    cfg_desactiver: 'Deactivate',
    cfg_activer: 'Activate',
    cfg_inactif_motif: 'Inactive',
    cfg_fourchette_invalide: 'min ≤ max required, between 1 and 10,000',
    cfg_min: 'min',
    cfg_max: 'max',

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
