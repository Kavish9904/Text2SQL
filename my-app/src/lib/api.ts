export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Export a function to test the API connection
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
};
