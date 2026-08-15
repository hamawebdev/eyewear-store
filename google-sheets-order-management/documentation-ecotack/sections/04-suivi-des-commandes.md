# Suivi des commandes

Source URL: https://documenter.getpostman.com/view/14517169/Tz5je15g

Endpoints in this section: 7

## POST Ajouter une information de suivi sur le colis

URL: `{{url}}/api/v1/add/maj?tracking={{tracking}}&content={{text}}`

Auth: Inherited from the collection/folder

Après expédition et pendant le process de livraison de votre commande vous pouvez ajouter des remarques sur le colis pour notifier la société de livraison sur un éventuel changement.

Ce point de terminaison vous permet d'ajouter une mise à jour sur votre colis

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |
| content | {{text}} | Contenu de la mise a jour \| string , maximum : 255 caractéres , **obligatoire** |

### Example Responses

#### Ajouter une information de suivi sur le colis (200 OK)

```json
{
 "success": true,
 "message": "Mise a jour avec success"
}
```

---

## GET Liste des mise a jours appliquée sur un colis

URL: `{{url}}/api/v1/get/maj?tracking={{tracking}}`

Auth: Inherited from the collection/folder

Il est possible de récupérer l’ensemble des mises a jours appliquées sur un colis.
La liste contient les mises a jours appliquées par le livreur et / ou par l’expéditeur.

Ce point de terminaison vous permet de récupérer la liste des mises à jours

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |

### Example Responses

#### Liste des mise a jours appliquées sur un colis (200 OK)

```json
[
 {
 "remarque": "Test Shop : TEST MAJ",
 "station": "",
 "livreur": "",
 "created_at": "2021-03-05 11:04:19",
 "tracking": "ECQFLD2103047673"
 },
 {
 "remarque": "Test Shop : Livraison avant 17:00 h",
 "station": "",
 "livreur": "",
 "created_at": "2021-03-05 11:04:51",
 "tracking": "ECQFLD2103047673"
 },
 {
 "remarque": "لا يرد على الإتصال",
 "station": "Centre draria",
 "livreur": "testhasna test",
 "created_at": "2021-03-05 11:16:27",
 "tracking": "ECQFLD2103047673"
 }
]
```

---

## POST Demander le retour d'un colis

URL: `{{url}}/api/v1/ask/for/order/return?tracking={{tracking}}`

Auth: Inherited from the collection/folder

Si le colis est en livraison il est possible de soumettre une demande de retour, dans le cas contraire un code d'erreur vous sera renvoyé.

NB: cette demande peut être ignorée par la société de livraison.

Ce point de terminaison vous permet de demander le retour

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |

### Example Responses

#### Demander le retour d'un colis - Erreur (200 OK)

```json
{
 "success": false,
 "error": 10003,
 "message": "Le retour ne peut pas etre demandé pour cette commande"
}
```

#### Demander le retour d'un colis (200 OK)

```json
{
 "success": true,
 "message": "Retour demandé avec succès"
}
```

---

## GET Suivi et historique des operations sur une commande

URL: `{{url}}/api/v1/get/tracking/info?tracking={{tracking}}`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité de récupérer l'historique des opérations effectuées sur une commande.

Les retours possibles pour **activity** sont **:**

- **order_information_received_by_carrier** : Commande enregistrée et validée par le vendeur

- **picked**: Commande récupérée par le prestataire de livraison

- **accepted_by_carrier**
 Commande réceptionnée par le centre de tri (Hub ou Station)

- **dispatched_to_driver**
 Commande dispatchée au livreur

- **attempt_delivery**
 Tentative de livraison

- **return_asked**
 Retour initié par le centre de tri (Hub ou Station)

- **return_in_transit**
 Retour en transit

- **Return_received**
 Retour réceptionné par le vendeur

- **livred**
 Commande livrée

- **encaissed**
 Commande encaissée

- **payed**:
 Paiement effectué

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |

### Example Responses

#### Suivi et historique des operations sur une commande - Erreur tracking (422 Unprocessable Entity)

```json
{
 "message": "The given data was invalid.",
 "errors": {
 "tracking": [
 "Le champ tracking sélectionné est invalide."
 ]
 }
}
```

#### Suivi et historique des operations sur une commande (200 OK)

