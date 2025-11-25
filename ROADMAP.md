# Plan de Développement - QSS Itinerary Generator

## Vue d'ensemble

Ce document décrit le plan de développement pour l'application de génération d'itinéraires QSS. Les phases 1 et 2 ont été complétées. Ce plan commence à la Phase 3.

**Principe important** : Maintenir le look and feel de l'application actuelle lors de l'implémentation de nouvelles fonctionnalités.

---

## Phase 3 : Fondation des Prestataires de Services

### Objectif

Créer la structure de base pour gérer les prestataires de services (restaurants, bars, boîtes de nuit, chefs, nounous, etc.).

### Entités à créer

#### 1. Table `service_categories`

Catégories de services pour organiser les prestataires.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `name` (TEXT, NOT NULL) - Ex: "Restaurants", "Bars", "Chefs", "Services de garde d'enfants"
- `description` (TEXT)
- `icon` (TEXT) - Optionnel, pour l'UI
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ) - Soft delete

**Contraintes :**

- Nom unique

**Indexes :**

- `idx_service_categories_name`

#### 2. Table `service_providers`

Les prestataires de services individuels.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `name` (TEXT, NOT NULL) - Nom du prestataire
- `category_id` (UUID, REFERENCES service_categories(id))
- `description` (TEXT)
- `address` (TEXT)
- `website` (TEXT)
- `notes` (TEXT) - Notes internes
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Indexes :**

- `idx_service_providers_category_id`
- `idx_service_providers_name`
- `idx_service_providers_is_active`

#### 3. Table `service_provider_contacts`

Informations de contact pour les prestataires (plusieurs contacts possibles par prestataire).

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `service_provider_id` (UUID, REFERENCES service_providers(id) ON DELETE CASCADE)
- `contact_type` (TEXT, NOT NULL) - 'phone', 'email', 'whatsapp', etc.
- `value` (TEXT, NOT NULL) - La valeur du contact
- `is_primary` (BOOLEAN, DEFAULT false)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes :**

- `idx_service_provider_contacts_provider_id`
- `idx_service_provider_contacts_type`

### Fonctionnalités à implémenter

1. **Pages de gestion :**

   - Liste des catégories de services
   - CRUD pour les catégories
   - Liste des prestataires de services
   - CRUD pour les prestataires
   - Gestion des contacts pour chaque prestataire

2. **Services backend :**

   - `serviceCategoryService.ts` - Gestion des catégories
   - `serviceProviderService.ts` - Gestion des prestataires
   - `serviceProviderContactService.ts` - Gestion des contacts

3. **Composants UI :**

   - `ServiceCategorySelector` - Sélecteur de catégorie
   - `ServiceProviderSelector` - Sélecteur de prestataire
   - `CreateServiceCategoryDialog`
   - `EditServiceCategoryDialog`
   - `CreateServiceProviderDialog`
   - `EditServiceProviderDialog`

4. **RLS Policies :**
   - Les utilisateurs authentifiés peuvent voir toutes les catégories et prestataires
   - Les utilisateurs authentifiés peuvent créer/modifier/supprimer

### Migration SQL

- Créer les tables avec toutes les contraintes
- Créer les indexes
- Créer les triggers pour `updated_at`
- Configurer les RLS policies

---

## Phase 4 : Architecture des Services

### Objectif

Créer la table `services` pour établir une relation un-à-plusieurs entre les prestataires et leurs services offerts, permettant à chaque prestataire d'offrir plusieurs services avec des prix et détails différents.

### Entité à créer

#### Table `services`

