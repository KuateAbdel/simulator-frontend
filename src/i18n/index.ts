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
    forgot_title: 'Réinitialisation par email',
    forgot_send_code: 'Recevoir un code par email',
    forgot_code_sent:
      'Si un compte existe pour cet email, un code à 8 chiffres a été envoyé — valide 15 minutes, 5 essais.',
    forgot_code_label: 'Code reçu (8 chiffres)',
    forgot_reset_action: 'Réinitialiser et se connecter',
    forgot_back: 'Retour à la connexion',
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

    // Runs — le rite D-01 (US-C1→C6)
    run_rite_titre: 'Le rite D-01',
    run_rite_sous_titre:
      'Aucun REAL sans préparation lue — ce n’est pas une consigne, c’est l’absence structurelle du chemin.',
    run_etape_preparer: 'Préparer (à blanc)',
    run_etape_lire: 'Lire le rapport',
    run_etape_confirmer: 'Confirmer le RÉEL',
    run_preparer_action: 'Lancer la préparation (DRY_RUN)',
    run_preparer_note:
      'Un run complet à blanc, sur l’intention persistée — AUCUNE écriture ne part vers FinZuu.',
    run_en_preparation: 'Préparation en cours…',
    run_rapport_titre: 'Le rapport de préparation',
    run_derniere_occasion:
      'La dernière occasion de dire non — ce rapport décrit EXACTEMENT ce que le RÉEL exécutera, sur ce périmètre figé.',
    run_empreinte: 'Empreinte figée (D-10)',
    run_confirmer_action: 'Confirmer → RÉEL',
    run_re_preparer: 'Re-préparer',
    run_confirmer_titre: 'Confirmer l’exécution RÉELLE ?',
    run_confirmer_texte:
      'Les écritures partiront vers les 9 services FinZuu, sur le périmètre figé de cette préparation. Trois services n’ont aucun DELETE — cette action ne se défait pas d’un clic.',
    run_confirme_toast: 'RÉEL lancé — suivi dans Progression.',
    run_perimetre_change:
      'Le périmètre a changé depuis la préparation — le rapport lu ne décrit plus ce qui va s’exécuter. Re-préparez.',
    run_statut: 'Statut',
    run_paliers: 'Paliers',
    run_aucun: 'Aucun run — le premier geste du rite est la préparation.',
    run_suivi_titre: 'Progression du run',
    run_arreter: 'Arrêter le run',
    run_arreter_titre: 'Arrêter ce run ?',
    run_arreter_texte:
      'Le run sera clos en FAILED — un état terminal et VRAI, jamais un RUNNING fantôme. La réconciliation du prochain run dira ce qui reste à vérifier.',
    run_arret_demande: 'Arrêt demandé — le run se clôt en FAILED.',
    run_pas_en_cours: 'Aucun run en cours dans ce processus.',
    run_duree: 'durée',
    run_issue: 'issue',
    run_historique_titre: 'Historique des runs',
    run_historique_note:
      'Append-only : aucune route de suppression n’existe — l’histoire ne se réécrit pas.',
    run_periode_sim: 'Période simulée',
    run_voir_rapport: 'Voir le rapport',
    run_rapport_integral: 'Rapport intégral',
    run_rapport_vide: 'Rapport pas encore rangé (run en cours ou interrompu très tôt).',
    run_retour_liste: 'Retour à la liste',
    run_actualiser: 'Actualiser',

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
    forgot_title: 'Reset by email',
    forgot_send_code: 'Receive a code by email',
    forgot_code_sent:
      'If an account exists for this email, an 8-digit code has been sent — valid 15 minutes, 5 attempts.',
    forgot_code_label: 'Received code (8 digits)',
    forgot_reset_action: 'Reset and sign in',
    forgot_back: 'Back to sign-in',
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

    // Runs — the D-01 rite (US-C1→C6)
    run_rite_titre: 'The D-01 rite',
    run_rite_sous_titre:
      'No REAL without a read preparation — not a guideline: the path structurally does not exist.',
    run_etape_preparer: 'Prepare (dry)',
    run_etape_lire: 'Read the report',
    run_etape_confirmer: 'Confirm REAL',
    run_preparer_action: 'Launch preparation (DRY_RUN)',
    run_preparer_note:
      'A full dry run on the persisted intent — NO write ever goes to FinZuu.',
    run_en_preparation: 'Preparing…',
    run_rapport_titre: 'Preparation report',
    run_derniere_occasion:
      'The last chance to say no — this report describes EXACTLY what REAL will execute, on this frozen scope.',
    run_empreinte: 'Frozen fingerprint (D-10)',
    run_confirmer_action: 'Confirm → REAL',
    run_re_preparer: 'Re-prepare',
    run_confirmer_titre: 'Confirm the REAL execution?',
    run_confirmer_texte:
      'Writes will go to the 9 FinZuu services, on this preparation’s frozen scope. Three services have no DELETE — this cannot be undone with a click.',
    run_confirme_toast: 'REAL launched — follow it in Progress.',
    run_perimetre_change:
      'The scope changed since preparation — the report you read no longer describes what will run. Re-prepare.',
    run_statut: 'Status',
    run_paliers: 'Checkpoints',
    run_aucun: 'No run yet — the rite starts with a preparation.',
    run_suivi_titre: 'Run progress',
    run_arreter: 'Stop the run',
    run_arreter_titre: 'Stop this run?',
    run_arreter_texte:
      'The run will close as FAILED — a terminal, TRUE state, never a ghost RUNNING. The next run’s reconciliation will say what remains to check.',
    run_arret_demande: 'Stop requested — the run closes as FAILED.',
    run_pas_en_cours: 'No run currently running in this process.',
    run_duree: 'duration',
    run_issue: 'outcome',
    run_historique_titre: 'Run history',
    run_historique_note:
      'Append-only: no delete route exists — history does not get rewritten.',
    run_periode_sim: 'Simulated period',
    run_voir_rapport: 'View report',
    run_rapport_integral: 'Full report',
    run_rapport_vide: 'Report not stored yet (run in progress or interrupted very early).',
    run_retour_liste: 'Back to the list',
    run_actualiser: 'Refresh',

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
