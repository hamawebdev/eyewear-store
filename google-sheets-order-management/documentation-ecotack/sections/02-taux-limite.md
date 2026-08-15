# Taux limite

Source URL: https://documenter.getpostman.com/view/14517169/Tz5je15g

Endpoints in this section: 1

## Section Notes

Présentation des Limites de Taux
Pour assurer la stabilité et la disponibilité de notre API, nous avons mis en place des limites de taux d'utilisation. Ces limites vous permettent d'effectuer un certain nombre de requêtes pendant une période définie.

Notre API applique les limites suivantes :

- **15 000 requêtes par jour** par utilisateur ou adresse IP

- **1 500 requêtes par heure** par utilisateur ou adresse IP

- **50 requêtes par minute** par utilisateur ou adresse IP

Comment suivre votre utilisation
Chaque réponse de l'API contient des en-têtes spécifiques qui vous permettent de suivre votre consommation :

En-têtes pour la limite journalière

- `X-RateLimit-Limit-Day` : Nombre total de requêtes autorisées par jour

- `X-RateLimit-Remaining-Day` : Nombre de requêtes restantes pour la journée

- `X-RateLimit-Reset-Day` : Timestamp Unix indiquant quand le compteur journalier sera réinitialisé

En-têtes pour la limite horaire

- `X-RateLimit-Limit-Hour` : Nombre total de requêtes autorisées par heure

- `X-RateLimit-Remaining-Hour` : Nombre de requêtes restantes pour l'heure en cours

- `X-RateLimit-Reset-Hour` : Timestamp Unix indiquant quand le compteur horaire sera réinitialisé

Que faire en cas de dépassement des limites
Si vous dépassez l'une de ces limites, l'API renverra une réponse avec le code d'état HTTP `429 Too Many Requests` et un message d'erreur expliquant quelle limite a été dépassée.

La réponse contiendra également :

- Un message indiquant quand vous pourrez à nouveau effectuer des requêtes

- L'en-tête `Retry-After` indiquant le nombre de secondes à attendre

Bonnes pratiques
Pour éviter de dépasser les limites de taux :

- **Surveillez votre utilisation** en vérifiant régulièrement les en-têtes de limite

- **Espacez vos requêtes** plutôt que de les envoyer en rafales

- **Mettez en cache** les données que vous utilisez fréquemment

- **Implémentez une logique de backoff** qui suspend temporairement les requêtes lorsque vous approchez des limites

Exemple de réponse
`HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 50
X-RateLimit-Limit-Remaining: 49
X-RateLimit-Limit-Day: 15000
X-RateLimit-Remaining-Day: 14950
X-RateLimit-Reset-Day: 1710892800
X-RateLimit-Limit-Hour: 1500
X-RateLimit-Remaining-Hour: 1490
X-RateLimit-Reset-Hour: 1710817200

`
```
Pour toute question concernant les limites de taux ou si vous avez besoin de limites plus élevées pour un cas d'utilisation spécifique, n'hésitez pas à contacter notre équipe de support.

## GET Taux limite

URL: `{{url}}/api/v1/`

Auth: Inherited from the collection/folder

Si vous envoyez plus de 50 requêtes par minute vous aurez la réponse suivante: **429 Too Many Request**

### Example Responses

#### Taux limite (429 Too Many Requests)

```json
{
 "message": "Too Many Attempts."
}
```
