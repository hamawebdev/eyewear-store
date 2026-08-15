# Authorisation

Source URL: https://documenter.getpostman.com/view/14517169/Tz5je15g

Endpoints in this section: 1

## Section Notes

Pour consommer l'API il est nécessaire de générer un **token** à partir de votre compte ECOTRACK, ce token est un équivalent de votre nom d'utilisateur et mot de passe.

Utiliser le token de l'API dans l'en-tête Autorisation autan que jeton Bearer.

## GET Vérification de validité d'un token

URL: `{{url}}/api/v1/validate/token?api_token={{api_token}}`

Auth: No auth

Cet endpoint permet de vérifier si votre token est valide.
Les retours possibles sont :

- `{ 'success' : false, 'message' : 'INVALID_TOKEN'}` si le token est invalide

- `{ 'success' : false, 'message' : 'TOKEN_NOT_ALLOWED'}` Si l'accès a l'api public est désactivé pour ce compte

- `{ 'success' : true, 'message' : 'VALID_TOKEN'}` Si le token est valide

### Query Parameters

| Name | Example | Description |
| --- | --- | --- |
| api_token | {{api_token}} | |

### Example Responses

#### Vérification de validité d'un token

```text
{ 'success' : true, 'message' : 'VALID_TOKEN'}
```