Services individuels offerts par les prestataires.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `service_provider_id` (UUID, NOT NULL, REFERENCES service_providers(id) ON DELETE CASCADE)
- `name` (TEXT, NOT NULL) - Nom du service (ex: "Dîner", "Déjeuner", "Service de garde 4h")
- `description` (TEXT)
- `duration_minutes` (INTEGER) - Durée estimée en minutes
- `base_price` (DECIMAL(10, 2)) - Prix de base
- `currency` (TEXT, DEFAULT 'EUR')
- `pricing_type` (TEXT) - 'fixed', 'per_person', 'per_hour', 'custom'
- `capacity_min` (INTEGER) - Capacité minimale
- `capacity_max` (INTEGER) - Capacité maximale
- `is_available` (BOOLEAN, DEFAULT true)
- `notes` (TEXT) - Notes internes
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Contraintes :**

- `capacity_max >= capacity_min` (si les deux sont définis)

**Indexes :**

- `idx_services_provider_id`
- `idx_services_name`
- `idx_services_is_available`

### Fonctionnalités à implémenter

1. **Pages de gestion :**

   - Liste des services par prestataire
   - CRUD pour les services
   - Vue détaillée d'un service

2. **Services backend :**

   - `serviceService.ts` - Gestion des services

3. **Composants UI :**

   - `ServiceSelector` - Sélecteur de service (filtré par prestataire)
   - `CreateServiceDialog`
   - `EditServiceDialog`
   - `ServiceCard` - Carte d'affichage d'un service

4. **Intégration :**
   - Ajouter la gestion des services dans la page de détail du prestataire
   - Permettre de créer/modifier des services directement depuis la page du prestataire

### Migration SQL

- Créer la table `services`
- Créer les indexes
- Créer les triggers
- Configurer les RLS policies

---

## Phase 5 : Lier les Services aux Itinéraires

### Objectif

Permettre de lier les éléments d'itinéraire (`itinerary_items`) à des services spécifiques, permettant un suivi détaillé des réservations et des coûts.

### Modifications à apporter

#### Table `itinerary_items`

Ajouter une colonne pour référencer un service.

**Nouvelle colonne :**

- `service_id` (UUID, REFERENCES services(id) ON DELETE SET NULL) - Optionnel, pour permettre les items sans service lié

**Indexes :**

- `idx_itinerary_items_service_id`

### Fonctionnalités à implémenter

1. **Modifications de l'éditeur d'itinéraire :**

   - Ajouter un sélecteur de service dans le formulaire d'édition d'un item
   - Afficher les informations du service (nom, prix, prestataire) dans l'item
   - Permettre de rechercher des services par nom ou prestataire

2. **Affichage amélioré :**

   - Afficher le nom du prestataire et du service dans les items d'itinéraire
   - Afficher le prix estimé si disponible
   - Lien vers la page du prestataire/service

3. **Services backend :**
   - Mettre à jour `itineraryService.ts` pour inclure les données de service dans les requêtes

### Migration SQL

- Ajouter la colonne `service_id` à `itinerary_items`
- Créer l'index
- Mettre à jour les RLS policies si nécessaire

---

## Phase 6 : Réservations/Bookings

### Objectif

Créer un système de gestion des réservations pour suivre les réservations effectuées auprès des prestataires de services.

### Entité à créer

#### Table `bookings`