```json
{
 "recipientName": "client",
 "shippedBy": "Test Shop",
 "originCity": 16,
 "destLocationCity": 16,
 "activity": [
 {
 "date": "2021-03-04",
 "time": "22:32:47",
 "status": "order_information_received_by_carrier"
 },
 {
 "date": "2021-03-05",
 "time": "11:04:49",
 "status": "notification_on_order"
 },
 {
 "date": "2021-03-05",
 "time": "11:05:21",
 "status": "notification_on_order"
 },
 {
 "date": "2021-03-05",
 "time": "11:15:26",
 "status": "picked"
 },
 {
 "date": "2021-03-05",
 "time": "11:16:05",
 "status": "accepted_by_carrier"
 },
 {
 "date": "2021-03-05",
 "time": "11:16:37",
 "status": "dispatched_to_driver",
 "scanLocation": "HUB"
 },
 {
 "date": "2021-03-05",
 "time": "11:16:57",
 "status": "attempt_delivery"
 }
 ]
}
```

---

## GET Suivi et historique des operations sur plusieurs commandes

URL: `{{url}}/api/v1/get/trackings/info?trackings[]=[{{tracking}},{{tracking}}]`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité de récupérer l'historique des opérations effectuées sur un ensemble de commandes.
Il est possible de soumettre un tableau de 100 trackings en une seule requête.

Les retours possibles pour **status** sont :

- **'Prêt à expédier'**

- **'Prêt à préparer'**

- **'En ramassage'**

- **'Stock en préparation'**

- **'Vers hub'**

- **'En hub'**

- **'Vers wilaya'**

- **'En préparation'**

- **'En livraison'**

- **'Suspendus'**

- **'Retours chez livreur'**

- **'Retours en traitement'**

- **'Retours prêts'**

- **'Retours reçu'**

- **'Retours à dispatcher vers stock'**

- **'Retours en transit stock'**

- **'Retours en stock'**

- **'Livre non encaissé'**

- **'Livre encaissé non payé'**

- **'Paiement prêt'**

- **'Paiement archivé'**

- **'Retours archivé'**

Les retours possibles pour **activity** sont **:**

- **order_information_received_by_carrier** : Commande enregistrée et validée par le vendeur

- **picked**: Commande récupérée par le prestataire de livraison

- **accepted_by_carrier**
 Commande réceptionnée par le centre de tri (Hub ou Station)

- **dispatched_to_driver**
 Commande dispatchée au livreur

- **attempt_delivery**
 Tentative de livraison

- **return_asked**
 Retour initié par le centre de tri (Hub ou Station)

- **return_in_transit**
 Retour en transit

- **Return_received**
 Retour réceptionné par le vendeur

- **livred**
 Commande livrée

- **encaissed**
 Commande encaissée

- **payed**:
 Paiement effectué

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| trackings[] | [{{tracking}},{{tracking}}] | tableau des trackings \| **obligatoire** |

### Example Responses

#### Suivi et historique des operations sur une commande - Erreur tracking (422 Unprocessable Entity)

```json
{
 "message": "The given data was invalid.",
 "errors": {
 "tracking": [
 "Le champ tracking sélectionné est invalide."
 ]
 }
}
```

---

## GET Liste des commandes avec status

URL: `{{url}}/api/v1/get/orders?page={{int}}&start_date={{Y-m-d}}&end_date={{Y-m-d}}&tracking`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité de récupérer la liste de vos commandes en process avec leurs statuts actuels.

Les résultats sont affichés en pagination avec 40 commandes par page.

Il est possible de naviguer entre les pages en utilisant le paramètre page.

Par défaut, le point de terminaison renvoie les commandes en process crée lors des derniers 90 jours, vous pouvez utiliser les paramètres **start_date** et **end_date** pour personnaliser la période selon vos besoins.

Il est egalement possible de recuperer les information pour **une commande uniquement** en envoyant le parametre **tracking** dans la requette.

NB: les commandes archivés sont exclut du retour des resultat pour ce point de terminaison

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| page | {{int}} | page a afficher \| int |
| start_date | {{Y-m-d}} | Filtre par date de creation de la commande \| Y-m-d |
| end_date | {{Y-m-d}} | Filtre par date de creation de la commande \| Y-m-d |
| tracking | | Tracking de la commande |

### Example Responses

#### Liste des commandes avec status (200 OK)

