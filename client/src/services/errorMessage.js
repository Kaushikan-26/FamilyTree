/**
 * Turn an axios error into a clear, user-facing message.
 * Distinguishes "server unreachable" (backend down) from real API errors,
 * so users know whether to start the backend or fix their input.
 */
export function getErrorMessage(err, fallback = "Something went wrong") {
  // The server responded with an error status → use its message
  if (err?.response) {
    return err.response.data?.message || fallback;
  }
  // Request was made but no response (backend down / not reachable)
  if (err?.request) {
    return "Cannot reach the server. Make sure the backend is running (npm run dev in the server folder).";
  }
  return err?.message || fallback;
}