Réservations liées aux services et aux séjours.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `stay_id` (UUID, NOT NULL, REFERENCES stays(id) ON DELETE CASCADE)
- `service_id` (UUID, NOT NULL, REFERENCES services(id) ON DELETE RESTRICT)
- `itinerary_item_id` (UUID, REFERENCES itinerary_items(id) ON DELETE SET NULL) - Optionnel, pour lier à un item spécifique
- `booking_date` (DATE, NOT NULL) - Date de la réservation
- `booking_time` (TIME) - Heure de la réservation
- `number_of_guests` (INTEGER)
- `status` (TEXT, NOT NULL, DEFAULT 'pending') - 'pending', 'confirmed', 'cancelled', 'completed'
- `confirmation_number` (TEXT) - Numéro de confirmation du prestataire
- `total_price` (DECIMAL(10, 2))
- `currency` (TEXT, DEFAULT 'EUR')
- `deposit_amount` (DECIMAL(10, 2)) - Acompte payé
- `deposit_paid_at` (TIMESTAMPTZ)
- `notes` (TEXT) - Notes internes
- `cancellation_reason` (TEXT) - Si annulé
- `cancelled_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Contraintes :**

- `status` CHECK IN ('pending', 'confirmed', 'cancelled', 'completed')
- `number_of_guests > 0`
- `total_price >= 0`
- `deposit_amount >= 0`

**Indexes :**

- `idx_bookings_stay_id`
- `idx_bookings_service_id`
- `idx_bookings_itinerary_item_id`
- `idx_bookings_booking_date`
- `idx_bookings_status`

### Fonctionnalités à implémenter

1. **Pages de gestion :**

   - Liste des réservations (filtrée par séjour, statut, date)
   - Page de détail d'une réservation
   - CRUD pour les réservations
   - Vue calendrier des réservations

2. **Services backend :**

   - `bookingService.ts` - Gestion complète des réservations

3. **Composants UI :**

   - `CreateBookingDialog` - Créer une réservation depuis un item d'itinéraire ou directement
   - `EditBookingDialog`
   - `BookingStatusBadge` - Badge de statut
   - `BookingsCalendar` - Vue calendrier
   - `BookingCard` - Carte d'affichage

4. **Intégration :**

   - Lien depuis les items d'itinéraire vers les réservations
   - Créer une réservation depuis un item d'itinéraire avec service
   - Afficher les réservations sur la page de détail du séjour

5. **Notifications :**
   - Rappels pour les réservations à confirmer
   - Alertes pour les réservations en attente

### Migration SQL

- Créer la table `bookings`
- Créer les indexes
- Créer les triggers
- Configurer les RLS policies

---

## Phase 7 : Gestion des Tâches

### Objectif

Créer un système de gestion des tâches pour suivre les actions à effectuer pour chaque séjour.

### Entité à créer

#### Table `tasks`

Tâches liées aux séjours.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `stay_id` (UUID, NOT NULL, REFERENCES stays(id) ON DELETE CASCADE)
- `title` (TEXT, NOT NULL) - Titre de la tâche
- `description` (TEXT)
- `task_type` (TEXT) - 'preparation', 'follow_up', 'reminder', 'custom'
- `priority` (TEXT, DEFAULT 'medium') - 'low', 'medium', 'high', 'urgent'
- `status` (TEXT, DEFAULT 'pending') - 'pending', 'in_progress', 'completed', 'cancelled'
- `due_date` (DATE)
- `due_time` (TIME)
- `completed_at` (TIMESTAMPTZ)
- `assigned_to_user_id` (UUID, REFERENCES auth.users(id)) - Optionnel, pour assigner à un utilisateur spécifique
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Contraintes :**

- `priority` CHECK IN ('low', 'medium', 'high', 'urgent')
- `status` CHECK IN ('pending', 'in_progress', 'completed', 'cancelled')
- `task_type` CHECK IN ('preparation', 'follow_up', 'reminder', 'custom')

**Indexes :**

- `idx_tasks_stay_id`
- `idx_tasks_status`
- `idx_tasks_priority`
- `idx_tasks_due_date`
- `idx_tasks_assigned_to_user_id`

### Fonctionnalités à implémenter

1. **Pages de gestion :**

   - Liste des tâches (filtrée par séjour, statut, priorité, date d'échéance)
   - Vue kanban des tâches (par statut)
   - Page de détail d'une tâche
   - CRUD pour les tâches

2. **Services backend :**

   - `taskService.ts` - Gestion complète des tâches

3. **Composants UI :**

   - `CreateTaskDialog`
   - `EditTaskDialog`
   - `TaskCard` - Carte d'affichage
   - `TaskKanban` - Vue kanban
   - `TaskPriorityBadge` - Badge de priorité
   - `TaskStatusSelector` - Sélecteur de statut

4. **Intégration :**

   - Afficher les tâches sur la page de détail du séjour
   - Créer des tâches depuis les réservations (ex: "Confirmer réservation X")
   - Rappels automatiques pour les tâches à échéance

5. **Templates de tâches :**
   - Tâches automatiques créées lors de la création d'un séjour
   - Tâches suggérées basées sur le type de séjour

### Migration SQL

- Créer la table `tasks`
- Créer les indexes
- Créer les triggers
- Configurer les RLS policies

---

## Phase 8 : Tarification et Facturation

### Objectif

Créer un système complet de gestion des coûts et de facturation pour suivre les dépenses et générer des factures.

### Entités à créer

#### 1. Table `invoices`

Factures générées pour les séjours.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `stay_id` (UUID, NOT NULL, REFERENCES stays(id) ON DELETE CASCADE)
- `invoice_number` (TEXT, NOT NULL, UNIQUE) - Numéro de facture (ex: "INV-2024-001")
- `invoice_date` (DATE, NOT NULL)
- `due_date` (DATE)
- `status` (TEXT, NOT NULL, DEFAULT 'draft') - 'draft', 'sent', 'paid', 'overdue', 'cancelled'
- `subtotal` (DECIMAL(10, 2), NOT NULL, DEFAULT 0)
- `tax_rate` (DECIMAL(5, 2), DEFAULT 0) - Taux de taxe en pourcentage
- `tax_amount` (DECIMAL(10, 2), DEFAULT 0)
- `discount_amount` (DECIMAL(10, 2), DEFAULT 0)
- `total_amount` (DECIMAL(10, 2), NOT NULL, DEFAULT 0)
- `currency` (TEXT, DEFAULT 'EUR')
- `notes` (TEXT) - Notes sur la facture
- `sent_at` (TIMESTAMPTZ)
- `paid_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Contraintes :**

