const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/calculate-price`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(method, body) {
  const response = await fetch(ENDPOINT, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { response, data };
}

async function testGetShouldReturn405() {
  const { response } = await request("GET");
  assert(
    response.status === 405,
    `GET should return 405, got ${response.status}`
  );
  console.log("PASS: GET returns 405 (method not allowed)");
}

async function testValidCalculation() {
  const payload = {
    origin: "San Salvador",
    weight: 180,
    volume: 1.2,
    destination: "Guatemala City",
  };

  const { response, data } = await request("POST", payload);

  assert(response.status === 200, `POST should return 200, got ${response.status}`);
  assert(typeof data?.clientCost === "number", "clientCost must be a number");
  assert(data?.breakdown, "breakdown must be present");
  assert(typeof data?.breakdown?.distanceKm === "number", "distanceKm must be present");
  assert(typeof data?.breakdown?.distanceCharge === "number", "distanceCharge must be present");

  console.log("PASS: valid POST returns client pricing with distance breakdown");
}

async function testRoutePairImpactsPrice() {
  const basePayload = {
    weight: 180,
    volume: 1.2,
    destination: "Guatemala City",
  };

  const fromSanSalvador = await request("POST", {
    ...basePayload,
    origin: "San Salvador",
  });

  const fromSantaAna = await request("POST", {
    ...basePayload,
    origin: "Santa Ana",
  });

  assert(fromSanSalvador.response.status === 200, `San Salvador origin should return 200, got ${fromSanSalvador.response.status}`);
  assert(fromSantaAna.response.status === 200, `Santa Ana origin should return 200, got ${fromSantaAna.response.status}`);
  assert(
    fromSanSalvador.data.clientCost > fromSantaAna.data.clientCost,
    `route matrix must impact price. San Salvador->Guatemala City=${fromSanSalvador.data.clientCost}, Santa Ana->Guatemala City=${fromSantaAna.data.clientCost}`
  );

  console.log("PASS: origin-destination route matrix impacts total price");
}

async function testInvalidWeight() {
  const { response, data } = await request("POST", {
    origin: "San Salvador",
    weight: 0,
    volume: 1.2,
    destination: "Guatemala City",
  });

  assert(response.status === 400, `invalid weight should return 400, got ${response.status}`);
  assert(typeof data?.error === "string", "invalid weight should return error message");
  console.log("PASS: invalid weight returns 400");
}

async function testInvalidVolume() {
  const { response, data } = await request("POST", {
    origin: "San Salvador",
    weight: 150,
    volume: -2,
    destination: "San Salvador",
  });

  assert(response.status === 400, `invalid volume should return 400, got ${response.status}`);
  assert(typeof data?.error === "string", "invalid volume should return error message");
  console.log("PASS: invalid volume returns 400");
}

async function testInvalidOrigin() {
  const { response, data } = await request("POST", {
    origin: "Unknown City",
    weight: 150,
    volume: 1.2,
    destination: "Guatemala City",
  });

  assert(
    response.status === 400,
    `invalid origin should return 400, got ${response.status}`
  );
  assert(
    typeof data?.error === "string",
    "invalid origin should return error message"
  );
  console.log("PASS: invalid origin returns 400");
}

async function testInvalidDestination() {
  const { response, data } = await request("POST", {
    origin: "San Salvador",
    weight: 150,
    volume: 1.2,
    destination: "Unknown City",
  });

  assert(
    response.status === 400,
    `invalid destination should return 400, got ${response.status}`
  );
  assert(
    typeof data?.error === "string",
    "invalid destination should return error message"
  );
  console.log("PASS: invalid destination returns 400");
}

async function run() {
  console.log(`Running calculate-price tests against ${ENDPOINT}`);

  try {
    await testGetShouldReturn405();
    await testValidCalculation();
    await testRoutePairImpactsPrice();
    await testInvalidWeight();
    await testInvalidVolume();
    await testInvalidOrigin();
    await testInvalidDestination();

    console.log("\nAll calculate-price tests passed.");
    process.exit(0);
  } catch (error) {
    console.error("\nTest failed:", error.message);
    process.exit(1);
  }
}

run();
