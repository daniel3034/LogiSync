"use client";

import { useState } from "react";

const routes = [
  {
    id: 1,
    origin: "Asunción",
    destination: "Ciudad del Este",
  },
  {
    id: 2,
    origin: "Asunción",
    destination: "Encarnación",
  },
  {
    id: 3,
    origin: "Luque",
    destination: "San Lorenzo",
  },
  {
    id: 4,
    origin: "Asunción",
    destination: "Luque",
  },
];

export default function RoutesPage() {
  const [search, setSearch] = useState("");

  const filteredRoutes = routes.filter((route) =>
    route.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Route Search
      </h1>

      <input
        type="text"
        placeholder="Search destination city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg p-3 w-full max-w-md mb-6"
      />

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Origin</th>
            <th className="border p-2">Destination</th>
          </tr>
        </thead>

        <tbody>
          {filteredRoutes.map((route) => (
            <tr key={route.id}>
              <td className="border p-2">{route.origin}</td>
              <td className="border p-2">{route.destination}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}