- `status` CHECK IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')
- `subtotal >= 0`
- `tax_amount >= 0`
- `discount_amount >= 0`
- `total_amount >= 0`

**Indexes :**

- `idx_invoices_stay_id`
- `idx_invoices_invoice_number`
- `idx_invoices_status`
- `idx_invoices_invoice_date`

#### 2. Table `invoice_items`

Lignes de facture (détails des services/frais).

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `invoice_id` (UUID, NOT NULL, REFERENCES invoices(id) ON DELETE CASCADE)
- `booking_id` (UUID, REFERENCES bookings(id) ON DELETE SET NULL) - Optionnel, pour lier à une réservation
- `description` (TEXT, NOT NULL) - Description de la ligne
- `quantity` (DECIMAL(10, 2), DEFAULT 1)
- `unit_price` (DECIMAL(10, 2), NOT NULL)
- `total_price` (DECIMAL(10, 2), NOT NULL) - Calculé: quantity \* unit_price
- `sort_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ)

**Contraintes :**

- `quantity > 0`
- `unit_price >= 0`
- `total_price >= 0`

**Indexes :**

- `idx_invoice_items_invoice_id`
- `idx_invoice_items_booking_id`
- `idx_invoice_items_sort_order`

#### 3. Table `payments`

Paiements reçus pour les factures.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `invoice_id` (UUID, NOT NULL, REFERENCES invoices(id) ON DELETE CASCADE)
- `payment_method` (TEXT, NOT NULL) - 'bank_transfer', 'credit_card', 'cash', 'check', 'other'
- `amount` (DECIMAL(10, 2), NOT NULL)
- `currency` (TEXT, DEFAULT 'EUR')
- `payment_date` (DATE, NOT NULL)
- `reference_number` (TEXT) - Numéro de référence du paiement
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Contraintes :**

- `payment_method` CHECK IN ('bank_transfer', 'credit_card', 'cash', 'check', 'other')
- `amount > 0`

**Indexes :**

- `idx_payments_invoice_id`
- `idx_payments_payment_date`

### Fonctionnalités à implémenter

1. **Pages de gestion :**

   - Liste des factures (filtrée par séjour, statut, date)
   - Page de détail d'une facture avec PDF
   - CRUD pour les factures
   - Gestion des lignes de facture
   - Liste des paiements
   - Enregistrement des paiements

2. **Services backend :**

   - `invoiceService.ts` - Gestion des factures
   - `invoiceItemService.ts` - Gestion des lignes de facture
   - `paymentService.ts` - Gestion des paiements

3. **Composants UI :**

   - `CreateInvoiceDialog`
   - `EditInvoiceDialog`
   - `InvoicePDFViewer` - Visualisation PDF
   - `InvoiceItemEditor` - Éditeur de lignes
   - `PaymentDialog` - Enregistrer un paiement
   - `InvoiceStatusBadge`

4. **Génération automatique :**

   - Générer une facture depuis un séjour (incluant toutes les réservations)
   - Calcul automatique des totaux
   - Génération de numéros de facture séquentiels

5. **PDF de facture :**

   - Template de facture professionnel
   - Export PDF
   - Envoi par email (futur)

6. **Suivi financier :**
   - Tableau de bord des revenus
   - Rapports de facturation
   - Suivi des paiements en attente

### Migration SQL

- Créer les tables `invoices`, `invoice_items`, `payments`
- Créer les indexes
- Créer les triggers
- Configurer les RLS policies
- Créer une fonction pour générer les numéros de facture

---

## Phase 9 : Fonctionnalités Avancées

### Objectif

Ajouter des fonctionnalités avancées pour améliorer l'expérience utilisateur et la gestion de l'application.

### Entités à créer

#### 1. Table `attachments`

Pièces jointes pour les séjours, réservations, factures, etc.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `entity_type` (TEXT, NOT NULL) - 'stay', 'booking', 'invoice', 'task'
- `entity_id` (UUID, NOT NULL) - ID de l'entité liée
- `file_name` (TEXT, NOT NULL)
- `file_path` (TEXT, NOT NULL) - Chemin dans le stockage
- `file_size` (BIGINT) - Taille en bytes
- `mime_type` (TEXT)
- `uploaded_by_user_id` (UUID, REFERENCES auth.users(id))
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ)

**Indexes :**

- `idx_attachments_entity_type_id` - Composite sur (entity_type, entity_id)
- `idx_attachments_uploaded_by_user_id`

#### 2. Table `notifications`

Notifications système pour les utilisateurs.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE)
- `type` (TEXT, NOT NULL) - 'booking_reminder', 'task_due', 'payment_received', 'invoice_sent', 'custom'
- `title` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `entity_type` (TEXT) - Type d'entité liée
- `entity_id` (UUID) - ID de l'entité liée
- `is_read` (BOOLEAN, DEFAULT false)
- `read_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

