# Commandes

Source URL: https://documenter.getpostman.com/view/14517169/Tz5je15g

Endpoints in this section: 6

## POST Ajouter une commande

URL: `{{url}}/api/v1/create/order?reference&nom_client=&telephone=&telephone_2&adresse=&code_postal&commune=&code_wilaya=&montant=&remarque&produit&stock&quantite&produit_a_recuperer&boutique&type=&stop_desk&weight&fragile&gps_link`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité d'ajouter des commandes sur votre compte ECOTRACK .

Tous les types sont autorisés:

- Livraison

- Pick UP

- Échange

- Recouvrement.

La requête est de type POST.
Il n'est possible d'ajouter qu'une seule commande par requête.

Le contenu de la requête est un tableau de paramètres, contenant votre token d'identification et les informations relatives à la commande.

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| reference | | Reference de la commande \| string , maximum 255 caractéres , optionnel |
| nom_client | | nom & prénom du destinataire \| string , maximum 255 caractéres , **obligatoire** |
| telephone | | numéro de téléphone du destinataire \| numeric , entre 9 et 10 chiffres , **obligatoire** |
| telephone_2 | | numéro de téléphone du destinataire \| numeric , entre 9 et 10 chiffres , optionnel |
| adresse | | L'adresse de livraison \| string , maximum 255 caractéres , **obligatoire** |
| code_postal | | Le code postal \| numeric , optionnel |
| commune | | Le nom de la commune \| string , maximum 255 caractéres , **obligatoire** |
| code_wilaya | | Le code de la wilaya \| integer , entre 1 et 58 , **obligatoire** |
| montant | | Le montant à récolter , incluant les frais de livraison\| numeric , **obligatoire** |
| remarque | | Remarque ou consignes à propos du colis ou de la livraison.\| string , maximum 255 caractéres , optionnel |
| produit | | Nom du/des produit(s) , Si la commande est préparée avec des produits stockés chez le prestataire, les références des produits doivent être séparées par une virgule. ( Ex : prod001,prod052 ) \| string , maximum 255 caractéres , optionnel |
| stock | | Si la commande sera préparée du stock [0 : non , 1 : oui] \| integer , 0 ou 1 |
| quantite | | Si la commande est avec stock, les quantités de chaque produit séparé par une virgule \| **obligatoire** si stock = 1 |
| produit_a_recuperer | | Produit à récuperer dans le cas d'un échange, maximum 255 caractéres , optionnel |
| boutique | | Nom de la boutique, si vous gérez plusieurs boutiques en amant \| string , maximum 255 caractéres , optionnel |
| type | | Type de l'operation *[ 1 = Livraison , 2 = Echange , 3 = PICKUP , 4 = Recouvrement ]* \| integer , entre 1 et 4 , **obligatoire** |
| stop_desk | | choix de la prestation Livraison à domicile ou bien collecte en Point relais et STOP DESK. *[ 0 = a domicile , 1 = STOP DESK ]* \| integer , entre 0 et 1 ,<br> optionnel |
| weight | | Poids du colis, optionnel |
| fragile | | Si le colis contient des produits fragiles , optionnel [ valeurs possibles 0 , 1 ] |
| gps_link | | Lien de Localisation du client, optionnel |

### Example Responses

#### Ajouter une commande - Erreur parametres (422 Unprocessable Entity)

```json
{
 "message": "The given data was invalid.",
 "errors": {
 "nom_client": [
 "Le champ nom client est obligatoire."
 ],
 "telephone": [
 "Le champ téléphone est obligatoire."
 ],
 "adresse": [
 "Le champ adresse est obligatoire."
 ],
 "code_wilaya": [
 "Le champ code wilaya est obligatoire."
 ],
 "commune": [
 "Le champ commune est obligatoire."
 ],
 "montant": [
 "Le champ montant est obligatoire."
 ],
 "type": [
 "Le champ type est obligatoire."
 ]
 }
}
```

#### Ajouter une commande (200 OK)

```json
{
 "success": true,
 "tracking": "ECQFLD2103047673"
}
```

#### Ajouter une commande - Erreur wilaya (200 OK)

```json
{
 "success": false,
 "error": 10002,
 "message": "Pas de livraison pour la wilaya sélectionnée"
}
```

---

## POST Ajouter plusieurs commandes

URL: `{{url}}/api/v1/create/orders`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité d'ajouter plusieurs commandes sur votre compte ECOTRACK .

Tous les types sont autorisés:

- Livraison

- Pick UP

- Échange

- Recouvrement.

La requête est de type POST.
la limite est de 100 commandes par requette

Le contenu de la requête est un tableau contenant les commandes

### Request Body (raw)

