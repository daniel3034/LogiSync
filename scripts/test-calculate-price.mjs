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
    weight: 180,
    volume: 1.2,
    destination: "Guatemala City",
  };

  const { response, data } = await request("POST", payload);

  assert(response.status === 200, `POST should return 200, got ${response.status}`);
  assert(typeof data?.clientCost === "number", "clientCost must be a number");
  assert(
    typeof data?.driverPayment === "number",
    "driverPayment must be a number"
  );
  assert(typeof data?.netMargin === "number", "netMargin must be a number");
  assert(
    typeof data?.marginPercent === "number",
    "marginPercent must be a number"
  );
  assert(data?.breakdown, "breakdown must be present");

  const expectedNetMargin = Number((data.clientCost - data.driverPayment).toFixed(2));
  assert(
    data.netMargin === expectedNetMargin,
    `netMargin mismatch. expected ${expectedNetMargin}, got ${data.netMargin}`
  );

  console.log("PASS: valid POST returns full pricing object");
}

async function testInvalidWeight() {
  const { response, data } = await request("POST", {
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
    weight: 150,
    volume: -2,
    destination: "San Salvador",
  });

  assert(response.status === 400, `invalid volume should return 400, got ${response.status}`);
  assert(typeof data?.error === "string", "invalid volume should return error message");
  console.log("PASS: invalid volume returns 400");
}

async function testInvalidDestination() {
  const { response, data } = await request("POST", {
    weight: 150,
    volume: 1.2,
    destination: "",
  });

  assert(
    response.status === 400,
    `empty destination should return 400, got ${response.status}`
  );
  assert(
    typeof data?.error === "string",
    "empty destination should return error message"
  );
  console.log("PASS: empty destination returns 400");
}

async function run() {
  console.log(`Running calculate-price tests against ${ENDPOINT}`);

  try {
    await testGetShouldReturn405();
    await testValidCalculation();
    await testInvalidWeight();
    await testInvalidVolume();
    await testInvalidDestination();

    console.log("\nAll calculate-price tests passed.");
    process.exit(0);
  } catch (error) {
    console.error("\nTest failed:", error.message);
    process.exit(1);
  }
}

run();
