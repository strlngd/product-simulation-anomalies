# Planning

> This was the initial planning done before starting the project.

> Disclaimer: This project is a concept mockup and not intended to fully replicate inventory management systems.

## **Overview**

The purpose of this project is to simulate and detect anomalies within product purchases and inventory. Retail stores have faced many challenges throughout the pandemic as well as natural disasters such as hurricanes. This project provides a **concept** for determining what products are being purchased at a different rate than the normal while utilizing data acquired to create a heatmap that also showcases areas of the store that are lacking in sales.

---

## **Technologies**

### Backend

`.NET Core 6`, `ASP.NET`, `Newtonsoft.Json`

### Frontend

`Typescript`, `Angular.js`, `PostCSS`

**Decisions**:

- Use `Talewind` OR `Bootstrap`
- Use `WebAssembly`???

**Heatmap**:

- https://developers.google.com/maps/documentation/javascript/examples/layer-heatmap
- https://www.patrick-wied.at/static/heatmapjs/

### Database

`???`

Could use relational with area names or just store in memory since the data is small in size.

## **Simulation**

Create data for store regions:

```json
// Store Region
{
  "id": "GUID", // Key for araa lookups
  "name": "Region Name", // Name of region (e.g. aisle)
  "area_points": [] // Area of region defined as an array of points (x,y)
}
```

Create data for products:

```json
// Product
{
  "id": "GUID / SKU", // Key for product lookups
  "name": "Product Name", // Name of product
  "region": "???", // Where the product is located in the store
  "buy_factor": 0.15 // Value indicating how many of this product is purchased per customer on average
}
```

The `buy_factor` represents on average how many of a particular item a customer will purchase in a given shopping trip. If the value is `0.25` it means, on average, 1 in 4 shoppers will purchase this item. Likewise, if the value is `2.0` it means, on average, each shopper will buy 2 of this item.

Use Random Number Generation (RNG) to determine whether or not a customer buys an item.

For simulation purposes, we only care about what the customer buys and walks out the door with. Because of this, we don't need to simulate movement, just load `cart` data for the customer with products determined from RNG and then process those products immedietly.

```json
// Cart
[
  {
    "product_id": "GUID / SKU", // Key for product lookups
    "amount": 2 // How many of that product is in the cart
  }
]
```

**^ Note:** The array of objects above is an array of key-value pairs.

### Anomaly Detection

A basic anomaly detection would be when a product is being purchased at a rate that differs from its `buy_factor` by a given threshold.

`???` **We could use machine learning instead?**

The benefit of a machine learning model is that it could better understand the idea of varying purchase amounts. For example if you have 100 customers and the purchases for an item over a week are `[10, 11, 12, 14, 14, 17, 20]`, this is not neccessarily an anomaly as the purchases are gradually increasing. Same thing with `[10, 12, 14, 10, 18, 19, 20]`. If we look at the jump from 10 to 18, this appears to be an anomaly, but the previous day was 14 and gradually increasing.

To do this, we could feed a model with the current purchases for that day and compare it to a set of previous days. The model returns a value ranging from 0 (no anomaly) to 1 (anomaly).

It should be noted, if we use machine learning, the `buy_factor` of a product should be updated daily to reflect the current state of sales. It may be a good idea to use previous days in this calculation as well.

> ^ This will require more thought. It would be nice to have it perform in real-time.`

---

## **Visualization**

Create a 2D top-down view of a store with labelled areas and aisles. Utilize simulated data to generate a heatmap of product purchases over an indicated timespan.

Color Guide:

- Green: No anomalies
- Yellow: Up to 2.5% anomalies
- Orange: Up to 5% anomalies
- Red: More than 5% anomalies

Create way to visualize product anomaly with scatter chart.

---

## **User Interface**

Create a modern themed user interface with controls located at the top of the page's content.

### Base User Functionality

- Simulation Speed Slider
- Heatmap Timespan Slider ???
- Force Anomaly Button

### Developer Functionality

- Create easy way to define regions and products ???

---

## **Big Questions**

**Should the inventory of a product be infinite for simulation purposes?**

- > Either way we can still detect anomalies. Because this project ignores issues with suppliers—if an item is ever out of stock, it would mean that this was unexpected and therefore an anomaly. If the product is infinitely available and being purchased at a rate higher than expected through the `buy_factor`, this is also an anomaly.

**Should machine learning be used for anomaly detection?**