**Indexes :**

- `idx_notifications_user_id`
- `idx_notifications_is_read`
- `idx_notifications_created_at`

#### 3. Table `user_roles`

Rôles des utilisateurs dans l'application.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE)
- `role` (TEXT, NOT NULL) - 'admin', 'manager', 'staff', 'viewer'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Contraintes :**

- `role` CHECK IN ('admin', 'manager', 'staff', 'viewer')
- UNIQUE (user_id, role)

**Indexes :**

- `idx_user_roles_user_id`
- `idx_user_roles_role`

#### 4. Table `permissions`

Permissions granulaires pour les fonctionnalités.

**Colonnes :**

- `id` (UUID, PRIMARY KEY)
- `role` (TEXT, NOT NULL) - Rôle concerné
- `resource` (TEXT, NOT NULL) - Ressource (ex: 'clients', 'bookings', 'invoices')
- `action` (TEXT, NOT NULL) - Action (ex: 'create', 'read', 'update', 'delete')
- `created_at` (TIMESTAMPTZ)

**Contraintes :**

- `role` CHECK IN ('admin', 'manager', 'staff', 'viewer')
- UNIQUE (role, resource, action)

**Indexes :**

- `idx_permissions_role`
- `idx_permissions_resource`

### Fonctionnalités à implémenter

