# LogiSync Driver API Documentation

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Edit `.env` and choose your database:

#### Option A: SQLite (Local Testing)

```
DATABASE_URL="file:./prisma/dev.db"
```

#### Option B: PostgreSQL (Production)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

Then in `.env`:

```
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 3. Run Migrations

```bash
npx prisma migrate dev
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

---

## API Endpoints

> **All `/api/drivers` endpoints require an authenticated `ADMIN` user.** Requests
> without a session get `401 Unauthorized`; authenticated non-admins get
> `403 Forbidden`. Sign in at `/login` (see `scripts/seed-admin.mjs` for creating
> the first admin).

### **Create Driver**

- **POST** `/api/drivers`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "phone": "+1234567890",
    "truckSize": "large",
    "preferredCities": "New York,Los Angeles,Chicago"
  }
  ```
- **Response:** 201 Created + Driver object
- **Errors:** 400 (missing fields), 409 (phone exists)

### **Get All Drivers**

- **GET** `/api/drivers`
- **Query Params (optional):**
  - `city=New York` - Filter by preferred city. Matches whole city names only
    (case-insensitive), so `city=York` does **not** match a driver serving
    `New York`.
- **Response:** 200 OK + Array of drivers
- **Example:**
  ```
  GET /api/drivers?city=NewYork
  ```

### **Get Single Driver**

- **GET** `/api/drivers/:id`
- **Response:** 200 OK + Driver object with waybills
- **Errors:** 404 (not found)

### **Update Driver**

- **PUT** `/api/drivers/:id`
- **Body:** Any driver field(s) to update
  ```json
  {
    "truckSize": "medium",
    "preferredCities": "Dallas,Houston,Austin"
  }
  ```
- **Response:** 200 OK + Updated driver object
- **Errors:** 404 (not found), 409 (phone in use)

### **Delete Driver**

- **DELETE** `/api/drivers/:id`
- **Response:** 200 OK + Success message
- **Errors:** 404 (not found)

### **Calculate Price**

- **POST** `/api/calculate-price`
- **Body:**
  ```json
  {
    "weight": 180,
    "volume": 1.2,
    "destination": "Guatemala City"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "clientCost": 279.45,
    "driverPayment": 173.26,
    "netMargin": 106.19,
    "marginPercent": 38,
    "breakdown": {
      "baseFee": 12,
      "billableWeightKg": 300,
      "volumetricWeightKg": 300,
      "destinationMultiplier": 1.25,
      "fuelSurcharge": 20.7
    }
  }
  ```
- **Errors:** 400 (invalid weight/volume/destination)

- **Formula Notes:**
  - Billable weight = `max(weight, volume * 250)`
  - Destination multiplier = local `1.0`, regional `1.25`, other `1.5`
  - Fuel surcharge = `8%`
  - Driver payment = `max(clientCost * 0.62, 15)`

---

## Testing with cURL

### Create a driver:

```bash
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Garcia",
    "phone": "+5551234567",
    "truckSize": "medium",
    "preferredCities": "Los Angeles,San Diego,Las Vegas"
  }'
```

### Get all drivers:

```bash
curl http://localhost:3000/api/drivers
```

### Filter by city:

```bash
curl "http://localhost:3000/api/drivers?city=Los Angeles"
```

### Get single driver:

```bash
curl http://localhost:3000/api/drivers/{id}
```

### Update driver:

```bash
curl -X PUT http://localhost:3000/api/drivers/{id} \
  -H "Content-Type: application/json" \
  -d '{"truckSize": "small"}'
```

### Delete driver:

```bash
curl -X DELETE http://localhost:3000/api/drivers/{id}
```

### Calculate price:

```bash
curl -X POST http://localhost:3000/api/calculate-price \
  -H "Content-Type: application/json" \
  -d '{"weight": 180, "volume": 1.2, "destination": "Guatemala City"}'
```

---

## Testing with Postman

1. Import these as requests:
   - **POST** `{{base_url}}/api/drivers`
   - **GET** `{{base_url}}/api/drivers`
   - **GET** `{{base_url}}/api/drivers/{{driver_id}}`
   - **PUT** `{{base_url}}/api/drivers/{{driver_id}}`
   - **DELETE** `{{base_url}}/api/drivers/{{driver_id}}`

- **POST** `{{base_url}}/api/calculate-price`

2. Set `{{base_url}}` to `http://localhost:3000`

---

## Database Schema

### Driver Model

```
id              : String (CUID, Primary Key)
name            : String
phone           : String (Unique)
truckSize       : String
preferredCities : String (comma-separated)
createdAt       : DateTime
updatedAt       : DateTime
waybills        : Waybill[] (relation)
```

### Waybill Model (for future use)

```
id              : String (CUID, Primary Key)
driverId        : String (FK to Driver)
senderName      : String
senderPhone     : String
receiverName    : String
receiverPhone   : String
destination     : String
weight          : Float (kg)
volume          : Float (m³)
description     : String?
clientCost      : Float
driverPayment   : Float
netMargin       : Float
status          : String (pending, in_transit, delivered)
createdAt       : DateTime
updatedAt       : DateTime
driver          : Driver (relation)
```

---

## Next Steps

1. **Frontend Integration:** Connect to these endpoints from React components
2. **Route Filter:** Enhance the city filter query logic
3. **Price Calculator:** Create `/api/calculate-price` endpoint
4. **Waybill API:** Add waybill CRUD endpoints
5. **Error Handling:** Add global error middleware
6. **Validation:** Add input validation library (Zod/Yup)
7. **Authentication:** Add user auth before moving to production

---

## Environment Variables Template

Create `.env` file:

```
# Database
DATABASE_URL="file:./prisma/dev.db"

# API
NODE_ENV="development"
```