```json
{
 "current_page": 1,
 "data": [
 {
 "tracking": "ECG4SU2112195902",
 "reference": null,
 "client": "kas",
 "phone": "0560351041",
 "phone_2": null,
 "adresse": "Alger",
 "commune": "Ain Taya",
 "wilaya_id": 16,
 "montant": "500",
 "tarif_prestation": "400",
 "tarif_retour": "200",
 "type_id": 1,
 "created_at": "2021-12-19",
 "payment_id": null,
 "return_id": null,
 "status": "prete_a_expedier",
 "products": "Prod 1"
 },
 {
 "tracking": "ECG4SU2111175434",
 "reference": "REF123",
 "client": "client 1",
 "phone": "0500000000",
 "phone_2": null,
 "adresse": "ouled fayet",
 "commune": "Ouled Fayet",
 "wilaya_id": 16,
 "montant": "21900",
 "tarif_prestation": "400",
 "tarif_retour": "200",
 "type_id": 1,
 "created_at": "2021-11-16",
 "payment_id": 312,
 "return_id": null,
 "status": "payé_et_archivé",
 "products": "Prod 1"
 }
 ],
 "first_page_url": "https://ecotrack-new.test/api/v1/get/orders?page=1",
 "from": 1,
 "last_page": 190,
 "last_page_url": "https://ecotrack-new.test/api/v1/get/orders?page=190",
 "links": [
 {
 "url": null,
 "label": "&laquo; Précédent",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=1",
 "label": "1",
 "active": true
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=2",
 "label": "2",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=3",
 "label": "3",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=4",
 "label": "4",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=5",
 "label": "5",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=6",
 "label": "6",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=7",
 "label": "7",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=8",
 "label": "8",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=9",
 "label": "9",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=10",
 "label": "10",
 "active": false
 },
 {
 "url": null,
 "label": "...",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=189",
 "label": "189",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=190",
 "label": "190",
 "active": false
 },
 {
 "url": "https://ecotrack-new.test/api/v1/get/orders?page=2",
 "label": "Suivant &raquo;",
 "active": false
 }
 ],
 "next_page_url": "https://ecotrack-new.test/api/v1/get/orders?page=2",
 "path": "https://ecotrack-new.test/api/v1/get/orders",
 "per_page": 2,
 "prev_page_url": null,
 "to": 2,
 "total": 379
}
```

---

## GET Filtre des commandes par status

URL: `{{url}}/api/v1/get/orders/status?api_token={{token}}&trackings={{tracking1}},{{tracking2}},{{tracking3}}&status={{status1}},{{status2}},{{status3}}`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité de filtrer la liste de vos commandes par leurs statuts .

Le nombre maximum de trackings soumis est de 100 par requête.

les statuts disponibles sont identique a l'affichage du menu sur votre compte expéditeur :

- **prete_a_expedier,**

- **en_ramassage,**

- **en_preparation_stock,**

- **vers_hub,**

- **en_hub,**

- **vers_wilaya,**

- **en_preparation,**

- **en_livraison,**

- **suspendu,**

- **livre_non_encaisse,**

- **encaisse_non_paye,**

- **paiements_prets,**

- **paye_et_archive,**

- **retour_chez_livreur,**

- **retour_transit_entrepot,**

- **retour_en_traitement,**

- **retour_recu,**

- **retour_archive,**

- **annule**

- **all**

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| api_token | {{token}} | token généré a partir de votre compte \| **obligatoire** |
| trackings | {{tracking1}},{{tracking2}},{{tracking3}} | trackings des commandes \| string \| **obligatoire** |
| status | {{status1}},{{status2}},{{status3}} | status des commandes \| string \| **obligatoire** |

### Example Responses

#### Filtre des commandes par status (200 OK)

```json
{
 "data": {
 "ECLWIT2505052286": {
 "status": "en_preparation",
 "order_id": "1237",
 "desk_phone": "",
 "desk_commune": "",
 "desk_map_link": "",
 "desk_address": "",
 "activity": [
 {
 "reason": "Client ne réponds pas",
 "details": "",
 "station": "Station principale",
 "driver": "HINI Djamel",
 "date": "2025-07-16",
 "time": "02:08:51",
 "postponed_to": null
 },
 {
 "reason": "Le client est absent",
 "details": "test 000029",
 "station": "Station principale",
 "driver": "HINI Djamel",
 "date": "2025-07-16",
 "time": "02:09:11",
 "postponed_to": "2025-07-19"
 },
 {
 "reason": "Écrire une remarque",
 "details": "another test",
 "station": "Station principale",
 "driver": "HINI Djamel",
 "date": "2025-07-16",
 "time": "02:09:20",
 "postponed_to": "2025-07-19"
 }
 ]
 },
 "ECLWIT2507162547": {
 "status": "en_livraison",
 "order_id": "",
 "driver_phone": "0123456789",
 "desk_phone": "",
 "desk_commune": "",
 "desk_map_link": "",
 "desk_address": "",
 "activity": [
 {
 "reason": "Remarque",
 "details": "Colis a livrer le 23 juillet",
 "station": "Station principale",
 "driver": "",
 "date": "2025-07-16",
 "time": "02:31:15",
 "postponed_to": "2025-07-23"
 }
 ]
 },
 "ECLWIT2505052287": {
 "status": "encaisse_non_paye",
 "order_id": "",
 "estimated_fee": 700,
 "activity": []
 }
 }
}
```