```json
{
 "orders": {
 "0": {
 "reference":"DEMO852",
 "nom_client": "client 1",
 "telephone": "0500000000",
 "telephone_2": "",
 "adresse": "17 rue med",
 "code_postal":"",
 "commune": "Oum Touyour",
 "code_wilaya": "5",
 "montant": "5000",
 "remarque": "test",
 "produit": "tesrty",
 "stock": 1,
 "quantite": "1",
 "produit_a_recuperer": "",
 "boutique" : "",
 "type": "1",
 "stop_desk":0,
 "weight": "2",
 "gps_link": "https://maps.app.goo.gl/VnX8UtFq4PVY2c7d7"
 },
 "1": {
 "reference":"DEMO853",
 "nom_client": "client 2",
 "telephone": "0500000002",
 "telephone_2": "",
 "adresse": "17 rue med",
 "code_postal":"",
 "commune": "Oum Touyour",
 "code_wilaya": "5",
 "montant": "5000",
 "remarque": "test",
 "produit": "tesrty",
 "stock": 1,
 "quantite": "1",
 "produit_a_recuperer": "",
 "boutique" : "",
 "type": "1",
 "stop_desk":0,
 "weight": "2"
 }
 }
}
```

### Example Responses

#### Ajouter plusieurs commandes - Erreur parametres (422 Unprocessable Entity)

```json
{
 "results": {
 "DEMO852": {
 "telephone": [
 "Le champ téléphone est obligatoire."
 ],
 "code_wilaya": [
 "Le champ code wilaya est obligatoire."
 ],
 "commune": [
 "Commune mal écrite, ou désactivée.",
 "Wilaya mal écrite, ou désactivée."
 ]
 },
 "DEMO853": {
 "success": true,
 "tracking": "ECTNYH2407062554"
 }
 }
}
```

---

## POST Modifier une commande

URL: `{{url}}/api/v1/update/order?tracking={{tracking}}&reference&client&tel&tel2&adresse=&code_postal&commune&wilaya=&montant=&remarque&product&boutique&type&stop_desk&fragile&gps_link`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité d’apporter des modifications sur une commande après sa création et avant sa validation.

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |
| reference | | Reference de la commande \| string , maximum 255 caractéres , optionel |
| client | | nom & prénom du destinataire \| string , maximum 255 caractéres , optionel |
| tel | | numéro de téléphone du destinataire \| numeric , entre 9 et 10 chiffres , optionel |
| tel2 | | numéro de téléphone du destinataire \| numeric , entre 9 et 10 chiffres , optionel |
| adresse | | L'adresse de livraison \| string , maximum 255 caractéres , optionel |
| code_postal | | Le code postal \| numeric , optionel |
| commune | | Le nom de la commune \| string , maximum 255 caractéres , optionel |
| wilaya | | Le code de la wilaya \| integer , entre 1 et 58 , optionel |
| montant | | Le montant a récolté , incluant les frais de livraison\| numeric , optionel |
| remarque | | Remarque ou consignes a propo du colis ou de la livraison \| string , maximum 255 caractéres , optionel |
| product | | Nom du/des produit(s) \| string , maximum 255 caractéres , optionel |
| boutique | | Nom de la boutique, si vous geré plusieurs boutiques en amant \| string , maximum 255 caractéres , optionel |
| type | | Type de l'operation *[ 1 = Livraison , 2 = Echange , 3 = PICKUP , 4 = Recouvrement ]* \| integer , entre 1 et 4 , optionel |
| stop_desk | | choix de la prestation Livraison a domicile ou bien collecte en Point relais et STOP DESK. *[ 0 = a domicile , 1 = STOP DESK ]* \| integer , entre 0 et 1 , optionel |
| fragile | | Colis fragile. *[ 0 = NON , 1 = OUI ]* \| integer , entre 0 et 1 , optionel |
| gps_link | | Lien de Localisation du client |

### Example Responses

#### Modifier une commande (200 OK)

```json
{
 "success": true,
 "message": "Commande modifiée avec succès"
}
```

#### Modifier une commande - Erreur tracking (422 Unprocessable Entity)

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

#### Modifier une commande - Erreur commande non modifiable (200 OK)

```json
{
 "success": false,
 "error": 10001,
 "message": "Commande non modifiable"
}
```

---

## DELETE Supprimer une commande

URL: `{{url}}/api/v1/delete/order?tracking={{tracking}}`

Auth: Inherited from the collection/folder

Ce point de terminaison vous donne la possibilité de supprimer la commande, tant que l’expédition n'est pas validée

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |

### Example Responses

#### Supprimer une commande - Erreur commande non modifiable (200 OK)

```json
{
 "success": false,
 "error": 10001,
 "message": "Commande non modifiable"
}
```

#### Supprimer une commande (200 OK)

```json
{
 "success": true,
 "message": "Commande supprimée"
}
```

---

## POST Expedier une commande

URL: `{{url}}/api/v1/valid/order?tracking={{tracking}}&ask_collection`

Auth: Inherited from the collection/folder

Ce point de terminaison est utilisé pour valider et expédier une commande.

NB: Après l’expédition de la commande il ne sera plus possible de modifier les informations ou de la supprimer.

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |
| ask_collection | | Demande de ramassage du colis \| int , 1 = demander un ramassage , 0 = pas de remassage |

### Example Responses

#### Valider & Expedier une commande (200 OK)

```json
{
 "success": true,
 "message": "Commande expedier avec succès"
}
```

---

## GET Télécharger l'étiquette

URL: `{{url}}/api/v1/get/order/label?tracking={{tracking}}`

Auth: Inherited from the collection/folder

Ce point de terminaison est utilisé pour générer et télécharger l'étiquette spécifique à la commande.

Le fichier retourné par cet appel est au format **PDF**

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| tracking | {{tracking}} | L'identifiant unique de la commande \| **obligatoire** |
