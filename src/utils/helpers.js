import axios from "axios";

export function getDistance(lat1, lon1, lat2, lon2){
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export async function getDistanceAndDuration(fromLat, fromLng, toLat, toLng) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await axios.get(url);

  const data = response.data;

  if (data.status !== "OK") {
    throw new Error("Erreur Google Maps API: " + data.status);
  }

  const element = data.rows[0].elements[0];

  if (element.status !== "OK") {
    throw new Error("Erreur dans le calcul distance/durée: " + element.status);
  }

  return {
    distanceText: element.distance.text,   // ex: "5.2 km"
    distanceValue: element.distance.value, // en mètres
    durationText: element.duration.text,   // ex: "12 mins"
    durationValue: element.duration.value  // en secondes
  };
}