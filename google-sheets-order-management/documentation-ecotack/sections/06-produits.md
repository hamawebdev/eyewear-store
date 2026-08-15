# Produits

Source URL: https://documenter.getpostman.com/view/14517169/Tz5je15g

Endpoints in this section: 1

## GET Liste des produits

URL: `{{url}}/api/v1/get/products/list`

Auth: Bearer token

### Example Responses

#### Liste des produits (200 OK)

```json
{
 "products": [
 {
 "reference": "290444",
 "barcode": null,
 "title": "kas",
 "is_active": 1,
 "image": null,
 "stock_disponible": 1,
 "stock_reserve": 1,
 "stock_phisique": 2
 }
 ],
 "pagination": {
 "current_page": 1,
 "last_page": 1,
 "per_page": 15,
 "total": 1,
 "from": 1,
 "to": 1
 }
}
```
