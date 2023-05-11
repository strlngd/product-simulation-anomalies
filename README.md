# Product Purchase Simulator With Anomaly Detection

A project created to simulate product purchases within a grocery or other retail environment to visualize purchase anomalies. Such anomalies could be indicative of changes in purchase patterns outside the normal trend. In real-world situations, this may lead to a shortage or surplus of products which could result in out of stock or expired goods.

Note that this project is a proof-of-concept prototype and is not connected to any real product data.

## Technologies Used

- `.NET Core 6` (`ASP.NET`, `C#`)
- `Angular`
- `TypeScript`
- `JSON`
- `Tailwind.css`
- `Chart.js`

## User Guide

This web application makes use of a top-down floorplan view of a grocery store with highlighted product regions for visualization.

Regions are color-coded based on the percentage ratio of anomalies within their containing products as follows:

- Green: No anomalies
- Yellow: Up to 2.5% anomalies
- Orange: Up to 5% anomalies
- Red: More than 5% anomalies

Users can click on an individual region to display details of the products within that region in the details panel located to the right of the floorplan. From here, users can then click on individual products to view a graph of the product purchase trend with anomalies marked as a red (`+`) symbol.

To simulate new data, the user can click on the `Simulate Next` button. They can adjust the total time to simulate with the ComboBox located left of the aforementioned button.
