# Globus CRM: Automated Business Workflow

This document outlines the core business process and automated data flow of the Globus Engineering CRM system, based on the legacy Globus/xforcia architecture.

## 1. Master Data Setup (Initial Stage)
The foundation of the system depends on setting up these key master records:
- **Items:** Define the industrial parts or products being handled.
- **Processes:** Define the specific manufacturing or treatment steps performed.
- **Customers:** Register the clients receiving these services.

## 2. Price Fixing (Configuration Stage)
Once Items and Processes are defined, prices must be fixed.
- Prices are set per **Item** for specific customers.
- This step ensures that the system knows exactly what to charge when a specific part is brought in.

## 3. Inward Entry (The Action Stage)
This is the **primary trigger** for the entire automated system.
- When materials are received, an **Inward Entry** is created.
- The user selects the **Customer**, selects the **Item**, and picks the relevant **Processes**.
- **Crucial:** Once the Inward Entry is saved, the rest of the workflow becomes automated.

## 4. Automatic Invoicing (Zero-Manual Stage)
- No manual Invoice entry should be performed.
- The system automatically generates a corresponding **Invoice Record** from the **Inward Entry** data using the prices fixed in Stage 2.
- The system manages the links between Inward No, DC No, and the resulting Invoice No.

## 5. Invoice Management & Reporting
In the Invoice module, users can view and handle the automatically generated entries:
- **Filtering:** Invoices can be filtered/categorized by "With Process", "Without Process" (WOP), or "Both".
- **Reports:** All financial, tax (GST), and ledger reports are stored and generated automatically based on this flow.
- **Persistence:** Every action from the Inward Entry onwards is captured permanently in the database for consistency.

---
**Core Rule:** *Data flows forward. Never create manual financial records that should have originated from an Inward Entry.*
