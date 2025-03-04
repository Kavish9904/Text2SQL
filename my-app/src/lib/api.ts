export const getApiUrl = () => {
  // In production, use the environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.trim();
  }

  // In development, use localhost
  return "http://localhost:8000";
};

export const apiUrl = getApiUrl();

// Export a function to test the API connection
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/v1/health`);
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
};