1. **Gestion des pièces jointes :**

   - Upload de fichiers (contrats, photos, documents)
   - Stockage dans Supabase Storage
   - Affichage et téléchargement
   - Gestion par type d'entité

2. **Système de notifications :**

   - Notifications en temps réel
   - Badge de compteur de notifications non lues
   - Centre de notifications
   - Notifications par email (futur)

3. **Gestion des rôles et permissions :**

   - Attribution de rôles aux utilisateurs
   - Vérification des permissions dans l'UI
   - RLS policies basées sur les rôles
   - Interface d'administration des rôles

4. **Fonctionnalités supplémentaires :**
   - Recherche globale améliorée
   - Filtres avancés
   - Export de données (CSV, Excel)
   - Rapports personnalisés
   - Intégrations API (futur)

### Migration SQL

- Créer les tables `attachments`, `notifications`, `user_roles`, `permissions`
- Créer les indexes
- Créer les triggers
- Configurer les RLS policies
- Créer les permissions par défaut pour chaque rôle

---

## Notes d'implémentation

### Principes généraux

1. **Migration progressive** : Chaque phase doit être complètement implémentée et testée avant de passer à la suivante.

2. **RLS Policies** : Toutes les tables doivent avoir des politiques RLS appropriées pour la sécurité des données.

3. **Soft Delete** : Utiliser `deleted_at` pour permettre la récupération des données supprimées.

4. **Timestamps** : Toutes les tables doivent avoir `created_at` et `updated_at` avec des triggers automatiques.

5. **Indexes** : Créer des indexes sur toutes les colonnes utilisées dans les WHERE, JOIN, et ORDER BY.

6. **Validation** : Utiliser des contraintes CHECK pour valider les données au niveau de la base de données.

7. **Consistance UI** : Maintenir le look and feel actuel de l'application lors de l'ajout de nouvelles fonctionnalités.

### Workflow de développement

Pour chaque phase :

1. **Migration SQL** : Créer et appliquer la migration
2. **Services backend** : Créer les services TypeScript
3. **Composants UI** : Créer les composants React
4. **Pages** : Créer les pages de gestion
5. **Intégration** : Intégrer avec les fonctionnalités existantes
6. **Tests** : Tester toutes les fonctionnalités
7. **Documentation** : Mettre à jour la documentation

### Outils et technologies

- **Base de données** : PostgreSQL (via Supabase)
- **Backend** : Supabase (PostgREST, RLS, Storage)
- **Frontend** : React + TypeScript
- **UI Components** : Shadcn UI
- **Styling** : Tailwind CSS
- **Routing** : React Router
- **PDF Generation** : jsPDF
- **Date handling** : date-fns

---

## État d'avancement

- ✅ **Phase 1** : Fondation (Clients, Accommodations) - **COMPLÉTÉE**
- ✅ **Phase 2** : Gestion des Séjours - **COMPLÉTÉE**
- ⏳ **Phase 3** : Fondation des Prestataires de Services - **À FAIRE**
- ⏳ **Phase 4** : Architecture des Services - **À FAIRE**
- ⏳ **Phase 5** : Lier les Services aux Itinéraires - **À FAIRE**
- ⏳ **Phase 6** : Réservations/Bookings - **À FAIRE**
- ⏳ **Phase 7** : Gestion des Tâches - **À FAIRE**
- ⏳ **Phase 8** : Tarification et Facturation - **À FAIRE**
- ⏳ **Phase 9** : Fonctionnalités Avancées - **À FAIRE**

---

_Dernière mise à jour : Décembre 2024_
